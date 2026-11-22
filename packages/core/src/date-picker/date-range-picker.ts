// The date range picker (M3 modal date range picker): a dialog whose calendar lays the months one
// under another, where one press chooses the start of a range and the next its end, or whose two
// text fields take the dates typed.
//
// - A press on a day starts a range there. The next press, on that day or a later one, ends it; on
//   an earlier one, it starts the range there instead. Once the range has both ends, a press starts
//   a new one.
// - The calendar renders a window of months, which grows as the months scroll near either end of it
//   (`extend`), and as the keys move the focus past it (`focusDate`).

import { firstDayOfWeek } from '../locale/locale';
import { formatMessage, type DatePickerMessages } from '../locale/messages';
import type { PartAttrs, PartNode } from '../parts';
import {
  calendarKeyTarget,
  dayName,
  monthBounds,
  monthYearName,
  outOfRange,
  weekdayName,
  weekdaysFrom,
} from './calendar-shared';
import {
  addMonths,
  firstOfMonth,
  formatDate,
  formatNumber,
  isIsoDate,
  monthGrid,
  monthOf,
  today as personsToday,
} from './date';
import {
  dateInputPattern,
  initialFocus,
  readDateInput,
  writeDateInput,
  type DateFieldProps,
} from './date-picker';

/** How many months the calendar renders before the one it opens on, after it, and adds at once */
const MONTHS_BEFORE = 3;
const MONTHS_AFTER = 12;
const MONTHS_ADDED = 12;

const shiftMonth = (month: string, months: number) =>
  monthOf(addMonths(firstOfMonth(month), months));

/** The months a calendar renders as it opens on a date */
const monthsAround = (date: string, min?: string, max?: string) => {
  const [lowest, highest] = monthBounds(min, max, [date]);
  const before = shiftMonth(monthOf(date), -MONTHS_BEFORE);
  const after = shiftMonth(monthOf(date), MONTHS_AFTER);
  return {
    firstMonth: before < lowest ? lowest : before,
    lastMonth: after > highest ? highest : after,
  };
};

// The calendar: the months one under another

export interface RangeCalendarProps {
  /** The range's start, `YYYY-MM-DD` */
  start?: string;
  /** The range's end, `YYYY-MM-DD` */
  end?: string;
  /** The date the keys move from, which takes the focus, `YYYY-MM-DD` */
  focused: string;
  /** The first month rendered, `YYYY-MM` */
  firstMonth: string;
  /** The last month rendered, `YYYY-MM` */
  lastMonth: string;
  /** The earliest date that can be chosen */
  min?: string;
  /** The latest date that can be chosen */
  max?: string;
  /** The language, already resolved: it names the months and days and starts the week. */
  locale: string;
  /** Overrides the language's first day of the week: 1 (Monday) to 7 (Sunday). */
  firstDayOfWeek?: number;
}

export interface RangeCalendarOptions {
  props: () => RangeCalendarProps;
  /** Makes dates unavailable, besides those outside `min` and `max`. */
  isDateDisabled?: (date: string) => boolean;
  /** Today, where the person is. A function, so tests can fix it. */
  today?: () => string;
  /** A date was chosen. With `confirm`, by Enter, which also confirms a range it completes. */
  onSelect: (date: string, confirm: boolean) => void;
  /** Asks to move the focus to another date. */
  onFocusChange: (date: string) => void;
  /** Asks to render other months: the first and the last, `YYYY-MM`. */
  onMonthsChange: (first: string, last: string) => void;
}

export interface RangeCalendarParts {
  root: () => PartAttrs;
  /** The weekdays above the months, hidden from assistive technology: each day's name says it */
  weekdays: () => PartAttrs;
  /** A weekday's narrow name */
  weekday: (day: number) => PartAttrs;
  /** The months, which scroll */
  months: () => PartAttrs;
  /** A month: its subhead over its grid */
  month: (month: string) => PartAttrs;
  /** The month's name, hidden from assistive technology: the grid's name says it */
  subhead: (month: string) => PartAttrs;
  /** The month's weeks: a `<table role="grid">` of `<tr>`s, named by the month */
  grid: (month: string) => PartAttrs;
  /** A day's cell, a `<td>`. The days of the months around leave theirs empty. */
  cell: (date: string, month: string) => PartAttrs;
  /** The `<button>` in a day's cell, holding `dayText(date)` */
  day: (date: string) => PartAttrs;
}

