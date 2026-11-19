// The menu's behavior in the DOM: it shows in the top layer next to what opened it, takes the
// keyboard, and moves the focus in and back out. Built on `attachOverlay` and
// `attachAnchoredPosition` (see "Overlays" in docs/conventions.md).
//
// - Opening places the menu, then focuses the selected item, or else the first.
// - Up and Down move between the items, wrapping around, and Home and End go to the ends. Typing
//   letters moves to the next item whose label starts with them.
// - Disabled items take the focus too.
// - Tab closes the menu and moves on from the element that opened it.
// - Closing after a choice or Escape gives the focus back to the anchor, or to whatever had it
//   before. A click elsewhere leaves the focus where the click put it.
// - A right-click in an open menu opens nothing: the browser's own menu doesn't show over it. On a
//   field that takes text, it does, for pasting and spelling.
//
// Submenus (`attachSubMenu`) are menus too, with these on top:
// - The pointer opens one after resting on its item for a moment, and a click opens it at once.
//   Heading for an open submenu, the pointer may cross other items without closing it, for a short
//   while: within the triangle from where it left the item to the submenu's near side, and only
//   while it moves that way. Pointing at another item closes it.
// - The focus follows the pointer from one open menu into another. Within one menu, pointing
//   doesn't move it.
// - Right (left in right-to-left layouts), Enter, and Space on its item open it and focus its
//   first item. Left and Escape close it and give the focus back to its item. Tab and a choice
//   close the whole menu.
// - The menu with the pointer or the focus has the active shape, and the other open menus around
//   it the inactive one: `onInactiveChange` tells each menu as it changes.
//
// Not yet: opening a menu from its trigger with the arrow keys.

import {
  attachAnchoredPosition,
  type AnchoredPositionHandle,
  type AnchoredSide,
  type AnchorPoint,
} from '../primitives/anchored-position/anchored-position';
import { attachOverlay } from '../primitives/overlay/overlay';
import { resolveProps } from '../utils/object';
import { createTypeahead } from '../utils/typeahead';
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
  /** The menu takes the inactive shape, or the active one again, for `createMenu`'s `inactive`. */
  onInactiveChange?: (inactive: boolean) => void;
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

export interface SubMenuDomOptions {
  /**
   * The submenu opens or closes on its own: the pointer, the arrow keys, Escape, or a click
   * elsewhere. The adapter sets its `open` to match.
   */
  onOpenChange: (open: boolean) => void;
  /** As a menu's `onInactiveChange` */
  onInactiveChange?: (inactive: boolean) => void;
}

export interface SubMenuDomHandle {
  /** Brings the submenu in line with `open`. Call it once attached, and whenever `open` changes. */
  sync(open: boolean): void;
  detach(): void;
}

/** Where to try next when the preferred side has no room: across, then to the sides. */
const FALLBACKS: Record<AnchoredSide, AnchoredSide[]> = {
  bottom: ['top', 'end', 'start'],
  top: ['bottom', 'end', 'start'],
  end: ['start', 'bottom', 'top'],
  start: ['end', 'bottom', 'top'],
};

/** How long the pointer rests on an item before its submenu opens */
const HOVER_OPEN_MS = 100;
/** How long the pointer may take to reach an open submenu across other items */
const GRACE_MS = 300;
/**
 * A submenu goes beside its item, 4px off the menu around it (the item is inset 4px), with its
 * first item lined up with the item (its own are inset 4px from its top).
 */
const SUBMENU_PLACEMENT = { side: 'end', align: 'start', offset: 8, alignOffset: -4 } as const;

const isElement = (
  anchor: HTMLElement | MenuAnchorPoint | null | undefined,
): anchor is HTMLElement => !!anchor && typeof (anchor as HTMLElement).focus === 'function';

/** Points are compared by value: an inline `{ x, y }` is a new object on every render. */
const samePoint = (a: MenuAnchorPoint, b: MenuAnchorPoint) =>
  a.x === b.x && a.y === b.y && a.element === b.element;

