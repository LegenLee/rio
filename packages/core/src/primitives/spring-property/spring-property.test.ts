import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { attachSpringProperty, type SpringPropertyHandle } from './spring-property';

// A target that moves with an attribute, with :hover and :focus-visible, and with a variable set
// on an ancestor (as a theme does), plus an <angle> target for rotations. The targets get the
// instant transition the primitive relies on, except on `.unobserved`.
beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `
    @property --test-target { syntax: '<length>'; inherits: false; initial-value: 0px; }
    @property --test-turn { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
    .box {
      width: 80px;
      height: 40px;
      --test-target: var(--test-base, 4px);
      transition: --test-target 1ms step-end, --test-turn 1ms step-end;
    }
    .box:hover { --test-target: 12px; }
    .box:focus-visible { --test-target: 20px; }
    .box[data-selected='true'] { --test-turn: 180deg; }
    .box.springy {
      --rio-motion-fast-spatial-damping: 1;
      --rio-motion-fast-spatial-stiffness: 1400;
    }
    .box.unobserved { transition: none; }
  `;
  document.head.append(style);
});

let handle: SpringPropertyHandle | undefined;
let box: HTMLDivElement;
let applied: (number | undefined)[];

const setup = (target = '--test-target', className = 'box') => {
  box = document.createElement('div');
  box.className = className;
  box.tabIndex = 0;
  document.body.append(box);
  applied = [];
  // No motion variables on the page, so the spring jumps to each target: the test sees the
  // target itself, then `undefined` as it hands back to CSS.
  handle = attachSpringProperty(box, { target, apply: (value) => applied.push(value) });
};

afterEach(async () => {
  handle?.detach();
  box?.remove();
  document.body.style.removeProperty('--test-base');
  await userEvent.unhover(document.body);
});

describe('attachSpringProperty', () => {
  test('follows a target that moves on hover', async () => {
    setup();
    await userEvent.hover(box);
    await vi.waitFor(() => expect(applied).toContain(12));
    await userEvent.unhover(box);
    await vi.waitFor(() => expect(applied.filter((v) => v !== undefined).at(-1)).toBe(4));
  });

  test('follows a target that moves on keyboard focus', async () => {
    setup();
    await userEvent.keyboard('{Shift}');
    box.focus();
    await vi.waitFor(() => expect(applied).toContain(20));
    box.blur();
    await vi.waitFor(() => expect(applied.filter((v) => v !== undefined).at(-1)).toBe(4));
  });

  test('reads an <angle> target in degrees', async () => {
    setup('--test-turn');
    box.dataset.selected = 'true';
    await vi.waitFor(() => expect(applied).toContain(180));
  });

  test('follows a target moved by a variable on an ancestor, as a theme does', async () => {
    setup();
    document.body.style.setProperty('--test-base', '30px');
    await vi.waitFor(() => expect(applied).toContain(30));
  });

  // The bug this design fixes: a target that changed while the spring rested left it holding the
  // old value, and the next move started from there, so the shape jumped.
  test('after a change while at rest, the next move starts from what is on screen', async () => {
    setup('--test-target', 'box springy');
    document.body.style.setProperty('--test-base', '30px');
    await vi.waitFor(() => expect(applied.at(-1)).toBeUndefined());
    await vi.waitFor(() => expect(applied).toContain(30), { timeout: 2000 });
    await vi.waitFor(() => expect(applied.at(-1)).toBeUndefined(), { timeout: 2000 });

    applied = [];
    await userEvent.hover(box);
    await vi.waitFor(() => expect(applied.length).toBeGreaterThan(0));
    expect(applied[0]).toBeGreaterThan(29);
  });

  // A hidden element gets no transitions, so this needs the catch-up when it shows again.
  test.each([
    ['display: none', () => (box.style.display = 'none'), () => (box.style.display = '')],
    ['out of the document', () => box.remove(), () => document.body.append(box)],
  ])('a target that changed while hidden (%s) is caught up when shown', async (_, hide, show) => {
    setup('--test-target', 'box springy');
    hide();
    document.body.style.setProperty('--test-base', '30px');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    show();
    // The catch-up jumps: it writes the value and hands back to CSS at once, so nothing moves.
    await vi.waitFor(() => expect(applied).toEqual([30, undefined]));

    applied = [];
    await userEvent.hover(box);
    await vi.waitFor(() => expect(applied.length).toBeGreaterThan(0));
    expect(applied[0]).toBeGreaterThan(29);
  });

  test('without the transition, the spring stays still and the stylesheet shows the target', async () => {
    setup('--test-target', 'box unobserved');
    box.dataset.selected = 'true';
    await userEvent.hover(box);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(applied).toEqual([]);
  });
});
