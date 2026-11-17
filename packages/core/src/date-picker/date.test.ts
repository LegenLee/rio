import { describe, expect, test } from 'vitest';
import {
  addDays,
  addMonths,
  clampDate,
  daysInMonth,
  dateFormat,
  formatDate,
  isIsoDate,
  monthGrid,
  readDate,
  weekday,
  writeDate,
  writePattern,
} from './date';

const LETTERS = { year: 'YYYY', month: 'MM', day: 'DD' } as const;

describe('ISO dates', () => {
  test('only real dates in YYYY-MM-DD count', () => {
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-1-01')).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });

  test('days in a month, leap years included', () => {
    expect([daysInMonth(2024, 2), daysInMonth(2100, 2), daysInMonth(2000, 2)]).toEqual([
      29, 28, 29,
    ]);
    expect(daysInMonth(2026, 11)).toBe(30);
  });

  test('adding days and months crosses months and years, and keeps the day where it can', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-03-15', -14)).toBe('2025-01-15');
    // Years below 100 stay as they are.
    expect(addDays('0099-12-31', 1)).toBe('0100-01-01');
  });

  test('weekdays run from 1 (Monday) to 7 (Sunday)', () => {
    expect(weekday('2026-11-16')).toBe(1);
    expect(weekday('2026-11-22')).toBe(7);
  });

  test('a month grid is six weeks from the week it starts in', () => {
    const sunday = monthGrid('2026-11', 7);
    expect(sunday).toHaveLength(6);
    expect(sunday[0]![0]).toBe('2026-11-01');
    const monday = monthGrid('2026-11', 1);
    expect(monday[0]![0]).toBe('2026-10-26');
    expect(monday[5]![6]).toBe('2026-12-06');
  });

  test('clamping keeps a date within the limits given', () => {
    expect(clampDate('2026-01-01', '2026-02-01')).toBe('2026-02-01');
    expect(clampDate('2026-03-01', undefined, '2026-02-01')).toBe('2026-02-01');
    expect(clampDate('2026-01-15')).toBe('2026-01-15');
  });
});

describe('dates as a language writes them', () => {
  test.each([
    ['en-US', '11/27/2026', 'MM/DD/YYYY'],
    ['en-GB', '27/11/2026', 'DD/MM/YYYY'],
    ['de-DE', '27.11.2026', 'DD.MM.YYYY'],
    ['ko-KR', '2026. 11. 27.', 'YYYY. MM. DD.'],
    ['ja-JP', '2026/11/27', 'YYYY/MM/DD'],
  ])('%s writes %s', (locale, written, pattern) => {
    const format = dateFormat(locale);
    expect(writeDate('2026-11-27', format)).toBe(written);
    expect(writePattern(format, LETTERS)).toBe(pattern);
    expect(readDate(written, format)).toBe('2026-11-27');
  });

  test('Latin digits, without direction marks, in Arabic', () => {
    expect(writeDate('2026-11-27', dateFormat('ar-EG'))).toBe('27/11/2026');
  });

  test('reading takes any separators and leaves out leading zeros', () => {
    const us = dateFormat('en-US');
    for (const text of ['11/27/2026', '11-27-2026', '11.27.2026', '11 27 2026', ' 1/2/2026 ']) {
      expect(readDate(text, us)).toMatch(/^2026-/);
    }
    expect(readDate('1/2/2026', us)).toBe('2026-01-02');
    // A four-digit year first reads as year-month-day, whatever the format.
    expect(readDate('2026-01-02', dateFormat('de-DE'))).toBe('2026-01-02');
  });

  test('reading turns down what isn’t a real date', () => {
    const us = dateFormat('en-US');
    for (const text of [
      '',
      '11/27',
      '13/01/2026',
      '02/30/2026',
      '11/27/26',
      '111/27/2026',
      'soon',
    ]) {
      expect(readDate(text, us)).toBeUndefined();
    }
  });

  test('formatDate writes with Intl, in the Gregorian calendar, whatever the time zone', () => {
    expect(
      formatDate('2026-11-27', 'en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    ).toBe('Friday, November 27');
    expect(formatDate('2026-11-27', 'th-TH', { year: 'numeric' })).toBe('2026');
  });
});
