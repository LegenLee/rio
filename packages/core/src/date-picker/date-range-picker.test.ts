import { describe, expect, test, vi } from 'vitest';
import { messagesFor } from '../locale/messages';
import {
  createDateRangePickerDialog,
  createRangeCalendar,
  initialDateRangePickerState,
  type DateRangePickerDialogProps,
  type DateRangePickerState,
  type RangeCalendarProps,
} from './date-range-picker';

const en = messagesFor('en').datePicker;

const calendarSetup = (props: Partial<RangeCalendarProps> = {}) => {
  const calls = { onSelect: vi.fn(), onFocusChange: vi.fn(), onMonthsChange: vi.fn() };
  const calendar = createRangeCalendar({
    props: () => ({
      focused: '2026-08-17',
      firstMonth: '2026-07',
      lastMonth: '2026-09',
      locale: 'en-US',
      ...props,
    }),
    today: () => '2026-08-05',
    isDateDisabled: (date) => date === '2026-08-30',
    ...calls,
  });
  return { calendar, ...calls };
};

describe('createRangeCalendar', () => {
  test('it renders the months from the first to the last, each with the weeks that hold its days', () => {
    const { calendar } = calendarSetup();
    expect(calendar.months()).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(calendar.monthText('2026-08')).toBe('August 2026');
    // August 2026 starts on a Saturday and ends on a Monday: six weeks.
    const weeks = calendar.weeks('2026-08');
    expect(weeks).toHaveLength(6);
    expect(weeks[0]![6]).toBe('2026-08-01');
    expect(weeks[5]![1]).toBe('2026-08-31');
    expect(calendar.showsDay('2026-07-31', '2026-08')).toBe(false);
    expect(calendar.showsDay('2026-08-01', '2026-08')).toBe(true);
    expect(calendar.parts.cell('2026-07-31', '2026-08')).toEqual({
      class: 'rio-date-picker__cell',
    });
    expect(
      calendarSetup({ firstMonth: '2026-12', lastMonth: '2027-01' }).calendar.months(),
    ).toEqual(['2026-12', '2027-01']);
  });

  test('each month is a grid named by it; the weekdays above are hidden from assistive technology', () => {
    const { calendar } = calendarSetup();
    expect(calendar.parts.grid('2026-08')).toEqual({
      class: 'rio-date-picker__grid',
      role: 'grid',
      'aria-label': 'August 2026',
      'aria-multiselectable': 'true',
    });
    expect(calendar.parts.weekdays()['aria-hidden']).toBe('true');
    expect(calendar.parts.subhead('2026-08')['aria-hidden']).toBe('true');
    expect(calendar.parts.month('2026-08')['data-month']).toBe('2026-08');
    expect(calendar.weekdays()).toEqual([7, 1, 2, 3, 4, 5, 6]);
    expect(calendar.weekdayText(7)).toBe('S');
  });

  test('the ends are selected, and the days between them are in the range', () => {
    const { calendar } = calendarSetup({ start: '2026-08-17', end: '2026-08-23' });
    expect(calendar.parts.cell('2026-08-17', '2026-08')).toMatchObject({
      'aria-selected': 'true',
      'data-range-start': '',
      'data-range-end': undefined,
      'data-in-range': undefined,
    });
    expect(calendar.parts.cell('2026-08-20', '2026-08')).toMatchObject({
      'aria-selected': 'true',
      'data-in-range': '',
    });
    expect(calendar.parts.cell('2026-08-23', '2026-08')).toMatchObject({
      'aria-selected': 'true',
      'data-range-end': '',
    });
    expect(calendar.parts.cell('2026-08-24', '2026-08')['aria-selected']).toBeUndefined();
    expect(calendar.parts.day('2026-08-17')['data-selected']).toBe('');
    expect(calendar.parts.day('2026-08-23')['data-selected']).toBe('');
    expect(calendar.parts.day('2026-08-20')['data-selected']).toBeUndefined();
  });

  test('a range of one day, or only a start, has no band', () => {
    for (const end of ['2026-08-17', undefined]) {
      const { calendar } = calendarSetup({ start: '2026-08-17', end });
      expect(calendar.parts.cell('2026-08-17', '2026-08')).toMatchObject({
        'aria-selected': 'true',
        'data-range-start': undefined,
        'data-range-end': undefined,
      });
    }
  });

  test('a day: one takes the focus, today is current, and unavailable ones say so', () => {
    const { calendar } = calendarSetup({ min: '2026-08-03' });
    expect(calendar.parts.day('2026-08-17')).toMatchObject({
      tabindex: '0',
      'aria-label': 'Monday, August 17, 2026',
      'data-date': '2026-08-17',
    });
    expect(calendar.parts.day('2026-08-18').tabindex).toBe('-1');
    expect(calendar.parts.day('2026-08-05')['aria-current']).toBe('date');
    expect(calendar.parts.day('2026-08-02')['aria-disabled']).toBe('true');
    expect(calendar.parts.day('2026-08-30')['aria-disabled']).toBe('true');
    expect(calendar.dayText('2026-08-05')).toBe('5');
  });

  test('a press on a day that can be chosen moves the focus and chooses it', () => {
    const { calendar, onSelect, onFocusChange } = calendarSetup();
    calendar.handleDayClick('2026-08-30');
    expect(onSelect).not.toHaveBeenCalled();
    calendar.handleDayClick('2026-08-20');
    expect(onFocusChange).toHaveBeenLastCalledWith('2026-08-20');
    expect(onSelect).toHaveBeenLastCalledWith('2026-08-20', false);
  });

  test('the focus moved past the months rendered renders up to its month', () => {
    const { calendar, onMonthsChange, onFocusChange } = calendarSetup();
    calendar.focusDate('2026-09-03');
    expect(onMonthsChange).not.toHaveBeenCalled();
    calendar.focusDate('2026-11-03');
    expect(onMonthsChange).toHaveBeenLastCalledWith('2026-07', '2026-11');
    calendar.focusDate('2025-12-31');
    expect(onMonthsChange).toHaveBeenLastCalledWith('2025-12', '2026-09');
    expect(onFocusChange).toHaveBeenLastCalledWith('2025-12-31');
    expect(calendar.keyTarget('PageDown', true, '2026-08-17', false)).toBe('2027-08-17');
    expect(
      calendarSetup({ max: '2026-09-10' }).calendar.keyTarget(
        'PageDown',
        false,
        '2026-08-17',
        false,
      ),
    ).toBe('2026-09-10');
  });

  test('more months come a year at a time, up to the limits or 1900 to 2100', () => {
    const { calendar, onMonthsChange } = calendarSetup();
    calendar.extend('start');
    expect(onMonthsChange).toHaveBeenLastCalledWith('2025-07', '2026-09');
    calendar.extend('end');
    expect(onMonthsChange).toHaveBeenLastCalledWith('2026-07', '2027-09');
    const limited = calendarSetup({ min: '2026-05-20', max: '2026-10-02' });
    limited.calendar.extend('start');
    expect(limited.onMonthsChange).toHaveBeenLastCalledWith('2026-05', '2026-09');
    limited.calendar.extend('end');
    expect(limited.onMonthsChange).toHaveBeenLastCalledWith('2026-07', '2026-10');
    const ends = calendarSetup({ firstMonth: '1900-01', lastMonth: '2100-12' });
    ends.calendar.extend('start');
    ends.calendar.extend('end');
    expect(ends.onMonthsChange).not.toHaveBeenCalled();
  });

  test('without min and max, the months reach past 1900 to 2100 to take in the range and the focus', () => {
    const early = calendarSetup({
      start: '1850-06-01',
      focused: '1850-06-01',
      firstMonth: '1850-06',
      lastMonth: '1851-06',
    });
    early.calendar.extend('start');
    expect(early.onMonthsChange).not.toHaveBeenCalled();
    early.calendar.extend('end');
    expect(early.onMonthsChange).toHaveBeenLastCalledWith('1850-06', '1852-06');
    const late = calendarSetup({
      end: '2150-03-01',
      focused: '2100-12-01',
      firstMonth: '2100-09',
      lastMonth: '2100-12',
    });
    late.calendar.extend('end');
    expect(late.onMonthsChange).toHaveBeenLastCalledWith('2100-09', '2101-12');
  });
});

