// The scroll field's behavior in the DOM.
//
// - The viewport scrolls the column itself, with the platform's momentum, and snaps an item to the
//   middle. As the item in the middle changes, it is reported (`onCenterChange`), and whether the
//   person scrolled it there: with a trackpad, a touch, or a pen.
// - A notch of a mouse wheel moves one value, as an arrow key does (`onStep`): a wheel event in
//   lines or pages, or in pixels as far as an item or more. Smaller ones, as a trackpad's, scroll.
//   Over a field that doesn't take it, the page scrolls instead.
// - `sync` scrolls the value's item into the middle when it isn't there. It waits while the person
//   scrolls, and corrects the scroll once it stops, as when the app turned the value down. It
//   scrolls at once the first time and under reduced motion, smoothly otherwise. While it scrolls,
//   a new value's item is the one nearest where it is headed, so steps faster than the scroll keep
//   their way, and a looping field whose scroll heads out of the middle copy moves back by whole
//   copies at once, so it doesn't run out of them. As the viewport comes back into the page, which
//   loses the scroll, or changes size, the value goes back to the middle at once.
// - A looping field, once its scroll stops, moves at once to the same value in the middle copy, so
//   there is always more to scroll either way.
// - As editing starts, the text input takes the focus, with its text selected. Typing completes
//   text values, and text that is a value is taken at once (`onChange`). Enter ends editing when
//   the text is a value and reports that it isn't otherwise (`onInvalidChange`); Escape puts the
//   value from before editing back and ends it; either puts the focus back on the field. Leaving
//   the input keeps editing, and reports text that isn't a value.

import { prefersReducedMotion } from '../primitives/reduced-motion/reduced-motion';
import type { ScrollFieldValue } from './scroll-field';

export interface ScrollFieldDomOptions {
  viewport: () => HTMLElement | null | undefined;
  /** The text input, while editing */
  input: () => HTMLInputElement | null | undefined;
  /** The value's item nearest the given one (`targetIndex` from `createScrollField`). */
  targetIndex: (near?: number) => number;
  /** The value text stands for (`readText` from `createScrollField`). */
  readText: (text: string) => ScrollFieldValue | undefined;
  /** What text completes to (`completeText` from `createScrollField`). */
  completeText: (text: string) => string | undefined;
  /** The item in the middle changed; `byPerson` when the person scrolled it there. */
  onCenterChange: (index: number, byPerson: boolean) => void;
  /** The value the person typed, or the one from before editing as they cancel it */
  onChange: (value: ScrollFieldValue) => void;
  /** The value now, for Escape to put back */
  value: () => ScrollFieldValue;
  /** The value, written, for the input as editing starts (`valueText` from `createScrollField`) */
  valueText: () => string;
  onEditingChange: (editing: boolean) => void;
  /** Whether the text the person took last isn't a value, and no more once they type again */
  onInvalidChange: (invalid: boolean) => void;
  /** A notch of a mouse wheel, toward the end (1) or the start (-1); whether the field took it */
  onStep: (by: number) => boolean;
}

export interface ScrollFieldDomHandle {
  /** Scrolls the value into the middle and follows editing. Call it after each render. */
  sync(): void;
  detach(): void;
}

/** Without `scrollend`, a scroll counts as stopped after this long without moving. */
const SETTLE_MS = 150;

