import { formatNumber } from '../date-picker/date';
import { formatMessage, type TimePickerMessages } from '../locale/messages';
import type { PartAttrs, PartNode } from '../parts';
import {
  dayPeriods,
  hour12,
  hour24,
  hourCycleOf,
  isPm,
  parseTime,
  writeTime,
  type HourCycle,
  type Time,
} from './time';

/** Which way the dial picker lays out: on its own from the window, or fixed */
export const TIME_PICKER_LAYOUTS = ['auto', 'vertical', 'horizontal'] as const;
export type TimePickerLayout = (typeof TIME_PICKER_LAYOUTS)[number];

/** The dial, or the text input */
export type TimePickerMode = 'dial' | 'input';

/** The field the dial sets */
export type TimeSelection = 'hour' | 'minute';

/** The state an adapter keeps for a time picker, which it asks to change with `onStateChange` */
export interface TimePickerState {
  /** The time chosen so far, `HH:MM`; the dialog's value changes on OK. */
  draft?: string;
  /** The half of the day, on a 12-hour clock without a time yet */
  pm: boolean;
  /** What the text fields hold, as typed */
  hourText: string;
  minuteText: string;
  /** The field whose text isn't a time; the error under the fields says why. */
  invalid?: TimeSelection;
  /** Which field the dial sets */
  selection: TimeSelection;
  mode: TimePickerMode;
  /** The number nearest a pointer that hovers over the dial, which shows its hover state */
  hovered?: number;
}

export interface TimePickerProps {
  /** The time, `HH:MM` on a 24-hour clock. The adapter owns it. */
  value?: string;
  /** The dialog's `open`. The adapter owns it. */
  open?: boolean;
  /** The language, already resolved */
  locale: string;
  /** Overrides the language's clock: 12 hours with AM and PM, or 24. */
  hourCycle?: HourCycle;
  /** The dialog's layout. Defaults to `'auto'`. */
  layout?: TimePickerLayout;
  /** What the dialog starts in. Defaults to `'dial'`. */
  initialMode?: TimePickerMode;
  /** Whether the dialog's content renders: from opening until the closing motion ends */
  rendered?: boolean;
}

export interface TimePickerOptions {
  props: () => TimePickerProps;
  /** `'inline'` is the text input on the page; `'dialog'`, the modal with the dial. */
  variant: 'inline' | 'dialog';
  messages: () => TimePickerMessages;
  state: () => TimePickerState;
  /** Ids for the parts that refer to each other, unique in the document */
  ids: { error: string };
  /** Called with the requested time. */
  onChange: (value: string | undefined) => void;
  /** Called with the requested `open` (the dialog). */
  onOpenChange?: (open: boolean) => void;
  onStateChange: (state: Partial<TimePickerState>) => void;
}

/** A number on the dial */
export interface DialItem {
  /** The hour (0 to 23) or minute (0 to 59) it sets */
  value: number;
  /** What it shows, or nothing for a minute between the fives */
  label: string;
  /** Where it sits, clockwise from the top, in degrees */
  angle: number;
  /** The inner ring holds 12 to 23 on a 24-hour clock. */
  inner: boolean;
}

export interface TimePickerParts {
  /** Inline: the picker. Dialog: a `<dialog>` with a basic dialog's container and motion. */
  root: () => PartAttrs;
  /** The fields and the period, and in the dialog's dial mode, the dial beside or below them */
  body: () => PartAttrs;
  /** The hour field, the separator, and the minute field */
  fields: () => PartAttrs;
  /** In the dial mode, a toggle button; in the text input, an `<input>` */
  hourField: () => PartAttrs;
  separator: () => PartAttrs;
  minuteField: () => PartAttrs;
  /** In the text input, a field over its supporting text */
  unit: () => PartAttrs;
  /** In the text input, the supporting text under each field */
  hourLabel: () => PartAttrs;
  minuteLabel: () => PartAttrs;
  /** The AM and PM buttons, a radio group, on a 12-hour clock */
  period: () => PartAttrs;
  am: () => PartAttrs;
  pm: () => PartAttrs;
  /** Inside AM and PM, a target that reaches 48px past the 40px buttons */
  periodTouch: () => PartAttrs;
  /** The dial: a group of the numbers, over its face, with the selector's track and handle */
  dial: () => PartAttrs;
  dialTrack: () => PartAttrs;
  dialHandle: () => PartAttrs;
  dialCenter: () => PartAttrs;
  /** A number on the dial, a button, pressed when selected */
  dialItem: (item: DialItem) => PartAttrs;
  /** Holds `error()`, announced as it appears */
  error: () => PartAttrs;
  /** The mode button (`iconButtonSkeleton`), Cancel, and OK */
  actions: () => PartAttrs;
}

