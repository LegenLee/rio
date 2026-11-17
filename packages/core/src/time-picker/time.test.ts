import { describe, expect, test } from 'vitest';
import {
  dayPeriods,
  hour12,
  hour24,
  hourCycleOf,
  isPm,
  isTime,
  parseTime,
  writeTime,
} from './time';

describe('times', () => {
  test('reads HH:MM on a 24-hour clock, and nothing else', () => {
    expect(parseTime('07:05')).toEqual({ hour: 7, minute: 5 });
    expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 });
    for (const text of ['24:00', '12:60', '7:05', '07:5', '07:05:00', '', ' 07:05', undefined]) {
      expect(parseTime(text), String(text)).toBeUndefined();
      expect(isTime(text)).toBe(false);
    }
    expect(isTime('19:30')).toBe(true);
  });

  test('writes two digits each', () => {
    expect(writeTime({ hour: 7, minute: 5 })).toBe('07:05');
    expect(writeTime({ hour: 19, minute: 30 })).toBe('19:30');
  });

  test('12-hour hours and halves of the day', () => {
    expect([0, 1, 11, 12, 13, 23].map(hour12)).toEqual([12, 1, 11, 12, 1, 11]);
    expect([0, 11, 12, 23].map(isPm)).toEqual([false, false, true, true]);
    expect(hour24(12, false)).toBe(0);
    expect(hour24(12, true)).toBe(12);
    expect(hour24(7, false)).toBe(7);
    expect(hour24(7, true)).toBe(19);
  });
});

describe('languages', () => {
  test('the hours a language counts', () => {
    expect(hourCycleOf('en-US')).toBe(12);
    expect(hourCycleOf('ko-KR')).toBe(12);
    expect(hourCycleOf('en-GB')).toBe(24);
    expect(hourCycleOf('de-DE')).toBe(24);
    expect(hourCycleOf('ja-JP')).toBe(24);
    // An extension asks for the other clock.
    expect(hourCycleOf('en-US-u-hc-h23')).toBe(24);
    expect(hourCycleOf('de-DE-u-hc-h12')).toBe(12);
  });

  test('a tag Intl can’t read counts 24 hours', () => {
    expect(hourCycleOf('not a tag')).toBe(24);
  });

  test('how a language says AM and PM', () => {
    expect(dayPeriods('en-US')).toEqual(['AM', 'PM']);
    expect(dayPeriods('ko-KR')).toEqual(['오전', '오후']);
  });
});