export function attachScrollField(
  root: HTMLElement,
  options: ScrollFieldDomOptions,
): ScrollFieldDomHandle {
  const hasScrollEnd = 'onscrollend' in root.ownerDocument.defaultView!;
  let viewport: HTMLElement | undefined;
  let center: number | undefined;
  /** Who moves the scroll now: the person, Rio, or nobody */
  let driver: 'person' | 'rio' | undefined;
  /** The item Rio scrolls to */
  let heading: number | undefined;
  let moving = false;
  let touching = false;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let placed = false;
  let editing = false;
  let refocus = false;
  /** The value as editing started */
  let before: ScrollFieldValue | undefined;
  /** Whether the field reported the text as no value, and hasn't taken it back */
  let reportedInvalid = false;

  const itemHeight = () => viewport?.firstElementChild?.getBoundingClientRect().height ?? 0;
  const itemCount = () => viewport?.childElementCount ?? 0;

  const report = (index: number, byPerson: boolean) => {
    if (index === center) return;
    center = index;
    options.onCenterChange(index, byPerson);
  };

  const scrollTo = (index: number, smooth: boolean) => {
    if (!viewport) return;
    const top = index * itemHeight();
    if (Math.abs(viewport.scrollTop - top) < 0.5) {
      // Already there: a smooth scroll on the way elsewhere stops.
      if (driver === 'rio') {
        driver = undefined;
        heading = undefined;
        viewport.scrollTo({ top, behavior: 'auto' });
      }
      report(index, false);
      return;
    }
    if (smooth) {
      driver = 'rio';
      heading = index;
      viewport.scrollTo({ top, behavior: 'smooth' });
      return;
    }
    // At once, in place of a smooth scroll on its way
    driver = undefined;
    heading = undefined;
    report(index, false);
    viewport.scrollTo({ top, behavior: 'auto' });
  };

  /** At rest on the value, in a looping field: the same value in the middle copy, at once */
  const recenter = () => {
    if (center === undefined || options.targetIndex(center) !== center) return;
    const middle = options.targetIndex();
    if (middle !== center) scrollTo(middle, false);
  };

  const place = () => {
    if (!viewport || !itemHeight()) return;
    if (moving && driver === 'person') return;
    if (!placed) {
      placed = true;
      scrollTo(options.targetIndex(center), false);
      return;
    }
    // While Rio scrolls, from where it is headed, so steps faster than the scroll keep their way
    const from = driver === 'rio' ? heading : center;
    let target = options.targetIndex(from);
    // Whole copies from the middle one, in a looping field. Far out, the scroll moves back by them
    // at once, which snaps it to an item, so only then.
    const away = target - options.targetIndex();
    if (driver === 'rio' && Math.abs(away) > itemCount() / 4 && from !== undefined) {
      viewport.scrollTo({ top: viewport.scrollTop - away * itemHeight(), behavior: 'auto' });
      target -= away;
      // Moving the scroll stopped the smooth one.
      scrollTo(target, !prefersReducedMotion());
    } else if (target !== from) {
      scrollTo(target, !prefersReducedMotion());
    }
  };

  const settle = () => {
    clearTimeout(settleTimer);
    if (touching) return;
    // A smooth scroll that a newer one replaced, or that moved by whole copies, ends short of
    // where Rio is headed.
    if (
      driver === 'rio' &&
      heading !== undefined &&
      viewport &&
      Math.abs(viewport.scrollTop / itemHeight() - heading) > 0.5
    ) {
      return;
    }
    moving = false;
    driver = undefined;
    heading = undefined;
    recenter();
    place();
  };

  const onScroll = () => {
    if (!viewport) return;
    const height = itemHeight();
    if (!height) return;
    moving = true;
    const index = Math.min(itemCount() - 1, Math.max(0, Math.round(viewport.scrollTop / height)));
    report(index, driver === 'person');
    if (!hasScrollEnd) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, SETTLE_MS);
    }
  };
  const onWheel = (event: WheelEvent) => {
    // Ctrl and the wheel zoom the page.
    if (event.ctrlKey || !event.deltaY) return;
    const notch =
      event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL || Math.abs(event.deltaY) >= itemHeight();
    if (!notch) {
      driver = 'person';
      return;
    }
    if (options.onStep(Math.sign(event.deltaY))) event.preventDefault();
  };
  const onPointerDown = (event: PointerEvent) => {
    // A mouse presses and clicks; a pen or a finger may scroll.
    if (event.pointerType !== 'mouse') driver = 'person';
  };
  const onTouchStart = () => {
    touching = true;
  };
  const onTouchEnd = () => {
    touching = false;
    if (!hasScrollEnd) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, SETTLE_MS);
    }
  };

  const resize =
    typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(() => {
          placed = false;
          place();
        });

  const listeners: [string, EventListener, AddEventListenerOptions?][] = [
    ['scroll', onScroll, { passive: true }],
    ['scrollend', settle],
    ['wheel', onWheel as EventListener, { passive: false }],
    ['pointerdown', onPointerDown as EventListener],
    ['touchstart', onTouchStart, { passive: true }],
    ['touchend', onTouchEnd],
    ['touchcancel', onTouchEnd],
  ];
  const listen = (el: HTMLElement | undefined, on: boolean) => {
    if (el && on) resize?.observe(el);
    else if (el) resize?.unobserve(el);
    for (const [type, listener, init] of listeners) {
      if (on) el?.addEventListener(type, listener, init);
      else el?.removeEventListener(type, listener, init);
    }
  };

  // Editing

  const invalid = (next: boolean) => {
    if (next === reportedInvalid) return;
    reportedInvalid = next;
    options.onInvalidChange(next);
  };
  /** Takes the text when it is a value; whether it was */
  const take = (input: HTMLInputElement) => {
    const value = options.readText(input.value);
    if (value === undefined) return false;
    invalid(false);
    if (value !== options.value()) options.onChange(value);
    return true;
  };

  const onKeydown = (event: KeyboardEvent) => {
    const input = options.input();
    if (!input || event.target !== input || event.isComposing) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!take(input)) {
        invalid(true);
        return;
      }
      refocus = true;
      options.onEditingChange(false);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      invalid(false);
      if (before !== undefined && before !== options.value()) options.onChange(before);
      refocus = true;
      options.onEditingChange(false);
    }
  };
  const onInput = (event: Event) => {
    const input = options.input();
    if (!input || event.target !== input) return;
    const typed = input.value;
    const completed = (event as InputEvent).inputType?.startsWith('insert')
      ? options.completeText(typed)
      : undefined;
    if (completed && completed.length > typed.length && input.selectionStart === typed.length) {
      input.value = completed;
      input.setSelectionRange(typed.length, completed.length);
    }
    take(input);
  };
  const onFocusOut = (event: FocusEvent) => {
    const input = options.input();
    if (!input || event.target !== input) return;
    if (options.readText(input.value) === undefined) invalid(true);
  };

  root.addEventListener('keydown', onKeydown);
  root.addEventListener('input', onInput);
  root.addEventListener('focusout', onFocusOut);

  const sync = () => {
    const next = options.viewport() ?? undefined;
    if (next !== viewport) {
      listen(viewport, false);
      viewport = next;
      listen(viewport, true);
      placed = false;
      center = undefined;
    }
    const input = options.input();
    if (input && !editing) {
      editing = true;
      before = options.value();
      input.value = options.valueText();
      input.focus();
      input.select();
    } else if (!input && editing) {
      editing = false;
      before = undefined;
      invalid(false);
      if (refocus) root.focus();
      refocus = false;
    }
    place();
  };

  sync();
  return {
    sync,
    detach() {
      clearTimeout(settleTimer);
      listen(viewport, false);
      resize?.disconnect();
      root.removeEventListener('keydown', onKeydown);
      root.removeEventListener('input', onInput);
      root.removeEventListener('focusout', onFocusOut);
    },
  };
}
