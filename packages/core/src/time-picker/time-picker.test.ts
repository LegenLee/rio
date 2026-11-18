import { describe, expect, test, vi } from 'vitest';
import { messagesFor } from '../locale/messages';
import {
  createTimePicker,
  initialTimePickerState,
  type TimePickerProps,
  type TimePickerState,
} from './time-picker';

const en = messagesFor('en').timePicker;

/** A picker whose adapter takes every change it is asked for */
const setup = (
  variant: 'inline' | 'dialog',
  props: Partial<TimePickerProps> = {},
  initial: Partial<TimePickerState> = {},
) => {
  const current: TimePickerProps = { locale: 'en-US', rendered: true, ...props };
  const state: TimePickerState = {
    ...initialTimePickerState(current.value),
    ...(variant === 'inline' ? { mode: 'input' as const } : {}),
    ...initial,
  };
  const onChange = vi.fn((value: string | undefined) => (current.value = value));
  const onOpenChange = vi.fn((open: boolean) => (current.open = open));
  const picker = createTimePicker({
    variant,
    props: () => current,
    messages: () => en,
    state: () => state,
    ids: { error: 'the-error' },
    onChange,
    onOpenChange,
    onStateChange: (next) => Object.assign(state, next),
  });
  if (variant === 'inline') picker.valueChanged();
  else picker.opened();
  return { picker, state, props: current, onChange, onOpenChange };
};

