// Ported from androidx graphics-shapes, commonTest's ShapesTest.kt, at androidx 079e2e3. Copyright
// 2022 The Android Open Source Project, licensed under the Apache License, Version 2.0. Changed:
// ported to TypeScript and Vitest; the pill star tests are new.

import { describe, expect, test } from 'vitest';
import type { CornerRounding } from './corner-rounding';
import { pointOnCurve, type Cubic } from './cubic';
import { Point } from './point';
import { circlePolygon, pillStarPolygon, starPolygon } from './shapes';
import { assertEqualish, assertFeaturesEqualish, assertInBounds } from './test-utils';

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

describe('pillStarPolygon', () => {
  // Unrounded, each corner is a single point at its vertex, two features apart.
  const vertex = (polygon: ReturnType<typeof pillStarPolygon>, i: number) =>
    polygon.features[2 * i]!.cubics[0]!;

  // The original misplaces vertices when startLocation is above 0 (see shapes.ts), so these check
  // the port against its own start of 0, which the goldens check against the original.
  const tall = { width: 1, height: 2, innerRadiusRatio: 0.7, vertexSpacing: 0.8 };

  test('a start location an even number of vertices on is the same shape, rotated', () => {
    // 2/6 of the way around 6 vertices is 2 vertices on, where one vertex's t is the perimeter.
    const shifted = pillStarPolygon({ ...tall, numVerticesPerRadius: 3, startLocation: 2 / 6 });
    const reference = pillStarPolygon({ ...tall, numVerticesPerRadius: 3 }).features;
    shifted.features.forEach((feature, i) =>
      assertFeaturesEqualish(reference[(i + 4) % reference.length]!, feature, `feature ${i}`),
    );
  });

  test('a vertex whose t is the perimeter lands where the outline starts', () => {
    // 0.3 of the way around 10 vertices: vertex 7, an inner one, is at t = perimeter.
    const polygon = pillStarPolygon({ ...tall, numVerticesPerRadius: 5, startLocation: 0.3 });
    const [x, y] = vertex(polygon, 7);
    assertEqualish(0.7, x);
    assertEqualish(0, y);
  });

  test('on a wide pill too, where the outline starts past the straight half side', () => {
    // 1/6 of the way around 6 vertices: vertex 5, an inner one, is at t = perimeter. The outline
    // starts at the right end cap, 0.5 (hSegHalf) right of the center plus the inner radius.
    const polygon = pillStarPolygon({
      width: 2,
      height: 1,
      numVerticesPerRadius: 3,
      innerRadiusRatio: 0.7,
      vertexSpacing: 0.8,
      startLocation: 1 / 6,
    });
    const [x, y] = vertex(polygon, 5);
    assertEqualish(1.2, x);
    assertEqualish(0, y);
  });
});
