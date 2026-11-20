// Ported from androidx graphics-shapes, commonTest's CubicTest.kt, at androidx 079e2e3. Copyright
// 2022 The Android Open Source Project, licensed under the Apache License, Version 2.0. Changed:
// ported to TypeScript and Vitest; the Int overloads of `*` and `/` have no counterpart.

import { describe, expect, test } from 'vitest';
import {
  addCubics,
  arcCubic,
  cubicFromPoints,
  divideCubic,
  emptyCubic,
  pointOnCurve,
  reverseCubic,
  scaleCubic,
  splitCubic,
  straightCubic,
  transformCubic,
  zeroLength,
  type Cubic,
} from './cubic';
import { Point } from './point';
import {
  assertCubicsEqualish,
  assertPointsEqualish,
  identityTransform,
  scaleTransform,
  translateTransform,
} from './test-utils';

// These points make a roughly circular arc in the upper-right quadrant around (0, 0).
const zero = new Point(0, 0);
const p0 = new Point(1, 0);
const p1 = new Point(1, 0.5);
const p2 = new Point(0.5, 1);
const p3 = new Point(0, 1);
const cubic = cubicFromPoints(p0, p1, p2, p3);

const anchor0 = (c: Cubic) => new Point(c[0], c[1]);
const control0 = (c: Cubic) => new Point(c[2], c[3]);
const control1 = (c: Cubic) => new Point(c[4], c[5]);
const anchor1 = (c: Cubic) => new Point(c[6], c[7]);

function assertBetween(end0: Point, end1: Point, actual: Point) {
  expect(Math.min(end0.x, end1.x)).toBeLessThanOrEqual(actual.x);
  expect(Math.min(end0.y, end1.y)).toBeLessThanOrEqual(actual.y);
  expect(Math.max(end0.x, end1.x)).toBeGreaterThanOrEqual(actual.x);
  expect(Math.max(end0.y, end1.y)).toBeGreaterThanOrEqual(actual.y);
}

describe('cubic', () => {
  test('construction', () => {
    expect(anchor0(cubic)).toEqual(p0);
    expect(control0(cubic)).toEqual(p1);
    expect(control1(cubic)).toEqual(p2);
    expect(anchor1(cubic)).toEqual(p3);
  });

  test('circular arc', () => {
    const arc = arcCubic(zero.x, zero.y, p0.x, p0.y, p3.x, p3.y);
    expect(anchor0(arc)).toEqual(p0);
    expect(anchor1(arc)).toEqual(p3);
  });

  test('div', () => {
    assertCubicsEqualish(cubic, divideCubic(cubic, 1));
    const divCubic = divideCubic(cubic, 2);
    assertPointsEqualish(p0.div(2), anchor0(divCubic));
    assertPointsEqualish(p1.div(2), control0(divCubic));
    assertPointsEqualish(p2.div(2), control1(divCubic));
    assertPointsEqualish(p3.div(2), anchor1(divCubic));
  });

  test('times', () => {
    let timesCubic = scaleCubic(cubic, 1);
    expect(anchor0(timesCubic)).toEqual(p0);
    expect(control0(timesCubic)).toEqual(p1);
    expect(control1(timesCubic)).toEqual(p2);
    expect(anchor1(timesCubic)).toEqual(p3);
    timesCubic = scaleCubic(cubic, 2);
    assertPointsEqualish(p0.times(2), anchor0(timesCubic));
    assertPointsEqualish(p1.times(2), control0(timesCubic));
    assertPointsEqualish(p2.times(2), control1(timesCubic));
    assertPointsEqualish(p3.times(2), anchor1(timesCubic));
  });

  test('plus', () => {
    const offsetCubic = scaleCubic(cubic, 2);
    const plusCubic = addCubics(cubic, offsetCubic);
    assertPointsEqualish(p0.plus(anchor0(offsetCubic)), anchor0(plusCubic));
    assertPointsEqualish(p1.plus(control0(offsetCubic)), control0(plusCubic));
    assertPointsEqualish(p2.plus(control1(offsetCubic)), control1(plusCubic));
    assertPointsEqualish(p3.plus(anchor1(offsetCubic)), anchor1(plusCubic));
  });

  test('reverse', () => {
    const reversed = reverseCubic(cubic);
    expect(anchor0(reversed)).toEqual(p3);
    expect(control0(reversed)).toEqual(p2);
    expect(control1(reversed)).toEqual(p1);
    expect(anchor1(reversed)).toEqual(p0);
  });

  test('straight line', () => {
    const line = straightCubic(p0.x, p0.y, p3.x, p3.y);
    expect(anchor0(line)).toEqual(p0);
    expect(anchor1(line)).toEqual(p3);
    assertBetween(p0, p3, control0(line));
    assertBetween(p0, p3, control1(line));
  });

  test('split', () => {
    const [split0, split1] = splitCubic(cubic, 0.5);
    expect(anchor0(split0)).toEqual(anchor0(cubic));
    expect(anchor1(split1)).toEqual(anchor1(cubic));
    assertBetween(anchor0(cubic), anchor1(cubic), anchor1(split0));
    assertBetween(anchor0(cubic), anchor1(cubic), anchor0(split1));
  });

  test('point on curve', () => {
    let halfway = pointOnCurve(cubic, 0.5);
    assertBetween(anchor0(cubic), anchor1(cubic), halfway);
    const line = straightCubic(p0.x, p0.y, p3.x, p3.y);
    halfway = pointOnCurve(line, 0.5);
    const computedHalfway = new Point(p0.x + 0.5 * (p3.x - p0.x), p0.y + 0.5 * (p3.y - p0.y));
    assertPointsEqualish(computedHalfway, halfway);
  });

  test('transform', () => {
    assertCubicsEqualish(cubic, transformCubic(cubic, identityTransform()));
    assertCubicsEqualish(scaleCubic(cubic, 3), transformCubic(cubic, scaleTransform(3, 3)));

    const translation = new Point(200, 300);
    const translated = transformCubic(cubic, translateTransform(translation.x, translation.y));
    assertPointsEqualish(anchor0(cubic).plus(translation), anchor0(translated));
    assertPointsEqualish(control0(cubic).plus(translation), control0(translated));
    assertPointsEqualish(control1(cubic).plus(translation), control1(translated));
    assertPointsEqualish(anchor1(cubic).plus(translation), anchor1(translated));
  });

  test('an empty cubic has zero length', () => {
    expect(zeroLength(emptyCubic(10, 10))).toBe(true);
  });
});