describe('createTimePicker, inline', () => {
  test('the clock comes from the language, unless the app sets one', () => {
    expect(setup('inline').picker.hourCycle()).toBe(12);
    expect(setup('inline', { locale: 'de-DE' }).picker.hourCycle()).toBe(24);
    expect(setup('inline', { hourCycle: 24 }).picker.hourCycle()).toBe(24);
    expect(setup('inline', { locale: 'de-DE', hourCycle: 12 }).picker.hourCycle()).toBe(12);
  });

  test('the fields show the time as the clock counts it', () => {
    expect(setup('inline', { value: '19:05' }).state).toMatchObject({
      hourText: '07',
      minuteText: '05',
    });
    expect(setup('inline', { value: '00:30' }).picker.hourText()).toBe('12');
    expect(setup('inline', { value: '19:05', hourCycle: 24 }).picker.hourText()).toBe('19');
    expect(setup('inline').state).toMatchObject({ hourText: '', minuteText: '' });
  });

  test('typed text is read in the half of the day the time is in', () => {
    const { picker, state, onChange } = setup('inline', { value: '19:05' });
    picker.hourInput('8');
    picker.commitText();
    expect(onChange).toHaveBeenLastCalledWith('20:05');
    expect(state).toMatchObject({ hourText: '08', minuteText: '05', invalid: undefined });
  });

  test('a minute left empty counts as 00; without a time, AM', () => {
    const { picker, onChange } = setup('inline');
    picker.hourInput('8');
    picker.commitText();
    expect(onChange).toHaveBeenLastCalledWith('08:00');
  });

  test('the same time again isn’t a change', () => {
    const { picker, onChange } = setup('inline', { value: '19:05' });
    picker.hourInput('7');
    picker.commitText();
    expect(onChange).not.toHaveBeenCalled();
  });

  test.each([
    ['an hour past 12', 12, '13', '05', 'hour', en.invalidHour12],
    ['hour 0 on a 12-hour clock', 12, '0', '05', 'hour', en.invalidHour12],
    ['an hour past 23', 24, '24', '05', 'hour', en.invalidHour24],
    ['an hour that isn’t a number', 24, 'ab', '05', 'hour', en.invalidHour24],
    ['an hour left empty', 24, '', '05', 'hour', en.invalidHour24],
    ['a minute past 59', 24, '10', '60', 'minute', en.invalidMinute],
    ['a minute that isn’t a number', 24, '10', '5a', 'minute', en.invalidMinute],
    ['three digits', 24, '010', '05', 'hour', en.invalidHour24],
  ] as const)(
    '%s is an error on its field, and the value stays',
    (_, hourCycle, hour, minute, invalid, error) => {
      const { picker, state, onChange } = setup('inline', { value: '09:30', hourCycle });
      picker.hourInput(hour);
      picker.minuteInput(minute);
      picker.commitText();
      expect(onChange).not.toHaveBeenCalled();
      expect(state.invalid).toBe(invalid);
      expect(picker.error()).toBe(error);
      expect(picker.showsError()).toBe(true);
      const [wrong, right] =
        invalid === 'hour'
          ? [picker.parts.hourField(), picker.parts.minuteField()]
          : [picker.parts.minuteField(), picker.parts.hourField()];
      expect(wrong['aria-invalid']).toBe('true');
      expect(wrong['aria-describedby']).toBe('the-error');
      expect(right['aria-invalid']).toBeUndefined();
      expect(right['aria-describedby']).toBeUndefined();
      expect(picker.parts.error()).toMatchObject({ id: 'the-error', role: 'alert' });
    },
  );

  test('the error follows the clock in use', () => {
    const { picker, props } = setup('inline', { value: '09:30' });
    picker.hourInput('13');
    picker.commitText();
    expect(picker.error()).toBe(en.invalidHour12);
    props.hourCycle = 24;
    expect(picker.error()).toBe(en.invalidHour24);
  });

  test('a time read after an error clears it', () => {
    const { picker, state } = setup('inline', { value: '09:30', hourCycle: 24 });
    picker.hourInput('99');
    picker.commitText();
    picker.hourInput('10');
    picker.commitText();
    expect(state.invalid).toBeUndefined();
    expect(picker.showsError()).toBe(false);
    expect(picker.parts.hourField()['aria-invalid']).toBeUndefined();
  });

  test('empty fields clear the time', () => {
    const { picker, onChange } = setup('inline', { value: '09:30' });
    picker.hourInput(' ');
    picker.minuteInput('');
    picker.commitText();
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    const empty = setup('inline');
    empty.picker.commitText();
    expect(empty.onChange).not.toHaveBeenCalled();
  });

  test('AM and PM move the hour by 12; without a time, the choice waits for one', () => {
    const { picker, onChange } = setup('inline', { value: '08:03' });
    picker.selectPeriod(true);
    expect(onChange).toHaveBeenLastCalledWith('20:03');
    picker.selectPeriod(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    picker.selectPeriod(false);
    expect(onChange).toHaveBeenLastCalledWith('08:03');

    const later = setup('inline');
    later.picker.selectPeriod(true);
    expect(later.onChange).not.toHaveBeenCalled();
    expect(later.picker.parts.pm()['aria-checked']).toBe('true');
    later.picker.hourInput('12');
    later.picker.commitText();
    expect(later.onChange).toHaveBeenLastCalledWith('12:00');
  });

  test('AM and PM are a radio group, with the checked one in the tab order', () => {
    const { picker } = setup('inline', { value: '19:05' });
    expect(picker.showsPeriod()).toBe(true);
    expect(picker.parts.period()).toMatchObject({ role: 'radiogroup', 'aria-label': en.period });
    expect(picker.parts.am()).toMatchObject({
      role: 'radio',
      'aria-checked': 'false',
      tabindex: '-1',
      'data-selected': undefined,
    });
    expect(picker.parts.pm()).toMatchObject({
      role: 'radio',
      'aria-checked': 'true',
      tabindex: '0',
      'data-selected': '',
    });
    expect(picker.periodNames()).toEqual(['AM', 'PM']);
    expect(setup('inline', { hourCycle: 24 }).picker.showsPeriod()).toBe(false);
  });

  test('the fields are numeric inputs, named, two digits long', () => {
    const { picker } = setup('inline', { value: '19:05' });
    expect(picker.textInput()).toBe(true);
    expect(picker.showsDial()).toBe(false);
    expect(picker.parts.hourField()).toMatchObject({
      inputmode: 'numeric',
      maxlength: '2',
      autocomplete: 'off',
      'aria-label': 'Hour',
      'aria-invalid': undefined,
    });
    expect(picker.parts.minuteField()['aria-label']).toBe('Minute');
    expect(picker.fieldNames()).toEqual(['Hour', 'Minute']);
    expect(picker.parts.root()).toMatchObject({
      class: 'rio-time-picker',
      'aria-label': undefined,
      'data-layout': undefined,
      'data-mode': 'input',
      'data-hour-cycle': '12',
    });
  });

  test('a time from the app replaces what was typed, and its error', () => {
    const { picker, state, props } = setup('inline', { value: '09:30' });
    picker.hourInput('99');
    picker.commitText();
    props.value = '23:59';
    picker.valueChanged();
    expect(state).toMatchObject({ hourText: '11', minuteText: '59', invalid: undefined });
  });
});

describe('createTimePicker, dialog', () => {
  test('each opening starts from the value, on the hours, in the initial mode', () => {
    const { picker, state } = setup('dialog', { value: '19:05' });
    expect(state).toMatchObject({ draft: '19:05', pm: true, selection: 'hour', mode: 'dial' });
    picker.dialPick(3, true);
    picker.switchMode();
    picker.opened();
    expect(state).toMatchObject({ draft: '19:05', selection: 'hour', mode: 'dial' });
    const typed = setup('dialog', { value: '19:05', initialMode: 'input' });
    expect(typed.state).toMatchObject({ mode: 'input', hourText: '07', minuteText: '05' });
  });

  test('without a value, it starts at midnight', () => {
    const { picker, state } = setup('dialog');
    expect(state.draft).toBe('00:00');
    expect([picker.hourText(), picker.minuteText()]).toEqual(['12', '00']);
    expect(setup('dialog', { hourCycle: 24 }).picker.hourText()).toBe('00');
  });

  test('the dial’s toggles: the time so far, pressed for the field the dial sets', () => {
    const { picker } = setup('dialog', { value: '19:05' });
    expect([picker.hourText(), picker.minuteText()]).toEqual(['07', '05']);
    expect(picker.parts.hourField()).toMatchObject({
      type: 'button',
      'aria-label': 'Hour 7',
      'aria-pressed': 'true',
      'data-field': 'hour',
      'data-selected': '',
    });
    expect(picker.parts.minuteField()).toMatchObject({
      'aria-label': 'Minute 5',
      'aria-pressed': 'false',
      'data-field': 'minute',
      'data-selected': undefined,
    });
    picker.selectField('minute');
    expect(picker.parts.minuteField()['aria-pressed']).toBe('true');
    expect(
      setup('dialog', { value: '19:05', hourCycle: 24 }).picker.parts.hourField()['aria-label'],
    ).toBe('Hour 19');
    expect(setup('dialog', { value: '00:05' }).picker.parts.hourField()['aria-label']).toBe(
      'Hour 12',
    );
    expect(picker.parts.dial()['aria-label']).toBe('Minute');
  });

  test('a picked hour keeps its half of the day; the release goes on to the minutes', () => {
    const { picker, state, onChange } = setup('dialog', { value: '19:05' });
    picker.dialPick(3);
    expect(state).toMatchObject({ draft: '15:05', selection: 'hour' });
    picker.dialPick(0, true);
    expect(state).toMatchObject({ draft: '12:05', selection: 'minute' });
    picker.dialPick(45);
    expect(state).toMatchObject({ draft: '12:45', selection: 'minute' });
    picker.dialPick(50, true);
    expect(state).toMatchObject({ draft: '12:50', selection: 'minute' });
    expect(onChange).not.toHaveBeenCalled();
  });

  test('a 24-hour dial picks the hour as it is', () => {
    const { picker, state } = setup('dialog', { value: '19:05', hourCycle: 24 });
    picker.dialPick(3);
    expect(state.draft).toBe('03:05');
    picker.dialPick(15);
    expect(state.draft).toBe('15:05');
  });

  test('the number a pointer hovers nearest shows it, as the adapter keeps it', () => {
    const { picker, state } = setup('dialog', { value: '19:05' });
    const [, , , three, four] = picker.dialItems();
    picker.hover(3);
    expect(state.hovered).toBe(3);
    expect(picker.parts.dialItem(three!)['data-hovered']).toBe('');
    expect(picker.parts.dialItem(four!)['data-hovered']).toBeUndefined();
    picker.hover(undefined);
    expect(picker.parts.dialItem(three!)['data-hovered']).toBeUndefined();
  });

  test('only a click without a pointer picks a number; the pointer picks through the dial', () => {
    const { picker, state } = setup('dialog', { value: '19:05' });
    picker.handleNumberClick({ detail: 1 }, 3);
    expect(state.draft).toBe('19:05');
    picker.handleNumberClick({ detail: 0 }, 3);
    expect(state).toMatchObject({ draft: '15:05', selection: 'hour' });
  });

  test('AM and PM change the draft', () => {
    const { picker, state, onChange } = setup('dialog', { value: '07:30' });
    picker.selectPeriod(true);
    expect(state).toMatchObject({ draft: '19:30', pm: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  test('the numbers: 12 at the top of a 12-hour dial, then 1 to 11', () => {
    const items = setup('dialog').picker.dialItems();
    expect(items).toHaveLength(12);
    expect(items[0]).toEqual({ value: 0, label: '12', angle: 0, inner: false });
    expect(items[3]).toEqual({ value: 3, label: '3', angle: 90, inner: false });
    expect(items[11]).toEqual({ value: 11, label: '11', angle: 330, inner: false });
  });

  test('a 24-hour dial: 00 to 11 outside, 12 to 23 inside', () => {
    const items = setup('dialog', { hourCycle: 24 }).picker.dialItems();
    expect(items).toHaveLength(24);
    expect(items[0]).toEqual({ value: 0, label: '00', angle: 0, inner: false });
    expect(items[9]).toEqual({ value: 9, label: '09', angle: 270, inner: false });
    expect(items[12]).toEqual({ value: 12, label: '12', angle: 0, inner: true });
    expect(items[23]).toEqual({ value: 23, label: '23', angle: 330, inner: true });
  });

  test('the minutes: every one, labeled on the fives', () => {
    const { picker } = setup('dialog', { value: '19:05' });
    picker.selectField('minute');
    const items = picker.dialItems();
    expect(items).toHaveLength(60);
    expect(items[0]).toEqual({ value: 0, label: '00', angle: 0, inner: false });
    expect(items[7]).toEqual({ value: 7, label: '', angle: 42, inner: false });
    expect(items[55]).toEqual({ value: 55, label: '55', angle: 330, inner: false });
    expect(picker.parts.dialItem(items[7]!)).toMatchObject({
      'aria-label': 'Minute 7 of 60',
      'data-unlabeled': '',
      tabindex: '-1',
    });
    expect(picker.parts.dialItem(items[5]!)).toMatchObject({
      'aria-pressed': 'true',
      tabindex: '-1',
      'data-selected': '',
      'data-unlabeled': undefined,
    });
  });

  test('the numbers: options out of the tab order, each saying its hour', () => {
    const { picker } = setup('dialog', { value: '19:05' });
    const [twelve, , , three, , , , seven] = picker.dialItems();
    expect(picker.parts.dialItem(seven!)).toMatchObject({
      type: 'button',
      'aria-pressed': 'true',
      'aria-label': 'Hour 7 of 12',
      tabindex: '-1',
      style: '--rio-time-picker-angle: 210deg',
      'data-value': '7',
      'data-selected': '',
      'data-inner': undefined,
    });
    expect(picker.parts.dialItem(three!)).toMatchObject({
      'aria-pressed': 'false',
      tabindex: '-1',
      'data-selected': undefined,
    });
    expect(picker.parts.dialItem(twelve!)['aria-label']).toBe('Hour 12 of 12');
  });

  test('without a time, nothing is selected', () => {
    const { picker, state } = setup('dialog');
    state.draft = undefined;
    const items = picker.dialItems();
    expect(items.map((item) => picker.parts.dialItem(item)['aria-pressed'])).not.toContain('true');
    expect(picker.parts.dial().style).toBeUndefined();
    expect(picker.parts.dial()['data-inner']).toBeUndefined();
    expect(picker.parts.dial()['data-empty']).toBe('');
  });

  test('the dial: a group, with the selector’s angle and ring', () => {
    const { picker } = setup('dialog', { value: '19:05', hourCycle: 24 });
    expect(picker.parts.dial()).toMatchObject({
      role: 'group',
      'aria-label': 'Hour',
      'data-selection': 'hour',
      style: '--rio-time-picker-angle: 210deg',
      'data-inner': '',
      'data-empty': undefined,
    });
    const inner = picker.dialItems()[19]!;
    expect(picker.parts.dialItem(inner)).toMatchObject({
      'aria-label': 'Hour 19',
      'aria-pressed': 'true',
      'data-inner': '',
    });
    picker.selectField('minute');
    expect(picker.parts.dial()).toMatchObject({
      style: '--rio-time-picker-angle: 30deg',
      'data-inner': undefined,
    });
  });

  test('the language’s digits on the dial', () => {
    const { picker } = setup('dialog', { value: '19:05', locale: 'ar-EG' });
    expect(picker.dialItems()[3]!.label).toBe('٣');
    expect([picker.hourText(), picker.minuteText()]).toEqual(['٠٧', '٠٥']);
  });

  test('switching to the text input carries the time; switching back reads it', () => {
    const { picker, state } = setup('dialog', { value: '19:05' });
    picker.switchMode();
    expect(state).toMatchObject({ mode: 'input', hourText: '07', minuteText: '05' });
    expect(picker.textInput()).toBe(true);
    expect(picker.showsDial()).toBe(false);
    picker.hourInput('9');
    picker.switchMode();
    expect(state).toMatchObject({ mode: 'dial', draft: '21:05', selection: 'hour' });
  });

  test('switching back with an error leaves the draft and the error behind', () => {
    const { picker, state } = setup('dialog', { value: '19:05' });
    picker.switchMode();
    picker.hourInput('99');
    picker.commitText();
    expect(state.invalid).toBe('hour');
    picker.switchMode();
    expect(state).toMatchObject({ mode: 'dial', draft: '19:05', invalid: undefined });
  });

  test('the mode button says what it switches to; the dialog is named for its mode', () => {
    const { picker } = setup('dialog', { value: '19:05' });
    expect(picker.modeButtonLabel()).toBe('Toggle input picker');
    expect(picker.parts.root()).toMatchObject({
      class: 'rio-dialog rio-time-picker rio-time-picker-dialog',
      'aria-label': 'Select time',
      'data-mode': 'dial',
      'data-layout': 'auto',
      'data-hour-cycle': '12',
    });
    picker.switchMode();
    expect(picker.modeButtonLabel()).toBe('Toggle dial picker');
    expect(picker.parts.root()['aria-label']).toBe('Enter time');
    expect(setup('dialog', { layout: 'horizontal' }).picker.parts.root()['data-layout']).toBe(
      'horizontal',
    );
  });

  test('in the text input, the dialog’s fields set the draft, not the value', () => {
    const { picker, state, onChange } = setup('dialog', { value: '19:05', initialMode: 'input' });
    picker.minuteInput('45');
    picker.commitText();
    expect(state.draft).toBe('19:45');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('OK sets the draft and closes; the same time isn’t a change', () => {
    const { picker, onChange, onOpenChange } = setup('dialog', { value: '19:05' });
    picker.dialPick(3);
    picker.confirm();
    expect(onChange).toHaveBeenLastCalledWith('15:05');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    const same = setup('dialog', { value: '19:05' });
    same.picker.confirm();
    expect(same.onChange).not.toHaveBeenCalled();
    expect(same.onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test('OK in the text input reads it, and stays open on an error', () => {
    const { picker, state, onChange, onOpenChange } = setup('dialog', {
      value: '19:05',
      initialMode: 'input',
    });
    picker.minuteInput('75');
    picker.confirm();
    expect(state.invalid).toBe('minute');
    expect(onOpenChange).not.toHaveBeenCalled();
    picker.minuteInput('15');
    picker.confirm();
    expect(onChange).toHaveBeenLastCalledWith('19:15');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test('OK on empty fields clears the time', () => {
    const { picker, onChange } = setup('dialog', { value: '19:05', initialMode: 'input' });
    picker.hourInput('');
    picker.minuteInput('');
    picker.confirm();
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  test('Cancel closes, and leaves the value', () => {
    const { picker, onChange, onOpenChange } = setup('dialog', { value: '19:05' });
    picker.dialPick(3);
    picker.cancel();
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test('closed, nothing inside renders', () => {
    const { picker } = setup('dialog', { value: '19:05', rendered: false });
    expect([picker.rendered(), picker.showsPeriod(), picker.showsDial()]).toEqual([
      false,
      false,
      false,
    ]);
  });
});
