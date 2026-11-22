import { describe, expect, test } from 'vitest';
import { progressBarAttrs, progressFraction, progressMax } from './progress';

describe('progress helpers', () => {
  test('the maximum falls back to 1', () => {
    expect(progressMax(4)).toBe(4);
    expect(progressMax(0)).toBe(1);
    expect(progressMax(-2)).toBe(1);
    expect(progressMax(NaN)).toBe(1);
  });

  test('the fraction is clamped, and undefined without a value', () => {
    expect(progressFraction(1, 4)).toBe(0.25);
    expect(progressFraction(9, 4)).toBe(1);
    expect(progressFraction(-1, 4)).toBe(0);
    expect(progressFraction(undefined, 4)).toBeUndefined();
    expect(progressFraction(NaN, 4)).toBeUndefined();
  });

  test('a progress bar has its value only while determinate', () => {
    expect(progressBarAttrs(5, 4)).toEqual({
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': '4',
      'aria-valuenow': '4',
    });
    expect(progressBarAttrs(undefined, 4)['aria-valuenow']).toBeUndefined();
  });
});
