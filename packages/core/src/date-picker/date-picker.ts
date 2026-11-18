import { firstDayOfWeek } from '../locale/locale';
import { formatMessage, type DatePickerMessages } from '../locale/messages';
import type { PartAttrs, PartNode } from '../parts';
import {
  addDays,
  addMonths,
  clampDate,
  dateFormat,
  firstOfMonth,
  formatDate,
  formatNumber,
  isIsoDate,
  monthGrid,
  monthOf,
  readDate,
  today as personsToday,
  writeDate,
  writePattern,
} from './date';

/** M3 date pickers: a field with a calendar below it, or a calendar in a modal dialog. */
export const DATE_PICKER_VARIANTS = ['docked', 'modal'] as const;
export type DatePickerVariant = (typeof DATE_PICKER_VARIANTS)[number];

/** What a calendar shows: the days of a month, the list of months (docked), or the years */
export type CalendarView = 'days' | 'months' | 'years';

/** The years a calendar offers without `min` and `max` */
const YEAR_RANGE = [1900, 2100] as const;

// The calendar, which the docked picker and the modal one share

export interface CalendarProps {
  /** The selected date, `YYYY-MM-DD` */
  selected?: string;
  /** The month shown, `YYYY-MM` */
  month: string;
  /** The date the keys move from, which takes the focus in the grid, `YYYY-MM-DD` */
  focused: string;
  /** Defaults to `'days'`. */
  view?: CalendarView;
  /** The earliest date that can be chosen */
  min?: string;
  /** The latest date that can be chosen */
  max?: string;
  /** The language, already resolved: it names the months and days and starts the week. */
  locale: string;
  /** Overrides the language's first day of the week: 1 (Monday) to 7 (Sunday). */
  firstDayOfWeek?: number;
  /**
   * `'docked'` has a month menu and a year menu, each with its arrows, and shows the days of the
   * months around. `'modal'` has one button for the month and year, which opens a grid of years.
   */
  variant?: DatePickerVariant;
}

export interface CalendarOptions {
  props: () => CalendarProps;
  messages: () => DatePickerMessages;
  /** Makes dates unavailable, besides those outside `min` and `max`. */
  isDateDisabled?: (date: string) => boolean;
  /** Today, where the person is. A function, so tests can fix it. */
  today?: () => string;
  /** A date was chosen. With `confirm`, the choice also closes the picker, as Enter does. */
  onSelect: (date: string, confirm: boolean) => void;
  /** Asks to show another month, `YYYY-MM`. */
  onMonthChange: (month: string) => void;
  /** Asks to move the focus to another date. */
  onFocusChange: (date: string) => void;
  /** Asks to show the days, the months, or the years. */
  onViewChange: (view: CalendarView) => void;
}

export interface CalendarParts {
  root: () => PartAttrs;
  header: () => PartAttrs;
  /** Docked: the month menu's button, holding `monthText()` and the dropdown icon */
  monthButton: () => PartAttrs;
  /** Docked: the year menu's button, holding `yearText()`; modal: the month-and-year button */
  yearButton: () => PartAttrs;
  previousMonth: () => PartAttrs;
  nextMonth: () => PartAttrs;
  /** Docked only */
  previousYear: () => PartAttrs;
  /** Docked only */
  nextYear: () => PartAttrs;
  /** Holds the dropdown icon in a menu button. It turns over while its list is shown. */
  dropdownIcon: () => PartAttrs;
  /** The month's days: a `<table role="grid">` */
  grid: () => PartAttrs;
  /** A weekday's heading: its narrow name, with the full one in `abbr` */
  weekday: (day: number) => PartAttrs;
  /** A day's cell, a `<td>`. Docked shows the days of the months around; modal leaves them empty. */
  cell: (date: string) => PartAttrs;
  /** The `<button>` in a day's cell, holding `dayText(date)` */
  day: (date: string) => PartAttrs;
  /** Docked: the list of months; modal: the grid of years */
  list: () => PartAttrs;
  /** A month in the docked list, 1 to 12 */
  monthOption: (month: number) => PartAttrs;
  yearOption: (year: number) => PartAttrs;
}

type CalendarWhen = 'showsDays' | 'showsList';

