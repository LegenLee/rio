import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { attachShapeMorph, type ShapeMorphHandle } from './shape-morph';

// The parts of a component stylesheet the primitive relies on, inlined so the test stands alone.
beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `
    @property --rio-shape-morph-target { syntax: '<length>'; inherits: false; initial-value: 0px; }
    .box { width: 100px; height: 40px; --rio-shape-morph-target: 20px; border-radius: 20px; }
    .box[data-pressed] { --rio-shape-morph-target: 8px; border-radius: 8px; }
    .box.springy {
      --rio-motion-fast-spatial-damping: 0.6;
      --rio-motion-fast-spatial-stiffness: 800;
    }
  `;
  document.head.append(style);
});

let handle: ShapeMorphHandle | undefined;
let box: HTMLDivElement;

const setup = (className: string) => {
  box = document.createElement('div');
  box.className = className;
  document.body.append(box);
  handle = attachShapeMorph(box);
};

const radius = () => parseFloat(getComputedStyle(box).borderTopLeftRadius);
const mutationsFlushed = () => new Promise((r) => setTimeout(r));

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
    await mutationsFlushed();
    expect(box.style.borderRadius).not.toBe(''); // the spring owns the radius while moving

    await vi.waitFor(() => expect(box.style.borderRadius).toBe(''), { timeout: 2000 });
    cancelAnimationFrame(frame);
    expect(radius()).toBe(8);
    // Expressive fast spatial (damping 0.6) dips below the 8px target before settling.
    expect(Math.min(...seen)).toBeLessThan(8);
  });

  test('jumps when the theme defines no spring', async () => {
    setup('box');
    box.dataset.pressed = '';
    await mutationsFlushed();
    expect(box.style.borderRadius).toBe('');
    expect(radius()).toBe(8);
  });

  test('marks the element and cleans up on detach', () => {
    setup('box springy');
    expect(box.dataset.shapeMorph).toBe('');
    handle!.detach();
    expect('shapeMorph' in box.dataset).toBe(false);
  });
});
