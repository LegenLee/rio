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
  /** The dialog's name on the dial or the scroll fields */
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
  /** The mode button on the dial or the scroll fields, and in the text input, back to either */
  switchToInput: string;
  switchToDial: string;
  switchToScroll: string;
  cancel: string;
  ok: string;
  /** Typed hours outside 1 to 12, or 0 to 23 */
  invalidHour12: string;
  invalidHour24: string;
  invalidMinute: string;
}

/** An input chip's remove button. `{label}` stands for the chip's label. */
export interface ChipMessages {
  remove: string;
}

/** The range slider's inputs, as assistive technology names them inside the app's group. */
export interface SliderMessages {
  rangeStart: string;
  rangeEnd: string;
}

export interface RioMessages {
  chip: ChipMessages;
  datePicker: DatePickerMessages;
  slider: SliderMessages;
  timePicker: TimePickerMessages;
}

const TABLES: Record<string, RioMessages> = { en, ko };

/** Any of the messages, as an app gives them for one language */
export type PartialMessages = { [Group in keyof RioMessages]?: Partial<RioMessages[Group]> };

export interface MessageOptions {
  /**
   * The app's tables, by language tag (`ja`, `en-GB`): languages Rio has no table for, or messages
   * that replace Rio's. A tag with a region, such as `en-GB`, goes over its language's table.
   */
  messages?: Record<string, PartialMessages>;
  /**
   * For a language Rio has no table for, the language whose messages stand in for those the app's
   * tables leave out. Defaults to English.
   */
  fallbackLocale?: string;
}

const canonical = (tag: string) => {
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? tag;
  } catch {
    return tag;
  }
};

/** The tables for a language, the later ones going over the earlier: Rio's, then the app's */
function tablesFor(locale: string, apps: MessageOptions['messages'] = {}): PartialMessages[] {
  const tag = canonical(locale);
  const language = languageOf(tag);
  const app = (wanted: string) =>
    Object.entries(apps).find(([key]) => canonical(key) === wanted)?.[1];
  return [TABLES[language], app(language), tag === language ? undefined : app(tag)].filter(
    (table) => table !== undefined,
  );
}

/**
 * The messages for a language: Rio's table, with the app's over it. A language Rio has no table
 * for takes what the app's tables leave out from the fallback language, then from English, so
 * every message has a text.
 */
export function messagesFor(locale: string, options: MessageOptions = {}): RioMessages {
  // Rio's own tables have every message, so only a language without one needs the fallback's.
  const under = TABLES[languageOf(canonical(locale))]
    ? []
    : tablesFor(options.fallbackLocale ?? 'en', options.messages);
  const tables = [...under, ...tablesFor(locale, options.messages)];
  const last = tables.at(-1);
  if (!last) return en;
  if (tables.length === 1 && Object.values(TABLES).includes(last as RioMessages)) {
    return last as RioMessages;
  }
  const merged = structuredClone(en);
  for (const table of tables) {
    for (const group of Object.keys(merged) as (keyof RioMessages)[]) {
      // A message given as undefined leaves the one under it.
      const given = Object.entries(table[group] ?? {}).filter(
        ([, message]) => message !== undefined,
      );
      Object.assign(merged[group], Object.fromEntries(given));
    }
  }
  return merged;
}

/** Fills in the `{name}` placeholders of a message. */
export const formatMessage = (message: string, values: Record<string, string>) =>
  message.replace(/\{(\w+)\}/g, (all, name: string) => values[name] ?? all);
