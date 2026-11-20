// Ported from androidx graphics-shapes, commonTest's MorphTest.kt, at androidx 079e2e3. Copyright
// 2024 The Android Open Source Project, licensed under the Apache License, Version 2.0. Changed:
// ported to TypeScript and Vitest; the bounds tests are new.

import { describe, expect, test } from 'vitest';
import { createMorph } from './morph';
import { polygonBounds, polygonMaxBounds, roundedPolygon } from './polygon';
import { cubicsEqualish } from './test-utils';

const poly1 = roundedPolygon({ numVertices: 3, center: { x: 0.5, y: 0.5 } });
const poly2 = roundedPolygon({ numVertices: 4, center: { x: 0.5, y: 0.5 } });

describe('createMorph', () => {
  test('a morph from a shape to itself has its curves', () => {
    // The morph's structure may not match its shapes' exactly, since it can optimize out some
    // zero-length curves, but every curve of the morph should exist somewhere in the shape it is
    // based on. That only holds because the morph goes from and to the same shape.
    const cubics11 = createMorph(poly1, poly1).cubics(0);
    expect(cubics11.length).toBeGreaterThan(0);
    for (const morphCubic of cubics11) {
      expect(poly1.cubics.some((c) => cubicsEqualish(morphCubic, c))).toBe(true);
    }
  });

  test("the bounds cover both shapes'", () => {
    const morph = createMorph(poly1, poly2);
    const b1 = polygonBounds(poly1);
    const b2 = polygonBounds(poly2);
    expect(morph.bounds()).toEqual({
      left: Math.min(b1.left, b2.left),
      top: Math.min(b1.top, b2.top),
      right: Math.max(b1.right, b2.right),
      bottom: Math.max(b1.bottom, b2.bottom),
    });
    const m1 = polygonMaxBounds(poly1);
    const m2 = polygonMaxBounds(poly2);
    expect(morph.maxBounds()).toEqual({
      left: Math.min(m1.left, m2.left),
      top: Math.min(m1.top, m2.top),
      right: Math.max(m1.right, m2.right),
      bottom: Math.max(m1.bottom, m2.bottom),
    });
  });

  test('a closed outline at any progress', () => {
    const morph = createMorph(poly1, poly2);
    for (const progress of [0, 0.3, 0.5, 1, 1.2]) {
      const cubics = morph.cubics(progress);
      const first = cubics[0]!;
      const last = cubics[cubics.length - 1]!;
      expect([last[6], last[7]]).toEqual([first[0], first[1]]);
    }
  });
});
