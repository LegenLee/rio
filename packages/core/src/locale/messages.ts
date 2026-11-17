// The text Rio's components show or give assistive technology, one table per language
// (`messages/<language>.ts`). A component takes its table by the language's first subtag, with
// English for a language without one, and the app can replace any of it with a component's
// `messages`. Placeholders in braces, such as `{format}`, are filled in with `formatMessage`.

import { en } from './messages/en';
import { ko } from './messages/ko';
import { languageOf } from './locale';

/** The date picker's text */
export interface DatePickerMessages {
  /** Above the modal picker's headline */
  title: string;
  /** The modal picker's headline while nothing is selected, in the calendar */
  noDateSelected: string;
  /** The modal picker's headline while nothing is entered, in the text input */
  noDateEntered: string;
  /** The label of the modal picker's text field */
  fieldLabel: string;
  cancel: string;
  ok: string;
  clear: string;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  /** Names the button that lists the months; `{month}` is the month shown */
  chooseMonth: string;
  /** Names the button that lists the years; `{year}` is the year shown */
  chooseYear: string;
  switchToInput: string;
  switchToCalendar: string;
  /** Names the button that opens the calendar from a field */
  openCalendar: string;
  /** The letters a date format is written with, such as MM/DD/YYYY */
  formatYear: string;
  formatMonth: string;
  formatDay: string;
  /** Typed text that isn't a date; `{format}` is the format, such as MM/DD/YYYY */
  invalidFormat: string;
  /** A date before `min`; `{min}` is written as the field writes dates */
  beforeMin: string;
  /** A date after `max` */
  afterMax: string;
  /** A date the app made unavailable */
  unavailable: string;
}

/** The time picker's text */
export interface TimePickerMessages {
  /** The dialog's name on the dial */
  selectTime: string;
  /** The dialog's name in the text input */
  enterTime: string;
  /** The hour field's name, and its supporting text in the text input */
  hour: string;
  minute: string;
  /** The dial's hour toggle, with the hour it holds; `{hour}` is the hour as the clock shows it */
  hourToggle: string;
  /** The dial's minute toggle; `{minute}` is the minute */
  minuteToggle: string;
  /** A dial's hour on a 12-hour clock; `{hour}` is the hour */
  dialHour12: string;
  /** A dial's hour on a 24-hour clock */
  dialHour24: string;
  /** A dial's minute; `{minute}` is the minute */
  dialMinute: string;
  /** Names the AM and PM buttons together */
  period: string;
  /** The dialog's mode button on the dial, and in the text input */
  switchToInput: string;
  switchToDial: string;
  cancel: string;
  ok: string;
  /** Typed hours outside 1 to 12, or 0 to 23 */
  invalidHour12: string;
  invalidHour24: string;
  invalidMinute: string;
}

export interface RioMessages {
  datePicker: DatePickerMessages;
  timePicker: TimePickerMessages;
}

const TABLES: Record<string, RioMessages> = { en, ko };

/** The table for a language, or English's when there is none */
export const messagesFor = (locale: string): RioMessages => TABLES[languageOf(locale)] ?? en;

/** Fills in the `{name}` placeholders of a message. */
export const formatMessage = (message: string, values: Record<string, string>) =>
  message.replace(/\{(\w+)\}/g, (all, name: string) => values[name] ?? all);
