// One `Intl` format for each language and options, kept for the next call: making one takes far
// longer than using it, and components write numbers and dates on every render. A language `Intl`
// doesn't take throws, as `Intl` does, and isn't kept.

const dateTimeFormats = new Map<string, Intl.DateTimeFormat>();
const numberFormats = new Map<string, Intl.NumberFormat>();

const keyOf = (locale: string | undefined, options: object) =>
  `${locale ?? ''} ${JSON.stringify(options)}`;

/** `new Intl.DateTimeFormat(locale, options)`, made once for each */
export function dateTimeFormat(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions = {},
): Intl.DateTimeFormat {
  const key = keyOf(locale, options);
  let format = dateTimeFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    dateTimeFormats.set(key, format);
  }
  return format;
}

/** `new Intl.NumberFormat(locale, options)`, made once for each */
export function numberFormat(
  locale: string | undefined,
  options: Intl.NumberFormatOptions = {},
): Intl.NumberFormat {
  const key = keyOf(locale, options);
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    numberFormats.set(key, format);
  }
  return format;
}
