// Ported from androidx graphics-shapes, commonTest's RoundedPolygonTest.kt and PolygonTest.kt, at
// androidx 079e2e3. Copyright 2022 The Android Open Source Project, licensed under the Apache
// License, Version 2.0. Changed: ported to TypeScript and Vitest; the copy constructor has no
// counterpart, since polygons are immutable data.

import { describe, expect, test } from 'vitest';
import type { CornerRounding } from './corner-rounding';
import { emptyCubic, straightCubic, zeroLength, type Cubic } from './cubic';
import { corner, edgeFeature, type EdgeFeature } from './features';
import { Point } from './point';
import {
  calculateBounds,
  calculateMaxBounds,
  polygonBounds,
  polygonFromFeatures,
  polygonMaxBounds,
  roundedPolygon,
  transformPolygon,
} from './polygon';
import {
  circlePolygon,
  pillPolygon,
  pillStarPolygon,
  rectanglePolygon,
  starPolygon,
} from './shapes';
import {
  assertCubicListsEqualish,
  assertCubicsEqualish,
  assertEqualish,
  assertInBounds,
  assertPointsEqualish,
  assertPolygonsEqualish,
  identityTransform,
  scaleTransform,
  translateTransform,
} from './test-utils';

const rounding: CornerRounding = { radius: 0.1 };
const perVtxRounded = [rounding, rounding, rounding, rounding];

const pointsToNumbers = (points: Point[]) => points.flatMap((p) => [p.x, p.y]);

