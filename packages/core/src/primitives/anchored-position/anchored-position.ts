// Places a floating element, such as a menu or a tooltip, next to an anchor: an element, or a
// point, such as where a context menu was asked for. The floating element is shown in the top
// layer (see `overlay/`) with `position: fixed` (`@rio-m3e/styles/base/anchored-position.css`), so
// its coordinates are the viewport's and no ancestor clips it.
//
// The preferred side comes first. If the element doesn't fit there, the fallbacks are tried in
// order, and if none fits, the side with the most room wins. Along the other axis the element is
// shifted to stay on screen. `start` and `end` follow the writing direction, like the shape
// morph's sides.
//
// What it decides goes out for the stylesheet:
// - `data-side` and `data-align`: where the element ended up, for example to set the transform
//   origin of an opening animation.
// - `--rio-anchored-available-width` and `--rio-anchored-available-height`: the room on that side,
//   for a `max-height` that makes a long menu scroll.
// - `--rio-anchored-anchor-width`: the anchor's width, for a menu as wide as its text field.
// - `data-anchor-hidden`: the anchor scrolled out of the window, while the element stays at its
//   edge. A menu can hide or close then. Only the window counts: an anchor hidden by an inner
//   scrolling container, but still within the window, counts as shown.
//
// Call `update()` right after showing the element, so it is placed before it first paints. From
// then on it follows the anchor: scrolling anywhere, resizing the window, and a change of size of
// either element place it again, once per frame. Scrolling inside the element doesn't.
//
// Not handled: vertical writing modes, and the visual viewport (pinch zoom, or a phone's on-screen
// keyboard), which can cover part of the window it places against.

export type AnchoredSide = 'top' | 'bottom' | 'start' | 'end';
export type AnchoredAlign = 'start' | 'center' | 'end';

/** A point in viewport coordinates, such as a pointer event's `clientX` and `clientY`. */
export interface AnchorPoint {
  x: number;
  y: number;
}

export interface AnchoredPositionOptions {
  /** Returns the anchor. Placing is skipped while it returns nothing. */
  anchor: () => Element | AnchorPoint | null | undefined;
  /** The preferred side of the anchor. Defaults to `'bottom'`. */
  side?: AnchoredSide;
  /** Which edges line up along that side. Defaults to `'start'`. */
  align?: AnchoredAlign;
  /** Space between the anchor and the element, in px. Defaults to 0. */
  offset?: number;
  /** Sides to try, in order, when the preferred one has no room. Defaults to the opposite side. */
  fallbacks?: readonly AnchoredSide[];
  /** Space kept from the edges of the window, in px. Defaults to 8. */
  padding?: number;
}

export interface AnchoredPositionHandle {
  /** Places the element now, for example after the anchor point moved. */
  update(): void;
  detach(): void;
}

type Physical = 'top' | 'bottom' | 'left' | 'right';

const OPPOSITE: Record<AnchoredSide, AnchoredSide> = {
  top: 'bottom',
  bottom: 'top',
  start: 'end',
  end: 'start',
};

const VARS = [
  '--rio-anchored-available-width',
  '--rio-anchored-available-height',
  '--rio-anchored-anchor-width',
] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

/** An anchor point, rather than an element. Checked by shape, so elements from iframes count. */
const isPoint = (target: Element | AnchorPoint): target is AnchorPoint =>
  typeof (target as Element).getBoundingClientRect !== 'function';

