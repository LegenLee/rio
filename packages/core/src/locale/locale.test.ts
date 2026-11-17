import { afterEach, describe, expect, test, vi } from 'vitest';
import { firstDayOfWeek, languageOf, resolveLocale } from './locale';
import { formatMessage, messagesFor } from './messages';

describe('resolveLocale', () => {
  afterEach(() => vi.unstubAllGlobals());

  test('the one given, canonicalized', () => {
    expect(resolveLocale('ko-kr')).toBe('ko-KR');
  });

  test('then the document’s lang, then the browser’s language, then English', () => {
    vi.stubGlobal('document', { documentElement: { lang: 'de' } });
    vi.stubGlobal('navigator', { language: 'fr-FR' });
    expect(resolveLocale()).toBe('de');
    vi.stubGlobal('document', { documentElement: { lang: '' } });
    expect(resolveLocale()).toBe('fr-FR');
    vi.stubGlobal('navigator', { language: '' });
    expect(resolveLocale()).toBe('en');
  });

  test('on a server, without a document, English: its navigator is the server’s', () => {
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('navigator', { language: 'ko-KR' });
    expect(resolveLocale()).toBe('en');
    expect(resolveLocale('de')).toBe('de');
  });

  test('skips what isn’t a language tag', () => {
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('navigator', undefined);
    expect(resolveLocale('not a tag!')).toBe('en');
  });
});

describe('firstDayOfWeek', () => {
  test.each([
    ['en-US', 7],
    ['ko-KR', 7],
    ['de-DE', 1],
    ['en-GB', 1],
  ])('%s starts the week on %i', (locale, day) => {
    expect(firstDayOfWeek(locale)).toBe(day);
  });

  test('without Intl’s week info, from the likely region', () => {
    const original = Intl.Locale.prototype;
    const getWeekInfo = Object.getOwnPropertyDescriptor(original, 'getWeekInfo');
    const weekInfo = Object.getOwnPropertyDescriptor(original, 'weekInfo');
    // oxlint-disable-next-line typescript/no-explicit-any
    delete (original as any).getWeekInfo;
    // oxlint-disable-next-line typescript/no-explicit-any
    delete (original as any).weekInfo;
    try {
      expect([firstDayOfWeek('ko'), firstDayOfWeek('fr'), firstDayOfWeek('ar-EG')]).toEqual([
        7, 1, 6,
      ]);
    } finally {
      if (getWeekInfo) Object.defineProperty(original, 'getWeekInfo', getWeekInfo);
      if (weekInfo) Object.defineProperty(original, 'weekInfo', weekInfo);
    }
  });
});

describe('messages', () => {
  test('by the language’s first subtag, with English for a language without a table', () => {
    expect(languageOf('ko-KR')).toBe('ko');
    expect(messagesFor('ko-KR').datePicker.cancel).toBe('취소');
    expect(messagesFor('sw').datePicker.cancel).toBe('Cancel');
  });

  test('every language has every message', () => {
    const keys = (locale: string) =>
      Object.entries(messagesFor(locale)).flatMap(([group, messages]) =>
        Object.keys(messages).map((key) => `${group}.${key}`),
      );
    expect(keys('ko').sort()).toEqual(keys('en').sort());
  });

  test('placeholders are filled in, and unknown ones left', () => {
    expect(formatMessage('Choose {min} or {other}', { min: '1/2/2026' })).toBe(
      'Choose 1/2/2026 or {other}',
    );
  });
});