describe('roundedPolygon', () => {
  test('from a number of vertices', () => {
    expect(() => roundedPolygon({ numVertices: 2 })).toThrow();

    const min = new Point(-1, -1);
    const max = new Point(1, 1);
    assertInBounds(roundedPolygon({ numVertices: 4 }).cubics, min, max);
    assertInBounds(
      roundedPolygon({ numVertices: 4, radius: 2 }).cubics,
      min.times(2),
      max.times(2),
    );
    assertInBounds(roundedPolygon({ numVertices: 4, rounding }).cubics, min, max);
    assertInBounds(
      roundedPolygon({ numVertices: 4, perVertexRounding: perVtxRounded }).cubics,
      min,
      max,
    );
    assertInBounds(
      roundedPolygon({ numVertices: 4, center: { x: 1, y: 2 } }).cubics,
      new Point(0, 1),
      new Point(2, 3),
    );
  });

  test('from vertices', () => {
    const p0 = new Point(1, 0);
    const p1 = new Point(0, 1);
    const p2 = new Point(-1, 0);
    const p3 = new Point(0, -1);
    const verts = pointsToNumbers([p0, p1, p2, p3]);

    expect(() => roundedPolygon({ vertices: pointsToNumbers([p0, p1]) })).toThrow();

    const min = new Point(-1, -1);
    const max = new Point(1, 1);
    assertInBounds(roundedPolygon({ vertices: verts }).cubics, min, max);

    const offset = new Point(1, 2);
    const offsetVerts = pointsToNumbers([p0, p1, p2, p3].map((p) => p.plus(offset)));
    assertInBounds(
      roundedPolygon({ vertices: offsetVerts, center: offset }).cubics,
      new Point(0, 1),
      new Point(2, 3),
    );
    assertInBounds(roundedPolygon({ vertices: verts, rounding }).cubics, min, max);
    assertInBounds(
      roundedPolygon({ vertices: verts, perVertexRounding: perVtxRounded }).cubics,
      min,
      max,
    );
  });

  test('computes the center', () => {
    const polygon = roundedPolygon({ vertices: [0, 0, 1, 0, 0, 1, 1, 1] });
    assertEqualish(0.5, polygon.center.x);
    assertEqualish(0.5, polygon.center.y);
  });

  test('centers a regular polygon on (0, 0)', () => {
    assertPointsEqualish(new Point(0, 0), roundedPolygon({ numVertices: 4 }).center);
  });

  test('uses only the room there is for rounding', () => {
    const polygon = roundedPolygon({
      vertices: pointsToNumbers([new Point(0, 0), new Point(1, 0), new Point(0.5, 1)]),
      perVertexRounding: [{ radius: 1, smoothing: 0 }, { radius: 1, smoothing: 1 }, {}],
    });

    // There isn't enough room on the p0 -> p1 side even for the roundings, so smoothing doesn't
    // count, and the corners end in the middle.
    const lowerEdgeFeature = polygon.features.find((f) => f.type === 'edge')!;
    expect(lowerEdgeFeature.cubics).toHaveLength(1);
    const lowerEdge = lowerEdgeFeature.cubics[0]!;
    assertEqualish(0.5, lowerEdge[0]);
    assertEqualish(0.0, lowerEdge[1]);
    assertEqualish(0.5, lowerEdge[6]);
    assertEqualish(0.0, lowerEdge[7]);
  });

  /*
   * The uneven smoothing tests check how much was cut for the top left (vertex 0) and bottom left
   * corner (vertex 3), which compete for space on the left side.
   *
   *   Vertex 0            Vertex 1
   *      *---------------------*
   *      |                     |
   *      *---------------------*
   *   Vertex 3            Vertex 2
   */
  const steps = 20;

  function doUnevenSmoothTest(
    // Corner rounding for vertex 0 (top left)
    rounding0: CornerRounding,
    expectedV0SX: number, // Expected total cut from vertex 0 towards vertex 1
    expectedV0SY: number, // Expected total cut from vertex 0 towards vertex 3
    expectedV3SY: number, // Expected total cut from vertex 3 towards vertex 0
    // Corner rounding for vertex 3 (bottom left)
    rounding3: CornerRounding = { radius: 0.5 },
  ) {
    const polygon = roundedPolygon({
      vertices: pointsToNumbers([
        new Point(0, 0),
        new Point(5, 0),
        new Point(5, 1),
        new Point(0, 1),
      ]),
      perVertexRounding: [rounding0, {}, {}, rounding3],
    });
    const edges = polygon.features.filter((f): f is EdgeFeature => f.type === 'edge');
    const e01 = edges[0]!;
    const e30 = edges[3]!;
    const message = `r0 = ${JSON.stringify(rounding0)}, r3 = ${JSON.stringify(rounding3)}`;
    assertEqualish(expectedV0SX, e01.cubics[0]![0], message);
    assertEqualish(expectedV0SY, e30.cubics[0]![7], message);
    assertEqualish(expectedV3SY, 1 - e30.cubics[0]![1], message);
  }

  test('uneven smoothing', () => {
    // Vertex 3 has the default 0.5 radius, 0 smoothing. Vertex 0 has 0.4 radius, and smoothing
    // varying from 0 to 1.
    for (let i = 0; i <= steps; i++) {
      const smooth = i / steps;
      doUnevenSmoothTest(
        { radius: 0.4, smoothing: smooth },
        0.4 * (1 + smooth),
        Math.min(0.4 * (1 + smooth), 0.5),
        0.5,
      );
    }
  });

  test('uneven smoothing 2', () => {
    // Vertex 3 has 0.2 radius and 0.2 smoothing, so it takes at most 0.4. Vertex 0 has 0.4 radius
    // and smoothing varying from 0 to 1; from 0.5 it competes with vertex 3 for space.
    for (let i = 0; i <= steps; i++) {
      const smooth = i / steps;
      const smoothWantedV0 = 0.4 * smooth;
      const smoothWantedV3 = 0.2;
      // There is 0.4 room for smoothing
      const factor = Math.min(0.4 / (smoothWantedV0 + smoothWantedV3), 1);
      doUnevenSmoothTest(
        { radius: 0.4, smoothing: smooth },
        0.4 * (1 + smooth),
        0.4 + factor * smoothWantedV0,
        0.2 + factor * smoothWantedV3,
        { radius: 0.2, smoothing: 1 },
      );
    }
  });

  test('uneven smoothing 3', () => {
    // Vertex 3 has 0.6 radius. Vertex 0 has 0.4 radius and smoothing varying from 0 to 1. There's
    // no room for smoothing on the side between them, but vertex 0 can still smooth along the top.
    for (let i = 0; i <= steps; i++) {
      const smooth = i / steps;
      doUnevenSmoothTest({ radius: 0.4, smoothing: smooth }, 0.4 * (1 + smooth), 0.4, 0.6, {
        radius: 0.6,
      });
    }
  });

  test('a full-size shape scales down to the canonical one', () => {
    const radius = 400;
    const innerRadiusFactor = 0.35;
    const roundingFactor = 0.32;
    const fullSizeShape = transformPolygon(
      starPolygon({
        numVerticesPerRadius: 4,
        radius,
        innerRadius: radius * innerRadiusFactor,
        rounding: { radius: radius * roundingFactor },
        innerRounding: { radius: radius * roundingFactor },
        center: { x: radius, y: radius },
      }),
      (x, y) => [(x - radius) / radius, (y - radius) / radius],
    );
    const canonicalShape = starPolygon({
      numVerticesPerRadius: 4,
      radius: 1,
      innerRadius: innerRadiusFactor,
      rounding: { radius: roundingFactor },
      innerRounding: { radius: roundingFactor },
    });
    assertCubicListsEqualish(canonicalShape.cubics, fullSizeShape.cubics);
  });

  test('an empty polygon has one cubic, of zero length', () => {
    const polygon = roundedPolygon({ numVertices: 6, radius: 0, rounding: { radius: 0.1 } });
    expect(polygon.cubics).toHaveLength(1);
    const stillEmpty = transformPolygon(polygon, scaleTransform(10, 20));
    expect(stillEmpty.cubics).toHaveLength(1);
    expect(zeroLength(stillEmpty.cubics[0]!)).toBe(true);
  });

  test('a repeated vertex is like a missing side', () => {
    const polygon1 = roundedPolygon({ vertices: [0, 0, 1, 0, 1, 0, 0, 1] }); // one point repeated
    const polygon2 = roundedPolygon({ vertices: [0, 0, 1, 0, 0, 1] });
    assertCubicListsEqualish(polygon1.cubics, polygon2.cubics);
  });

  test("the cubics are the features' nonzero cubics", () => {
    const square = roundedPolygon({ numVertices: 4 });
    // Equalish, since the conversion from the features' cubics may adjust some points
    const nonzeroCubics = square.features.flatMap((f) => f.cubics).filter((c) => !zeroLength(c));
    assertCubicListsEqualish(square.cubics, nonzeroCubics);
  });
});