/**
 * The calendar's markup. The weekdays hold a `weekday` for each day of `weekdays()`; the months
 * hold a `month` for each of `months()`, with its `subhead` and its `grid`, whose rows of `cell`s
 * hold a `day` button where `showsDay`.
 */
export const rangeCalendarSkeleton: PartNode<'root' | 'weekdays' | 'months', never> = {
  part: 'root',
  tag: 'div',
  children: [
    { part: 'weekdays', tag: 'div', content: true },
    { part: 'months', tag: 'div', content: true },
  ],
};

export interface RangeCalendarApi {
  parts: RangeCalendarParts;
  /** The weekdays in the order shown, 1 (Monday) to 7 (Sunday) */
  weekdays: () => number[];
  weekdayText: (day: number) => string;
  /** The months rendered, `YYYY-MM`, in order */
  months: () => string[];
  /** The weeks that hold a day of the month */
  weeks: (month: string) => string[][];
  /** Whether a cell of the month's grid shows its date: the months around leave theirs empty. */
  showsDay: (date: string, month: string) => boolean;
  /** The day's number, as the language writes numbers */
  dayText: (date: string) => string;
  /** The month and its year, such as November 2026 */
  monthText: (month: string) => string;
  isDisabled: (date: string) => boolean;
  /** Attach to a day's `click`. */
  handleDayClick: (date: string) => void;
  /** The date a key moves the focus to, as in the month calendar (`CalendarApi.keyTarget`) */
  keyTarget: (key: string, shift: boolean, from: string, rtl: boolean) => string | undefined;
  /** Moves the focus, rendering the date's month when it is outside the months rendered. */
  focusDate: (date: string) => void;
  /**
   * Renders more months before the first or after the last, as the months scroll near that end: as
   * far as `min` and `max`, or 1900 to 2100 and the months of the range and the focus.
   */
  extend: (edge: 'start' | 'end') => void;
}

