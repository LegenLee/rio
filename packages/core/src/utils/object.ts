/**
 * A copy without the properties that are explicitly `undefined`, so spreading it over defaults
 * keeps the defaults: `{ ...defaults, ...omitUndefined(props) }`.
 */
export function omitUndefined<T extends object>(object: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