type Point = { x: number; y: number };

/** Whether a point is inside a polygon, by casting a ray to the right and counting crossings */
const isInside = ({ x, y }: Point, polygon: readonly Point[]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

// What a menu shares with the submenus in it

/** A submenu's item, as the menu it sits in drives it with the pointer */
interface Opener {
  /** The pointer is on the item: the submenu opens after a moment. */
  hover(): void;
  /** The pointer went to another item: the submenu closes. */
  cancel(): void;
}

interface MenuState {
  /** The submenus in the menu, by the item that opens each */
  openers: Map<HTMLElement, Opener>;
  /** Where the pointer may cross other items on its way to an open submenu, for a short while */
  grace?: {
    area: Point[];
    /** Which way the submenu lies from its item: beside it, or below or above without room there */
    toward: 'left' | 'right' | 'up' | 'down';
    timer: ReturnType<typeof setTimeout>;
  };
  /** Whether letters typed a moment ago still add up, so a space is part of the search */
  typing: () => boolean;
}

// Made by whichever comes first: a submenu inside mounts before the menu around it does.
const menuStates = new WeakMap<HTMLElement, MenuState>();
const stateOf = (menu: HTMLElement) => {
  let state = menuStates.get(menu);
  if (!state) {
    state = { openers: new Map(), typing: () => false };
    menuStates.set(menu, state);
  }
  return state;
};
const endGrace = (state: MenuState) => {
  if (state.grace) clearTimeout(state.grace.timer);
  state.grace = undefined;
};

// The open menus of one tree, a menu and its open submenus, share the active shape: the one the
// pointer or the focus was last in has it, and the others are inactive. With one menu open, it is
// simply active. Each menu hears of its own as it changes.
const menuAround = (element: Element) => element.parentElement?.closest<HTMLElement>('.rio-menu');
const topOf = (menu: HTMLElement) => {
  let top = menu;
  for (let up = menuAround(menu); up; up = menuAround(up)) top = up;
  return top;
};
/** A field that takes text, where a right-click keeps the browser's menu */
const TEXT_FIELD = [
  'input:not([type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"],' +
    ' [type="button"], [type="submit"], [type="reset"], [type="image"])',
  'textarea',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');
const activeMenus = new WeakMap<HTMLElement, HTMLElement>();
const shapes = new WeakMap<
  HTMLElement,
  { inactive: boolean; report?: (inactive: boolean) => void }
>();
const setInactive = (menu: HTMLElement, inactive: boolean) => {
  const shape = shapes.get(menu);
  if (!shape || shape.inactive === inactive) return;
  shape.inactive = inactive;
  shape.report?.(inactive);
};
const shapeTree = (menu: HTMLElement, active?: HTMLElement) => {
  const top = topOf(menu);
  if (active) activeMenus.set(top, active);
  // Closed since: the nearest menu still open around it takes over.
  let current: HTMLElement | null | undefined = activeMenus.get(top) ?? top;
  while (current && !current.matches(':popover-open')) current = menuAround(current);
  const open = [top, ...top.querySelectorAll<HTMLElement>('.rio-menu')].filter((each) =>
    each.matches(':popover-open'),
  );
  for (const each of open) setInactive(each, open.length > 1 && each !== current);
};

type Placement = Pick<MenuProps, 'side' | 'align' | 'offset'> & { alignOffset?: number };

/** What a submenu changes in its menu's behavior */
interface Nested {
  /** Whether opening moves the focus into it: from the keyboard, not the pointer */
  focusOnShow: () => boolean;
}

type MenuDom = MenuDomHandle & {
  /** Focuses the selected item, or else the first. */
  focusFirst(): void;
};

export function attachMenu(root: HTMLElement, options: MenuDomOptions): MenuDomHandle {
  return setup(root, options);
}

function setup(
  root: HTMLElement,
  options: Omit<MenuDomOptions, 'props'> & { props: () => Placement },
  nested?: Nested,
): MenuDom {
  const document = root.ownerDocument;
  const view = document.defaultView!;
  shapes.set(root, { inactive: false, report: options.onInactiveChange });
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
    const p = resolveProps({ ...menuDefaults, alignOffset: 0 }, options.props());
    const key = `${p.side} ${p.align} ${p.offset} ${p.alignOffset}`;
    if (anchored && key === placement) return anchored;
    anchored?.detach();
    placement = key;
    // Stays attached while the menu is closed, so a closing animation keeps its place.
    anchored = attachAnchoredPosition(root, {
      anchor: anchorNow,
      side: p.side,
      align: p.align,
      offset: p.offset,
      alignOffset: p.alignOffset,
      fallbacks: FALLBACKS[p.side],
    });
    return anchored;
  };

  const returnTarget = () => {
    const anchor = options.anchor();
    if (isElement(anchor) && anchor.isConnected) return anchor;
    return opener?.isConnected && !root.contains(opener) ? opener : null;
  };

  const search = createTypeahead();
  const typeahead = (key: string) => {
    const all = items();
    const labels = all.map(
      (item) => item.querySelector('.rio-menu-item__label')?.textContent ?? item.textContent ?? '',
    );
    all[search.find(key, labels, focused())]?.focus();
  };

  const state = stateOf(root);
  state.typing = search.typing;

  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    // Tab closes the whole menu, from a submenu too, so the outermost menu takes it.
    if (event.key === 'Tab') {
      if (nested) return;
      // Not prevented: the browser moves on from the element that opened the menu.
      options.onClose();
      returnTarget()?.focus();
      return;
    }
    // The keys pressed in a submenu are the submenu's.
    if ((event.target as Element).closest('[role="menu"]') !== root) return;
    // Keys make the menu they are pressed in the active one, as the focus moving in does. Not only
    // through `focusin`: a window without the system's focus doesn't fire it.
    if (activeMenus.get(topOf(root)) !== root) shapeTree(root, root);
    const handled = () => event.preventDefault();
    if (nested && event.key === (isRtl() ? 'ArrowRight' : 'ArrowLeft')) {
      handled();
      options.onClose();
      return;
    }
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
    }
    // A space presses the item, unless letters typed a moment ago are still adding up.
    if (event.key.length === 1 && !(event.key === ' ' && !search.typing())) {
      handled();
      typeahead(event.key);
    }
  };
  root.addEventListener('keydown', onKeydown);

  const isRtl = () => view.getComputedStyle(root).direction === 'rtl';

  // The pointer over the menu's own items opens the submenu of the one it rests on and closes the
  // others, except while it heads for an open submenu across other items (`MenuState.grace`). Only
  // a mouse: a touch has no hover, and a tap opens a submenu with its click.
  //
  // The focus follows the pointer from one open menu into another, a submenu or the menu around
  // it, so the keys carry on where the pointer is. Within the menu that has the focus, pointing
  // doesn't move it.
  let last: Point | undefined;
  /** Which way the pointer last moved, across and down */
  const heading: { x?: 'left' | 'right'; y?: 'up' | 'down' } = {};
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    const target = event.target as Element;
    if (target.closest('[role="menu"]') !== root) return;
    const point = { x: event.clientX, y: event.clientY };
    if (last && point.x !== last.x) heading.x = point.x > last.x ? 'right' : 'left';
    if (last && point.y !== last.y) heading.y = point.y > last.y ? 'down' : 'up';
    last = point;
    if (activeMenus.get(topOf(root)) !== root) shapeTree(root, root);
    const { grace } = state;
    if (grace) {
      const across = grace.toward === 'left' || grace.toward === 'right';
      if ((across ? heading.x : heading.y) === grace.toward && isInside(point, grace.area)) return;
    }
    endGrace(state);
    const item = target.closest<HTMLElement>('[role^="menuitem"]');
    if (!item) return;
    const focusedMenu = document.activeElement?.closest<HTMLElement>('[role="menu"]');
    // Without scrolling: an item half shown at the edge would otherwise slide under the pointer.
    if (focusedMenu && focusedMenu !== root && topOf(focusedMenu) === topOf(root)) {
      item.focus({ preventScroll: true });
    }
    for (const [opener, control] of state.openers) if (opener !== item) control.cancel();
    state.openers.get(item)?.hover();
  };
  root.addEventListener('pointermove', onPointerMove);
  const onContextMenuIn = (event: MouseEvent) => {
    if ((event.target as Element).closest(TEXT_FIELD)) return;
    event.preventDefault();
  };
  root.addEventListener('contextmenu', onContextMenuIn);
  // The focus moving into the menu, from the keyboard, makes it the active one too.
  const onFocusIn = (event: FocusEvent) => {
    if ((event.target as Element).closest('[role="menu"]') === root) shapeTree(root, root);
  };
  root.addEventListener('focusin', onFocusIn);

  const focusFirst = () => {
    const all = items();
    (all.find((item) => item.getAttribute('aria-checked') === 'true') ?? all[0])?.focus();
  };

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
    // A menu that takes the focus becomes the active one; a submenu the pointer opened leaves the
    // active shape where the pointer is.
    const focusing = !nested || nested.focusOnShow();
    shapeTree(root, focusing ? root : undefined);
    if (focusing) focusFirst();
  };

  // A context menu is asked for while the button is still down, in Safari, Firefox, and Chromium on
  // Linux and macOS. Releasing it then counts as a click outside, and closes the menu at once
  // wherever the browser follows the spec's light dismiss (WebKit does). So from a `contextmenu`
  // that comes with a button down until the press ends, opening or moving the menu waits, until a
  // task after the release, past the light dismiss. Other clicks and the keyboard never wait.
  // A release can go missing (the browser's own context menu takes it, or the window loses the
  // focus mid-press), so the wait also ends on those, and after a second at most. A submenu never
  // opens from a context menu's press, so it doesn't listen.
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
  if (!nested) {
    document.addEventListener('contextmenu', onContextMenu, { capture: true });
    view.addEventListener('contextmenu', onContextMenuDone);
    for (const type of ['pointerup', 'pointercancel']) {
      document.addEventListener(type, release, { capture: true });
    }
    view.addEventListener('blur', release);
  }

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
        search.reset();
        shapeTree(root);
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
    focusFirst,
    detach() {
      root.removeEventListener('keydown', onKeydown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('contextmenu', onContextMenuIn);
      root.removeEventListener('focusin', onFocusIn);
      endGrace(state);
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
      shapes.delete(root);
    },
  };
}

