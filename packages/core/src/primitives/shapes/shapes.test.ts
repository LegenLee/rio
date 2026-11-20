// Ported from androidx graphics-shapes, commonTest's ShapesTest.kt, at androidx 079e2e3. Copyright
// 2022 The Android Open Source Project, licensed under the Apache License, Version 2.0. Changed:
// ported to TypeScript and Vitest.

import { describe, expect, test } from 'vitest';
import type { CornerRounding } from './corner-rounding';
import { pointOnCurve, type Cubic } from './cubic';
import { Point } from './point';
import { circlePolygon, starPolygon } from './shapes';
import { assertInBounds } from './test-utils';

const ZERO = new Point(0, 0);
const EPSILON = 0.01;

const distance = (start: Point, end: Point) => end.minus(start).getDistance();

/** The point is `radius1` or `radius2` from `center`. */
function assertPointOnRadii(point: Point, radius1: number, radius2 = radius1, center = ZERO) {
  const dist = distance(center, point);
  expect(
    Math.abs(dist - radius1) < EPSILON || Math.abs(dist - radius2) < EPSILON,
    `${dist} from the center, not ${radius1} or ${radius2}`,
  ).toBe(true);
}

function assertCubicOnRadii(cubic: Cubic, radius1: number, radius2 = radius1, center = ZERO) {
  assertPointOnRadii(new Point(cubic[0], cubic[1]), radius1, radius2, center);
  assertPointOnRadii(new Point(cubic[6], cubic[7]), radius1, radius2, center);
}

/**
 * Points along the curve are `radius` from `center`. Lenient, since a circle is only an
 * approximation by cubics.
 */
function assertCircularCubic(cubic: Cubic, radius: number, center: Point) {
  for (let t = 0; t <= 1; t += 0.1) {
    expect(Math.abs(distance(center, pointOnCurve(cubic, t)) - radius)).toBeLessThan(EPSILON);
  }
}

function assertCircleShape(shape: readonly Cubic[], radius = 1, center = ZERO) {
  for (const cubic of shape) assertCircularCubic(cubic, radius, center);
}

describe('circlePolygon', () => {
  test('makes circles', () => {
    expect(() => circlePolygon({ numVertices: 2 })).toThrow();
    assertCircleShape(circlePolygon().cubics);
    assertCircleShape(circlePolygon({ numVertices: 3 }).cubics);
    assertCircleShape(circlePolygon({ numVertices: 20 }).cubics);
    assertCircleShape(circlePolygon({ radius: 3 }).cubics, 3);
    const center = new Point(1, 2);
    assertCircleShape(circlePolygon({ center }).cubics, 1, center);
  });
});

describe('starPolygon', () => {
  /**
   * Stars are complicated. Unrounded, the vertices should be the right distance from the center;
   * rounded, the shape should be within bounds.
   */
  test('places the vertices on the two radii', () => {
    for (const cubic of starPolygon({ numVerticesPerRadius: 4, innerRadius: 0.5 }).cubics) {
      assertCubicOnRadii(cubic, 1, 0.5);
    }
    const center = new Point(1, 2);
    for (const cubic of starPolygon({ numVerticesPerRadius: 4, innerRadius: 0.5, center }).cubics) {
      assertCubicOnRadii(cubic, 1, 0.5, center);
    }
    for (const cubic of starPolygon({ numVerticesPerRadius: 4, radius: 4, innerRadius: 2 })
      .cubics) {
      assertCubicOnRadii(cubic, 4, 2);
    }
  });

  test('keeps rounded stars in bounds', () => {
    const rounding: CornerRounding = { radius: 0.1 };
    const innerRounding: CornerRounding = { radius: 0.2 };
    const perVertexRounding = Array.from({ length: 4 }, () => [rounding, innerRounding]).flat();
    const min = new Point(-1, -1);
    const max = new Point(1, 1);
    for (const star of [
      starPolygon({ numVerticesPerRadius: 4, innerRadius: 0.5, rounding }),
      starPolygon({ numVerticesPerRadius: 4, innerRadius: 0.5, innerRounding }),
      starPolygon({ numVerticesPerRadius: 4, innerRadius: 0.5, rounding, innerRounding }),
      starPolygon({ numVerticesPerRadius: 4, innerRadius: 0.5, perVertexRounding }),
    ]) {
      assertInBounds(star.cubics, min, max);
    }
    expect(() =>
      starPolygon({ numVerticesPerRadius: 6, innerRadius: 0.5, perVertexRounding }),
    ).toThrow();
  });

  test('throws for bad radii', () => {
    expect(() => starPolygon({ numVerticesPerRadius: 4, innerRadius: 0 })).toThrow();
    expect(() => starPolygon({ numVerticesPerRadius: 4, innerRadius: 1 })).toThrow();
  });
});