type TimePickerWhen = 'showsPeriod' | 'showsDial' | 'textInput' | 'showsError' | 'rendered';

const bodySkeleton: PartNode<TimePickerPart, TimePickerWhen> = {
  part: 'body',
  tag: 'div',
  when: 'rendered',
  children: [
    // The fields, with their supporting text in the text input
    { part: 'fields', tag: 'div', content: true },
    { part: 'period', tag: 'div', when: 'showsPeriod', content: true },
    // The track, the handle, the center, and the numbers
    { part: 'dial', tag: 'div', when: 'showsDial', content: true },
  ],
};

type TimePickerPart = 'root' | 'body' | 'fields' | 'period' | 'dial' | 'error' | 'actions';

/** The input time picker on the page */
export const timePickerSkeleton: PartNode<TimePickerPart, TimePickerWhen> = {
  part: 'root',
  tag: 'div',
  children: [bodySkeleton, { part: 'error', tag: 'div', when: 'showsError', content: true }],
};

/** The dialog; its content renders from opening until the closing motion ends. */
export const timePickerDialogSkeleton: PartNode<TimePickerPart, TimePickerWhen> = {
  part: 'root',
  tag: 'dialog',
  children: [
    bodySkeleton,
    { part: 'error', tag: 'div', when: 'showsError', content: true },
    // The mode button (`iconButtonSkeleton`), Cancel, and OK
    { part: 'actions', tag: 'div', when: 'rendered', content: true },
  ],
};

