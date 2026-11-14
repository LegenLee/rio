import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { attachSpringProperty, type SpringPropertyHandle } from './spring-property';

// A target that moves with :hover and :focus-visible, which change no attribute, and an <angle>
// target for rotations.
beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `
    @property --test-target { syntax: '<length>'; inherits: false; initial-value: 0px; }
    @property --test-turn { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
    .box { width: 80px; height: 40px; --test-target: 4px; }
    .box:hover { --test-target: 12px; }
    .box:focus-visible { --test-target: 20px; }
    .box[data-selected='true'] { --test-turn: 180deg; }
  `;
  document.head.append(style);
});

let handle: SpringPropertyHandle | undefined;
let box: HTMLDivElement;
let applied: (number | undefined)[];

const setup = (target = '--test-target') => {
  box = document.createElement('div');
  box.className = 'box';
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
});
