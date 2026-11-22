// The date picker's behavior in the DOM.
//
// The calendar (`attachCalendar`):
// - In the grid, the keys `createCalendar` reads move the focus from day to day, into the months
//   around when they get there. Enter chooses the day and confirms it, as OK does; Space and a
//   click choose it. Shift+M and Shift+Y focus the month and the year buttons.
// - In a list of months or years, the arrow keys move between the options (left and right too in
//   the grid of years), and Home and End go to the ends.
// - After the adapter shows another month or list, the focus goes to the date it moved to, or, when
//   the element with it went away, to the date or option that takes the focus there.
// - A list scrolls to the month or year shown as it appears.
//
// The range calendar (`attachRangeCalendar`):
// - The keys in its grids work as in the month calendar's, from month to month. Enter chooses the
//   day, and confirms the range when that ends it.
// - As the months first get their size, they scroll to the month of the date that takes the focus.
// - As the months scroll near the first or the last month rendered, it reports that end, for more
//   months. Months added above leave the ones in view where they were.
// - After the adapter renders, the focus goes to the date the keys moved it to, or comes back to
//   the date that takes it when the element with it went away.
//
// The docked picker's calendar (`attachDatePickerMenu`):
// - It shows below the field, or above it without room there, in the top layer. It is a manual
//   popover, so a press on the field while it is open, to type, leaves it open.
// - A press outside the field and the calendar, the focus leaving both, and Escape close it.
// - Opened from the keyboard, the focus goes to the date that takes it in the calendar. Closing
//   with the focus in the calendar gives it back to the field.

import { attachAnchoredPosition } from '../primitives/anchored-position/anchored-position';
import { isRtl } from '../primitives/direction/direction';
import { attachOverlay } from '../primitives/overlay/overlay';
import { hasModifier } from '../utils/keyboard';
import type { CalendarApi } from './date-picker';
import type { RangeCalendarApi } from './date-range-picker';

export interface CalendarDomOptions {
  calendar: () => Pick<CalendarApi, 'keyTarget' | 'focusDate' | 'isDisabled'>;
  /** The date that takes the focus in the grid */
  focused: () => string;
  /** Enter on a day: it is chosen and confirmed. */
  onConfirm: (date: string) => void;
}

export interface CalendarDomHandle {
  /** Call it after each render: the focus follows the keys, or comes back after a change of view. */
  sync(): void;
  /** Focuses the date that takes the focus, or the option shown in a list. */
  focus(): void;
  detach(): void;
}

export function attachCalendar(root: HTMLElement, options: CalendarDomOptions): CalendarDomHandle {
  const document = root.ownerDocument;
  /** The keys moved the focus, and the element to take it may render only now. */
  let moving = false;
  /** The focus was in the calendar, so it comes back when its element goes away. */
  let inside = false;
  /** The list last scrolled to its shown option */
  let scrolled: Element | null = null;

  const target = () =>
    root.querySelector<HTMLElement>(`[data-date="${options.focused()}"]:not([data-outside])`) ??
    root.querySelector<HTMLElement>('[data-list] [tabindex="0"]');
  const focus = () => target()?.focus();

  const listKey = (event: KeyboardEvent, option: HTMLElement) => {
    const all = [...root.querySelectorAll<HTMLElement>('[data-list] button')];
    const at = all.indexOf(option);
    const columns =
      root.querySelector('[data-list="years"]') && option.dataset.year ? columnsOf(all) : 1;
    const rtl = isRtl(root) ? -1 : 1;
    const step: Record<string, number> = {
      ArrowDown: columns,
      ArrowUp: -columns,
      ...(columns > 1 ? { ArrowRight: rtl, ArrowLeft: -rtl } : {}),
      Home: -at,
      End: all.length - 1 - at,
    };
    const by = step[event.key];
    if (by === undefined) return;
    event.preventDefault();
    all[Math.max(0, Math.min(at + by, all.length - 1))]?.focus();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || hasModifier(event)) return;
    const element = event.target as HTMLElement;
    if (event.shiftKey && (event.key === 'M' || event.key === 'Y')) {
      const button = root.querySelectorAll<HTMLElement>('.rio-date-picker__menu-button');
      const choice = event.key === 'M' ? button[0] : button[button.length - 1];
      if (choice) {
        event.preventDefault();
        choice.focus();
      }
      return;
    }
    if (element.closest('[data-list]')) {
      listKey(event, element);
      return;
    }
    const date = element.dataset.date;
    if (!date) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!options.calendar().isDisabled(date)) options.onConfirm(date);
      return;
    }
    const next = options.calendar().keyTarget(event.key, event.shiftKey, date, isRtl(root));
    if (!next) return;
    event.preventDefault();
    moving = true;
    options.calendar().focusDate(next);
  };
  const onFocusIn = () => (inside = true);
  const onFocusOut = (event: FocusEvent) => {
    if (!root.contains(event.relatedTarget as Node | null)) inside = false;
  };

  root.addEventListener('keydown', onKeydown);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);

  return {
    sync() {
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected;
      if (moving || (inside && lost)) focus();
      moving = false;
      const list = root.querySelector<HTMLElement>('[data-list]');
      if (list && list !== scrolled) {
        const shown = list.querySelector<HTMLElement>('[data-selected]');
        if (shown) list.scrollTop = shown.offsetTop - (list.clientHeight - shown.offsetHeight) / 2;
      }
      scrolled = list;
    },
    focus,
    detach() {
      root.removeEventListener('keydown', onKeydown);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
    },
  };
}

