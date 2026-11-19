import { describe, expect, test } from 'vitest';
import { disabledAttrs, isBlocked } from './disabled';

describe('isBlocked', () => {
  test('disabled or soft-disabled', () => {
    expect(isBlocked({})).toBe(false);
    expect(isBlocked({ disabled: true })).toBe(true);
    expect(isBlocked({ softDisabled: true })).toBe(true);
    expect(isBlocked({ disabled: false, softDisabled: false })).toBe(false);
  });
});

describe('disabledAttrs', () => {
  test('enabled: neither', () => {
    expect(disabledAttrs({})).toEqual({ disabled: undefined, 'aria-disabled': undefined });
  });

  test('disabled: native disabled only', () => {
    expect(disabledAttrs({ disabled: true })).toEqual({
      disabled: '',
      'aria-disabled': undefined,
    });
    expect(disabledAttrs({ disabled: true, softDisabled: true })).toEqual({
      disabled: '',
      'aria-disabled': undefined,
    });
  });

  test('soft-disabled: aria-disabled, and it stays focusable', () => {
    expect(disabledAttrs({ softDisabled: true })).toEqual({
      disabled: undefined,
      'aria-disabled': 'true',
    });
  });
});