describe('polygonFromFeatures', () => {
  test('throws for too few features', () => {
    expect(() => polygonFromFeatures([])).toThrow();
    expect(() => polygonFromFeatures([corner([emptyCubic(0, 0)])])).toThrow();
  });

  test('throws for non-continuous features', () => {
    const cubic1 = straightCubic(0, 0, 1, 0);
    const cubic2 = straightCubic(10, 10, 20, 20);
    expect(() => polygonFromFeatures([edgeFeature(cubic1), edgeFeature(cubic2)])).toThrow();
  });

  test.each([
    ['a square', rectanglePolygon()],
    ['a rounded square', rectanglePolygon({ rounding: { radius: 0.5, smoothing: 0.2 } })],
    ['a pill', pillPolygon()],
    ['a pill star', pillStarPolygon({ rounding: { radius: 0.5, smoothing: 0.2 } })],
  ])('reconstructs %s', (_, base) => {
    assertPolygonsEqualish(base, polygonFromFeatures(base.features));
  });

  test('reconstructs circles and stars', () => {
    for (let i = 3; i <= 20; i++) {
      for (const base of [
        circlePolygon({ numVertices: i }),
        starPolygon({ numVerticesPerRadius: i }),
        starPolygon({ numVerticesPerRadius: i, rounding: { radius: 0.5, smoothing: 0.2 } }),
      ]) {
        assertPolygonsEqualish(base, polygonFromFeatures(base.features), `${i} vertices`);
      }
    }
  });
});

describe('bounds', () => {
  const square = roundedPolygon({ numVertices: 4 });
  const roundedSquare = roundedPolygon({ numVertices: 4, rounding: { radius: 0.2 } });
  const pentagon = roundedPolygon({ numVertices: 5 });

  test('of a square', () => {
    for (const bounds of [polygonBounds(square), polygonBounds(square, { approximate: false })]) {
      assertEqualish(-1, bounds.left);
      assertEqualish(-1, bounds.top);
      assertEqualish(1, bounds.right);
      assertEqualish(1, bounds.bottom);
    }
  });

  test('approximate bounds are larger, from the control points', () => {
    const bounds = calculateBounds(roundedSquare);
    const betterBounds = calculateBounds(roundedSquare, false);
    expect(betterBounds[2] - betterBounds[0]).toBeLessThan(bounds[2] - bounds[0]);
  });

  test('max bounds hold the shape in any rotation', () => {
    const bounds = calculateBounds(pentagon);
    const maxBounds = calculateMaxBounds(pentagon);
    expect(maxBounds[2] - maxBounds[0]).toBeGreaterThan(bounds[2] - bounds[0]);
    expect(polygonMaxBounds(pentagon)).toEqual({
      left: maxBounds[0],
      top: maxBounds[1],
      right: maxBounds[2],
      bottom: maxBounds[3],
    });
  });

  test('like the original, a right or bottom edge below 0 comes out as about 0', () => {
    const polygon = roundedPolygon({ numVertices: 4, center: { x: -5, y: -5 } });
    const { right, bottom } = polygonBounds(polygon);
    expect(right).toBeCloseTo(0);
    expect(bottom).toBeCloseTo(0);
  });
});

describe('transformPolygon', () => {
  const square = roundedPolygon({ numVertices: 4 });

  test('the identity changes nothing', () => {
    const copy = transformPolygon(square, identityTransform());
    expect(copy.cubics).toHaveLength(square.cubics.length);
    square.cubics.forEach((cubic, i) => assertCubicsEqualish(cubic, copy.cubics[i]!));
  });

  test('a translation moves every point', () => {
    const offset = new Point(1, 2);
    const translated = transformPolygon(square, translateTransform(offset.x, offset.y)).cubics;
    square.cubics.forEach((cubic, i) => {
      const moved: Cubic = cubic.map((v, j) => v + (j % 2 === 0 ? offset.x : offset.y)) as never;
      assertCubicsEqualish(moved, translated[i]!);
    });
  });
});
