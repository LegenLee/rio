import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import {
  attachAnchoredPosition,
  type AnchoredPositionHandle,
  type AnchoredPositionOptions,
  type AnchorPoint,
} from './anchored-position';

// The stylesheet's part (`@rio-m3e/styles/base/anchored-position.css`), inlined so the test stands
// alone, and a floating element that scrolls when the available height is less than its own.
beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = `
    :where([data-anchored]) { position: fixed; inset: auto; margin: 0; }
    .floating {
      box-sizing: border-box; width: 100px; padding: 0; border: 0;
      max-height: var(--rio-anchored-available-height); overflow: auto;
    }
    .anchor { position: fixed; width: 60px; height: 30px; }
  `;
  document.head.append(style);
});

let handle: AnchoredPositionHandle | undefined;
const cleanup: Element[] = [];

afterEach(() => {
  handle?.detach();
  handle = undefined;
  for (const element of cleanup.splice(0)) element.remove();
});

/** An anchor box at a viewport position. */
const anchorAt = (left: number, top: number, dir: 'ltr' | 'rtl' = 'ltr') => {
  const anchor = document.createElement('div');
  anchor.className = 'anchor';
  anchor.dir = dir;
  Object.assign(anchor.style, { left: `${left}px`, top: `${top}px` });
  document.body.append(anchor);
  cleanup.push(anchor);
  return anchor;
};

/** A shown popover of the given height, placed against the anchor. */
const place = (
  anchor: Element | AnchorPoint,
  options: Omit<AnchoredPositionOptions, 'anchor'> = {},
  height = 50,
) => {
  const floating = document.createElement('div');
  floating.className = 'floating';
  floating.popover = 'manual';
  floating.innerHTML = `<div style="height: ${height}px"></div>`;
  document.body.append(floating);
  cleanup.push(floating);
  floating.showPopover();
  handle = attachAnchoredPosition(floating, { anchor: () => anchor, ...options });
  handle.update();
  return floating;
};

const box = (element: Element) => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
};
const view = () => ({
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
});

