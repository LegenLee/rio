// Breakpoints: the window widths at which a layout changes, from compact, a phone in portrait, to
// extra-large, a wide desktop window. Widths are in CSS px, 1px for each dp.
//
// CSS can't read these in a media query: `var()` isn't allowed there. Stylesheets write the width
// itself, and a test in `@rio-m3e/styles` checks that each one is a breakpoint's.

/** The breakpoints, narrowest first */
export const BREAKPOINTS = ['compact', 'medium', 'expanded', 'large', 'extra-large'] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

/** Where each breakpoint starts: a window at least this wide, and narrower than the next one */
export const BREAKPOINT_WIDTHS = {
  compact: 0,
  medium: 600,
  expanded: 840,
  large: 1200,
  'extra-large': 1600,
} as const satisfies Record<Breakpoint, number>;

/**
 * The media query for a window at a breakpoint, as `matchMedia` takes it: `'(width < 600px)'` for
 * compact, `'(600px <= width < 840px)'` for medium, `'(width >= 1600px)'` for extra-large.
 */
export function breakpointQuery(breakpoint: Breakpoint): string {
  const start = BREAKPOINT_WIDTHS[breakpoint];
  const next = BREAKPOINTS[BREAKPOINTS.indexOf(breakpoint) + 1];
  if (next === undefined) return `(width >= ${start}px)`;
  const end = BREAKPOINT_WIDTHS[next];
  return start === 0 ? `(width < ${end}px)` : `(${start}px <= width < ${end}px)`;
}