/**
 * The calendar's markup. The header holds icon buttons (`iconButtonSkeleton`) around the menu
 * buttons; the grid holds a `<thead>` row of `weekday` cells and six `<tr>` of `cell`s, each with a
 * `day` button where `showsDay`; the list holds `monthOption`s or `yearOption`s.
 */
export const calendarSkeleton: PartNode<'root' | 'header' | 'grid' | 'list', CalendarWhen> = {
  part: 'root',
  tag: 'div',
  children: [
    { part: 'header', tag: 'div', content: true },
    { part: 'grid', tag: 'table', when: 'showsDays', content: true },
    { part: 'list', tag: 'div', when: 'showsList', content: true },
  ],
};

export interface CalendarApi extends Record<CalendarWhen, () => boolean> {
  parts: CalendarParts;
  view: () => CalendarView;
  /** The weekdays in the order shown, 1 (Monday) to 7 (Sunday) */
  weekdays: () => number[];
  weekdayText: (day: number) => string;
  /** Six weeks of dates, from the week the month starts in */
  weeks: () => string[][];
  /** Whether a day's cell shows its date: docked shows the months around, modal doesn't. */
  showsDay: (date: string) => boolean;
  /** The day's number, as the language writes numbers: 27, not 27일 */
  dayText: (date: string) => string;
  /** Docked: the short month, such as Nov */
  monthText: () => string;
  /** Docked: the year, as a number; modal: the month and year, such as November 2026 */
  yearText: () => string;
  /** A year in the list, as a number */
  yearOptionText: (year: number) => string;
  /** The months offered in the docked list, 1 to 12 */
  months: () => number[];
  monthName: (month: number) => string;
  /** The years offered, from `min` and `max`, or 1900 to 2100 */
  years: () => number[];
  isDisabled: (date: string) => boolean;
  /** Arrow buttons: move by months, or with `toggle`, between the days and a list. */
  goMonths: (months: number) => void;
  toggleView: (view: Exclude<CalendarView, 'days'>) => void;
  chooseMonth: (month: number) => void;
  chooseYear: (year: number) => void;
  /** Attach to a day's `click`. */
  handleDayClick: (date: string) => void;
  /**
   * The date a key moves the focus to from `from`, or nothing for a key the grid doesn't take.
   * Arrows move by a day or a week (left and right swap in right-to-left text), Home and End to the
   * month's first and last day, Page Up and Page Down by a month, and with Shift, by a year. The
   * result stays within `min` and `max`.
   */
  keyTarget: (key: string, shift: boolean, from: string, rtl: boolean) => string | undefined;
  /** Moves the focus, showing the date's month when it is another. */
  focusDate: (date: string) => void;
}

