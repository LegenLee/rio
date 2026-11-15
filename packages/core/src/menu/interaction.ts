// The menu's behavior in the DOM: it shows in the top layer next to what opened it, takes the
// keyboard, and moves the focus in and back out. Built on `attachOverlay` and
// `attachAnchoredPosition` (see "Overlays" in docs/conventions.md).
//
// - Opening places the menu, then focuses the selected item, or else the first.
// - Up and Down move between the items, wrapping around, and Home and End go to the ends. Typing
//   letters moves to the next item whose label starts with them.
// - Disabled items take the focus too, as the spec says.
// - Tab closes the menu and moves on from the element that opened it, as in the WAI-ARIA menu
//   button pattern.
// - Closing after a choice or Escape gives the focus back to the anchor, or to whatever had it
//   before. A click elsewhere leaves the focus where the click put it.
//
// Not yet: submenus, and opening from the keyboard with the arrow keys.

import {
  attachAnchoredPosition,
  type AnchoredPositionHandle,
  type AnchoredSide,
  type AnchorPoint,
} from '../primitives/anchored-position/anchored-position';
import { attachOverlay } from '../primitives/overlay/overlay';
import { omitUndefined } from '../utils/object';
import { menuDefaults, type MenuProps } from './menu';

/**
 * A point a menu opens at, such as where a context menu was asked for, in viewport coordinates.
 * With `element`, what the point is on, the menu keeps to that spot on it as it scrolls, as it
 * follows an element anchor. Without, it stays where the point is on the screen.
 */
export interface MenuAnchorPoint extends AnchorPoint {
  element?: Element;
}

export interface MenuDomOptions {
  /** What the menu opens from: an element, such as a button, or a point, for a context menu. */
  anchor: () => HTMLElement | MenuAnchorPoint | null | undefined;
  /** The placement props, read when the menu opens. */
  props: () => Pick<MenuProps, 'side' | 'align' | 'offset'>;
  /**
   * The menu closed, or asks to close, on its own: Escape, a click outside, Tab, or another
   * overlay opening. The adapter sets `open` to false.
   */
  onClose: () => void;
}

export interface MenuDomHandle {
  /** Brings the menu in line with `open`. Call it once attached, and whenever `open` changes. */
  sync(open: boolean): void;
  /**
   * Call it when the anchor changes. An anchor other than the one the menu opened at is a new
   * request, as from another right-click: an open menu opens afresh there, with its opening motion.
   * One that fills in where there was none, such as a template ref, only places it.
   */
  update(): void;
  detach(): void;
}

/** Where to try next when the preferred side has no room: across, then to the sides. */
const FALLBACKS: Record<AnchoredSide, AnchoredSide[]> = {
  bottom: ['top', 'end', 'start'],
  top: ['bottom', 'end', 'start'],
  end: ['start', 'bottom', 'top'],
  start: ['end', 'bottom', 'top'],
};

/** How long typed letters add up to one search. */
const TYPEAHEAD_MS = 500;

const isElement = (
  anchor: HTMLElement | MenuAnchorPoint | null | undefined,
): anchor is HTMLElement => !!anchor && typeof (anchor as HTMLElement).focus === 'function';

/** Points are compared by value: an inline `{ x, y }` is a new object on every render. */
const samePoint = (a: MenuAnchorPoint, b: MenuAnchorPoint) =>
  a.x === b.x && a.y === b.y && a.element === b.element;