describe('attachAnchoredPosition', () => {
  test('places the element below the anchor, start edges lined up, by default', () => {
    const anchor = anchorAt(200, 100);
    const floating = place(anchor, { offset: 4 });
    expect(box(floating)).toMatchObject({ left: 200, top: 134 });
    expect([floating.dataset.side, floating.dataset.align]).toEqual(['bottom', 'start']);
  });

  test('start and end follow the writing direction', () => {
    const anchor = anchorAt(200, 100, 'rtl');
    // Start is the right edge: 200 + 60 - 100
    expect(box(place(anchor)).left).toBe(160);
  });

  test.each([
    ['center', 180],
    ['end', 160],
  ] as const)('align %s', (align, left) => {
    expect(box(place(anchorAt(200, 100), { align })).left).toBe(left);
  });

  test.each([
    // [side, dir, left, top]
    ['top', 'ltr', 200, 46],
    ['end', 'ltr', 264, 100],
    ['end', 'rtl', 96, 100],
    ['start', 'ltr', 96, 100],
  ] as const)('side %s (%s)', (side, dir, left, top) => {
    const floating = place(anchorAt(200, 100, dir), { side, offset: 4 });
    expect(box(floating)).toMatchObject({ left, top });
    expect(floating.dataset.side).toBe(side);
  });

  test.each([
    // [side, dir, left, top]: beside the anchor it moves down, above or below it toward the end
    ['end', 'ltr', 264, 96],
    ['bottom', 'ltr', 196, 134],
    ['bottom', 'rtl', 164, 134],
  ] as const)('alignOffset moves it along the anchor (%s, %s)', (side, dir, left, top) => {
    const floating = place(anchorAt(200, 100, dir), { side, offset: 4, alignOffset: -4 });
    expect(box(floating)).toMatchObject({ left, top });
  });

  test('flips to the opposite side when there is no room', () => {
    const anchor = anchorAt(200, view().height - 40);
    const floating = place(anchor, { offset: 4 });
    expect(floating.dataset.side).toBe('top');
    expect(box(floating).top).toBe(view().height - 40 - 4 - 50);
  });

  test('tries the fallbacks in order', () => {
    const anchor = anchorAt(8, view().height - 40);
    const floating = place(anchor, { fallbacks: ['start', 'end', 'top'] });
    // No room below, none at the start (left), so the end
    expect(floating.dataset.side).toBe('end');
  });

  test('without room anywhere, takes the roomier side and scrolls within it', () => {
    const { height } = view();
    const anchor = anchorAt(200, height * 0.6);
    const floating = place(anchor, { offset: 4, padding: 8 }, height);
    // Above has 0.6 of the height, below 0.4
    expect(floating.dataset.side).toBe('top');
    const room = height * 0.6 - 4 - 8;
    expect(parseFloat(floating.style.getPropertyValue('--rio-anchored-available-height'))).toBe(
      room,
    );
    expect(box(floating).height).toBeCloseTo(room, 0);
    expect(box(floating).top).toBeGreaterThanOrEqual(8);
  });

  test('a side fallback has to fit along the anchor too, or the element stays above or below', () => {
    const { height } = view();
    // Too tall for the window: neither below, above, nor beside it fits.
    const floating = place(
      anchorAt(200, height * 0.3),
      { fallbacks: ['top', 'end', 'start'] },
      height * 2,
    );
    // Below has more room than above; beside it would have to start at the top of the window.
    expect(floating.dataset.side).toBe('bottom');
  });

  test('shifts along the anchor to stay on screen', () => {
    const anchor = anchorAt(view().width - 70, 100);
    expect(box(place(anchor, { padding: 8 })).left).toBe(view().width - 8 - 100);
  });

  test('places against a point, such as a context menu', () => {
    const floating = place({ x: 300, y: 200 });
    expect(box(floating)).toMatchObject({ left: 300, top: 200 });
  });

  test("passes the anchor's width on", () => {
    const floating = place(anchorAt(200, 100));
    expect(floating.style.getPropertyValue('--rio-anchored-anchor-width')).toBe('60px');
  });

  test('follows the anchor when a container scrolls', async () => {
    const scroller = document.createElement('div');
    Object.assign(scroller.style, { position: 'fixed', top: '0', left: '0', width: '400px' });
    Object.assign(scroller.style, { height: '300px', overflow: 'auto' });
    scroller.innerHTML =
      '<div style="height: 2000px; padding-top: 100px"><span>anchor</span></div>';
    document.body.append(scroller);
    cleanup.push(scroller);
    const anchor = scroller.querySelector('span')!;
    const floating = place(anchor);
    const before = box(floating).top;
    scroller.scrollTop = 50;
    await vi.waitFor(() => expect(box(floating).top).toBe(before - 50));
  });

  test('follows the anchor when it changes size', async () => {
    const anchor = anchorAt(200, 100);
    const floating = place(anchor);
    (anchor as HTMLElement).style.height = '80px';
    await vi.waitFor(() => expect(box(floating).top).toBe(180));
  });

  test('skips a hidden element and cleans up on detach', () => {
    const floating = place(anchorAt(200, 100));
    floating.hidePopover();
    floating.style.left = 'auto';
    handle!.update();
    expect(floating.style.left).toBe('auto');

    handle!.detach();
    handle = undefined;
    expect(floating.getAttribute('style')).toBe('');
    for (const name of ['anchored', 'side', 'align']) expect(name in floating.dataset).toBe(false);
  });

  test('says when the anchor is out of the window', () => {
    const anchor = anchorAt(200, -100) as HTMLElement;
    const floating = place(anchor);
    expect('anchorHidden' in floating.dataset).toBe(true);
    anchor.style.top = '100px';
    handle!.update();
    expect('anchorHidden' in floating.dataset).toBe(false);
  });

  test('skips an anchor taken out of the document', () => {
    const anchor = anchorAt(200, 100);
    const floating = place(anchor);
    anchor.remove();
    handle!.update();
    expect(box(floating)).toMatchObject({ left: 200, top: 130 });
  });

  test('scrolling inside the element leaves it in place', async () => {
    const anchor = anchorAt(200, 100);
    const floating = place(anchor, {}, 400);
    floating.style.maxHeight = '100px';
    const calls = vi.fn(() => anchor);
    handle!.detach();
    handle = attachAnchoredPosition(floating, { anchor: calls });
    handle.update();
    calls.mockClear();
    floating.scrollTop = 50;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(calls).not.toHaveBeenCalled();
  });

  test('in right-to-left layouts, an element wider than the window keeps its right edge', () => {
    const anchor = anchorAt(200, 100, 'rtl');
    const floating = document.createElement('div');
    floating.className = 'floating';
    floating.popover = 'manual';
    floating.style.width = `${view().width + 40}px`;
    document.body.append(floating);
    cleanup.push(floating);
    floating.showPopover();
    handle = attachAnchoredPosition(floating, { anchor: () => anchor });
    handle.update();
    expect(box(floating).left + box(floating).width).toBe(view().width - 8);
  });
});
