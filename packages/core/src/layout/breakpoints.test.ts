import { describe, expect, test } from 'vitest';
import { BREAKPOINT_WIDTHS, BREAKPOINTS, breakpointQuery } from './breakpoints';

describe('breakpoints', () => {
  test("the spec's widths: compact under 600, medium 600–839, expanded 840–1199, large 1200–1599, extra-large 1600 and up", () => {
    expect(BREAKPOINTS.map((each) => BREAKPOINT_WIDTHS[each])).toEqual([0, 600, 840, 1200, 1600]);
  });

  test('a media query for each, which together cover every width once', () => {
    expect(BREAKPOINTS.map(breakpointQuery)).toEqual([
      '(width < 600px)',
      '(600px <= width < 840px)',
      '(840px <= width < 1200px)',
      '(1200px <= width < 1600px)',
      '(width >= 1600px)',
    ]);
  });
});