export interface TimePickerApi extends Record<TimePickerWhen, () => boolean> {
  parts: TimePickerParts;
  /** The clock in use: the app's, or the language's */
  hourCycle: () => HourCycle;
  /** The hour field's text: the time's hour, as the clock counts it, or what was typed */
  hourText: () => string;
  minuteText: () => string;
  periodNames: () => [am: string, pm: string];
  /** The fields' names, for their labels in the text input */
  fieldNames: () => [hour: string, minute: string];
  /** The numbers on the dial for the field it sets */
  dialItems: () => DialItem[];
  /** The text of the error under the fields, or nothing */
  error: () => string;
  /** The label of the button that switches modes */
  modeButtonLabel: () => string;
  /** The dial mode's hour and minute toggles */
  selectField: (selection: TimeSelection) => void;
  /** AM or PM chosen */
  selectPeriod: (pm: boolean) => void;
  /**
   * A number chosen on the dial. With `release`, by the pointer's release on an hour, the dial goes
   * on to the minutes.
   */
  dialPick: (value: number, release?: boolean) => void;
  /**
   * Attach to a number's `click`. A click without a pointer, as Enter, Space, and assistive
   * technology make, picks it; the pointer picks through the dial (`attachTimePicker`).
   */
  handleNumberClick: (event: { detail: number }, value: number) => void;
  /** The number a pointer hovers nearest on the dial, or none (`attachTimePicker`'s `onHover`) */
  hover: (value: number | undefined) => void;
  hourInput: (text: string) => void;
  minuteInput: (text: string) => void;
  /** Reads the text fields: call it on Enter and on their `change`. */
  commitText: () => void;
  /** The dialog's mode button */
  switchMode: () => void;
  /** The dialog opened: it starts from the value, in the initial mode, on the hour. */
  opened: () => void;
  /** The value or the language changed: the inline fields show it afresh. */
  valueChanged: () => void;
  confirm: () => void;
  cancel: () => void;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** The state a time picker starts from */
export const initialTimePickerState = (value: string | undefined): TimePickerState => {
  const time = parseTime(value);
  return {
    draft: value,
    pm: time ? isPm(time.hour) : false,
    hourText: '',
    minuteText: '',
    invalid: undefined,
    selection: 'hour',
    mode: 'dial',
    hovered: undefined,
  };
};

export function createTimePicker(options: TimePickerOptions): TimePickerApi {
  const props = () => options.props();
  const state = () => options.state();
  const messages = () => options.messages();
  const dialog = options.variant === 'dialog';
  const cycle = (): HourCycle => props().hourCycle ?? hourCycleOf(props().locale);
  const number = (value: number) => formatNumber(value, props().locale);
  const twoDigits = (value: number) => (value < 10 ? number(0) : '') + number(value);
  /** The time the fields show: the draft in the dialog, the value inline */
  const shown = (): Time | undefined => parseTime(dialog ? state().draft : props().value);
  const mode = (): TimePickerMode => (dialog ? state().mode : 'input');
  const textInput = () => mode() === 'input';
  const rendered = () => !dialog || !!props().rendered;

  const hourShown = (time: Time) => (cycle() === 12 ? hour12(time.hour) : time.hour);
  const fieldsFrom = (time: Time | undefined) => ({
    hourText: time ? pad(hourShown(time)) : '',
    minuteText: time ? pad(time.minute) : '',
  });
  /** The time on the dial: midnight until there is one */
  const dialTime = (): Time => shown() ?? { hour: 0, minute: 0 };
  const pmNow = () => {
    const time = shown();
    return time ? isPm(time.hour) : state().pm;
  };
  /** Sets the time: the draft in the dialog, the value inline */
  const set = (time: Time) => {
    const value = writeTime(time);
    if (dialog) options.onStateChange({ draft: value, pm: isPm(time.hour) });
    else if (value !== props().value) options.onChange(value);
  };

  /** Reads the text fields into a time, or the field that isn't one */
  const read = (): { time?: Time; invalid?: TimeSelection; empty?: true } => {
    const { hourText, minuteText } = state();
    if (!hourText.trim() && !minuteText.trim()) return { empty: true };
    const hour = Number(hourText);
    const minute = minuteText.trim() ? Number(minuteText) : 0;
    const twelve = cycle() === 12;
    const hourOk =
      /^\d{1,2}$/.test(hourText.trim()) && (twelve ? hour >= 1 && hour <= 12 : hour <= 23);
    if (!hourOk) return { invalid: 'hour' };
    if (minuteText.trim() && !/^\d{1,2}$/.test(minuteText.trim())) return { invalid: 'minute' };
    if (minute > 59) return { invalid: 'minute' };
    return { time: { hour: twelve ? hour24(hour, pmNow()) : hour, minute } };
  };
  const commitText = () => {
    const result = read();
    if (result.invalid) {
      options.onStateChange({ invalid: result.invalid });
      return;
    }
    options.onStateChange({ invalid: undefined, ...fieldsFrom(result.time) });
    if (result.time) set(result.time);
    else if (!dialog && props().value !== undefined) options.onChange(undefined);
  };

  const close = () => options.onOpenChange?.(false);
  const inputField = (field: TimeSelection, label: string): PartAttrs => ({
    class: 'rio-time-picker__field rio-time-picker__input rio-focus-ring',
    inputmode: 'numeric',
    maxlength: '2',
    autocomplete: 'off',
    'aria-label': label,
    'aria-invalid': state().invalid === field ? 'true' : undefined,
    'aria-describedby': state().invalid === field ? options.ids.error : undefined,
  });
  const toggleField = (selection: TimeSelection, label: string): PartAttrs => ({
    class: 'rio-time-picker__field rio-state-layer rio-focus-ring',
    type: 'button',
    'aria-label': label,
    'aria-pressed': String(state().selection === selection),
    'data-field': selection,
    'data-selected': state().selection === selection ? '' : undefined,
  });

  const api: TimePickerApi = {
    hourCycle: cycle,
    showsPeriod: () => rendered() && cycle() === 12,
    showsDial: () => rendered() && mode() === 'dial',
    textInput,
    showsError: () => rendered() && !!state().invalid,
    rendered,
    parts: {
      root: () => ({
        class: dialog ? 'rio-dialog rio-time-picker rio-time-picker-dialog' : 'rio-time-picker',
        'aria-label': dialog
          ? mode() === 'dial'
            ? messages().selectTime
            : messages().enterTime
          : undefined,
        'data-mode': mode(),
        'data-layout': dialog ? (props().layout ?? 'auto') : undefined,
        'data-hour-cycle': String(cycle()),
      }),
      body: () => ({ class: 'rio-time-picker__body' }),
      fields: () => ({ class: 'rio-time-picker__fields' }),
      hourField: () =>
        textInput()
          ? inputField('hour', messages().hour)
          : toggleField(
              'hour',
              formatMessage(messages().hourToggle, {
                hour: String(hourShown(dialTime())),
              }),
            ),
      separator: () => ({ class: 'rio-time-picker__separator', 'aria-hidden': 'true' }),
      minuteField: () =>
        textInput()
          ? inputField('minute', messages().minute)
          : toggleField(
              'minute',
              formatMessage(messages().minuteToggle, { minute: String(dialTime().minute) }),
            ),
      unit: () => ({ class: 'rio-time-picker__unit' }),
      hourLabel: () => ({ class: 'rio-time-picker__label', 'aria-hidden': 'true' }),
      minuteLabel: () => ({ class: 'rio-time-picker__label', 'aria-hidden': 'true' }),
      period: () => ({
        class: 'rio-time-picker__period',
        role: 'radiogroup',
        'aria-label': messages().period,
      }),
      am: () => ({
        class: 'rio-time-picker__period-button rio-state-layer rio-focus-ring',
        type: 'button',
        role: 'radio',
        'aria-checked': String(!pmNow()),
        tabindex: pmNow() ? '-1' : '0',
        'data-selected': pmNow() ? undefined : '',
      }),
      periodTouch: () => ({
        class: 'rio-time-picker__touch rio-touch-target',
        'aria-hidden': 'true',
      }),
      pm: () => ({
        class: 'rio-time-picker__period-button rio-state-layer rio-focus-ring',
        type: 'button',
        role: 'radio',
        'aria-checked': String(pmNow()),
        tabindex: pmNow() ? '0' : '-1',
        'data-selected': pmNow() ? '' : undefined,
      }),
      dial: () => {
        const selected = selectedItem();
        return {
          class: 'rio-time-picker__dial',
          role: 'group',
          'aria-label': state().selection === 'hour' ? messages().hour : messages().minute,
          'data-selection': state().selection,
          // The selector's angle, and its ring; without a time, no selector
          style: selected ? `--rio-time-picker-angle: ${selected.angle}deg` : undefined,
          'data-inner': selected?.inner ? '' : undefined,
          'data-empty': selected ? undefined : '',
        };
      },
      dialTrack: () => ({ class: 'rio-time-picker__track', 'aria-hidden': 'true' }),
      dialHandle: () => ({ class: 'rio-time-picker__handle', 'aria-hidden': 'true' }),
      dialCenter: () => ({ class: 'rio-time-picker__center', 'aria-hidden': 'true' }),
      dialItem: (item) => {
        const selected =
          selectedItem()?.value === item.value && selectedItem()?.inner === item.inner;
        return {
          class: 'rio-time-picker__number rio-state-layer rio-focus-ring',
          type: 'button',
          // Out of the tab order: Enter on the field's toggle moves the focus onto the dial.
          tabindex: '-1',
          'aria-pressed': String(selected),
          'aria-label':
            state().selection === 'minute'
              ? formatMessage(messages().dialMinute, { minute: String(item.value) })
              : formatMessage(cycle() === 12 ? messages().dialHour12 : messages().dialHour24, {
                  hour: String(cycle() === 12 ? hour12(item.value) : item.value),
                }),
          style: `--rio-time-picker-angle: ${item.angle}deg`,
          'data-value': String(item.value),
          'data-inner': item.inner ? '' : undefined,
          'data-selected': selected ? '' : undefined,
          'data-unlabeled': item.label ? undefined : '',
          'data-hovered': state().hovered === item.value ? '' : undefined,
        };
      },
      error: () => ({
        class: 'rio-time-picker__error',
        id: options.ids.error,
        role: 'alert',
      }),
      actions: () => ({ class: 'rio-time-picker__actions' }),
    },
    // The dial's toggles show the language's digits; the text input, what was typed.
    hourText: () => (textInput() ? state().hourText : twoDigits(hourShown(dialTime()))),
    minuteText: () => (textInput() ? state().minuteText : twoDigits(dialTime().minute)),
    periodNames: () => dayPeriods(props().locale),
    fieldNames: () => [messages().hour, messages().minute],
    dialItems,
    error() {
      const { invalid } = state();
      if (invalid === 'minute') return messages().invalidMinute;
      if (invalid !== 'hour') return '';
      return cycle() === 12 ? messages().invalidHour12 : messages().invalidHour24;
    },
    modeButtonLabel: () => (mode() === 'dial' ? messages().switchToInput : messages().switchToDial),
    selectField: (selection) => options.onStateChange({ selection }),
    selectPeriod(pm) {
      const time = shown();
      if (!time) {
        options.onStateChange({ pm });
        return;
      }
      if (isPm(time.hour) === pm) return;
      set({ hour: hour24(hour12(time.hour), pm), minute: time.minute });
    },
    dialPick(value, release = false) {
      const time = shown() ?? { hour: state().pm ? 12 : 0, minute: 0 };
      if (state().selection === 'hour') {
        const hour = cycle() === 12 ? hour24(hour12(value), isPm(time.hour)) : value;
        set({ hour, minute: time.minute });
        if (release) options.onStateChange({ selection: 'minute' });
      } else {
        set({ hour: time.hour, minute: value });
      }
    },
    handleNumberClick(event, value) {
      if (event.detail === 0) api.dialPick(value);
    },
    hover: (hovered) => options.onStateChange({ hovered }),
    hourInput: (hourText) => options.onStateChange({ hourText }),
    minuteInput: (minuteText) => options.onStateChange({ minuteText }),
    commitText,
    switchMode() {
      if (state().mode === 'dial') {
        options.onStateChange({ mode: 'input', invalid: undefined, ...fieldsFrom(shown()) });
        return;
      }
      const result = read();
      options.onStateChange({
        mode: 'dial',
        invalid: undefined,
        selection: 'hour',
        ...(result.time ? { draft: writeTime(result.time), pm: isPm(result.time.hour) } : {}),
      });
    },
    opened() {
      const start = initialTimePickerState(props().value);
      const time = parseTime(props().value);
      options.onStateChange({
        ...start,
        draft: props().value ?? writeTime({ hour: 0, minute: 0 }),
        mode: props().initialMode ?? 'dial',
        ...fieldsFrom(time),
      });
    },
    valueChanged: () =>
      options.onStateChange({ ...fieldsFrom(parseTime(props().value)), invalid: undefined }),
    confirm() {
      if (state().mode === 'input') {
        const result = read();
        if (result.invalid) {
          options.onStateChange({ invalid: result.invalid });
          return;
        }
        const value = result.time ? writeTime(result.time) : undefined;
        if (value !== props().value) options.onChange(value);
        close();
        return;
      }
      if (state().draft !== props().value) options.onChange(state().draft);
      close();
    },
    cancel: close,
  };
  return api;

  function selectedItem(): DialItem | undefined {
    const time = shown();
    if (!time) return undefined;
    if (state().selection === 'minute') return minuteItem(time.minute);
    // A 12-hour clock shows each hour once, for AM and PM alike.
    const hour = cycle() === 12 ? time.hour % 12 : time.hour;
    return dialItems().find((item) => item.value === hour);
  }

  function minuteItem(minute: number): DialItem {
    return {
      value: minute,
      label: minute % 5 ? '' : twoDigits(minute),
      angle: minute * 6,
      inner: false,
    };
  }

  function dialItems(): DialItem[] {
    if (state().selection === 'minute') {
      return Array.from({ length: 60 }, (_, minute) => minuteItem(minute));
    }
    if (cycle() === 12) {
      // 12 at the top, then 1 to 11
      return Array.from({ length: 12 }, (_, index) => {
        const hour = index === 0 ? 12 : index;
        return { value: hour % 12, label: number(hour), angle: index * 30, inner: false };
      });
    }
    // 00 to 11 outside, 12 to 23 inside
    return Array.from({ length: 24 }, (_, hour) => ({
      value: hour,
      label: hour < 12 ? twoDigits(hour) : number(hour),
      angle: (hour % 12) * 30,
      inner: hour >= 12,
    }));
  }
}
