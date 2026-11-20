// Assertions the shape tests share, within the original's tolerance. For tests only.
//
// Ported from androidx graphics-shapes, commonTest's TestUtils.kt, at androidx 079e2e3. Copyright
// 2022 The Android Open Source Project, licensed under the Apache License, Version 2.0. Changed:
// ported to TypeScript and Vitest.

import { expect } from 'vitest';
import type { Cubic, PointTransformer } from './cubic';
import type { PolygonFeature } from './features';
import type { RoundedPolygon, ShapePoint } from './polygon';

export const EPSILON = 1e-4;

export function assertEqualish(expected: number, actual: number, message?: string): void {
  expect(Math.abs(expected - actual), `${message ?? ''} ${expected} vs. ${actual}`).toBeLessThan(
    EPSILON,
  );
}

export function equalish(f0: number, f1: number, epsilon: number): boolean {
  return Math.abs(f0 - f1) < epsilon;
}

export function assertPointsEqualish(expected: ShapePoint, actual: ShapePoint): void {
  const message = `(${expected.x}, ${expected.y}) vs. (${actual.x}, ${actual.y})`;
  assertEqualish(expected.x, actual.x, message);
  assertEqualish(expected.y, actual.y, message);
}

export function pointsEqualish(p0: ShapePoint, p1: ShapePoint): boolean {
  return equalish(p0.x, p1.x, EPSILON) && equalish(p0.y, p1.y, EPSILON);
}

export function cubicsEqualish(c0: Cubic, c1: Cubic): boolean {
  return c0.every((v, i) => equalish(v, c1[i]!, EPSILON));
}

export function assertCubicsEqualish(expected: Cubic, actual: Cubic, message = ''): void {
  for (let i = 0; i < 8; i++) {
    assertEqualish(expected[i]!, actual[i]!, `${message} [${expected}] vs. [${actual}] at ${i}`);
  }
}

export function assertCubicListsEqualish(
  expected: readonly Cubic[],
  actual: readonly Cubic[],
  message = '',
): void {
  expect(actual.length, `${message} cubic count`).toBe(expected.length);
  expected.forEach((cubic, i) => assertCubicsEqualish(cubic, actual[i]!, `${message} cubic ${i}`));
}

export function assertFeaturesEqualish(
  expected: PolygonFeature,
  actual: PolygonFeature,
  message = '',
): void {
  assertCubicListsEqualish(expected.cubics, actual.cubics, message);
  expect(actual.type, `${message} type`).toBe(expected.type);
  if (expected.type === 'corner' && actual.type === 'corner') {
    expect(actual.convex, `${message} convex`).toBe(expected.convex);
  }
}

export function assertPolygonsEqualish(
  expected: RoundedPolygon,
  actual: RoundedPolygon,
  message = '',
): void {
  assertCubicListsEqualish(expected.cubics, actual.cubics, message);
  expect(actual.features.length, `${message} feature count`).toBe(expected.features.length);
  expected.features.forEach((feature, i) =>
    assertFeaturesEqualish(feature, actual.features[i]!, `${message} feature ${i}`),
  );
}

export function assertPointGreaterish(expected: ShapePoint, actual: ShapePoint): void {
  expect(actual.x).toBeGreaterThanOrEqual(expected.x - EPSILON);
  expect(actual.y).toBeGreaterThanOrEqual(expected.y - EPSILON);
}

export function assertPointLessish(expected: ShapePoint, actual: ShapePoint): void {
  expect(actual.x).toBeLessThanOrEqual(expected.x + EPSILON);
  expect(actual.y).toBeLessThanOrEqual(expected.y + EPSILON);
}

/** Every point of every cubic is within the box from `minPoint` to `maxPoint`. */
export function assertInBounds(
  shape: readonly Cubic[],
  minPoint: ShapePoint,
  maxPoint: ShapePoint,
): void {
  for (const cubic of shape) {
    for (let i = 0; i < 8; i += 2) {
      const point = { x: cubic[i]!, y: cubic[i + 1]! };
      assertPointGreaterish(minPoint, point);
      assertPointLessish(maxPoint, point);
    }
  }
}

export const identityTransform = (): PointTransformer => (x, y) => [x, y];

export const scaleTransform =
  (sx: number, sy: number): PointTransformer =>
  (x, y) => [x * sx, y * sy];

export const translateTransform =
  (dx: number, dy: number): PointTransformer =>
  (x, y) => [x + dx, y + dy];
