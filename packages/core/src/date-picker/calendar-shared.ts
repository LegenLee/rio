// What the month calendar and the range calendar share: their limits, their names for days and
// months, and the keys in their grids. Internal: the calendars' APIs carry what adapters need.

import { addDays, addMonths, clampDate, firstOfMonth, formatDate, monthOf } from './date';

/** The months a calendar offers without `min` and `max` */
const DEFAULT_MONTHS = ['1900-01', '2100-12'] as const;

/**
 * The first and the last month a calendar offers: from `min` and `max`, or else from 1900 to 2100,
 * reaching further to take in `dates`, the ones it shows, as a date typed before 1900.
 */
export function monthBounds(
  min: string | undefined,
  max: string | undefined,
  dates: readonly (string | undefined)[],
): [string, string] {
  const months = dates.filter((date): date is string => !!date).map(monthOf);
  const first = [DEFAULT_MONTHS[0], ...months].reduce((a, b) => (b < a ? b : a));
  const last = [DEFAULT_MONTHS[1], ...months].reduce((a, b) => (b > a ? b : a));
  return [min ? monthOf(min) : first, max ? monthOf(max) : last];
}

/** Whether a date is before `min` or after `max` */
export const outOfRange = (date: string, min?: string, max?: string) =>
  (!!min && date < min) || (!!max && date > max);

/** The weekdays in the order shown, 1 (Monday) to 7 (Sunday), from the first day of the week */
export const weekdaysFrom = (first: number) =>
  Array.from({ length: 7 }, (_, index) => ((first - 1 + index) % 7) + 1);

/** A weekday's name, 1 (Monday) to 7 (Sunday) */
export const weekdayName = (day: number, width: 'narrow' | 'long', locale: string) =>
  // 2026-11-16 is a Monday.
  formatDate(addDays('2026-11-16', day - 1), locale, { weekday: width });

/** A day's full name, as "Friday, November 27, 2026" */
export const dayName = (date: string, locale: string) =>
  formatDate(date, locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

/** A month and its year, as "November 2026" */
export const monthYearName = (month: string, locale: string) =>
  formatDate(firstOfMonth(month), locale, { month: 'long', year: 'numeric' });

/**
 * The date a key moves the focus to from `from` in a grid of days, or nothing for a key the grid
 * doesn't take. Arrows move by a day or a week (left and right swap in right-to-left text), Home and
 * End to the month's first and last day, Page Up and Page Down by a month, and with Shift, by a
 * year. The result stays within `min` and `max`.
 */
export function calendarKeyTarget(
  key: string,
  shift: boolean,
  from: string,
  rtl: boolean,
  min?: string,
  max?: string,
): string | undefined {
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
  return target && clampDate(target, min, max);
}
