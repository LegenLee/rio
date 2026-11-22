import { describe, expect, test } from 'vitest';
import { resolveProps } from './object';

describe('resolveProps', () => {
  const defaults = { size: 'small', shape: 'round', toggle: false };

  test('a prop given wins; one left out or undefined takes the default', () => {
    expect(resolveProps(defaults, { size: 'large', shape: undefined })).toEqual({
      size: 'large',
      shape: 'round',
      toggle: false,
    });
  });

  test('keeps the other falsy values', () => {
    expect(resolveProps({ a: 1, b: 1, c: 1, d: 1 }, { a: null, b: 0, c: false, d: '' })).toEqual({
      a: null,
      b: 0,
      c: false,
      d: '',
    });
  });

  test('keeps the props that have no default, undefined ones left out', () => {
    expect(resolveProps(defaults, { href: '/a', value: undefined })).toEqual({
      ...defaults,
      href: '/a',
    });
  });

  test('changes neither the defaults nor the props', () => {
    const props = { size: undefined };
    resolveProps(defaults, props);
    expect(defaults.size).toBe('small');
    expect(props).toEqual({ size: undefined });
  });
});
