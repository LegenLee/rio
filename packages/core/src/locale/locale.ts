// The language Rio's components speak, and what follows from it through `Intl`: the first day of
// the week, and how dates are written.
//
// - The app names the language (an adapter's provider, or a component's `locale` prop). Without
//   that, the document's `lang`, then the browser's language, then English. A server renders in
//   English unless the app names the language.
// - Text the components show comes from the message tables (`messages.ts`), by the language's
//   first subtag, with English for a language without a table.
// - Dates are Gregorian, and numbers typed or shown in fields use Latin digits.

/**
 * The language Rio uses: the one given, or the document's, or the browser's, or English. On a
 * server, without a document, `navigator` is the server's and not the visitor's, so it is English
 * unless given.
 */
export function resolveLocale(locale?: string): string {
  const browser = typeof document !== 'undefined';
  const candidates = [
    locale,
    browser ? document.documentElement.lang : undefined,
    browser && typeof navigator !== 'undefined' ? navigator.language : undefined,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return Intl.getCanonicalLocales(candidate)[0] ?? 'en';
    } catch {
      // Not a language tag: the next one.
    }
  }
  return 'en';
}

/** A language tag's language, such as `ko` for `ko-KR` */
export const languageOf = (locale: string) => locale.split('-')[0]!.toLowerCase();

/** Regions whose week starts on Sunday or Saturday, from CLDR's week data. The rest start on Monday. */
const SUNDAY_FIRST = new Set(
  'AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(
    ' ',
  ),
);
const SATURDAY_FIRST = new Set('AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '));

interface WeekInfo {
  firstDay: number;
}

/**
 * The first day of the week where the language is spoken, from 1 (Monday) to 7 (Sunday), as
 * `Intl.Locale.prototype.getWeekInfo()` gives it. Browsers without it fall back to the older
 * `weekInfo` getter, then to CLDR's table for the language's likely region.
 */
export function firstDayOfWeek(locale: string): number {
  try {
    const intl = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => WeekInfo;
      weekInfo?: WeekInfo;
    };
    const info = intl.getWeekInfo?.() ?? intl.weekInfo;
    if (info?.firstDay) return info.firstDay;
    const region = intl.maximize().region ?? '';
    if (SUNDAY_FIRST.has(region)) return 7;
    if (SATURDAY_FIRST.has(region)) return 6;
  } catch {
    // Not a language tag: Monday, as for most of the world.
  }
  return 1;
}