export function attachMenu(root: HTMLElement, options: MenuDomOptions): MenuDomHandle {
  const document = root.ownerDocument;
  // A menu moved to a new anchor during a press is closed by the browser when the press ends;
  // it opens again at the new anchor instead of telling the adapter (see `afterPress`).
  let reanchoring = false;
  const overlay = attachOverlay(root, {
    mode: 'auto',
    onClose: (reason) => {
      if (!(reanchoring && reason === 'dismiss')) options.onClose();
    },
  });

  // The items of this menu, not of one nested inside it
  const items = () =>
    [...root.querySelectorAll<HTMLElement>('[role^="menuitem"]')].filter(
      (item) => item.closest('[role="menu"]') === root,
    );
  const focused = () => items().indexOf(document.activeElement as HTMLElement);
  const focusAt = (index: number) => {
    const all = items();
    if (all.length) all[(index + all.length) % all.length]!.focus();
  };

  let anchored: AnchoredPositionHandle | undefined;
  let placement = '';
  /** What had the focus when the menu opened */
  let opener: HTMLElement | null = null;

  // A point on an element is measured against the element when the menu is asked to open there,
  // or the point changes. From then on it keeps to that spot on the element, so the menu follows
  // what was clicked as it scrolls.
  let pinned: { point: MenuAnchorPoint; x: number; y: number } | undefined;
  const pin = (fresh: boolean) => {
    const anchor = options.anchor();
    if (!anchor || isElement(anchor) || !anchor.element) {
      pinned = undefined;
      return;
    }
    if (!fresh && pinned && samePoint(pinned.point, anchor)) return;
    const rect = anchor.element.getBoundingClientRect();
    pinned = { point: { ...anchor }, x: anchor.x - rect.left, y: anchor.y - rect.top };
  };
  /** The anchor for placing: for a point on an element, where that spot is now */
  const anchorNow = () => {
    const anchor = options.anchor();
    if (!anchor || isElement(anchor) || !anchor.element) return anchor;
    // Placing skips an anchor taken out of the document.
    if (!anchor.element.isConnected) return undefined;
    if (!pinned || !samePoint(pinned.point, anchor)) pin(false);
    const rect = anchor.element.getBoundingClientRect();
    return { x: rect.left + pinned!.x, y: rect.top + pinned!.y };
  };

  const place = () => {
    const p = { ...menuDefaults, ...omitUndefined(options.props()) };
    const key = `${p.side} ${p.align} ${p.offset}`;
    if (anchored && key === placement) return anchored;
    anchored?.detach();
    placement = key;
    // Stays attached while the menu is closed, so a closing animation keeps its place.
    anchored = attachAnchoredPosition(root, {
      anchor: anchorNow,
      side: p.side,
      align: p.align,
      offset: p.offset,
      fallbacks: FALLBACKS[p.side],
    });
    return anchored;
  };

  const returnTarget = () => {
    const anchor = options.anchor();
    if (isElement(anchor) && anchor.isConnected) return anchor;
    return opener?.isConnected && !root.contains(opener) ? opener : null;
  };

  let typed = '';
  let typedAt = 0;
  const typeahead = (key: string) => {
    const now = performance.now();
    typed = now - typedAt > TYPEAHEAD_MS ? key : typed + key;
    typedAt = now;
    const all = items();
    const labelOf = (item: HTMLElement) =>
      (item.querySelector('.rio-menu-item__label')?.textContent ?? item.textContent ?? '')
        .trim()
        .toLowerCase();
    // Repeating one letter cycles through the items that start with it. A single letter looks from
    // the next item on; a longer search may still match the focused one.
    const search = [...typed].every((letter) => letter === typed[0]) ? typed[0]! : typed;
    const start = focused() + (search.length === 1 ? 1 : 0);
    for (let step = 0; step < all.length; step++) {
      const item = all[(Math.max(start, 0) + step) % all.length]!;
      if (labelOf(item).startsWith(search)) {
        item.focus();
        return;
      }
    }
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const handled = () => event.preventDefault();
    switch (event.key) {
      case 'ArrowDown':
        handled();
        focusAt(focused() + 1);
        return;
      case 'ArrowUp':
        handled();
        focusAt(focused() < 0 ? -1 : focused() - 1);
        return;
      case 'Home':
        handled();
        focusAt(0);
        return;
      case 'End':
        handled();
        focusAt(-1);
        return;
      case 'Tab':
        // Not prevented: the browser moves on from the element that opened the menu.
        options.onClose();
        returnTarget()?.focus();
        return;
    }
    // A space with nothing typed yet presses the item.
    if (event.key.length === 1 && !(event.key === ' ' && !typed)) {
      handled();
      typeahead(event.key.toLowerCase());
    }
  };
  root.addEventListener('keydown', onKeydown);

  /** What the menu last opened at: its anchor element or point, or null for none */
  let shownAt: HTMLElement | MenuAnchorPoint | null = null;
  // An anchor other than that one is a new request, as from another right-click. One that fills
  // in where there was none, such as a template ref after the first render, isn't.
  const isNewAnchor = () => {
    const anchor = options.anchor();
    if (!anchor || !shownAt) return false;
    if (isElement(anchor) || isElement(shownAt)) return anchor !== shownAt;
    return !samePoint(anchor, shownAt);
  };
  const remember = () => {
    const anchor = options.anchor();
    shownAt = !anchor ? null : isElement(anchor) ? anchor : { ...anchor };
  };

  /**
   * Opens the menu. `afresh` opens it as if it had been closed: a menu still open, or still fading
   * out after a click outside, would only turn its closing back where it is, so that is cut short
   * and the opening motion plays from the start. By default, at a new anchor.
   */
  const show = (afresh = isNewAnchor()) => {
    const active = document.activeElement;
    if (!root.contains(active)) {
      opener = active instanceof document.defaultView!.HTMLElement ? active : null;
    }
    if (afresh) {
      root.style.setProperty('transition', 'none');
      if (root.matches(':popover-open')) overlay.hide();
      // Let the browser see it closed, so it opens from its starting style.
      void root.offsetWidth;
      root.style.removeProperty('transition');
    }
    const anchored = place();
    const anchor = options.anchor();
    remember();
    // What it opened from. For a point, what it is on, so a context menu asked for inside an open
    // popover nests in it rather than closing it.
    const on = anchor && !isElement(anchor) ? anchor.element : undefined;
    overlay.show(
      isElement(anchor) ? anchor : on instanceof document.defaultView!.HTMLElement ? on : undefined,
    );
    anchored.update();
    const all = items();
    (all.find((item) => item.getAttribute('aria-checked') === 'true') ?? all[0])?.focus();
  };

  // A context menu is asked for while the button is still down, in Safari, Firefox, and Chromium on
  // Linux and macOS. Releasing it then counts as a click outside, and closes the menu at once
  // wherever the browser follows the spec's light dismiss (WebKit does). So from a `contextmenu`
  // that comes with a button down until the press ends, opening or moving the menu waits, until a
  // task after the release, past the light dismiss. Other clicks and the keyboard never wait.
  // A release can go missing (the browser's own context menu takes it, or the window loses the
  // focus mid-press), so the wait also ends on those, and after a second at most.
  const view = document.defaultView!;
  let pressing = false;
  let afterPress: (() => void) | undefined;
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  const release = () => {
    if (!pressing) return;
    pressing = false;
    clearTimeout(pressTimer);
    const run = afterPress;
    afterPress = undefined;
    if (run) setTimeout(run);
  };
  // Capturing, so this comes before the app's own handler opens the menu. A `contextmenu` with no
  // button down, from the keyboard or after the release, as on Windows, doesn't wait.
  const onContextMenu = (event: MouseEvent) => {
    if (event.buttons === 0) return;
    pressing = true;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(release, 1000);
  };
  // When no handler took it, the browser's own menu opens and keeps the release. Checked once the
  // event is done, so an app handler on `window` counts in any order.
  const onContextMenuDone = (event: MouseEvent) => {
    setTimeout(() => {
      if (!event.defaultPrevented) release();
    });
  };
  document.addEventListener('contextmenu', onContextMenu, { capture: true });
  view.addEventListener('contextmenu', onContextMenuDone);
  for (const type of ['pointerup', 'pointercancel']) {
    document.addEventListener(type, release, { capture: true });
  }
  view.addEventListener('blur', release);

  let wanted = false;
  return {
    sync(open) {
      wanted = open;
      const shown = root.matches(':popover-open');
      if (open && !shown) {
        // Measured now, while what was clicked is where it was, even if opening waits.
        pin(true);
        if (pressing) afterPress = () => wanted && !root.matches(':popover-open') && show();
        else show();
      } else if (!open) {
        const hadFocus = root.contains(document.activeElement);
        afterPress = undefined;
        reanchoring = false;
        overlay.hide();
        typed = '';
        if (hadFocus) returnTarget()?.focus();
      }
    },
    update() {
      pin(false);
      if (!root.matches(':popover-open')) {
        // Closed by the release a moment ago (Windows), with the browser's word of it, the
        // `toggle` event, still to come: a new anchor opens it afresh all the same, and that
        // event then finds it open.
        if (wanted && !pressing && isNewAnchor()) show(true);
        return;
      }
      // Moved by a context menu asked for elsewhere, during a press: it stays put until the press
      // ends, then opens afresh at the new anchor, as a context menu opens the first time. The
      // release closes it in some browsers, and where they animate the closing, it is still
      // fading out by then.
      if (pressing) {
        reanchoring = true;
        afterPress = () => {
          reanchoring = false;
          if (wanted) show(true);
        };
        return;
      }
      // A new anchor, as from a right-click that comes after the release (Windows), opens it
      // afresh there too. One that fills in where there was none only places it.
      if (isNewAnchor()) {
        show(true);
      } else {
        remember();
        place().update();
      }
    },
    detach() {
      root.removeEventListener('keydown', onKeydown);
      document.removeEventListener('contextmenu', onContextMenu, { capture: true });
      view.removeEventListener('contextmenu', onContextMenuDone);
      for (const type of ['pointerup', 'pointercancel']) {
        document.removeEventListener(type, release, { capture: true });
      }
      view.removeEventListener('blur', release);
      clearTimeout(pressTimer);
      pressing = false;
      afterPress = undefined;
      overlay.detach();
      anchored?.detach();
    },
  };
}