export function createCalendar(options: CalendarOptions): CalendarApi {
  const props = () => options.props();
  const variant = () => props().variant ?? 'docked';
  const view = () => props().view ?? 'days';
  const messages = () => options.messages();
  const today = () => options.today?.() ?? personsToday();
  const locale = () => props().locale;

  const outOfRange = (date: string) => {
    const { min, max } = props();
    return (!!min && date < min) || (!!max && date > max);
  };
  const isDisabled = (date: string) => outOfRange(date) || !!options.isDateDisabled?.(date);
  const inMonth = (date: string) => monthOf(date) === props().month;
  const yearRange = (): [number, number] => {
    const { min, max } = props();
    return [
      min ? Number(min.slice(0, 4)) : YEAR_RANGE[0],
      max ? Number(max.slice(0, 4)) : YEAR_RANGE[1],
    ];
  };
  /** Whether any day of a month can be reached: its last day isn't before `min`, nor its first after `max` */
  const monthReachable = (month: string) => {
    const { min, max } = props();
    const first = firstOfMonth(month);
    return !(min && addDays(addMonths(first, 1), -1) < min) && !(max && first > max);
  };
  const focusDate = (date: string) => {
    if (monthOf(date) !== props().month) options.onMonthChange(monthOf(date));
    options.onFocusChange(date);
  };
  const goMonths = (months: number) => {
    const month = monthOf(addMonths(firstOfMonth(props().month), months));
    if (!monthReachable(month)) return;
    options.onMonthChange(month);
    options.onFocusChange(clampDate(addMonths(props().focused, months), props().min, props().max));
  };
  const showMonth = (month: string) => {
    options.onMonthChange(month);
    const day = props().focused.slice(7);
    const target = `${month}${day}`;
    options.onFocusChange(
      clampDate(
        isIsoDate(target) ? target : addDays(addMonths(firstOfMonth(month), 1), -1),
        props().min,
        props().max,
      ),
    );
    options.onViewChange('days');
  };
  const navButton = (label: string, months: number): PartAttrs => {
    const month = monthOf(addMonths(firstOfMonth(props().month), months));
    return {
      class: 'rio-date-picker__nav',
      'aria-label': label,
      disabled: view() === 'days' && monthReachable(month) ? undefined : '',
    };
  };
  const listButton = (list: Exclude<CalendarView, 'days'>, label: string): PartAttrs => ({
    class: 'rio-date-picker__menu-button',
    type: 'button',
    'aria-label': label,
    'aria-expanded': String(view() === list),
    // Docked: the other list's button can't be used while one is shown.
    disabled: variant() === 'docked' && view() !== 'days' && view() !== list ? '' : undefined,
  });

  return {
    parts: {
      root: () => ({
        class: 'rio-date-picker__calendar',
        'data-view': view(),
        'data-variant': variant(),
      }),
      header: () => ({ class: 'rio-date-picker__header' }),
      monthButton: () =>
        listButton('months', formatMessage(messages().chooseMonth, { month: formatMonthLong() })),
      yearButton: () =>
        listButton(
          'years',
          formatMessage(messages().chooseYear, {
            year: variant() === 'docked' ? props().month.slice(0, 4) : formatMonthYear(),
          }),
        ),
      previousMonth: () => navButton(messages().previousMonth, -1),
      nextMonth: () => navButton(messages().nextMonth, 1),
      previousYear: () => navButton(messages().previousYear, -12),
      nextYear: () => navButton(messages().nextYear, 12),
      dropdownIcon: () => ({ class: 'rio-date-picker__dropdown-icon', 'aria-hidden': 'true' }),
      grid: () => ({
        class: 'rio-date-picker__grid',
        role: 'grid',
        'aria-label': formatMonthYear(),
      }),
      weekday: (day) => ({
        class: 'rio-date-picker__weekday',
        scope: 'col',
        abbr: weekdayName(day, 'long'),
      }),
      cell: (date) => ({
        class: 'rio-date-picker__cell',
        'aria-selected': date === props().selected && inMonth(date) ? 'true' : undefined,
      }),
      day: (date) => {
        const p = props();
        const shown = inMonth(date);
        return {
          class: 'rio-date-picker__day rio-state-layer rio-focus-ring',
          type: 'button',
          // One date at a time takes the focus; the arrow keys move it.
          tabindex: date === p.focused && shown ? '0' : '-1',
          'aria-label': formatDate(date, locale(), {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          'aria-current': date === today() ? 'date' : undefined,
          'aria-disabled': isDisabled(date) ? 'true' : undefined,
          'data-date': date,
          'data-selected': date === p.selected ? '' : undefined,
          'data-outside': shown ? undefined : '',
        };
      },
      list: () => ({
        class: 'rio-date-picker__list',
        'data-list': view(),
      }),
      monthOption: (month) => {
        const shown = Number(props().month.slice(5));
        const target = `${props().month.slice(0, 4)}-${String(month).padStart(2, '0')}`;
        return {
          class: 'rio-date-picker__option rio-state-layer rio-focus-ring',
          type: 'button',
          tabindex: month === shown ? '0' : '-1',
          'aria-current': month === shown ? 'true' : undefined,
          'aria-disabled': monthReachable(target) ? undefined : 'true',
          'data-month': String(month),
          'data-selected': month === shown ? '' : undefined,
        };
      },
      yearOption: (year) => {
        const shown = Number(props().month.slice(0, 4));
        return {
          class: 'rio-date-picker__option rio-state-layer rio-focus-ring',
          type: 'button',
          tabindex: year === shown ? '0' : '-1',
          'aria-current': year === shown ? 'true' : undefined,
          'data-year': String(year),
          'data-selected': year === shown ? '' : undefined,
        };
      },
    },
    view,
    showsDays: () => view() === 'days',
    showsList: () => view() !== 'days',
    weekdays: () => {
      const first = props().firstDayOfWeek ?? firstDayOfWeek(locale());
      return Array.from({ length: 7 }, (_, index) => ((first - 1 + index) % 7) + 1);
    },
    weekdayText: (day) => weekdayName(day, 'narrow'),
    weeks: () => monthGrid(props().month, props().firstDayOfWeek ?? firstDayOfWeek(locale())),
    showsDay: (date) => variant() === 'docked' || inMonth(date),
    dayText: (date) => formatNumber(Number(date.slice(8)), locale()),
    monthText: () => formatDate(firstOfMonth(props().month), locale(), { month: 'short' }),
    yearText: () =>
      variant() === 'docked'
        ? formatNumber(Number(props().month.slice(0, 4)), locale())
        : formatMonthYear(),
    yearOptionText: (year) => formatNumber(year, locale()),
    months: () => Array.from({ length: 12 }, (_, index) => index + 1),
    monthName: (month) =>
      formatDate(`2026-${String(month).padStart(2, '0')}-01`, locale(), { month: 'long' }),
    years: () => {
      const [from, to] = yearRange();
      return Array.from({ length: to - from + 1 }, (_, index) => from + index);
    },
    isDisabled,
    goMonths,
    toggleView: (list) => options.onViewChange(view() === list ? 'days' : list),
    chooseMonth: (month) => {
      const target = `${props().month.slice(0, 4)}-${String(month).padStart(2, '0')}`;
      if (monthReachable(target)) showMonth(target);
    },
    chooseYear: (year) => {
      const month = `${String(year).padStart(4, '0')}${props().month.slice(4)}`;
      const { min, max } = props();
      // The same month in that year, or the nearest one that can be reached
      showMonth(
        min && month < min.slice(0, 7)
          ? min.slice(0, 7)
          : max && month > max.slice(0, 7)
            ? max.slice(0, 7)
            : month,
      );
    },
    handleDayClick(date) {
      if (isDisabled(date)) return;
      focusDate(date);
      options.onSelect(date, false);
    },
    keyTarget(key, shift, from, rtl) {
      const step = (days: number) => addDays(from, days);
      const target = (() => {
        switch (key) {
          case 'ArrowLeft':
            return step(rtl ? 1 : -1);
          case 'ArrowRight':
            return step(rtl ? -1 : 1);
          case 'ArrowUp':
            return step(-7);
          case 'ArrowDown':
            return step(7);
          case 'Home':
            return firstOfMonth(monthOf(from));
          case 'End':
            return addDays(addMonths(firstOfMonth(monthOf(from)), 1), -1);
          case 'PageUp':
            return addMonths(from, shift ? -12 : -1);
          case 'PageDown':
            return addMonths(from, shift ? 12 : 1);
          default:
            return undefined;
        }
      })();
      return target && clampDate(target, props().min, props().max);
    },
    focusDate,
  };

  function weekdayName(day: number, width: 'narrow' | 'long') {
    // 2026-11-16 is a Monday.
    return formatDate(addDays('2026-11-16', day - 1), locale(), { weekday: width });
  }
  function formatMonthYear() {
    return formatDate(firstOfMonth(props().month), locale(), { month: 'long', year: 'numeric' });
  }
  function formatMonthLong() {
    return formatDate(firstOfMonth(props().month), locale(), { month: 'long' });
  }
}

// The field, and what it reads

/** What `readDateInput` makes of typed text */
export type DateInputResult =
  | { value: string | undefined; error?: undefined }
  | { value?: undefined; error: string };

export interface DateInputRules {
  locale: string;
  messages: DatePickerMessages;
  min?: string;
  max?: string;
  isDateDisabled?: (date: string) => boolean;
}

/** The numeric format a language writes dates in, as a hint such as MM/DD/YYYY */
export const dateInputPattern = (locale: string, messages: DatePickerMessages) =>
  writePattern(dateFormat(locale), {
    year: messages.formatYear,
    month: messages.formatMonth,
    day: messages.formatDay,
  });

/** Writes a date as the field shows it, such as 11/27/2026. */
export const writeDateInput = (date: string | undefined, locale: string) =>
  date && isIsoDate(date) ? writeDate(date, dateFormat(locale)) : '';

/**
 * Reads what was typed in a date field: no text is no date, and text that isn't a date that can be
 * chosen comes back with the error to show.
 */
export function readDateInput(text: string, rules: DateInputRules): DateInputResult {
  if (!text.trim()) return { value: undefined };
  const date = readDate(text, dateFormat(rules.locale));
  const { messages, min, max } = rules;
  if (!date) {
    return {
      error: formatMessage(messages.invalidFormat, {
        format: dateInputPattern(rules.locale, messages),
      }),
    };
  }
  if (min && date < min) {
    return { error: formatMessage(messages.beforeMin, { min: writeDateInput(min, rules.locale) }) };
  }
  if (max && date > max) {
    return { error: formatMessage(messages.afterMax, { max: writeDateInput(max, rules.locale) }) };
  }
  if (rules.isDateDisabled?.(date)) return { error: messages.unavailable };
  return { value: date };
}

/** The modal picker's headline: the date chosen so far, such as Fri, Nov 27, or what stands for none */
export const dateHeadline = (
  date: string | undefined,
  locale: string,
  messages: DatePickerMessages,
  mode: 'calendar' | 'input',
) =>
  date && isIsoDate(date)
    ? formatDate(date, locale, { weekday: 'short', month: 'short', day: 'numeric' })
    : mode === 'calendar'
      ? messages.noDateSelected
      : messages.noDateEntered;

/**
 * The date a calendar opens on: the selected one, or else today, kept within `min` and `max`.
 */
export const initialFocus = (
  selected: string | undefined,
  min?: string,
  max?: string,
  today = personsToday(),
) => clampDate(selected && isIsoDate(selected) ? selected : today, min, max);

// What a picker keeps while it is used

/** The state an adapter keeps for a picker, which the picker asks to change with `onStateChange` */
export interface DatePickerState {
  /** The date chosen in the calendar so far; the value changes on OK. */
  draft?: string;
  /** The month the calendar shows, `YYYY-MM` */
  month: string;
  /** The date that takes the focus in the calendar */
  focused: string;
  view: CalendarView;
  /** The text in the date field */
  text: string;
  /** Why the text in the field isn't a date that can be chosen, shown as its error */
  textError?: string;
  /** The modal dialog's mode */
  mode: 'calendar' | 'input';
  /**
   * Whether the picker's last opening came from the keyboard, so the focus goes into the calendar.
   * Opening starts the rest of the state afresh, and leaves this.
   */
  focusOnOpen?: boolean;
}

/** What a picker asks for, and what it reads it from */
interface PickerBase {
  /** The date, `YYYY-MM-DD`. The adapter owns it. */
  value?: string;
  /** Whether the calendar or the dialog is shown. The adapter owns it. */
  open?: boolean;
  min?: string;
  max?: string;
  /** The language, already resolved */
  locale: string;
  /** A Clear button at the start of the buttons, which empties the date */
  clearable?: boolean;
}

interface PickerCallbacks {
  /** Makes dates unavailable, besides those outside `min` and `max`. */
  isDateDisabled?: (date: string) => boolean;
  messages: () => DatePickerMessages;
  /** The state the adapter keeps for the picker */
  state: () => DatePickerState;
  /** Called with the requested date. */
  onChange: (value: string | undefined) => void;
  /** Called with the requested `open`. */
  onOpenChange: (open: boolean) => void;
  /** Asks to change part of the state. */
  onStateChange: (state: Partial<DatePickerState>) => void;
}

/** The state a picker starts from, and goes back to as it opens */
export const initialDatePickerState = (
  value: string | undefined,
  locale: string,
  limits: { min?: string; max?: string } = {},
): DatePickerState => {
  const focused = initialFocus(value, limits.min, limits.max);
  return {
    draft: value,
    month: monthOf(focused),
    focused,
    view: 'days',
    text: writeDateInput(value, locale),
    textError: undefined,
    mode: 'calendar',
  };
};

/** What the actions of a picker do, which the docked one and the dialog share */
const pickerActions = (props: () => PickerBase, options: PickerCallbacks) => {
  const read = (text: string) =>
    readDateInput(text, {
      locale: props().locale,
      messages: options.messages(),
      min: props().min,
      max: props().max,
      isDateDisabled: options.isDateDisabled,
    });
  const close = () => options.onOpenChange(false);
  const confirm = () => {
    const draft = options.state().draft;
    if (draft !== props().value) options.onChange(draft);
    close();
  };
  return {
    read,
    close,
    confirm,
    clear() {
      if (props().value !== undefined) options.onChange(undefined);
      options.onStateChange({ draft: undefined, text: '', textError: undefined });
      close();
    },
    /** A date chosen in the calendar, which `confirm` also confirms, as Enter does */
    select(date: string, andConfirm: boolean) {
      options.onStateChange({ draft: date });
      if (andConfirm) {
        if (date !== props().value) options.onChange(date);
        close();
      }
    },
    /** Starts afresh from the value: call it when the picker opens. */
    opened(state: Partial<DatePickerState> = {}) {
      options.onStateChange({
        ...initialDatePickerState(props().value, props().locale, props()),
        ...state,
      });
    },
  };
};

// The field, with the docked calendar or the dialog

export interface DatePickerProps extends PickerBase {
  /** Defaults to `'docked'`. */
  variant?: DatePickerVariant;
  /** Submits the date with a form under this name. */
  name?: string;
  disabled?: boolean;
  /** The app's own supporting text, in place of the format */
  supportingText?: string;
  /** The app's own error */
  error?: boolean;
  errorText?: string;
}

export interface DatePickerOptions extends PickerCallbacks {
  props: () => DatePickerProps;
}

export interface DatePickerParts {
  /** Holds the field, the hidden input for forms, and the docked calendar or the dialog */
  root: () => PartAttrs;
  /**
   * Holds the text field (`textFieldSkeleton`), with the calendar button in its trailing icon. A
   * press on it opens the calendar (`handleFieldClick`).
   */
  field: () => PartAttrs;
  /** The trailing icon button's own attributes, besides its label (`calendarButtonLabel()`) */
  calendarButton: () => PartAttrs;
  /** A hidden `<input>` that submits the date with a form, as `YYYY-MM-DD` */
  formValue: () => PartAttrs;
  /** Docked: the calendar below the field, shown in the top layer */
  menu: () => PartAttrs;
  /** Modal: holds the dialog (`datePickerDialogSkeleton`) */
  modal: () => PartAttrs;
  /** The text buttons under a calendar: Clear, when `showsClear`, then Cancel and OK */
  actions: () => PartAttrs;
}

type DatePickerWhen = 'submits' | 'docked' | 'modal';

export const datePickerSkeleton: PartNode<
  'root' | 'field' | 'formValue' | 'menu' | 'modal',
  DatePickerWhen
> = {
  part: 'root',
  tag: 'div',
  children: [
    { part: 'field', tag: 'div', content: true },
    { part: 'formValue', tag: 'input', when: 'submits' },
    // While open, the calendar (`calendarSkeleton`) and the actions
    { part: 'menu', tag: 'div', when: 'docked', content: true },
    { part: 'modal', tag: 'div', when: 'modal', content: true },
  ],
};

/** The text field's props, as the picker gives them */
export interface DateFieldProps {
  placeholder: string;
  supportingText: string;
  error: boolean;
  errorText: string | undefined;
}

export interface DatePickerApi extends Record<DatePickerWhen, () => boolean> {
  parts: DatePickerParts;
  /** Whether the docked calendar has a Clear button */
  showsClear: () => boolean;
  /** The text field's placeholder, supporting text, and error */
  field: () => DateFieldProps;
  calendarButtonLabel: () => string;
  /** Whether the last opening came from the keyboard, so the focus goes into the calendar */
  focusOnOpen: () => boolean;
  /** Attach to the field's `click`: a press opens the calendar, with the focus left in the field. */
  handleFieldClick: (event: { detail: number; target: EventTarget | null }) => void;
  /** Attach to the field input's `keydown`: Enter reads the text and closes; Alt+Down opens. */
  handleFieldKeydown: (event: { key: string; altKey: boolean; preventDefault(): void }) => void;
  /** The calendar button's click: it opens the calendar with the focus in, or closes it. */
  toggle: () => void;
  /** The field's text changed as the person typed. */
  textInput: (text: string) => void;
  /** Reads the field's text: call it on the input's `change`. */
  commitText: () => void;
  /** The value or the language changed: the field writes it afresh. */
  valueChanged: () => void;
  /** The calendar or dialog opened, by the picker or the app: it starts from the value. */
  opened: () => void;
  select: (date: string, confirm: boolean) => void;
  /** OK */
  confirm: () => void;
  /** Cancel, and Escape, a press outside, or the focus leaving */
  cancel: () => void;
  clear: () => void;
}

export function createDatePicker(options: DatePickerOptions): DatePickerApi {
  const props = () => options.props();
  const variant = () => props().variant ?? 'docked';
  const actions = pickerActions(props, options);
  const show = (fromKeyboard: boolean) => {
    if (props().disabled || props().open) return;
    options.onStateChange({ focusOnOpen: fromKeyboard });
    options.onOpenChange(true);
  };
  const commitText = () => {
    const result = actions.read(options.state().text);
    if (result.error !== undefined) {
      options.onStateChange({ textError: result.error });
      return;
    }
    if (result.value !== props().value) options.onChange(result.value);
    options.onStateChange({
      text: writeDateInput(result.value, props().locale),
      textError: undefined,
    });
  };

  return {
    docked: () => variant() === 'docked',
    modal: () => variant() === 'modal',
    submits: () => !!props().name,
    showsClear: () => !!props().clearable,
    parts: {
      root: () => ({ class: 'rio-date-picker', 'data-variant': variant() }),
      field: () => ({ class: 'rio-date-picker__field' }),
      calendarButton: () => ({
        'aria-haspopup': 'dialog',
        'aria-expanded': String(!!props().open),
      }),
      formValue: () => ({ type: 'hidden', name: props().name, value: props().value ?? '' }),
      menu: () => ({
        class: 'rio-date-picker__menu',
        role: 'dialog',
        'aria-label': options.messages().title,
      }),
      modal: () => ({ class: 'rio-date-picker__modal' }),
      actions: () => ({ class: 'rio-date-picker__actions' }),
    },
    field() {
      const p = props();
      const pattern = dateInputPattern(p.locale, options.messages());
      const textError = options.state().textError;
      return {
        placeholder: pattern,
        supportingText: p.supportingText ?? pattern,
        error: !!p.error || textError !== undefined,
        errorText: textError ?? p.errorText,
      };
    },
    calendarButtonLabel: () => options.messages().openCalendar,
    focusOnOpen: () => !!options.state().focusOnOpen,
    handleFieldClick(event) {
      // A click from the keyboard or assistive technology has no pointer behind it; the calendar
      // button opens it from there.
      const target = event.target as Element | null;
      if (event.detail === 0 || target?.closest?.('.rio-icon-button')) return;
      show(false);
    },
    handleFieldKeydown(event) {
      if (event.key === 'Enter') {
        commitText();
        if (props().open) actions.close();
      } else if (event.altKey && event.key === 'ArrowDown') {
        event.preventDefault();
        show(true);
      }
    },
    toggle: () => (props().open ? actions.close() : show(true)),
    textInput: (text) => options.onStateChange({ text }),
    commitText,
    valueChanged: () =>
      options.onStateChange({
        text: writeDateInput(props().value, props().locale),
        textError: undefined,
      }),
    opened: () =>
      actions.opened({ text: options.state().text, textError: options.state().textError }),
    select: actions.select,
    confirm: actions.confirm,
    cancel: actions.close,
    clear: actions.clear,
  };
}

// The modal dialog

export interface DatePickerDialogProps extends PickerBase {
  /** What each opening starts in. Defaults to `'calendar'`. */
  initialMode?: 'calendar' | 'input';
  /** Whether the content renders: from opening until the closing motion ends. The adapter keeps it. */
  rendered: boolean;
}

export interface DatePickerDialogOptions extends PickerCallbacks {
  props: () => DatePickerDialogProps;
  ids: { title: string; headline: string };
}

export interface DatePickerDialogParts {
  /** A `<dialog>`, with a basic dialog's container and motion (`rio-dialog`) */
  root: () => PartAttrs;
  /** The title, the headline, and the icon button that switches modes (`iconButtonSkeleton`) */
  header: () => PartAttrs;
  /** Holds the calendar (`calendarSkeleton`), in the calendar mode */
  calendar: () => PartAttrs;
  /** Holds the title message, which names the dialog */
  title: () => PartAttrs;
  /** Holds `headline()`, announced as it changes */
  headline: () => PartAttrs;
  divider: () => PartAttrs;
  /** Holds the text field, in the text input mode */
  input: () => PartAttrs;
  /** Clear, when `showsClear`, then Cancel and OK */
  actions: () => PartAttrs;
}

type DatePickerDialogWhen = 'rendered' | 'calendarMode' | 'inputMode';

/** The dialog's content renders from opening until the closing motion ends. */
export const datePickerDialogSkeleton: PartNode<
  'root' | 'header' | 'divider' | 'calendar' | 'input' | 'actions',
  DatePickerDialogWhen
> = {
  part: 'root',
  tag: 'dialog',
  children: [
    { part: 'header', tag: 'div', when: 'rendered', content: true },
    { part: 'divider', tag: 'div', when: 'rendered' },
    { part: 'calendar', tag: 'div', when: 'calendarMode', content: true },
    // The text field (`textFieldSkeleton`)
    { part: 'input', tag: 'div', when: 'inputMode', content: true },
    // The buttons
    { part: 'actions', tag: 'div', when: 'rendered', content: true },
  ],
};

export interface DatePickerDialogApi extends Record<DatePickerDialogWhen, () => boolean> {
  parts: DatePickerDialogParts;
  showsClear: () => boolean;
  /** The date chosen so far, such as Fri, Nov 27, or what stands for none */
  headline: () => string;
  /** The label of the button that switches modes */
  modeButtonLabel: () => string;
  /** The text field's props, in the text input mode */
  field: () => DateFieldProps;
  /** Switches between the calendar and the text input, carrying the date across. */
  switchMode: () => void;
  /** Attach to the text field input's `keydown`: Enter confirms. */
  handleFieldKeydown: (event: { key: string; preventDefault(): void }) => void;
  textInput: (text: string) => void;
  /** The dialog opened, by the app or the field: it starts from the value, in `initialMode`. */
  opened: () => void;
  select: (date: string, confirm: boolean) => void;
  /** OK: in the text input, reads the text first, and stays open on an error. */
  confirm: () => void;
  cancel: () => void;
  clear: () => void;
}

export function createDatePickerDialog(options: DatePickerDialogOptions): DatePickerDialogApi {
  const props = () => options.props();
  const state = () => options.state();
  const actions = pickerActions(props, options);
  const rendered = () => props().rendered;
  const confirm = () => {
    if (state().mode === 'input') {
      const result = actions.read(state().text);
      if (result.error !== undefined) {
        options.onStateChange({ textError: result.error });
        return;
      }
      if (result.value !== props().value) options.onChange(result.value);
      actions.close();
      return;
    }
    actions.confirm();
  };

  return {
    rendered,
    calendarMode: () => rendered() && state().mode === 'calendar',
    inputMode: () => rendered() && state().mode === 'input',
    showsClear: () => !!props().clearable,
    parts: {
      root: () => ({
        class: 'rio-dialog rio-date-picker-dialog',
        'aria-labelledby': options.ids.title,
        'data-mode': state().mode,
      }),
      header: () => ({ class: 'rio-date-picker-dialog__header' }),
      calendar: () => ({ class: 'rio-date-picker__calendar' }),
      title: () => ({ class: 'rio-date-picker-dialog__title', id: options.ids.title }),
      headline: () => ({
        class: 'rio-date-picker-dialog__headline',
        id: options.ids.headline,
        'aria-live': 'polite',
      }),
      divider: () => ({ class: 'rio-date-picker-dialog__divider', 'aria-hidden': 'true' }),
      input: () => ({ class: 'rio-date-picker-dialog__input' }),
      actions: () => ({ class: 'rio-date-picker__actions' }),
    },
    headline: () => dateHeadline(state().draft, props().locale, options.messages(), state().mode),
    modeButtonLabel: () =>
      state().mode === 'calendar'
        ? options.messages().switchToInput
        : options.messages().switchToCalendar,
    field() {
      const pattern = dateInputPattern(props().locale, options.messages());
      return {
        placeholder: pattern,
        supportingText: pattern,
        error: state().textError !== undefined,
        errorText: state().textError,
      };
    },
    switchMode() {
      if (state().mode === 'calendar') {
        options.onStateChange({
          mode: 'input',
          text: writeDateInput(state().draft, props().locale),
          textError: undefined,
        });
        return;
      }
      const result = actions.read(state().text);
      const date = result.error === undefined ? result.value : undefined;
      options.onStateChange({
        mode: 'calendar',
        ...(date
          ? { draft: date, focused: date, month: monthOf(date), view: 'days' as const }
          : {}),
      });
    },
    handleFieldKeydown(event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      confirm();
    },
    textInput: (text) => options.onStateChange({ text }),
    opened: () => actions.opened({ mode: props().initialMode ?? 'calendar' }),
    select: actions.select,
    confirm,
    cancel: actions.close,
    clear: actions.clear,
  };
}
