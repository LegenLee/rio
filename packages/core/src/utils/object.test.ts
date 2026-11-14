import { describe, expect, test } from 'vitest';
import { omitUndefined } from './object';

describe('omitUndefined', () => {
  test('drops undefined properties and keeps the other falsy ones', () => {
    expect(omitUndefined({ a: undefined, b: null, c: 0, d: false, e: '' })).toEqual({
      b: null,
      c: 0,
      d: false,
      e: '',
    });
  });

  test('lets defaults show through when spread', () => {
    const defaults = { size: 'small', shape: 'round' };
    expect({ ...defaults, ...omitUndefined({ size: undefined, shape: 'square' }) }).toEqual({
      size: 'small',
      shape: 'square',
    });
  });
});
