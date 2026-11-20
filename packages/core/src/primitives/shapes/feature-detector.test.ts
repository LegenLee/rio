// Ported from androidx graphics-shapes, commonTest's FeatureDetectorTest.kt, at androidx 079e2e3.
// Copyright 2024 The Android Open Source Project, licensed under the Apache License, Version 2.0.
// Changed: ported to TypeScript and Vitest; the tests of an angle's convexity are new.

import { describe, expect, test } from 'vitest';
import { emptyCubic, splitCubic, straightCubic, zeroLength, type Cubic } from './cubic';
import {
  alignsIshWith,
  asFeature,
  detectFeatures,
  smoothesIntoIsh,
  straightIsh,
} from './feature-detector';
import { corner, edge, type CornerFeature, type PolygonFeature } from './features';
import { polygonFromFeatures } from './polygon';
import { pillStarPolygon } from './shapes';
import { assertFeaturesEqualish, assertPointsEqualish } from './test-utils';

const alternates = (features: readonly PolygonFeature[]) =>
  features.every((f, i) => i === 0 || f.type !== features[i - 1]!.type);

describe('feature detection', () => {
  test('recognizes straightness', () => {
    expect(straightIsh(straightCubic(0, 0, 1, 0))).toBe(true);
  });

  test('recognizes straightness, within tolerance', () => {
    const slightlyNotStraight: Cubic = [
      323.508, 201.759, 317.35, 192.008, 311.193, 182.227, 305.035, 172.475,
    ];
    expect(straightIsh(slightlyNotStraight)).toBe(true);
  });

  test('recognizes curvature', () => {
    expect(straightIsh([0, 0, 0.5, 0.5, 0.5, 0.5, 1, 0])).toBe(false);
  });

  test('recognizes smoothness for a curved cubic', () => {
    const base: Cubic = [0, 0, 0, 10, 10, 10, 10, 0];
    const smoothContinuation: Cubic = [10, 0, 10, -10, 20, -10, 20, 0];
    expect(smoothesIntoIsh(base, smoothContinuation)).toBe(true);
  });

  test('recognizes smoothness for a straight cubic', () => {
    expect(smoothesIntoIsh(straightCubic(0, 0, 10, 0), straightCubic(10, 0, 20, 0))).toBe(true);
  });

  test('recognizes smoothness within relative tolerance', () => {
    // From the edge of an imported shape: not smooth within the absolute distance epsilon, but
    // relatively, they should count.
    const base: Cubic = [323.508, 201.759, 317.35, 192.008, 311.193, 182.227, 305.008, 172.475];
    const smoothContinuation: Cubic = [
      305.008, 172.475, 290.812, 149.962, 276.617, 127.42, 262.422, 104.907,
    ];
    expect(smoothesIntoIsh(base, smoothContinuation)).toBe(true);
  });

  test("empty cubics aren't straight", () => {
    expect(straightIsh(emptyCubic(10, 10))).toBe(false);
  });

  test('recognizes alignment for straight lines', () => {
    expect(alignsIshWith(straightCubic(0, 0, 10, 0), straightCubic(10, 0, 20, 0))).toBe(true);
  });

  test('recognizes alignment within relative tolerance', () => {
    // From the edge of an imported shape. The second edge isn't empty, but its length of 0.027 is
    // so tiny relative to the coordinates that it counts as empty, and extends the first.
    const base: Cubic = [323.508, 201.759, 317.35, 192.008, 311.193, 182.227, 305.035, 172.475];
    const smoothContinuation = straightCubic(305.035, 172.475, 305.008, 172.475);
    expect(alignsIshWith(base, smoothContinuation)).toBe(true);
  });

  test('includes alignment for empty cubics', () => {
    const base = straightCubic(0, 0, 10, 0);
    const empty = emptyCubic(10, 0);
    expect(alignsIshWith(base, empty)).toBe(true);
    expect(alignsIshWith(empty, base)).toBe(true);
  });

  test('converts a straight cubic to an edge', () => {
    const cubic = straightCubic(0, 0, 10, 0);
    const converted = asFeature(cubic, straightCubic(10, 0, 20, 0));
    expect(converted.type).toBe('edge');
    assertFeaturesEqualish(edge([cubic]), converted);
  });

  test('converts a curved cubic to a corner', () => {
    const cubic: Cubic = [0, 0, 0.5, 0.5, 0.5, 0.5, 1, 0];
    const converted = asFeature(cubic, [1, 0, 1.5, 1.5, 1.5, 1.5, 2, 0]);
    expect(converted.type).toBe('corner');
    assertFeaturesEqualish(corner([cubic], false), converted);
  });

  test('converts an empty cubic to a corner', () => {
    const cubic = emptyCubic(1, 0);
    const converted = asFeature(cubic, [1, 0, 1.5, 1.5, 1.5, 1.5, 2, 0]);
    expect(converted.type).toBe('corner');
    assertFeaturesEqualish(corner([cubic], false), converted);
  });

  test('a corner where the path turns clockwise is convex, and anticlockwise, concave', () => {
    // An arrow head, clockwise: three convex points and the concave notch at (0, 0.4)
    const sides = [
      straightCubic(0, -1, 1, 1),
      straightCubic(1, 1, 0, 0.4),
      straightCubic(0, 0.4, -1, 1),
      straightCubic(-1, 1, 0, -1),
    ];
    const corners = detectFeatures(sides).filter((f): f is CornerFeature => f.type === 'corner');
    expect(corners.map((f) => [f.cubics[0]![0], f.cubics[0]![1], f.convex])).toEqual([
      [1, 1, true],
      [0, 0.4, false],
      [-1, 1, true],
      [0, -1, true],
    ]);
  });

  test('reconstructs a pill star', () => {
    const originalPolygon = pillStarPolygon();
    const splitCubics = originalPolygon.cubics.flatMap((c) => splitCubic(c, 0.5));
    const createdPolygon = polygonFromFeatures(detectFeatures(splitCubics), originalPolygon.center);

    // The control points may differ, as long as the shape is the same.
    expect(createdPolygon.cubics).toHaveLength(originalPolygon.cubics.length);
    createdPolygon.cubics.forEach((created, i) => {
      const original = originalPolygon.cubics[i]!;
      // The pill star has no rounding, so the created cubics have none either.
      expect(straightIsh(created)).toBe(true);
      expect(straightIsh(original)).toBe(true);
      assertPointsEqualish({ x: original[0], y: original[1] }, { x: created[0], y: created[1] });
      assertPointsEqualish({ x: original[6], y: original[7] }, { x: created[6], y: created[7] });
    });

    // The features' order may differ, as long as they describe the same shape.
    const count = (features: readonly PolygonFeature[], type: string) =>
      features.filter((f) => f.type === type).length;
    expect(createdPolygon.features).toHaveLength(originalPolygon.features.length);
    expect(count(createdPolygon.features, 'corner')).toBe(
      count(originalPolygon.features, 'corner'),
    );
    expect(count(createdPolygon.features, 'edge')).toBe(count(originalPolygon.features, 'edge'));
    expect(alternates(createdPolygon.features)).toBe(true);
    expect(
      createdPolygon.features
        .filter((f) => f.type === 'corner')
        .every((f) => f.cubics.length === 1 && zeroLength(f.cubics[0]!)),
    ).toBe(true);
  });

  test('reconstructs a rounded pill star closely enough', () => {
    // The distance epsilon shouldn't be so high that the pill star's roundings, small in the
    // [0, 1] space, come out pointed.
    const originalPolygon = pillStarPolygon({ rounding: { radius: 0.2 } });
    const createdPolygon = polygonFromFeatures(
      detectFeatures(originalPolygon.cubics),
      originalPolygon.center,
    );
    expect(createdPolygon.cubics).toHaveLength(originalPolygon.cubics.length);
    // Up to one difference is fine,
    expect(Math.abs(originalPolygon.features.length - createdPolygon.features.length)).toBe(1);
    // as long as edges and corners still alternate.
    expect(alternates(createdPolygon.features)).toBe(true);
  });
});
