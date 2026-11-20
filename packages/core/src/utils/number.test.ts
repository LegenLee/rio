import { describe, expect, test } from 'vitest';
import { parseFloatStrict } from './number';

describe('parseFloatStrict', () => {
  test.each([
    ['1', 1],
    ['-10.5555', -10.5555],
    ['+.5', 0.5],
    ['3.', 3],
    [' \t12\n', 12],
    ['0.30000000000000004', 0.30000000000000004],
  ])('reads %j as %d', (text, value) => {
    expect(parseFloatStrict(text)).toBe(value);
  });

  test.each(['', ' ', '.', '-', '-1.45-1.32', '3.41.81', '1 2', 'one'])(
    'throws for %j, as Kotlin does',
    (text) => {
      expect(() => parseFloatStrict(text)).toThrow();
    },
  );
});