export interface RangeCalendarDomOptions {
  calendar: () => Pick<RangeCalendarApi, 'keyTarget' | 'focusDate' | 'isDisabled'>;
  /** The date that takes the focus */
  focused: () => string;
  /** Enter on a day: it is chosen, and confirms the range it ends. */
  onConfirm: (date: string) => void;
  /** The months scrolled near the first or the last month rendered (`RangeCalendarApi.extend`). */
  onEdge: (edge: 'start' | 'end') => void;
}

export function attachRangeCalendar(
  root: HTMLElement,
  options: RangeCalendarDomOptions,
): CalendarDomHandle {
  const document = root.ownerDocument;
  const viewport = () => root.querySelector<HTMLElement>('.rio-date-picker__months');
  /** The keys moved the focus, and the element to take it may render only now. */
  let moving = false;
  /** The focus was in the calendar, so it comes back when its element goes away. */
  let inside = false;
  /** Whether the months have scrolled to the one they open on */
  let placed = false;
  /** The first month as more were asked for above it, and where it was then */
  let anchor: { element: HTMLElement; top: number } | undefined;
  /** The last end asked for, with the months rendered then, so each is asked for once */
  let asked = '';

  const target = () => root.querySelector<HTMLElement>(`[data-date="${options.focused()}"]`);
  const focus = () => target()?.focus();

  const place = () => {
    const months = viewport();
    if (placed || !months?.clientHeight) return;
    placed = true;
    const month = target()?.closest<HTMLElement>('[data-month]');
    if (month) months.scrollTop = month.offsetTop;
  };
  const check = () => {
    const months = viewport();
    if (!placed || !months) return;
    const all = months.querySelectorAll<HTMLElement>('[data-month]');
    const first = all[0];
    const rendered = `${first?.dataset.month} ${all[all.length - 1]?.dataset.month}`;
    const near = months.clientHeight;
    const edge =
      months.scrollTop < near
        ? 'start'
        : months.scrollHeight - months.scrollTop - months.clientHeight < near
          ? 'end'
          : undefined;
    if (!edge || asked === `${edge} ${rendered}`) return;
    asked = `${edge} ${rendered}`;
    if (edge === 'start' && first) anchor = { element: first, top: first.offsetTop };
    options.onEdge(edge);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || hasModifier(event)) return;
    const date = (event.target as HTMLElement).dataset.date;
    if (!date) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!options.calendar().isDisabled(date)) options.onConfirm(date);
      return;
    }
    const next = options.calendar().keyTarget(event.key, event.shiftKey, date, isRtl(root));
    if (!next) return;
    event.preventDefault();
    moving = true;
    options.calendar().focusDate(next);
  };
  const onFocusIn = () => (inside = true);
  const onFocusOut = (event: FocusEvent) => {
    if (!root.contains(event.relatedTarget as Node | null)) inside = false;
  };
  // `scroll` doesn't bubble; the months' scroll reaches the root while capturing.
  const onScroll = () => check();
  const resize = new ResizeObserver(() => {
    place();
    check();
  });

  root.addEventListener('keydown', onKeydown);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  root.addEventListener('scroll', onScroll, { capture: true, passive: true });
  resize.observe(root);

  return {
    sync() {
      const months = viewport();
      if (anchor && months && anchor.element.isConnected) {
        months.scrollTop += anchor.element.offsetTop - anchor.top;
      }
      anchor = undefined;
      place();
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected;
      if (moving || (inside && lost)) focus();
      moving = false;
      check();
    },
    focus,
    detach() {
      root.removeEventListener('keydown', onKeydown);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      root.removeEventListener('scroll', onScroll, { capture: true });
      resize.disconnect();
    },
  };
}

