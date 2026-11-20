// The numeric helpers and tolerances the shape code shares. Not exported from the package.
//
// Ported from androidx graphics-shapes, Utils.kt, at androidx 079e2e3. Copyright 2022 The Android
// Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript, with 64-bit numbers; the debug logging is left out.

import { Point, ZERO } from './point';

export function distance(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

export function distanceSquared(x: number, y: number): number {
  return x * x + y * y;
}

/** The unit vector in the direction of (x, y) from (0, 0) */
export function directionVector(x: number, y: number): Point {
  const d = distance(x, y);
  if (!(d > 0)) throw new Error('Required distance greater than zero');
  return new Point(x / d, y / d);
}

/** The unit vector at an angle (Kotlin's `directionVector(angleRadians)`) */
export function directionVectorAt(angleRadians: number): Point {
  return new Point(Math.cos(angleRadians), Math.sin(angleRadians));
}

export function radialToCartesian(radius: number, angleRadians: number, center = ZERO): Point {
  return directionVectorAt(angleRadians).times(radius).plus(center);
}

/**
 * When two points count as the same, within reasonable roundoff error. The distance epsilon is
 * meant to stay under a pixel on any reasonably sized display.
 */
export const DISTANCE_EPSILON = 1e-4;
export const ANGLE_EPSILON = 1e-6;

/**
 * People see collinearity, for one, much more loosely than the math does, and more so on small
 * displays. For operations that allow higher tolerances.
 */
export const RELAXED_DISTANCE_EPSILON = 5e-3;

export const FLOAT_PI = Math.PI;
export const TWO_PI = 2 * Math.PI;

/**
 * Kotlin's `Float.MAX_VALUE` and `Float.MIN_VALUE`. The latter is the smallest positive float, not
 * the most negative one; the original starts maximums from it, and the port keeps that.
 */
export const FLOAT_MAX_VALUE = 3.4028234663852886e38;
export const FLOAT_MIN_VALUE = 1.401298464324817e-45;

export function square(x: number): number {
  return x * x;
}

/** Linearly interpolates between `start` and `stop`, `fraction` of the way. */
export function interpolate(start: number, stop: number, fraction: number): number {
  return (1 - fraction) * start + fraction * stop;
}

/**
 * Like `num % mod`, but never negative: `4 % 3` and `positiveModulo(4, 3)` are 1, but `-4 % 3` is
 * -1 where `positiveModulo(-4, 3)` is 2.
 */
export function positiveModulo(num: number, mod: number): number {
  return ((num % mod) + mod) % mod;
}

/** Whether C is on the line through A and B */
export function collinearIsh(
  aX: number,
  aY: number,
  bX: number,
  bY: number,
  cX: number,
  cY: number,
  tolerance = DISTANCE_EPSILON,
): boolean {
  // The dot product of a perpendicular angle is 0. By rotating one of the vectors, we save the
  // calculations to convert the dot product to degrees afterwards.
  const ab = new Point(bX - aX, bY - aY).rotate90();
  const ac = new Point(cX - aX, cY - aY);
  const dotProduct = Math.abs(ab.dotProduct(ac));
  const relativeTolerance = tolerance * ab.getDistance() * ac.getDistance();
  return dotProduct < tolerance || dotProduct < relativeTolerance;
}

/**
 * Approximates whether the corner at `current` is convex, from the previous->current and
 * current->next vectors.
 */
export function convex(previous: Point, current: Point, next: Point): boolean {
  // From the original: a fast, but not reliable calculation (b/369320447).
  return current.minus(previous).clockwise(next.minus(current));
}

/**
 * A ternary search in [v0..v1] for the parameter that minimizes `f`. Stops when the search space is
 * smaller than `tolerance`. (The original takes `tolerance` before `f`, by name.)
 */
export function findMinimum(
  v0: number,
  v1: number,
  f: (value: number) => number,
  tolerance = 1e-3,
): number {
  let a = v0;
  let b = v1;
  while (b - a > tolerance) {
    const c1 = (2 * a + b) / 3;
    const c2 = (2 * b + a) / 3;
    if (f(c1) < f(c2)) b = c2;
    else a = c1;
  }
  return (a + b) / 2;
}