export function attachAnchoredPosition(
  floating: HTMLElement,
  options: AnchoredPositionOptions,
): AnchoredPositionHandle {
  // The element's own document and window, which differ from the global ones in an iframe
  const document = floating.ownerDocument;
  const view = document.defaultView!;
  floating.dataset.anchored = '';
  const offset = options.offset ?? 0;
  const padding = options.padding ?? 8;
  const preferred = options.side ?? 'bottom';
  const align = options.align ?? 'start';
  const candidates = [...new Set([preferred, ...(options.fallbacks ?? [OPPOSITE[preferred]])])];

  /** Rounds to the device's pixel grid, so text in the element stays sharp. */
  const snap = (value: number) => Math.round(value * view.devicePixelRatio) / view.devicePixelRatio;

  let frame: number | undefined;
  const schedule = () => {
    frame ??= view.requestAnimationFrame(() => {
      frame = undefined;
      place();
    });
  };
  // Scrolling inside the element, such as a long menu, doesn't move it.
  const onScroll = (event: Event) => {
    if (event.target !== document && floating.contains(event.target as Node)) return;
    schedule();
  };

  // Placing can change the element's size (through the available height), so a size change is
  // handled in the next frame rather than inside the observer, which would loop.
  const resize = new view.ResizeObserver(schedule);
  resize.observe(floating);
  let observed: Element | undefined;
  const observeAnchor = (element: Element | undefined) => {
    if (element === observed) return;
    if (observed) resize.unobserve(observed);
    observed = element;
    if (element) resize.observe(element);
  };

  const place = () => {
    const target = options.anchor();
    // Hidden, or nothing to place against: an anchor taken out of the document measures 0 x 0
    // at the corner of the window.
    if (!target || floating.getClientRects().length === 0) return;
    if (!isPoint(target) && !target.isConnected) return;
    observeAnchor(isPoint(target) ? undefined : target);

    const anchor = isPoint(target)
      ? { left: target.x, right: target.x, top: target.y, bottom: target.y, width: 0 }
      : target.getBoundingClientRect();
    const rtl = view.getComputedStyle(isPoint(target) ? floating : target).direction === 'rtl';
    const viewport = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    };
    const physical = (side: AnchoredSide): Physical =>
      side === 'start'
        ? rtl
          ? 'right'
          : 'left'
        : side === 'end'
          ? rtl
            ? 'left'
            : 'right'
          : side;
    const room: Record<Physical, number> = {
      top: anchor.top - offset - padding,
      bottom: viewport.height - anchor.bottom - offset - padding,
      left: anchor.left - offset - padding,
      right: viewport.width - anchor.right - offset - padding,
    };

    // Measure at the corner of the window, where nothing squeezes a fit-content width.
    floating.style.left = '0px';
    floating.style.top = '0px';
    const borders = {
      width: floating.offsetWidth - floating.clientWidth,
      height: floating.offsetHeight - floating.clientHeight,
    };
    // The size its content wants, even while a previous max-height makes it scroll
    const natural = {
      width: floating.scrollWidth + borders.width,
      height: floating.scrollHeight + borders.height,
    };
    const needs = (side: Physical) =>
      side === 'top' || side === 'bottom' ? natural.height : natural.width;
    const side =
      candidates.find((candidate) => room[physical(candidate)] >= needs(physical(candidate))) ??
      candidates.reduce((best, candidate) =>
        room[physical(candidate)] > room[physical(best)] ? candidate : best,
      );
    const at = physical(side);
    const vertical = at === 'top' || at === 'bottom';

    // The room goes out first, so a max-height that uses it applies before the size is read.
    const available = {
      width: vertical ? viewport.width - 2 * padding : room[at],
      height: vertical ? room[at] : viewport.height - 2 * padding,
    };
    floating.style.setProperty(VARS[0], `${Math.max(0, available.width)}px`);
    floating.style.setProperty(VARS[1], `${Math.max(0, available.height)}px`);
    floating.style.setProperty(VARS[2], `${anchor.width}px`);
    const size = { width: floating.offsetWidth, height: floating.offsetHeight };

    let x: number;
    let y: number;
    if (vertical) {
      y = at === 'bottom' ? anchor.bottom + offset : anchor.top - offset - size.height;
      const startEdge = rtl ? anchor.right - size.width : anchor.left;
      const endEdge = rtl ? anchor.left : anchor.right - size.width;
      x =
        align === 'center'
          ? anchor.left + (anchor.width - size.width) / 2
          : align === 'start'
            ? startEdge
            : endEdge;
    } else {
      x = at === 'right' ? anchor.right + offset : anchor.left - offset - size.width;
      const height = anchor.bottom - anchor.top;
      y =
        align === 'center'
          ? anchor.top + (height - size.height) / 2
          : align === 'start'
            ? anchor.top
            : anchor.bottom - size.height;
    }
    // Keep it on screen. When it is larger than the window, its start stays visible: the left
    // edge, or the right one in right-to-left layouts.
    const fit = (value: number, length: number, extent: number, startAtEnd: boolean) =>
      length > extent - 2 * padding
        ? startAtEnd
          ? extent - padding - length
          : padding
        : clamp(value, padding, extent - padding - length);
    x = fit(x, size.width, viewport.width, rtl);
    y = fit(y, size.height, viewport.height, false);

    floating.style.left = `${snap(x)}px`;
    floating.style.top = `${snap(y)}px`;
    floating.dataset.side = side;
    floating.dataset.align = align;
    // The anchor scrolled out of the window: the element stays at the edge, apart from it.
    const outside =
      anchor.bottom < 0 ||
      anchor.top > viewport.height ||
      anchor.right < 0 ||
      anchor.left > viewport.width;
    if (outside) floating.dataset.anchorHidden = '';
    else delete floating.dataset.anchorHidden;
  };

  // Scroll events don't bubble, but every one of them passes the document while capturing.
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  view.addEventListener('resize', schedule, { passive: true });

  return {
    update: place,
    detach() {
      document.removeEventListener('scroll', onScroll, { capture: true });
      view.removeEventListener('resize', schedule);
      resize.disconnect();
      if (frame !== undefined) view.cancelAnimationFrame(frame);
      for (const name of ['left', 'top', ...VARS]) floating.style.removeProperty(name);
      for (const name of ['side', 'align', 'anchorHidden', 'anchored'])
        delete floating.dataset[name];
    },
  };
}
