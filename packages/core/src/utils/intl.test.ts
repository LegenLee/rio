import { describe, expect, test } from 'vitest';
import { dateTimeFormat, numberFormat } from './intl';

describe('dateTimeFormat and numberFormat', () => {
  test('one format for each language and options', () => {
    expect(dateTimeFormat('ko', { hour: 'numeric' })).toBe(
      dateTimeFormat('ko', { hour: 'numeric' }),
    );
    expect(dateTimeFormat('ko', { hour: 'numeric' })).not.toBe(
      dateTimeFormat('en', { hour: 'numeric' }),
    );
    expect(dateTimeFormat('ko', { hour: 'numeric' })).not.toBe(
      dateTimeFormat('ko', { day: 'numeric' }),
    );
    expect(numberFormat('ar-EG')).toBe(numberFormat('ar-EG', {}));
    expect(numberFormat('en')).not.toBe(numberFormat('en', { useGrouping: false }));
  });

  test('formats as `Intl` does', () => {
    expect(numberFormat('en').format(12345)).toBe('12,345');
    expect(numberFormat('en', { useGrouping: false }).format(12345)).toBe('12345');
    const date = new Date(Date.UTC(2026, 10, 27));
    expect(dateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(date)).toBe(
      'November',
    );
  });

  test('without a language, the default one', () => {
    expect(numberFormat(undefined).resolvedOptions().locale).toBe(
      new Intl.NumberFormat().resolvedOptions().locale,
    );
  });

  test('a language `Intl` doesn’t take throws, every time', () => {
    expect(() => numberFormat('not a language')).toThrow(RangeError);
    expect(() => numberFormat('not a language')).toThrow(RangeError);
    expect(() => dateTimeFormat('not a language')).toThrow(RangeError);
  });
});
