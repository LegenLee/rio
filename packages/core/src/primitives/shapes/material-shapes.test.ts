// The shapes themselves are checked against the original in goldens.test.ts.

import { describe, expect, test } from 'vitest';
import { MATERIAL_SHAPES, materialShape, type MaterialShapeName } from './material-shapes';
import { polygonBounds } from './polygon';
import { assertEqualish } from './test-utils';

describe('materialShape', () => {
  test('has the 35 shapes of the library, each named once', () => {
    expect(MATERIAL_SHAPES).toHaveLength(35);
    expect(new Set(MATERIAL_SHAPES).size).toBe(35);
  });

  test.each(MATERIAL_SHAPES)('%s fills the unit square along its longer side', (name) => {
    const { left, top, right, bottom } = polygonBounds(materialShape(name));
    expect(left).toBeGreaterThanOrEqual(-1e-9);
    expect(top).toBeGreaterThanOrEqual(-1e-9);
    expect(right).toBeLessThanOrEqual(1 + 1e-9);
    expect(bottom).toBeLessThanOrEqual(1 + 1e-9);
    assertEqualish(1, Math.max(right - left, bottom - top));
  });

  test('builds each shape once, and freezes it', () => {
    const heart = materialShape('heart');
    expect(materialShape('heart')).toBe(heart);
    expect(Object.isFrozen(heart.features)).toBe(true);
    expect(Object.isFrozen(heart.cubics[0])).toBe(true);
  });

  test.each(['hexagon', 'constructor', 'toString'])(
    'throws for %j, which it has no shape for',
    (name) => {
      expect(() => materialShape(name as MaterialShapeName)).toThrow('Unknown Material shape');
    },
  );
});
