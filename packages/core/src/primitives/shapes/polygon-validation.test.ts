// Ported from androidx graphics-shapes, commonTest's PolygonValidationTest.kt, at androidx
// 079e2e3. Copyright 2024 The Android Open Source Project, licensed under the Apache License,
// Version 2.0. Changed: ported to TypeScript and Vitest.

import { describe, expect, test } from 'vitest';
import { fixPolygon } from './polygon-validation';
import { roundedPolygon, type RoundedPolygon } from './polygon';
import { assertPolygonsEqualish } from './test-utils';

const pentagonPoints = [0.2, 0.0, 0.8, 0.0, 1.0, 0.6, 0.5, 1.0, 0.0, 0.6];
const reverseOrientedPentagonPoints = [0.2, 0.0, 0.0, 0.6, 0.5, 1.0, 1.0, 0.6, 0.8, 0.0];

function staysUnchanged(polygon: RoundedPolygon) {
  const copy = structuredClone(polygon);
  expect(fixPolygon(polygon)).toBe(polygon);
  expect(polygon).toEqual(copy);
}

function fixes(broken: RoundedPolygon, expected: RoundedPolygon) {
  const fixed = fixPolygon(broken);
  expect(fixed).not.toEqual(broken);
  assertPolygonsEqualish(expected, fixed);
}

describe('fixPolygon', () => {
  test("doesn't fix a valid sharp polygon", () =>
    staysUnchanged(roundedPolygon({ numVertices: 5 })));

  test("doesn't fix a valid round polygon", () =>
    staysUnchanged(roundedPolygon({ numVertices: 5, rounding: { radius: 0.5 } })));

  test('fixes an anticlockwise polygon', () => {
    fixes(
      roundedPolygon({ vertices: reverseOrientedPentagonPoints }),
      roundedPolygon({ vertices: pentagonPoints }),
    );
  });

  test('fixes an anticlockwise rounded polygon', () => {
    fixes(
      roundedPolygon({ vertices: reverseOrientedPentagonPoints, rounding: { radius: 0.5 } }),
      roundedPolygon({ vertices: pentagonPoints, rounding: { radius: 0.5 } }),
    );
  });
});