/** How many options sit in the first row of a grid of them */
const columnsOf = (options: HTMLElement[]) => {
  const top = options[0]?.getBoundingClientRect().top;
  const count = options.findIndex((option) => option.getBoundingClientRect().top !== top);
  return count > 0 ? count : 1;
};

export interface DatePickerMenuDomOptions {
  /** The field's box, which the calendar is placed against */
  anchor: () => HTMLElement | null | undefined;
  /** The field's input, which gets the focus back */
  field: () => HTMLElement | null | undefined;
  /** Whether the opening came from the keyboard (`DatePickerApi.focusOnOpen`) */
  focusOnOpen: () => boolean;
  /** The calendar closes on its own: a press outside, the focus leaving, or Escape. */
  onClose: () => void;
}

export interface DatePickerMenuDomHandle {
  /** Brings the calendar in line with `open`. Call it once attached, and whenever `open` changes. */
  sync(open: boolean): void;
  detach(): void;
}

/** `root` holds the field and the calendar, `menu`. */
export function attachDatePickerMenu(
  root: HTMLElement,
  menu: HTMLElement,
  options: DatePickerMenuDomOptions,
): DatePickerMenuDomHandle {
  const document = root.ownerDocument;
  const overlay = attachOverlay(menu, { mode: 'manual', onClose: options.onClose });
  // Stays attached while closed, so a closing animation keeps its place.
  const anchored = attachAnchoredPosition(menu, {
    anchor: options.anchor,
    side: 'bottom',
    align: 'start',
    fallbacks: ['top'],
  });
  const isOpen = () => menu.matches(':popover-open');
  // Whether the focus is in the calendar, kept from its events: the adapter may take the
  // calendar's content away before it closes it, and the focus goes nowhere then. Only the focus
  // moving to another element counts as leaving.
  let inside = false;
  const onMenuFocusIn = () => (inside = true);
  const onMenuFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && !menu.contains(next)) inside = false;
  };

  // A press outside leaves the focus where the press puts it.
  const onPointerDown = (event: PointerEvent) => {
    if (!isOpen() || root.contains(event.target as Node)) return;
    inside = false;
    options.onClose();
  };
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    // Only to somewhere else on the page: the focus going nowhere, as on a press on the calendar's
    // background, leaves it open.
    if (isOpen() && next && !root.contains(next)) options.onClose();
  };
  document.addEventListener('pointerdown', onPointerDown, { capture: true });
  root.addEventListener('focusout', onFocusOut);
  menu.addEventListener('focusin', onMenuFocusIn);
  menu.addEventListener('focusout', onMenuFocusOut);

  return {
    sync(open) {
      if (open && !isOpen()) {
        // Without a source: the calendar follows the field in the tab order as it does in the page,
        // so Tab from its last button leaves the picker, and closes it.
        overlay.show();
        anchored.update();
        if (options.focusOnOpen()) {
          menu.querySelector<HTMLElement>('[data-date][tabindex="0"]')?.focus();
        }
      } else if (!open && isOpen()) {
        const hadFocus = inside || menu.contains(document.activeElement);
        inside = false;
        overlay.hide();
        if (hadFocus) options.field()?.focus();
      }
    },
    detach() {
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
      root.removeEventListener('focusout', onFocusOut);
      menu.removeEventListener('focusin', onMenuFocusIn);
      menu.removeEventListener('focusout', onMenuFocusOut);
      overlay.detach();
      anchored.detach();
    },
  };
}
