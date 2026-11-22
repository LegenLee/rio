/**
 * A computed length in px as a number, as `getPropertyValue` returns one: `'16px'` is 16.
 * A value that isn't a number, as a custom property the stylesheet doesn't set (`''`), is
 * `fallback`.
 */
export function parsePx(value: string, fallback = 0): number {
  const px = parseFloat(value);
  return Number.isFinite(px) ? px : fallback;
}
