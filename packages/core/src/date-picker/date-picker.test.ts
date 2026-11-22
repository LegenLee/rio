import { describe, expect, test, vi } from 'vitest';
import { messagesFor } from '../locale/messages';
import {
  createCalendar,
  createDatePicker,
  createDatePickerDialog,
  dateHeadline,
  initialDatePickerState,
  type DatePickerDialogProps,
  type DatePickerProps,
  dateInputPattern,
  initialFocus,
  readDateInput,
  writeDateInput,
  type CalendarProps,
} from './date-picker';

const en = messagesFor('en').datePicker;

const setup = (props: Partial<CalendarProps> = {}) => {
  const calls = {
    onSelect: vi.fn(),
    onMonthChange: vi.fn(),
    onFocusChange: vi.fn(),
    onViewChange: vi.fn(),
  };
  const calendar = createCalendar({
    props: () => ({
      month: '2026-11',
      focused: '2026-11-27',
      locale: 'en-US',
      ...props,
    }),
    messages: () => en,
    today: () => '2026-11-18',
    ...calls,
  });
  return { calendar, ...calls };
};

describe('createCalendar', () => {
  test('the week starts where the language starts it, unless the app says otherwise', () => {
    expect(setup().calendar.weekdays()).toEqual([7, 1, 2, 3, 4, 5, 6]);
    expect(setup({ locale: 'de-DE' }).calendar.weekdays()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(setup({ firstDayOfWeek: 6 }).calendar.weekdays()[0]).toBe(6);
    expect(setup().calendar.weekdayText(1)).toBe('M');
    expect(setup().calendar.parts.weekday(1).abbr).toBe('Monday');
  });

  test('a day: one takes the focus, today is current, the selected one shows it', () => {
    const { calendar } = setup({ selected: '2026-11-10' });
    expect(calendar.parts.day('2026-11-27')).toMatchObject({
      tabindex: '0',
      'aria-label': 'Friday, November 27, 2026',
      'data-date': '2026-11-27',
    });
    expect(calendar.parts.day('2026-11-18')['aria-current']).toBe('date');
    expect(calendar.parts.day('2026-11-10')['data-selected']).toBe('');
    expect(calendar.parts.cell('2026-11-10')['aria-selected']).toBe('true');
    expect(calendar.parts.day('2026-12-01')).toMatchObject({ tabindex: '-1', 'data-outside': '' });
  });

  test('modal calendars leave the days of the months around empty', () => {
    expect(setup().calendar.showsDay('2026-12-01')).toBe(true);
    expect(setup({ variant: 'modal' }).calendar.showsDay('2026-12-01')).toBe(false);
  });

  test('min, max, and the app’s rule make days unavailable', () => {
    const calendar = createCalendar({
      props: () => ({
        month: '2026-11',
        focused: '2026-11-15',
        locale: 'en-US',
        min: '2026-11-05',
      }),
      messages: () => en,
      isDateDisabled: (date) => date.endsWith('-13'),
      onSelect: () => {},
      onMonthChange: () => {},
      onFocusChange: () => {},
      onViewChange: () => {},
    });
    expect(calendar.isDisabled('2026-11-04')).toBe(true);
    expect(calendar.isDisabled('2026-11-13')).toBe(true);
    expect(calendar.isDisabled('2026-11-14')).toBe(false);
    expect(calendar.parts.day('2026-11-04')['aria-disabled']).toBe('true');
  });

  test('a click chooses an available day, and focuses it', () => {
    const { calendar, onSelect, onFocusChange } = setup({ max: '2026-11-28' });
    calendar.handleDayClick('2026-11-03');
    expect(onSelect).toHaveBeenCalledWith('2026-11-03', false);
    expect(onFocusChange).toHaveBeenCalledWith('2026-11-03');
    onSelect.mockClear();
    calendar.handleDayClick('2026-11-29');
    expect(onSelect).not.toHaveBeenCalled();
  });

  test.each([
    ['ArrowRight', false, false, '2026-11-28'],
    ['ArrowLeft', false, false, '2026-11-26'],
    ['ArrowLeft', false, true, '2026-11-28'],
    ['ArrowUp', false, false, '2026-11-20'],
    ['ArrowDown', false, false, '2026-12-04'],
    ['Home', false, false, '2026-11-01'],
    ['End', false, false, '2026-11-30'],
    ['PageUp', false, false, '2026-10-27'],
    ['PageDown', true, false, '2027-11-27'],
  ])('%s (shift %s, right to left %s) moves to %s', (key, shift, rtl, target) => {
    expect(setup().calendar.keyTarget(key, shift, '2026-11-27', rtl)).toBe(target);
  });

  test('keys stay within min and max, and others aren’t the grid’s', () => {
    const { calendar } = setup({ max: '2026-11-30' });
    expect(calendar.keyTarget('PageDown', false, '2026-11-27', false)).toBe('2026-11-30');
    expect(calendar.keyTarget('a', false, '2026-11-27', false)).toBeUndefined();
  });

  test('focusing a date in another month shows that month', () => {
    const { calendar, onMonthChange, onFocusChange } = setup();
    calendar.focusDate('2026-12-02');
    expect(onMonthChange).toHaveBeenCalledWith('2026-12');
    expect(onFocusChange).toHaveBeenCalledWith('2026-12-02');
  });

  test('the arrows move by months, and stop at a month that can’t be reached', () => {
    const { calendar, onMonthChange, onFocusChange } = setup({ max: '2026-12-10' });
    calendar.goMonths(1);
    expect(onMonthChange).toHaveBeenCalledWith('2026-12');
    expect(onFocusChange).toHaveBeenCalledWith('2026-12-10');
    onMonthChange.mockClear();
    calendar.goMonths(2);
    expect(onMonthChange).not.toHaveBeenCalled();
    expect(calendar.parts.nextYear().disabled).toBe('');
    expect(calendar.parts.nextMonth().disabled).toBeUndefined();
  });

  test('the lists: toggling, choosing a month, and a year kept within the limits', () => {
    const { calendar, onViewChange, onMonthChange } = setup({ min: '2025-06-01' });
    calendar.toggleView('years');
    expect(onViewChange).toHaveBeenCalledWith('years');
    calendar.chooseMonth(3);
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-03');
    expect(onViewChange).toHaveBeenLastCalledWith('days');
    calendar.chooseYear(2025);
    // November 2025 is past June 2025, so it stays November.
    expect(onMonthChange).toHaveBeenLastCalledWith('2025-11');
    const early = setup({ min: '2025-06-01', month: '2026-03', focused: '2026-03-01' });
    early.calendar.chooseYear(2025);
    expect(early.onMonthChange).toHaveBeenLastCalledWith('2025-06');
    expect(early.calendar.years()[0]).toBe(2025);
    expect(setup().calendar.years()).toHaveLength(201);
  });

  test('without min and max, the years reach past 1900 to 2100 to take in the dates shown', () => {
    const old = setup({ selected: '1850-06-01', month: '1850-06', focused: '1850-06-01' });
    expect([old.calendar.years()[0], old.calendar.years().at(-1)]).toEqual([1850, 2100]);
    const later = setup({ month: '2150-01', focused: '2150-01-10' });
    expect(later.calendar.years().at(-1)).toBe(2150);
    const limited = setup({ min: '1950-01-01', selected: '1850-06-01' });
    expect(limited.calendar.years()[0]).toBe(1950);
  });

  test('a month that can’t be reached is unavailable in the list', () => {
    const { calendar, onMonthChange } = setup({ min: '2026-05-10' });
    expect(calendar.parts.monthOption(4)['aria-disabled']).toBe('true');
    calendar.chooseMonth(4);
    expect(onMonthChange).not.toHaveBeenCalled();
  });

  test('days and years are numbers in the language’s digits, without a date format’s words', () => {
    const { calendar } = setup({ locale: 'ko-KR' });
    expect(calendar.dayText('2026-11-27')).toBe('27');
    expect(calendar.yearText()).toBe('2026');
    expect(calendar.yearOptionText(2030)).toBe('2030');
    expect(calendar.monthText()).toBe('11월');
    expect(setup({ locale: 'ar-EG' }).calendar.dayText('2026-11-27')).toBe('٢٧');
  });

  test('labels for the menu buttons and the grid', () => {
    expect(setup().calendar.monthText()).toBe('Nov');
    expect(setup().calendar.yearText()).toBe('2026');
    expect(setup({ variant: 'modal' }).calendar.yearText()).toBe('November 2026');
    expect(setup().calendar.parts.monthButton()['aria-label']).toBe('Choose month, November');
    expect(setup().calendar.parts.grid()['aria-label']).toBe('November 2026');
  });
});

describe('the field', () => {
  const rules = { locale: 'en-US', messages: en };

  test('reads a date, nothing for no text, and an error for what isn’t one', () => {
    expect(readDateInput(' 11/27/2026 ', rules)).toEqual({ value: '2026-11-27' });
    expect(readDateInput('', rules)).toEqual({ value: undefined });
    expect(readDateInput('later', rules)).toEqual({ error: 'Enter a date as MM/DD/YYYY' });
  });

  test('turns down dates outside the limits, and those the app makes unavailable', () => {
    expect(readDateInput('1/1/2026', { ...rules, min: '2026-02-01' })).toEqual({
      error: 'Choose 02/01/2026 or later',
    });
    expect(readDateInput('1/1/2026', { ...rules, max: '2025-12-31' })).toEqual({
      error: 'Choose 12/31/2025 or earlier',
    });
    expect(readDateInput('1/1/2026', { ...rules, isDateDisabled: () => true })).toEqual({
      error: 'This date isn’t available',
    });
  });

  test('writes and hints the format in the language', () => {
    expect(writeDateInput('2026-11-27', 'ko-KR')).toBe('2026. 11. 27.');
    expect(writeDateInput(undefined, 'en-US')).toBe('');
    expect(dateInputPattern('de-DE', en)).toBe('DD.MM.YYYY');
  });

  test('the modal headline: the date so far, or what stands for none', () => {
    expect(dateHeadline('2026-11-27', 'en-US', en, 'calendar')).toBe('Fri, Nov 27');
    expect(dateHeadline(undefined, 'en-US', en, 'calendar')).toBe('Selected date');
    expect(dateHeadline(undefined, 'en-US', en, 'input')).toBe('Entered date');
  });

  test('a calendar opens on the date, or today, within the limits', () => {
    expect(initialFocus('2026-11-27')).toBe('2026-11-27');
    expect(initialFocus(undefined, undefined, undefined, '2026-11-18')).toBe('2026-11-18');
    expect(initialFocus(undefined, '2027-01-01', undefined, '2026-11-18')).toBe('2027-01-01');
  });
});

describe('createDatePicker', () => {
  const setup = (props: Partial<DatePickerProps> = {}) => {
    let state = initialDatePickerState(props.value, 'en-US');
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const picker = createDatePicker({
      props: () => ({ locale: 'en-US', ...props }),
      messages: () => en,
      state: () => state,
      onChange,
      onOpenChange,
      onStateChange: (next) => (state = { ...state, ...next }),
    });
    return { picker, onChange, onOpenChange, state: () => state };
  };
  const key = (name: string, altKey = false) => ({ key: name, altKey, preventDefault: vi.fn() });

  test('typed text is read: a date, an error, or nothing', () => {
    const { picker, onChange, state } = setup({ value: '2026-11-27' });
    picker.textInput('1-2-2026');
    picker.commitText();
    expect(onChange).toHaveBeenCalledWith('2026-01-02');
    expect(state().text).toBe('01/02/2026');
    picker.textInput('soon');
    picker.commitText();
    expect(state().textError).toBe('Enter a date as MM/DD/YYYY');
    expect(picker.field()).toMatchObject({ error: true, errorText: 'Enter a date as MM/DD/YYYY' });
    picker.textInput('');
    picker.commitText();
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  test('the field: the format as placeholder and supporting text, unless the app gives its own', () => {
    expect(setup().picker.field()).toEqual({
      placeholder: 'MM/DD/YYYY',
      supportingText: 'MM/DD/YYYY',
      error: false,
      errorText: undefined,
    });
    expect(setup({ supportingText: 'When you leave' }).picker.field().supportingText).toBe(
      'When you leave',
    );
  });

  test('a press on the field opens it; a click without a pointer doesn’t', () => {
    const { picker, onOpenChange } = setup();
    picker.handleFieldClick({ detail: 0, target: null });
    expect(onOpenChange).not.toHaveBeenCalled();
    picker.handleFieldClick({ detail: 1, target: null });
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(picker.focusOnOpen()).toBe(false);
  });

  test('Alt+Down and the calendar button open it with the focus in; disabled, nothing opens', () => {
    const { picker, onOpenChange, state } = setup();
    const event = key('ArrowDown', true);
    picker.handleFieldKeydown(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(picker.focusOnOpen()).toBe(true);
    // It is the adapter's state, and opening, which starts the rest afresh, leaves it.
    expect(state().focusOnOpen).toBe(true);
    picker.opened();
    expect(picker.focusOnOpen()).toBe(true);
    const disabled = setup({ disabled: true });
    disabled.picker.toggle();
    expect(disabled.onOpenChange).not.toHaveBeenCalled();
  });

  test('Enter in the field reads the text and closes an open calendar', () => {
    const { picker, onChange, onOpenChange } = setup({ open: true });
    picker.textInput('3/4/2026');
    picker.handleFieldKeydown(key('Enter'));
    expect(onChange).toHaveBeenCalledWith('2026-03-04');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('a choice waits for OK; Enter on a day confirms; Cancel leaves the date', () => {
    const { picker, onChange, onOpenChange, state } = setup({ value: '2026-11-27', open: true });
    picker.select('2026-11-03', false);
    expect(state().draft).toBe('2026-11-03');
    expect(onChange).not.toHaveBeenCalled();
    picker.cancel();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onChange).not.toHaveBeenCalled();
    picker.confirm();
    expect(onChange).toHaveBeenCalledWith('2026-11-03');
    picker.select('2026-11-04', true);
    expect(onChange).toHaveBeenLastCalledWith('2026-11-04');
  });

  test('opening starts from the value; Clear empties it', () => {
    const { picker, onChange, state } = setup({ value: '2026-11-27', clearable: true });
    picker.select('2026-11-03', false);
    picker.opened();
    expect(state()).toMatchObject({ draft: '2026-11-27', month: '2026-11', view: 'days' });
    expect(picker.showsClear()).toBe(true);
    picker.clear();
    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(state().text).toBe('');
  });

  test('the calendar button tells what it opens and whether it is open', () => {
    expect(setup({ open: true }).picker.parts.calendarButton()).toEqual({
      'aria-haspopup': 'dialog',
      'aria-expanded': 'true',
    });
    expect(setup().picker.calendarButtonLabel()).toBe('Choose date');
  });
});

describe('createDatePickerDialog', () => {
  const setup = (props: Partial<DatePickerDialogProps> = {}) => {
    let state = initialDatePickerState(props.value, 'en-US');
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const dialog = createDatePickerDialog({
      props: () => ({ locale: 'en-US', rendered: true, ...props }),
      messages: () => en,
      state: () => state,
      ids: { title: 't', headline: 'h' },
      onChange,
      onOpenChange,
      onStateChange: (next) => (state = { ...state, ...next }),
    });
    return { dialog, onChange, onOpenChange, state: () => state };
  };

  test('opens in the initial mode; switching carries the date across', () => {
    const { dialog, state } = setup({ value: '2026-11-27', initialMode: 'input' });
    dialog.opened();
    expect(state()).toMatchObject({ mode: 'input', text: '11/27/2026' });
    expect(dialog.modeButtonLabel()).toBe('Switch to calendar');
    dialog.textInput('12/24/2026');
    dialog.switchMode();
    expect(state()).toMatchObject({ mode: 'calendar', draft: '2026-12-24', month: '2026-12' });
    expect(dialog.headline()).toBe('Thu, Dec 24');
  });

  test('OK in the text input reads it, and stays open on an error', () => {
    const { dialog, onChange, onOpenChange, state } = setup({ initialMode: 'input' });
    dialog.opened();
    dialog.textInput('nope');
    dialog.confirm();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(state().textError).toBe('Enter a date as MM/DD/YYYY');
    dialog.textInput('2/2/2027');
    const enter = { key: 'Enter', preventDefault: vi.fn() };
    dialog.handleFieldKeydown(enter);
    expect(onChange).toHaveBeenCalledWith('2027-02-02');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('the calendar: OK confirms the choice, and Clear empties the date', () => {
    const { dialog, onChange } = setup({ value: '2026-11-27', clearable: true });
    dialog.opened();
    dialog.select('2026-11-05', false);
    dialog.confirm();
    expect(onChange).toHaveBeenCalledWith('2026-11-05');
    expect(dialog.showsClear()).toBe(true);
    dialog.clear();
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});
