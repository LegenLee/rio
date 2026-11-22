import { describe, expect, test } from 'vitest';
import { parsePx } from './css';

describe('parsePx', () => {
  test('a length in px, as a computed value reads', () => {
    expect(parsePx('16px')).toBe(16);
    expect(parsePx(' 2.5px')).toBe(2.5);
    expect(parsePx('-3px')).toBe(-3);
  });

  test('0px is a length, not a missing value', () => {
    expect(parsePx('0px', 4)).toBe(0);
  });

  test('an unset custom property, or a value that isn’t a number, is the fallback', () => {
    expect(parsePx('')).toBe(0);
    expect(parsePx('', 40)).toBe(40);
    expect(parsePx('auto', 15)).toBe(15);
  });
});
