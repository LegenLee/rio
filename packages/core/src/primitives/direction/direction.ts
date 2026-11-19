// The direction an element lays out in, for the behaviors that mirror right to left: the arrow
// keys, a press's place along a track, a floating element's side.

/**
 * Whether `element` lays out right to left: its computed `direction`, from `dir` on it or an
 * element around it, or from the stylesheet.
 */
export function isRtl(element: Element): boolean {
  return getComputedStyle(element).direction === 'rtl';
}