/** A range dialog whose adapter takes every change it is asked for */
const setup = (props: Partial<DateRangePickerDialogProps> = {}) => {
  const current: DateRangePickerDialogProps = {
    locale: 'en-US',
    rendered: true,
    open: true,
    ...props,
  };
  const state: DateRangePickerState = initialDateRangePickerState(
    current.start,
    current.end,
    current.locale,
    current,
  );
  const onChange = vi.fn((start?: string, end?: string) => {
    current.start = start;
    current.end = end;
  });
  const onOpenChange = vi.fn((open: boolean) => (current.open = open));
  const dialog = createDateRangePickerDialog({
    props: () => current,
    messages: () => en,
    state: () => state,
    ids: { title: 'the-title', headline: 'the-headline' },
    onChange,
    onOpenChange,
    onStateChange: (next) => Object.assign(state, next),
  });
  dialog.opened();
  return { dialog, state, props: current, onChange, onOpenChange };
};

describe('initialDateRangePickerState', () => {
  test('it opens on the start, or today, with three months before it and a year after', () => {
    expect(initialDateRangePickerState('2026-08-17', '2026-08-23', 'en-US')).toEqual({
      start: '2026-08-17',
      end: '2026-08-23',
      focused: '2026-08-17',
      firstMonth: '2026-05',
      lastMonth: '2027-08',
      mode: 'calendar',
      startText: '08/17/2026',
      endText: '08/23/2026',
      startError: undefined,
      endError: undefined,
    });
    expect(
      initialDateRangePickerState('2026-08-17', undefined, 'en-US', {
        min: '2026-07-10',
        max: '2026-12-01',
      }),
    ).toMatchObject({ firstMonth: '2026-07', lastMonth: '2026-12', endText: '' });
    // A start before 1900 opens on its month, without min to reach.
    expect(initialDateRangePickerState('1850-06-01', undefined, 'en-US')).toMatchObject({
      firstMonth: '1850-06',
      lastMonth: '1851-06',
    });
  });
});

