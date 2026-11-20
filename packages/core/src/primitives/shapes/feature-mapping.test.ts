// Ported from androidx graphics-shapes, commonTest's FeatureMappingTest.kt, at androidx 079e2e3.
// Copyright 2024 The Android Open Source Project, licensed under the Apache License, Version 2.0.
// Changed: ported to TypeScript and Vitest.

import { describe, expect, test } from 'vitest';
import { doMapping, featureDistSquared } from './feature-mapping';
import { normalizePolygon, roundedPolygon, type RoundedPolygon } from './polygon';
import { LengthMeasurer, MeasuredPolygon } from './polygon-measure';
import { starPolygon } from './shapes';
import { assertEqualish } from './test-utils';

const triangleWithRoundings = roundedPolygon({ numVertices: 3, rounding: { radius: 0.2 } });
const triangle = roundedPolygon({ numVertices: 3 });
const square = roundedPolygon({ numVertices: 4 });

function verifyMapping(
  p1: RoundedPolygon,
  p2: RoundedPolygon,
  validator: (distances: number[]) => void,
) {
  const f1 = MeasuredPolygon.measurePolygon(new LengthMeasurer(), p1).features;
  const f2 = MeasuredPolygon.measurePolygon(new LengthMeasurer(), p2).features;

  // Maps progress on p1 to progress on p2
  const map = doMapping(f1, f2);

  // Which features were actually mapped, and the distance between their representative points
  const distances = map.map(([progress1, progress2]) => {
    const feature1 = f1.find((f) => f.progress === progress1)!;
    const feature2 = f2.find((f) => f.progress === progress2)!;
    return featureDistSquared(feature1.feature, feature2.feature);
  });

  validator(distances.sort((a, b) => b - a));
}

describe('doMapping', () => {
  test('maps triangles', () =>
    verifyMapping(triangleWithRoundings, triangle, (distances) => {
      for (const d of distances) expect(d).toBeLessThan(0.1);
    }));

  test('maps a triangle to a square', () =>
    verifyMapping(triangle, square, (distances) => {
      // One exact match (both have points at 0 degrees), and 2 close ones
      expect(distances).toHaveLength(3);
      assertEqualish(distances[0]!, distances[1]!);
      expect(distances[0]).toBeLessThan(0.3);
      expect(distances[2]).toBeLessThan(1e-6);
    }));

  test('maps a square to a triangle', () =>
    verifyMapping(square, triangle, (distances) => {
      // One exact match (both have points at 0 degrees), and 2 close ones
      expect(distances).toHaveLength(3);
      assertEqualish(distances[0]!, distances[1]!);
      expect(distances[0]).toBeLessThan(0.3);
      expect(distances[2]).toBeLessThan(1e-6);
    }));

  test("doesn't crash on complicated shapes", () => {
    // Complicated shapes can be matched (this used to crash).
    const checkmark = normalizePolygon(
      roundedPolygon({
        vertices: [400, -304, 240, -464, 296, -520, 400, -416, 664, -680, 720, -624, 400, -304],
      }),
    );
    const verySunny = normalizePolygon(
      starPolygon({ numVerticesPerRadius: 8, innerRadius: 0.65, rounding: { radius: 0.15 } }),
    );
    verifyMapping(checkmark, verySunny, (distances) => {
      // Most vertices of the checkmark map to a feature of the second shape,
      expect(distances.length).toBeGreaterThanOrEqual(6);
      // and they are close enough.
      expect(distances[0]).toBeLessThan(0.15);
    });
  });
});
