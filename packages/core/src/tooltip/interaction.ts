// The tooltip's behavior in the DOM. `trigger` wraps the element the tooltip is for and the tooltip
// itself (`root`), so the pointer moving from one to the other stays inside it, and the tooltip
// comes right after the element in the focus order. Built on `attachOverlay` and
// `attachAnchoredPosition` (see "Overlays" in docs/conventions.md).
//
// Transient, the default:
// - The pointer resting on the element for a moment shows the tooltip. Once a tooltip shows, the
//   next one shows at once, as the pointer moves along a toolbar. A pointer passing over shows none.
// - Focus from the keyboard shows it at once. A touch held for a moment shows it too, and the click
//   that follows doesn't count.
// - It closes 1.5s after the pointer and the focus leave both the element and the tooltip, at once
//   when the element is pressed, on Escape, and when another tooltip shows.
//
// Persistent (rich):
// - A click on the element opens it, and another click closes it. A click or the focus elsewhere,
//   and Escape, close it too. The pointer resting on the element doesn't open it.
//
// The element gets `aria-describedby` pointing at the tooltip, or at a dialog's text, unless its
// own name already says the same, as an icon button labeled with the tooltip's text does. A
// persistent tooltip's element also gets `aria-expanded`.

import {
  attachAnchoredPosition,
  type AnchoredPositionHandle,
} from '../primitives/anchored-position/anchored-position';
import { attachOverlay, type OverlayHandle } from '../primitives/overlay/overlay';
import type { TooltipPlacement } from './tooltip';

export interface TooltipDomOptions {
  /** Where the tooltip shows, read when it opens. */
  placement: () => TooltipPlacement;
  /** Whether it opens on a click and stays open. */
  persistent: () => boolean;
  /** Whether it holds actions, and so is a dialog whose text describes the element. */
  interactive: () => boolean;
  /** The tooltip opens or closes on its own. The adapter sets `open` to match. */
  onOpenChange: (open: boolean) => void;
}

export interface TooltipDomHandle {
  /** Brings the tooltip in line with `open`. Call it once attached, and whenever `open` changes. */
  sync(open: boolean): void;
  /** Call it after the element or the tooltip's content changed, to update the element's ARIA. */
  update(): void;
  detach(): void;
}

/** How long the pointer rests on the element before its tooltip shows */
const SHOW_DELAY_MS = 500;
/** How long a tooltip stays after the pointer and the focus leave */
const HIDE_DELAY_MS = 1500;
/** How soon after a tooltip closes the next one still shows at once */
const WARM_MS = 300;
/** How long a touch is held to show the tooltip */
const LONG_PRESS_MS = 500;
/** How long after a touch that showed the tooltip ends its click is swallowed */
const SWALLOW_CLICK_MS = 600;
/** How far a held touch may move, in px, and still count as held */
const MOVE_SLOP = 10;

// Every tooltip shown now, and when the last one closed: right after one, the next shows at once.
const shown = new Set<HTMLElement>();
let lastClosedAt = -Infinity;
const warm = () => shown.size > 0 || performance.now() - lastClosedAt < WARM_MS;

const textOf = (element: Element | null | undefined) =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** The element's accessible name, near enough to tell whether a tooltip repeats it */
const nameOf = (element: HTMLElement) => {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const document = element.ownerDocument;
    return labelledBy
      .split(/\s+/)
      .map((id) => textOf(document.getElementById(id)))
      .join(' ')
      .trim();
  }
  return element.getAttribute('aria-label')?.trim() || textOf(element);
};

/** Adds or removes one id in a space-separated attribute, keeping the others. */
const setToken = (element: HTMLElement, name: string, id: string, on: boolean) => {
  const ids = (element.getAttribute(name) ?? '').split(/\s+/).filter((each) => each && each !== id);
  if (on) ids.push(id);
  if (ids.length) element.setAttribute(name, ids.join(' '));
  else element.removeAttribute(name);
};

