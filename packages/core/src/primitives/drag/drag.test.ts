import { afterEach, describe, expect, test, vi } from 'vitest';
import { attachDrag, type DragHandle, type DragOptions } from './drag';

let handle: DragHandle | undefined;
let el: HTMLButtonElement;

const setup = (options: Partial<DragOptions> = {}, attrs: Record<string, string> = {}) => {
  el = document.createElement('button');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.append(el);
  const callbacks = { onStart: vi.fn(), onMove: vi.fn(), onEnd: vi.fn(), onCancel: vi.fn() };
  handle = attachDrag(el, { ...callbacks, ...options });
  return callbacks;
};

const pointer = (type: string, clientX: number, pointerType = 'touch') =>
  el.dispatchEvent(
    new PointerEvent(type, { bubbles: true, isPrimary: true, pointerId: 7, pointerType, clientX }),
  );

afterEach(() => {
  handle?.detach();
  el?.remove();
});

describe('attachDrag', () => {
  test('starts past the threshold and reports the distance and direction', () => {
    const { onStart, onMove, onEnd } = setup();
    pointer('pointerdown', 100);
    pointer('pointermove', 104);
    expect(onStart).not.toHaveBeenCalled();

    pointer('pointermove', 130);
    expect(onStart).toHaveBeenCalledOnce();
    expect(el.dataset.dragging).toBe('');
    expect(onMove).toHaveBeenLastCalledWith(expect.objectContaining({ dx: 30 }));

    pointer('pointerup', 140);
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ dx: 40 }));
    expect(onEnd.mock.calls[0]![0].velocityX).toBeGreaterThan(0);
    expect('dragging' in el.dataset).toBe(false);
  });

  test('a press that barely moves is not a drag', () => {
    const { onStart, onEnd } = setup();
    pointer('pointerdown', 100);
    pointer('pointermove', 103);
    pointer('pointerup', 103);
    expect(onStart).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  test('swallows the click that follows a drag', () => {
    setup();
    const onClick = vi.fn();
    el.addEventListener('click', onClick);
    pointer('pointerdown', 100);
    pointer('pointermove', 130);
    pointer('pointerup', 130);
    el.click();
    expect(onClick).not.toHaveBeenCalled();
    el.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  test('ignores the mouse by default', () => {
    const { onStart } = setup();
    pointer('pointerdown', 100, 'mouse');
    pointer('pointermove', 130, 'mouse');
    expect(onStart).not.toHaveBeenCalled();
  });

  test.each<Record<string, string>>([{ disabled: '' }, { 'aria-disabled': 'true' }])(
    'ignores disabled elements (%o)',
    (attrs) => {
      const { onStart } = setup({}, attrs);
      pointer('pointerdown', 100);
      pointer('pointermove', 130);
      expect(onStart).not.toHaveBeenCalled();
    },
  );

  test('reports a cancel, for example when the page scrolls', () => {
    const { onEnd, onCancel } = setup();
    pointer('pointerdown', 100);
    pointer('pointermove', 130);
    pointer('pointercancel', 130);
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onEnd).not.toHaveBeenCalled();
  });
});