export function createRangeCalendar(options: RangeCalendarOptions): RangeCalendarApi {
  const props = () => options.props();
  const locale = () => props().locale;
  const today = () => options.today?.() ?? personsToday();
  const firstDay = () => props().firstDayOfWeek ?? firstDayOfWeek(locale());
  const isDisabled = (date: string) =>
    outOfRange(date, props().min, props().max) || !!options.isDateDisabled?.(date);
  /** The range's ends, when it has two different ones */
  const span = (): [string, string] | undefined => {
    const { start, end } = props();
    return start && end && end > start ? [start, end] : undefined;
  };
  const isEnd = (date: string) => date === props().start || date === props().end;

  return {
    parts: {
      root: () => ({ class: 'rio-date-picker__calendar', 'data-variant': 'range' }),
      weekdays: () => ({ class: 'rio-date-picker__weekdays', 'aria-hidden': 'true' }),
      weekday: () => ({ class: 'rio-date-picker__weekday' }),
      months: () => ({ class: 'rio-date-picker__months' }),
      month: (month) => ({ class: 'rio-date-picker__month', 'data-month': month }),
      subhead: () => ({ class: 'rio-date-picker__subhead', 'aria-hidden': 'true' }),
      grid: (month) => ({
        class: 'rio-date-picker__grid',
        role: 'grid',
        'aria-label': monthYearName(month, locale()),
        'aria-multiselectable': 'true',
      }),
      cell: (date, month) => {
        if (monthOf(date) !== month) return { class: 'rio-date-picker__cell' };
        const ends = span();
        const inside = !!ends && date > ends[0] && date < ends[1];
        return {
          class: 'rio-date-picker__cell',
          'aria-selected': inside || isEnd(date) ? 'true' : undefined,
          'data-range-start': ends && date === ends[0] ? '' : undefined,
          'data-range-end': ends && date === ends[1] ? '' : undefined,
          'data-in-range': inside ? '' : undefined,
        };
      },
      day: (date) => ({
        class: 'rio-date-picker__day rio-state-layer rio-focus-ring',
        type: 'button',
        // One date at a time takes the focus; the arrow keys move it.
        tabindex: date === props().focused ? '0' : '-1',
        'aria-label': dayName(date, locale()),
        'aria-current': date === today() ? 'date' : undefined,
        'aria-disabled': isDisabled(date) ? 'true' : undefined,
        'data-date': date,
        'data-selected': isEnd(date) ? '' : undefined,
      }),
    },
    weekdays: () => weekdaysFrom(firstDay()),
    weekdayText: (day) => weekdayName(day, 'narrow', locale()),
    months: () => {
      const { firstMonth, lastMonth } = props();
      const months: string[] = [];
      for (let month = firstMonth; month <= lastMonth; month = shiftMonth(month, 1)) {
        months.push(month);
      }
      return months;
    },
    weeks: (month) =>
      monthGrid(month, firstDay()).filter((week) => week.some((date) => monthOf(date) === month)),
    showsDay: (date, month) => monthOf(date) === month,
    dayText: (date) => formatNumber(Number(date.slice(8)), locale()),
    monthText: (month) => monthYearName(month, locale()),
    isDisabled,
    handleDayClick(date) {
      if (isDisabled(date)) return;
      options.onFocusChange(date);
      options.onSelect(date, false);
    },
    keyTarget: (key, shift, from, rtl) =>
      calendarKeyTarget(key, shift, from, rtl, props().min, props().max),
    focusDate(date) {
      const month = monthOf(date);
      const { firstMonth, lastMonth } = props();
      if (month < firstMonth || month > lastMonth) {
        options.onMonthsChange(
          month < firstMonth ? month : firstMonth,
          month > lastMonth ? month : lastMonth,
        );
      }
      options.onFocusChange(date);
    },
    extend(edge) {
      const { firstMonth, lastMonth, min, max, start, end, focused } = props();
      const [lowest, highest] = monthBounds(min, max, [start, end, focused]);
      if (edge === 'start') {
        const first = shiftMonth(firstMonth, -MONTHS_ADDED);
        const next = first < lowest ? lowest : first;
        if (next < firstMonth) options.onMonthsChange(next, lastMonth);
        return;
      }
      const last = shiftMonth(lastMonth, MONTHS_ADDED);
      const next = last > highest ? highest : last;
      if (next > lastMonth) options.onMonthsChange(firstMonth, next);
    },
  };
}

// The dialog

/** The state an adapter keeps for a range picker, which it asks to change with `onStateChange` */
export interface DateRangePickerState {
  /** The range chosen so far; the value changes on OK. */
  start?: string;
  end?: string;
  /** The date that takes the focus in the calendar */
  focused: string;
  /** The months the calendar renders, `YYYY-MM` */
  firstMonth: string;
  lastMonth: string;
  mode: 'calendar' | 'input';
  /** The text in the start and end fields */
  startText: string;
  endText: string;
  /** Why the text in a field isn't a date that can be chosen, or doesn't end the range */
  startError?: string;
  endError?: string;
}

/** The state a range picker starts from, and goes back to as it opens */
export const initialDateRangePickerState = (
  start: string | undefined,
  end: string | undefined,
  locale: string,
  limits: { min?: string; max?: string } = {},
): DateRangePickerState => {
  const focused = initialFocus(start, limits.min, limits.max);
  return {
    start,
    end,
    focused,
    ...monthsAround(focused, limits.min, limits.max),
    mode: 'calendar',
    startText: writeDateInput(start, locale),
    endText: writeDateInput(end, locale),
    startError: undefined,
    endError: undefined,
  };
};

export interface DateRangePickerDialogProps {
  /** The range's start, `YYYY-MM-DD`. The adapter owns it. */
  start?: string;
  /** The range's end, `YYYY-MM-DD`. The adapter owns it. */
  end?: string;
  /** Whether the dialog is shown. The adapter owns it. */
  open?: boolean;
  min?: string;
  max?: string;
  /** The language, already resolved */
  locale: string;
  /** A Clear button at the start of the buttons, which empties the range */
  clearable?: boolean;
  /** What each opening starts in. Defaults to `'calendar'`. */
  initialMode?: 'calendar' | 'input';
  /** Whether the content renders: from opening until the closing motion ends. The adapter keeps it. */
  rendered: boolean;
}