export function attachTooltip(
  trigger: HTMLElement,
  root: HTMLElement,
  options: TooltipDomOptions,
): TooltipDomHandle {
  const document = trigger.ownerDocument;
  const view = document.defaultView!;
  /** The element the tooltip is for: the trigger's first child, ahead of the tooltip */
  const element = () => {
    const first = trigger.firstElementChild;
    return first instanceof view.HTMLElement && first !== root ? first : null;
  };
  const isOpen = () => root.matches(':popover-open');
  const request = (open: boolean) => options.onOpenChange(open);

  // A transient tooltip is a manual popover that gives way to any other overlay. A persistent one
  // is an auto popover, which a click or another popover elsewhere closes. Either way, clicks and
  // presses in it stay in it, so a card or a row around its element doesn't take them.
  let overlay: OverlayHandle | undefined;
  let overlayPersistent: boolean | undefined;
  /** When the pointer last went down on the element, whether the tooltip was open */
  let openAtPress = false;
  const overlayNow = () => {
    const persistent = options.persistent();
    if (overlay && persistent === overlayPersistent) return overlay;
    overlay?.detach();
    overlayPersistent = persistent;
    const onClose = () => request(false);
    overlay = attachOverlay(
      root,
      persistent
        ? { mode: 'auto', contain: true, onClose }
        : { mode: 'manual', transient: true, contain: true, onClose },
    );
    return overlay;
  };

  let anchored: AnchoredPositionHandle | undefined;
  let placement = '';
  const place = () => {
    const p = options.placement();
    const key = `${p.side} ${p.align} ${p.offset}`;
    if (anchored && key === placement) return anchored;
    anchored?.detach();
    placement = key;
    anchored = attachAnchoredPosition(root, {
      anchor: element,
      side: p.side,
      align: p.align,
      offset: p.offset,
    });
    return anchored;
  };

  // ARIA on the element, which belongs to the app: only the id Rio adds is taken away again.
  let described: { element: HTMLElement; id: string } | undefined;
  let expanded: HTMLElement | undefined;
  const updateAria = () => {
    const target = element();
    const text = options.interactive()
      ? root.querySelector<HTMLElement>('.rio-tooltip__supporting-text')
      : root;
    const describe = !!target && !!text?.id && nameOf(target) !== textOf(text);
    if (described && (!describe || described.element !== target || described.id !== text!.id)) {
      setToken(described.element, 'aria-describedby', described.id, false);
      described = undefined;
    }
    if (describe && !described) {
      setToken(target, 'aria-describedby', text!.id, true);
      described = { element: target, id: text!.id };
    }
    const persistent = options.persistent();
    if (expanded && (!persistent || expanded !== target)) {
      expanded.removeAttribute('aria-expanded');
      expanded = undefined;
    }
    if (persistent && target) {
      target.setAttribute('aria-expanded', String(isOpen()));
      expanded = target;
    }
  };

  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  const stopShow = () => {
    clearTimeout(showTimer);
    showTimer = undefined;
  };
  const stopHide = () => {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  };
  // Hidden after a while, unless by then the pointer is back, or the keyboard's focus is in. Focus
  // a click left on one of the tooltip's buttons doesn't keep it.
  const hideLater = () => {
    stopHide();
    hideTimer = setTimeout(() => {
      hideTimer = undefined;
      const focused = document.activeElement;
      const keyboard = !!focused && trigger.contains(focused) && focused.matches(':focus-visible');
      if (!trigger.matches(':hover') && !keyboard) request(false);
    }, HIDE_DELAY_MS);
  };

  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || options.persistent()) return;
    stopHide();
    if (isOpen() || showTimer !== undefined) return;
    if (warm()) {
      request(true);
      return;
    }
    showTimer = setTimeout(() => {
      showTimer = undefined;
      request(true);
    }, SHOW_DELAY_MS);
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || options.persistent()) return;
    stopShow();
    if (isOpen()) hideLater();
  };

  const onFocusIn = (event: FocusEvent) => {
    if (options.persistent()) return;
    // Focus from the keyboard on the element or in it, or any focus in the tooltip
    const focused = event.target as Element;
    if (!root.contains(focused) && !focused.matches(':focus-visible')) return;
    stopShow();
    stopHide();
    if (!isOpen()) request(true);
  };
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && trigger.contains(next)) return;
    if (options.persistent()) {
      // The focus moving to something else is an interaction with it. The window losing the focus
      // isn't.
      if (next && isOpen()) request(false);
      return;
    }
    if (isOpen()) hideLater();
  };

  // A touch held on the element shows the tooltip, and the click it ends with is swallowed, so a
  // person checking what a button does doesn't press it.
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let pressedAt: { x: number; y: number } | undefined;
  let swallowUntil = -Infinity;
  const stopPress = () => {
    clearTimeout(pressTimer);
    pressTimer = undefined;
    pressedAt = undefined;
  };
  const onPointerDown = (event: PointerEvent) => {
    const target = element();
    if (!target?.contains(event.target as Node)) return;
    openAtPress = isOpen();
    if (options.persistent()) return;
    stopShow();
    if (event.pointerType === 'touch') {
      stopPress();
      pressedAt = { x: event.clientX, y: event.clientY };
      pressTimer = setTimeout(() => {
        stopPress();
        swallowUntil = Infinity;
        stopHide();
        request(true);
      }, LONG_PRESS_MS);
      return;
    }
    // Pressing the element closes its tooltip.
    stopHide();
    if (isOpen()) request(false);
  };
  // A touch that moves away, as a drag the browser leaves to the page does, isn't held.
  const onPointerMove = (event: PointerEvent) => {
    if (!pressedAt) return;
    if (Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y) > MOVE_SLOP) {
      stopPress();
    }
  };
  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' || options.persistent()) return;
    stopPress();
    if (swallowUntil === Infinity) {
      swallowUntil = performance.now() + SWALLOW_CLICK_MS;
      if (isOpen()) hideLater();
    }
  };
  const onPointerCancel = () => {
    stopPress();
    swallowUntil = -Infinity;
  };
  // The browser's own menu for a held touch stays away while the tooltip has it.
  const onContextMenu = (event: MouseEvent) => {
    if (pressTimer !== undefined || performance.now() < swallowUntil) event.preventDefault();
  };
  const onClickFirst = (event: MouseEvent) => {
    if (performance.now() >= swallowUntil || !element()?.contains(event.target as Node)) return;
    swallowUntil = -Infinity;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  // A click on the element opens a persistent tooltip, or closes it, though a click outside the
  // popover closes it already by the time the click arrives.
  const onClick = (event: MouseEvent) => {
    if (!options.persistent()) return;
    if (!element()?.contains(event.target as Node)) return;
    // A click from the keyboard has no press before it (`detail` 0).
    request(!(event.detail === 0 ? isOpen() : openAtPress));
  };

  trigger.addEventListener('pointerenter', onPointerEnter);
  trigger.addEventListener('pointerleave', onPointerLeave);
  trigger.addEventListener('focusin', onFocusIn);
  trigger.addEventListener('focusout', onFocusOut);
  trigger.addEventListener('pointerdown', onPointerDown);
  trigger.addEventListener('pointermove', onPointerMove);
  trigger.addEventListener('pointerup', onPointerUp);
  trigger.addEventListener('pointercancel', onPointerCancel);
  trigger.addEventListener('contextmenu', onContextMenu);
  trigger.addEventListener('click', onClickFirst, { capture: true });
  trigger.addEventListener('click', onClick);
  overlayNow();
  updateAria();

  return {
    sync(open) {
      const showing = isOpen();
      if (open && !showing) {
        const target = element();
        // Nothing to show it for: the adapter's `open` goes back.
        if (!target) {
          request(false);
          return;
        }
        overlayNow().show(target);
        place().update();
        shown.add(root);
      } else if (!open) {
        stopShow();
        stopHide();
        if (showing) overlay?.hide();
        if (shown.delete(root)) lastClosedAt = performance.now();
      }
      updateAria();
    },
    update: updateAria,
    detach() {
      trigger.removeEventListener('pointerenter', onPointerEnter);
      trigger.removeEventListener('pointerleave', onPointerLeave);
      trigger.removeEventListener('focusin', onFocusIn);
      trigger.removeEventListener('focusout', onFocusOut);
      trigger.removeEventListener('pointerdown', onPointerDown);
      trigger.removeEventListener('pointermove', onPointerMove);
      trigger.removeEventListener('pointerup', onPointerUp);
      trigger.removeEventListener('pointercancel', onPointerCancel);
      trigger.removeEventListener('contextmenu', onContextMenu);
      trigger.removeEventListener('click', onClickFirst, { capture: true });
      trigger.removeEventListener('click', onClick);
      stopShow();
      stopHide();
      stopPress();
      if (described) setToken(described.element, 'aria-describedby', described.id, false);
      expanded?.removeAttribute('aria-expanded');
      if (shown.delete(root)) lastClosedAt = performance.now();
      overlay?.detach();
      anchored?.detach();
    },
  };
}