/**
 * A submenu's behavior in the DOM: a menu (see `attachMenu`) that `item` opens, shown beside it.
 * `item` sits in a menu that `attachMenu` or this function runs, and `root` follows it.
 */
export function attachSubMenu(
  item: HTMLElement,
  root: HTMLElement,
  options: SubMenuDomOptions,
): SubMenuDomHandle {
  const view = item.ownerDocument.defaultView!;
  const parent = item.closest<HTMLElement>('[role="menu"]');
  /** Whether the submenu is open, as last `sync`ed */
  let open = false;
  /**
   * Whether it is meant to be open: the last state asked for, or `sync`ed. An adapter may open it
   * some time after it is asked to; moving on to another item in between still closes it.
   */
  let wanted = false;
  /** Whether the opening asked for moves the focus in: from the keyboard, not the pointer */
  let focusIn = false;
  const request = (next: boolean, focus = false) => {
    focusIn = focus;
    wanted = next;
    options.onOpenChange(next);
  };
  const dom = setup(
    root,
    {
      anchor: () => item,
      props: () => SUBMENU_PLACEMENT,
      onClose: () => request(false),
      onInactiveChange: options.onInactiveChange,
    },
    { focusOnShow: () => focusIn },
  );
  const disabled = () => item.getAttribute('aria-disabled') === 'true';

  // The item invokes the submenu (`popovertarget`), so a click on it isn't a click outside, which
  // would close the open submenu. The click opens it through the adapter (`handleClick`), not the
  // browser, and is then stopped.
  // A click from the keyboard or assistive technology has no pointer behind it (`detail` 0), and
  // moves the focus in, as the keys do.
  const onClickFirst = (event: MouseEvent) => {
    focusIn = event.detail === 0;
  };
  const onClick = (event: MouseEvent) => event.preventDefault();
  item.addEventListener('click', onClickFirst, { capture: true });
  item.addEventListener('click', onClick);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const stopTimer = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const opener: Opener = {
    hover() {
      if (wanted || disabled() || timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        // Not once the menu around it has closed
        if (!parent || parent.matches(':popover-open')) request(true);
      }, HOVER_OPEN_MS);
    },
    cancel() {
      stopTimer();
      if (wanted) request(false);
    },
  };
  if (parent) stateOf(parent).openers.set(item, opener);

  // Leaving the item for the open submenu: the pointer may cross the items between, inside the
  // triangle from where it left to the submenu's near side (bled 5px back, so the start counts).
  // The submenu lies beside the item, or below or above it when it had no room beside.
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    stopTimer();
    if (!open || !parent) return;
    const state = stateOf(parent);
    const box = root.getBoundingClientRect();
    const from = item.getBoundingClientRect();
    const toward =
      box.top >= from.bottom - 1
        ? 'down'
        : box.bottom <= from.top + 1
          ? 'up'
          : box.left >= from.left
            ? 'right'
            : 'left';
    const across = toward === 'left' || toward === 'right';
    const bleed = toward === 'right' || toward === 'down' ? -5 : 5;
    const exit = across
      ? { x: event.clientX + bleed, y: event.clientY }
      : { x: event.clientX, y: event.clientY + bleed };
    const near = { right: box.left, left: box.right, down: box.top, up: box.bottom }[toward];
    const far = { right: box.right, left: box.left, down: box.bottom, up: box.top }[toward];
    endGrace(state);
    state.grace = {
      area: across
        ? [
            exit,
            { x: near, y: box.top },
            { x: far, y: box.top },
            { x: far, y: box.bottom },
            { x: near, y: box.bottom },
          ]
        : [
            exit,
            { x: box.left, y: near },
            { x: box.left, y: far },
            { x: box.right, y: far },
            { x: box.right, y: near },
          ],
      toward,
      timer: setTimeout(() => endGrace(state), GRACE_MS),
    };
  };
  item.addEventListener('pointerleave', onPointerLeave);

  // Right (left in right-to-left layouts), Enter, and Space open it with the focus on its first
  // item. A space while letters are being typed is part of the search.
  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const forward = view.getComputedStyle(item).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const space = event.key === ' ' && !(parent && stateOf(parent).typing());
    if (event.key !== forward && event.key !== 'Enter' && !space) return;
    // Also keeps Enter and Space from clicking the item.
    event.preventDefault();
    if (disabled()) return;
    if (open) dom.focusFirst();
    else request(true, true);
  };
  item.addEventListener('keydown', onKeydown);

  return {
    sync(next) {
      open = next;
      wanted = next;
      if (!next) stopTimer();
      dom.sync(next);
    },
    detach() {
      stopTimer();
      item.removeEventListener('click', onClickFirst, { capture: true });
      item.removeEventListener('click', onClick);
      item.removeEventListener('pointerleave', onPointerLeave);
      item.removeEventListener('keydown', onKeydown);
      if (parent && stateOf(parent).openers.get(item) === opener) {
        stateOf(parent).openers.delete(item);
      }
      dom.detach();
    },
  };
}