export interface DateRangePickerDialogOptions {
  props: () => DateRangePickerDialogProps;
  /** Makes dates unavailable, besides those outside `min` and `max`. */
  isDateDisabled?: (date: string) => boolean;
  messages: () => DatePickerMessages;
  state: () => DateRangePickerState;
  ids: { title: string; headline: string };
  /** Called with the requested range. */
  onChange: (start: string | undefined, end: string | undefined) => void;
  /** Called with the requested `open`. */
  onOpenChange: (open: boolean) => void;
  onStateChange: (state: Partial<DateRangePickerState>) => void;
}

export interface DateRangePickerDialogParts {
  /** A `<dialog>`, with a basic dialog's container and motion (`rio-dialog`) */
  root: () => PartAttrs;
  /** The title, the headline, and the icon button that switches modes (`iconButtonSkeleton`) */
  header: () => PartAttrs;
  /** Holds the title message, which names the dialog */
  title: () => PartAttrs;
  /** Holds `headline()`, announced as it changes */
  headline: () => PartAttrs;
  divider: () => PartAttrs;
  /** Holds the calendar (`rangeCalendarSkeleton`), in the calendar mode */
  calendar: () => PartAttrs;
  /** Holds the start and end text fields, in the text input mode */
  input: () => PartAttrs;
  /** Clear, when `showsClear`, then Cancel and OK */
  actions: () => PartAttrs;
}

type DateRangePickerDialogWhen = 'rendered' | 'calendarMode' | 'inputMode';

/** The dialog's content renders from opening until the closing motion ends. */
export const dateRangePickerDialogSkeleton: PartNode<
  'root' | 'header' | 'divider' | 'calendar' | 'input' | 'actions',
  DateRangePickerDialogWhen
> = {
  part: 'root',
  tag: 'dialog',
  children: [
    { part: 'header', tag: 'div', when: 'rendered', content: true },
    { part: 'divider', tag: 'div', when: 'rendered' },
    { part: 'calendar', tag: 'div', when: 'calendarMode', content: true },
    // The text fields (`textFieldSkeleton`)
    { part: 'input', tag: 'div', when: 'inputMode', content: true },
    // The buttons
    { part: 'actions', tag: 'div', when: 'rendered', content: true },
  ],
};

export interface DateRangePickerDialogApi extends Record<DateRangePickerDialogWhen, () => boolean> {
  parts: DateRangePickerDialogParts;
  showsClear: () => boolean;
  /** The range chosen so far, such as Aug 17 – Aug 23, with words for an end not chosen yet */
  headline: () => string;
  /** The label of the button that switches modes */
  modeButtonLabel: () => string;
  /** The start and end text fields' props, in the text input mode */
  startField: () => DateFieldProps;
  endField: () => DateFieldProps;
  /** Switches between the calendar and the text input, carrying the range across. */
  switchMode: () => void;
  /** Attach to the text fields' inputs' `keydown`: Enter confirms. */
  handleFieldKeydown: (event: { key: string; preventDefault(): void }) => void;
  startInput: (text: string) => void;
  endInput: (text: string) => void;
  /** The dialog opened: it starts from the value, in `initialMode`. */
  opened: () => void;
  /** A date chosen in the calendar. With `confirm`, a date that ends the range also confirms it. */
  select: (date: string, confirm: boolean) => void;
  /** OK: in the text input, reads the text first, and stays open on an error. */
  confirm: () => void;
  cancel: () => void;
  clear: () => void;
}

