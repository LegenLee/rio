// Dates as ISO strings, `YYYY-MM-DD`, the form `<input type="date">` takes, and months as
// `YYYY-MM`, in the Gregorian calendar. The arithmetic goes through `Date` in UTC, so no time zone
// shifts a day. Writing and reading dates the way a language does goes through `Intl`.

import { dateTimeFormat, numberFormat } from '../utils/intl';

export type DatePart = 'year' | 'month' | 'day';

interface Ymd {
  year: number;
  month: number;
  day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (value: number, length: number) => String(value).padStart(length, '0');

/** A real date in `YYYY-MM-DD`, or nothing */
const parse = (iso: string | undefined): Ymd | undefined => {
  const match = iso ? ISO_DATE.exec(iso) : null;
  if (!match) return undefined;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return undefined;
  return { year, month, day };
};

const write = ({ year, month, day }: Ymd) => `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;

const toUtc = ({ year, month, day }: Ymd) => {
  const date = new Date(0);
  // `setUTCFullYear` keeps years below 100 as they are; `Date.UTC` would add 1900.
  date.setUTCFullYear(year, month - 1, day);
  return date;
};
const fromUtc = (date: Date): Ymd => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
});

/** Whether a string is a real date in `YYYY-MM-DD` */
export const isIsoDate = (value: string | undefined): value is string => !!parse(value);

const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const daysInMonth = (year: number, month: number) =>
  month === 2 && isLeap(year) ? 29 : MONTH_DAYS[month - 1]!;

export const addDays = (iso: string, days: number) => {
  const date = toUtc(parse(iso)!);
  date.setUTCDate(date.getUTCDate() + days);
  return write(fromUtc(date));
};

/** Moves by whole months, keeping the day, or the month's last day where it is shorter. */
export const addMonths = (iso: string, months: number) => {
  const { year, month, day } = parse(iso)!;
  const index = year * 12 + (month - 1) + months;
  const next = { year: Math.floor(index / 12), month: (index % 12) + 1 };
  return write({ ...next, day: Math.min(day, daysInMonth(next.year, next.month)) });
};

/** The day of the week, from 1 (Monday) to 7 (Sunday), as `Intl` numbers them */
export const weekday = (iso: string) => toUtc(parse(iso)!).getUTCDay() || 7;

/** The month a date is in, `YYYY-MM` */
export const monthOf = (iso: string) => iso.slice(0, 7);

/** The first day of a month given as `YYYY-MM` */
export const firstOfMonth = (month: string) => `${month}-01`;

/** Today where the person is, in their time zone */
export const today = () => {
  const now = new Date();
  return write({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
};

/** Six weeks of seven days, from the week the month starts in, beginning on `firstDay` */
export const monthGrid = (month: string, firstDay: number): string[][] => {
  const first = firstOfMonth(month);
  const start = addDays(first, -((weekday(first) - firstDay + 7) % 7));
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
};

/** Keeps a date within `min` and `max`, either of which may be missing. */
export const clampDate = (iso: string, min?: string, max?: string) =>
  min && iso < min ? min : max && iso > max ? max : iso;

// Writing and reading dates as a language does

/** Writes a date with `Intl`, in the Gregorian calendar. */
export const formatDate = (iso: string, locale: string, options: Intl.DateTimeFormatOptions) =>
  dateTimeFormat(locale, { ...options, calendar: 'gregory', timeZone: 'UTC' }).format(
    toUtc(parse(iso)!),
  );

/**
 * Writes a number, such as a day or a year, in the language's digits, without grouping and without
 * the words a date format adds, such as 일 in Korean.
 */
export const formatNumber = (value: number, locale: string) =>
  numberFormat(locale, { useGrouping: false }).format(value);

/** How a language writes a date in numbers, such as 11/27/2026 or 27.11.2026 */
export interface DateFormat {
  /** The parts in the order written */
  order: DatePart[];
  /** The text before the first part, between the parts, and after the last */
  literals: [string, string, string, string];
}

// Marks that only steer the direction of the text
const BIDI_MARKS = /[\u200E\u200F\u061C]/g;

/** The numeric date format of a language, from `Intl`, with Latin digits */
export function dateFormat(locale: string): DateFormat {
  const parts = dateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  }).formatToParts(new Date(Date.UTC(2026, 10, 27)));
  const order: DatePart[] = [];
  const literals: [string, string, string, string] = ['', '', '', ''];
  for (const part of parts) {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') order.push(part.type);
    else if (part.type === 'literal') literals[order.length] += part.value.replace(BIDI_MARKS, '');
  }
  return order.length === 3
    ? { order, literals }
    : { order: ['year', 'month', 'day'], literals: ['', '-', '-', ''] };
}

/** Writes a date in a numeric format, such as 11/27/2026. */
export const writeDate = (iso: string, format: DateFormat) => {
  const date = parse(iso)!;
  const text = { year: pad(date.year, 4), month: pad(date.month, 2), day: pad(date.day, 2) };
  return format.literals
    .map((literal, index) => literal + (format.order[index] ? text[format.order[index]!] : ''))
    .join('');
};

/** The format as letters, such as MM/DD/YYYY, for a hint */
export const writePattern = (format: DateFormat, letters: Record<DatePart, string>) =>
  format.literals
    .map((literal, index) => literal + (format.order[index] ? letters[format.order[index]!] : ''))
    .join('')
    .trim();

/**
 * Reads a typed date, or nothing if it isn't one. It takes any separators (slashes, dashes, dots,
 * spaces) and leaves out leading zeros, in the format's order, and a four-digit year first in
 * year-month-day order whatever the format, as in 2026-11-27.
 */
export function readDate(text: string, format: DateFormat): string | undefined {
  const numbers = text.match(/\d+/g);
  if (!numbers || numbers.length !== 3) return undefined;
  const order: DatePart[] = numbers[0]!.length === 4 ? ['year', 'month', 'day'] : format.order;
  const value = { year: 0, month: 0, day: 0 };
  for (const [index, part] of order.entries()) {
    const digits = numbers[index]!;
    if (part === 'year' ? digits.length !== 4 : digits.length > 2) return undefined;
    value[part] = Number(digits);
  }
  const iso = write(value);
  return isIsoDate(iso) ? iso : undefined;
}