describe('createDateRangePickerDialog', () => {
  test('a day starts the range; a later one, or the same, ends it; an earlier one starts it again', () => {
    const { dialog, state } = setup();
    dialog.select('2026-08-17', false);
    expect([state.start, state.end]).toEqual(['2026-08-17', undefined]);
    dialog.select('2026-08-10', false);
    expect([state.start, state.end]).toEqual(['2026-08-10', undefined]);
    dialog.select('2026-08-23', false);
    expect([state.start, state.end]).toEqual(['2026-08-10', '2026-08-23']);
    dialog.select('2026-09-01', false);
    expect([state.start, state.end]).toEqual(['2026-09-01', undefined]);
    dialog.select('2026-09-01', false);
    expect([state.start, state.end]).toEqual(['2026-09-01', '2026-09-01']);
  });

  test('OK sets the range and closes; the same range isn’t a change', () => {
    const { dialog, onChange, onOpenChange } = setup({ start: '2026-08-17', end: '2026-08-23' });
    dialog.confirm();
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    const changed = setup();
    changed.dialog.select('2026-08-17', false);
    changed.dialog.select('2026-08-20', false);
    expect(changed.onChange).not.toHaveBeenCalled();
    changed.dialog.confirm();
    expect(changed.onChange).toHaveBeenLastCalledWith('2026-08-17', '2026-08-20');
  });

  test('OK with only a start sets it, without an end', () => {
    const { dialog, onChange } = setup({ start: '2026-08-01', end: '2026-08-05' });
    dialog.select('2026-08-17', false);
    dialog.confirm();
    expect(onChange).toHaveBeenLastCalledWith('2026-08-17', undefined);
  });

  test('Enter on the day that ends the range confirms it; on the start, it waits for the end', () => {
    const { dialog, onChange, onOpenChange } = setup();
    dialog.select('2026-08-17', true);
    expect(onOpenChange).not.toHaveBeenCalled();
    dialog.select('2026-08-20', true);
    expect(onChange).toHaveBeenLastCalledWith('2026-08-17', '2026-08-20');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test('Cancel closes and leaves the range; each opening starts from it', () => {
    const { dialog, state, onChange, onOpenChange } = setup({
      start: '2026-08-17',
      end: '2026-08-23',
    });
    dialog.select('2026-09-01', false);
    dialog.cancel();
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    dialog.opened();
    expect([state.start, state.end, state.focused]).toEqual([
      '2026-08-17',
      '2026-08-23',
      '2026-08-17',
    ]);
  });

  test('Clear empties the range and closes', () => {
    const { dialog, onChange, onOpenChange } = setup({
      start: '2026-08-17',
      end: '2026-08-23',
      clearable: true,
    });
    expect(dialog.showsClear()).toBe(true);
    dialog.clear();
    expect(onChange).toHaveBeenLastCalledWith(undefined, undefined);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(setup().dialog.showsClear()).toBe(false);
  });

  test('the headline is the range so far, with words for the ends not chosen', () => {
    const { dialog } = setup();
    expect(dialog.headline()).toBe('Start date – End date');
    dialog.select('2026-08-17', false);
    expect(dialog.headline()).toBe('Aug 17 – End date');
    dialog.select('2026-08-23', false);
    expect(dialog.headline()).toBe('Aug 17 – Aug 23');
    const korean = createDateRangePickerDialog({
      props: () => ({ locale: 'ko-KR', rendered: true, start: '2026-08-17', end: '2026-08-23' }),
      messages: () => messagesFor('ko').datePicker,
      state: () => initialDateRangePickerState('2026-08-17', '2026-08-23', 'ko-KR'),
      ids: { title: 't', headline: 'h' },
      onChange: vi.fn(),
      onOpenChange: vi.fn(),
      onStateChange: vi.fn(),
    });
    expect(korean.headline()).toBe('8월 17일 ~ 8월 23일');
  });

  test('the dialog: named by its title, in its mode', () => {
    const { dialog } = setup();
    expect(dialog.parts.root()).toEqual({
      class: 'rio-dialog rio-date-picker-dialog rio-date-range-picker',
      'aria-labelledby': 'the-title',
      'data-mode': 'calendar',
    });
    expect(dialog.parts.title().id).toBe('the-title');
    expect(dialog.parts.headline()).toMatchObject({ id: 'the-headline', 'aria-live': 'polite' });
    expect([dialog.calendarMode(), dialog.inputMode()]).toEqual([true, false]);
    expect(setup({ rendered: false }).dialog.calendarMode()).toBe(false);
  });

  test('the text input carries the range, and reads it back', () => {
    const { dialog, state } = setup({ start: '2026-08-17', end: '2026-08-23' });
    expect(dialog.modeButtonLabel()).toBe('Switch to text input');
    dialog.switchMode();
    expect(state).toMatchObject({
      mode: 'input',
      startText: '08/17/2026',
      endText: '08/23/2026',
    });
    expect(dialog.modeButtonLabel()).toBe('Switch to calendar');
    expect(dialog.startField()).toEqual({
      placeholder: 'MM/DD/YYYY',
      supportingText: 'MM/DD/YYYY',
      error: false,
      errorText: undefined,
    });
    dialog.startInput('12/24/2026');
    dialog.endInput('1/2/2027');
    dialog.switchMode();
    expect(state).toMatchObject({
      mode: 'calendar',
      start: '2026-12-24',
      end: '2027-01-02',
      focused: '2026-12-24',
      firstMonth: '2026-09',
    });
  });

  test('switching back, text that isn’t a range is left behind', () => {
    const { dialog, state } = setup({ start: '2026-08-17', end: '2026-08-23' });
    dialog.switchMode();
    dialog.endInput('08/01/2026');
    dialog.switchMode();
    expect([state.mode, state.start, state.end]).toEqual(['calendar', '2026-08-17', '2026-08-23']);
  });

  test('in the text input, OK and Enter read the fields, and errors keep the dialog open', () => {
    const { dialog, state, onChange, onOpenChange } = setup({
      initialMode: 'input',
      min: '2026-01-01',
    });
    expect(state.mode).toBe('input');
    dialog.endInput('08/23/2026');
    dialog.confirm();
    expect(state.startError).toBe('Enter a start date');
    dialog.startInput('08/30/2026');
    dialog.confirm();
    expect([state.startError, state.endError]).toEqual([
      undefined,
      'Choose an end date after the start date',
    ]);
    expect(dialog.endField()).toMatchObject({
      error: true,
      errorText: 'Choose an end date after the start date',
    });
    dialog.startInput('2025-12-31');
    dialog.endInput('soon');
    dialog.confirm();
    expect(state.startError).toBe('Choose 01/01/2026 or later');
    expect(state.endError).toBe('Enter a date as MM/DD/YYYY');
    expect(onOpenChange).not.toHaveBeenCalled();
    dialog.startInput('08/17/2026');
    dialog.endInput('');
    const enter = { key: 'Enter', preventDefault: vi.fn() };
    dialog.handleFieldKeydown(enter);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith('2026-08-17', undefined);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