export function createDateRangePickerDialog(
  options: DateRangePickerDialogOptions,
): DateRangePickerDialogApi {
  const props = () => options.props();
  const state = () => options.state();
  const messages = () => options.messages();
  const rendered = () => props().rendered;
  const close = () => options.onOpenChange(false);
  const commit = (start: string | undefined, end: string | undefined) => {
    if (start !== props().start || end !== props().end) options.onChange(start, end);
    close();
  };
  const read = (text: string) =>
    readDateInput(text, {
      locale: props().locale,
      messages: messages(),
      min: props().min,
      max: props().max,
      isDateDisabled: options.isDateDisabled,
    });
  /** Reads the text fields into a range, or the errors to show under them */
  const readRange = () => {
    const start = read(state().startText);
    const end = read(state().endText);
    let startError = start.error;
    let endError = end.error;
    if (startError === undefined && endError === undefined && end.value) {
      if (!start.value) startError = messages().startRequired;
      else if (end.value < start.value) endError = messages().invalidRange;
    }
    return { start: start.value, end: end.value, startError, endError };
  };
  const field = (error: string | undefined): DateFieldProps => {
    const pattern = dateInputPattern(props().locale, messages());
    return {
      placeholder: pattern,
      supportingText: pattern,
      error: error !== undefined,
      errorText: error,
    };
  };
  const dateText = (date: string | undefined, none: string) =>
    date && isIsoDate(date)
      ? formatDate(date, props().locale, { month: 'short', day: 'numeric' })
      : none;

  const confirm = () => {
    if (state().mode === 'input') {
      const range = readRange();
      if (range.startError !== undefined || range.endError !== undefined) {
        options.onStateChange({ startError: range.startError, endError: range.endError });
        return;
      }
      commit(range.start, range.end);
      return;
    }
    commit(state().start, state().end);
  };

  return {
    rendered,
    calendarMode: () => rendered() && state().mode === 'calendar',
    inputMode: () => rendered() && state().mode === 'input',
    showsClear: () => !!props().clearable,
    parts: {
      root: () => ({
        class: 'rio-dialog rio-date-picker-dialog rio-date-range-picker',
        'aria-labelledby': options.ids.title,
        'data-mode': state().mode,
      }),
      header: () => ({ class: 'rio-date-picker-dialog__header' }),
      title: () => ({ class: 'rio-date-picker-dialog__title', id: options.ids.title }),
      headline: () => ({
        class: 'rio-date-picker-dialog__headline',
        id: options.ids.headline,
        'aria-live': 'polite',
      }),
      divider: () => ({ class: 'rio-date-picker-dialog__divider', 'aria-hidden': 'true' }),
      calendar: () => ({ class: 'rio-date-picker__calendar' }),
      input: () => ({ class: 'rio-date-picker-dialog__input' }),
      actions: () => ({ class: 'rio-date-picker__actions' }),
    },
    headline: () =>
      formatMessage(messages().rangeHeadline, {
        start: dateText(state().start, messages().startDate),
        end: dateText(state().end, messages().endDate),
      }),
    modeButtonLabel: () =>
      state().mode === 'calendar' ? messages().switchToInput : messages().switchToCalendar,
    startField: () => field(state().startError),
    endField: () => field(state().endError),
    switchMode() {
      if (state().mode === 'calendar') {
        options.onStateChange({
          mode: 'input',
          startText: writeDateInput(state().start, props().locale),
          endText: writeDateInput(state().end, props().locale),
          startError: undefined,
          endError: undefined,
        });
        return;
      }
      // What doesn't read as a range is left behind.
      const range = readRange();
      const valid = range.startError === undefined && range.endError === undefined;
      const focused = valid && range.start ? range.start : undefined;
      options.onStateChange({
        mode: 'calendar',
        ...(valid ? { start: range.start, end: range.end } : {}),
        ...(focused ? { focused, ...monthsAround(focused, props().min, props().max) } : {}),
      });
    },
    handleFieldKeydown(event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      confirm();
    },
    startInput: (startText) => options.onStateChange({ startText }),
    endInput: (endText) => options.onStateChange({ endText }),
    opened: () =>
      options.onStateChange({
        ...initialDateRangePickerState(props().start, props().end, props().locale, props()),
        mode: props().initialMode ?? 'calendar',
      }),
    select(date, andConfirm) {
      const { start, end } = state();
      const next =
        start && !end && date >= start ? { start, end: date } : { start: date, end: undefined };
      options.onStateChange(next);
      if (andConfirm && next.end) commit(next.start, next.end);
    },
    confirm,
    cancel: close,
    clear() {
      if (props().start !== undefined || props().end !== undefined) {
        options.onChange(undefined, undefined);
      }
      options.onStateChange({
        start: undefined,
        end: undefined,
        startText: '',
        endText: '',
        startError: undefined,
        endError: undefined,
      });
      close();
    },
  };
}
