import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { attachCornerMorph, type CornerMorphHandle, type CornerMorphOptions } from './corner-morph';

// The parts of a component stylesheet the primitive relies on, inlined so the test stands alone.
// The registrations and the per-side defaults mirror `@rio-m3e/styles/base/corner-morph.css`; the
// corners that show the targets and the instant transitions mirror `button.css`.
beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `
    @property --rio-corner-morph-target { syntax: '<length>'; inherits: false; initial-value: 0px; }
    @property --rio-corner-morph-start-target { syntax: '<length>'; inherits: false; initial-value: 0px; }
    @property --rio-corner-morph-end-target { syntax: '<length>'; inherits: false; initial-value: 0px; }
    :where([data-corner-morph]) {
      --rio-corner-morph-start-target: var(--rio-corner-morph-target);
      --rio-corner-morph-end-target: var(--rio-corner-morph-target);
    }
    .box {
      width: 100px;
      height: 40px;
      --rio-corner-morph-target: 20px;
      border-start-start-radius: var(--rio-corner-morph-start-target);
      border-end-start-radius: var(--rio-corner-morph-start-target);
      border-start-end-radius: var(--rio-corner-morph-end-target);
      border-end-end-radius: var(--rio-corner-morph-end-target);
      transition:
        --rio-corner-morph-start-target 1ms step-end,
        --rio-corner-morph-end-target 1ms step-end;
    }
    .box[data-pressed] { --rio-corner-morph-target: 8px; }
    .box.springy {
      --rio-motion-fast-spatial-damping: 0.6;
      --rio-motion-fast-spatial-stiffness: 800;
    }
    /* A shape whose end side differs, like the first button of a connected button group */
    .box.lopsided[data-pressed] { --rio-corner-morph-end-target: 4px; }
    /* A shape whose bottom differs, like the first item of a segmented list: its corners drawn
       from the targets by the top and the bottom */
    .box.stacked {
      border-start-start-radius: var(--rio-corner-morph-start-target);
      border-start-end-radius: var(--rio-corner-morph-start-target);
      border-end-start-radius: var(--rio-corner-morph-end-target);
      border-end-end-radius: var(--rio-corner-morph-end-target);
    }
    .box.stacked[data-pressed] { --rio-corner-morph-end-target: 4px; }
  `;
  document.head.append(style);
});

let handle: CornerMorphHandle | undefined;
let box: HTMLDivElement;

const setup = (className: string, dir = 'ltr', options?: CornerMorphOptions) => {
  box = document.createElement('div');
  box.className = className;
  box.dir = dir;
  document.body.append(box);
  handle = attachCornerMorph(box, options);
};

type Corner =
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomLeftRadius'
  | 'borderBottomRightRadius';
const radius = (corner: Corner = 'borderTopLeftRadius') =>
  parseFloat(getComputedStyle(box)[corner]);
// The inline radii the springs write, empty once both sides have handed back to CSS.
const inline = () =>
  box.style.getPropertyValue('border-start-start-radius') +
  box.style.getPropertyValue('border-start-end-radius');
// The spring hears of a change a frame or two later, from the target's transition, and writes the
// radius in its first frame.
const springStarted = () => vi.waitFor(() => expect(inline()).not.toBe(''));

afterEach(() => {
  handle?.detach();
  box?.remove();
});

describe('attachCornerMorph', () => {
  test('springs to the new target, overshooting, and hands back to CSS at rest', async () => {
    setup('box springy');
    const seen: number[] = [];
    let frame = requestAnimationFrame(function record() {
      seen.push(radius());
      frame = requestAnimationFrame(record);
    });

    box.dataset.pressed = '';
    await springStarted(); // the spring owns the radius while moving

    await vi.waitFor(() => expect(inline()).toBe(''), { timeout: 2000 });
    cancelAnimationFrame(frame);
    expect(radius()).toBe(8);
    // Expressive fast spatial (damping 0.6) dips below the 8px target before settling.
    expect(Math.min(...seen)).toBeLessThan(8);
  });

  test('jumps when the theme defines no spring', async () => {
    setup('box');
    box.dataset.pressed = '';
    await vi.waitFor(() => expect(radius()).toBe(8));
    expect(inline()).toBe('');
  });

  test.each([
    ['ltr', 'borderTopLeftRadius', 'borderTopRightRadius'],
    ['rtl', 'borderTopRightRadius', 'borderTopLeftRadius'],
  ] as const)('springs the start and end sides separately (%s)', async (dir, start, end) => {
    setup('box springy lopsided', dir);
    box.dataset.pressed = '';
    await springStarted();
    // Both sides leave 20px together, each heading for its own target.
    await vi.waitFor(() => expect(radius(end)).toBeLessThan(radius(start)));
    await vi.waitFor(() => expect(inline()).toBe(''), { timeout: 2000 });
    expect([radius(start), radius(end)]).toEqual([8, 4]);
  });

  test('with the block axis, springs the top and the bottom separately', async () => {
    setup('box springy stacked', 'ltr', { axis: 'block' });
    const corners = [
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomLeftRadius',
      'borderBottomRightRadius',
    ] as const;
    // Every corner the springs write, empty once both have handed back to CSS
    const moving = () =>
      ['start-start', 'start-end', 'end-start', 'end-end']
        .map((corner) => box.style.getPropertyValue(`border-${corner}-radius`))
        .join('');
    const seen: number[][] = [];
    let frame = requestAnimationFrame(function record() {
      if (moving()) seen.push(corners.map(radius));
      frame = requestAnimationFrame(record);
    });

    box.dataset.pressed = '';
    await vi.waitFor(() => expect(moving()).not.toBe(''));
    await vi.waitFor(() => expect(moving()).toBe(''), { timeout: 2000 });
    cancelAnimationFrame(frame);
    // While moving, the top corners go together, and so do the bottom ones, toward 8px and 4px.
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every(([tl, tr, bl, br]) => tl === tr && bl === br)).toBe(true);
    expect(seen.some(([tl, , bl]) => bl! < tl!)).toBe(true);
    expect(corners.map(radius)).toEqual([8, 8, 4, 4]);
  });

  test('marks the element and cleans up on detach', () => {
    setup('box springy');
    expect(box.dataset.cornerMorph).toBe('');
    handle!.detach();
    expect('cornerMorph' in box.dataset).toBe(false);
  });
});
