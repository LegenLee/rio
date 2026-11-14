import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { attachShapeMorph, type ShapeMorphHandle } from './shape-morph';

// The parts of a component stylesheet the primitive relies on, inlined so the test stands alone.
// The registrations and the per-side defaults mirror `@rio-m3e/styles/base/shape-morph.css`.
beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `
    @property --rio-shape-morph-target { syntax: '<length>'; inherits: false; initial-value: 0px; }
    @property --rio-shape-morph-start-target { syntax: '<length>'; inherits: false; initial-value: 0px; }
    @property --rio-shape-morph-end-target { syntax: '<length>'; inherits: false; initial-value: 0px; }
    :where([data-shape-morph]) {
      --rio-shape-morph-start-target: var(--rio-shape-morph-target);
      --rio-shape-morph-end-target: var(--rio-shape-morph-target);
    }
    .box { width: 100px; height: 40px; --rio-shape-morph-target: 20px; border-radius: 20px; }
    .box[data-pressed] { --rio-shape-morph-target: 8px; border-radius: 8px; }
    .box.springy {
      --rio-motion-fast-spatial-damping: 0.6;
      --rio-motion-fast-spatial-stiffness: 800;
    }
    /* A shape whose end side differs, like the first button of a connected button group */
    .box.lopsided[data-pressed] {
      --rio-shape-morph-end-target: 4px;
      border-start-end-radius: 4px;
      border-end-end-radius: 4px;
    }
  `;
  document.head.append(style);
});

let handle: ShapeMorphHandle | undefined;
let box: HTMLDivElement;

const setup = (className: string, dir = 'ltr') => {
  box = document.createElement('div');
  box.className = className;
  box.dir = dir;
  document.body.append(box);
  handle = attachShapeMorph(box);
};

type Corner = 'borderTopLeftRadius' | 'borderTopRightRadius';
const radius = (corner: Corner = 'borderTopLeftRadius') =>
  parseFloat(getComputedStyle(box)[corner]);
// The inline radii the springs write, empty once both sides have handed back to CSS.
const inline = () =>
  box.style.getPropertyValue('border-start-start-radius') +
  box.style.getPropertyValue('border-start-end-radius');
const mutationsFlushed = () => new Promise((r) => setTimeout(r));
// Frame callbacks run in the order they were requested, so a frame requested after the mutation
// observer has run comes after the spring's first frame, which is when the spring writes the
// radius. A timeout alone can fire before that frame on a slow machine.
const springStarted = async () => {
  await mutationsFlushed();
  await new Promise((r) => requestAnimationFrame(r));
};

afterEach(() => {
  handle?.detach();
  box?.remove();
});

describe('attachShapeMorph', () => {
  test('springs to the new target, overshooting, and hands back to CSS at rest', async () => {
    setup('box springy');
    const seen: number[] = [];
    let frame = requestAnimationFrame(function record() {
      seen.push(radius());
      frame = requestAnimationFrame(record);
    });

    box.dataset.pressed = '';
    await springStarted();
    expect(inline()).not.toBe(''); // the spring owns the radius while moving

    await vi.waitFor(() => expect(inline()).toBe(''), { timeout: 2000 });
    cancelAnimationFrame(frame);
    expect(radius()).toBe(8);
    // Expressive fast spatial (damping 0.6) dips below the 8px target before settling.
    expect(Math.min(...seen)).toBeLessThan(8);
  });

  test('jumps when the theme defines no spring', async () => {
    setup('box');
    box.dataset.pressed = '';
    await mutationsFlushed();
    expect(inline()).toBe('');
    expect(radius()).toBe(8);
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

  test('marks the element and cleans up on detach', () => {
    setup('box springy');
    expect(box.dataset.shapeMorph).toBe('');
    handle!.detach();
    expect('shapeMorph' in box.dataset).toBe(false);
  });
});
