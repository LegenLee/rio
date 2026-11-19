import { describe, expect, test } from 'vitest';
import { hasModifier } from './keyboard';

const keys = { altKey: false, ctrlKey: false, metaKey: false };

describe('hasModifier', () => {
  test('Alt, Ctrl, or Meta', () => {
    expect(hasModifier(keys)).toBe(false);
    expect(hasModifier({ ...keys, altKey: true })).toBe(true);
    expect(hasModifier({ ...keys, ctrlKey: true })).toBe(true);
    expect(hasModifier({ ...keys, metaKey: true })).toBe(true);
  });

  test('not Shift', () => {
    expect(hasModifier({ ...keys, shiftKey: true } as typeof keys)).toBe(false);
  });
});
