// Maps progress along one shape's outline to progress along another's, and back. Not exported
// from the package.
//
// Ported from androidx graphics-shapes, FloatMapping.kt, at androidx 079e2e3. Copyright 2023 The
// Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript, with 64-bit numbers.

import { DISTANCE_EPSILON, positiveModulo } from './math';

/**
 * Whether `progress` is in the range from `progressFrom` to `progressTo`. Progress is in [0..1)
 * and wraps, so a range can end before it starts: from 0.7 to 0.2, both 0.8 and 0.1 are inside and
 * 0.5 is outside.
 */
export function progressInRange(progress: number, progressFrom: number, progressTo: number) {
  return progressTo >= progressFrom
    ? progress >= progressFrom && progress <= progressTo
    : progress >= progressFrom || progress <= progressTo;
}

/**
 * Maps from one set of progress values to another, as `DoubleMapper` does to find the value on one
 * shape that matches a value on the other.
 */
export function linearMap(xValues: readonly number[], yValues: readonly number[], x: number) {
  if (!(x >= 0 && x <= 1)) throw new Error(`Invalid progress: ${x}`);
  const segmentStartIndex = xValues.findIndex((_, i) =>
    progressInRange(x, xValues[i]!, xValues[(i + 1) % xValues.length]!),
  );
  if (segmentStartIndex < 0)
    throw new Error('Collection contains no element matching the predicate.');
  const segmentEndIndex = (segmentStartIndex + 1) % xValues.length;
  const segmentSizeX = positiveModulo(xValues[segmentEndIndex]! - xValues[segmentStartIndex]!, 1);
  const segmentSizeY = positiveModulo(yValues[segmentEndIndex]! - yValues[segmentStartIndex]!, 1);
  const positionInSegment =
    segmentSizeX < 0.001 ? 0.5 : positiveModulo(x - xValues[segmentStartIndex]!, 1) / segmentSizeX;
  return positiveModulo(yValues[segmentStartIndex]! + segmentSizeY * positionInSegment, 1);
}

/**
 * Maps values in the [0..1) source space to values in the [0..1) target space, and back. A finite
 * list of representative mappings extends to the whole interval by linear interpolation, wrapping
 * around. With mappings 0.2 to 0.5 and 0.4 to 0.6, 0.3 (in the middle of the source interval) maps
 * to 0.55 (the middle of the targets), 0.21 to 0.505, and so on.
 *
 * Given 0 to 0 and 0.5 to 0.25, for one: for x in [0 .. 0.5], y = x / 2; for x in [0.5 .. 1],
 * y = 0.25 + (x - 0.5) * 1.5 = x * 1.5 - 0.5. `mapBack` goes the other way: for y in [0 .. 0.25],
 * x = y * 2; for y in [0.25 .. 1], x = (y + 0.5) / 1.5.
 *
 * Morphs use it to map progress between the start and end shapes, to insert new curves and match
 * curves overall.
 */
export class DoubleMapper {
  private readonly sourceValues: number[] = [];
  private readonly targetValues: number[] = [];

  constructor(...mappings: readonly (readonly [number, number])[]) {
    for (const [source, target] of mappings) {
      this.sourceValues.push(source);
      this.targetValues.push(target);
    }
    // Both the source and the target values should increase monotonically, except maybe once
    // (since progress wraps around).
    validateProgress(this.sourceValues);
    validateProgress(this.targetValues);
  }

  map(x: number): number {
    return linearMap(this.sourceValues, this.targetValues, x);
  }

  mapBack(x: number): number {
    return linearMap(this.targetValues, this.sourceValues, x);
  }

  // Any 2 points on the (x, x) diagonal, with x in [0, 1), spread as much as possible to minimize
  // float errors.
  static readonly Identity = new DoubleMapper([0, 0], [0.5, 0.5]);
}

/**
 * Checks that the progress values are all in [0.0, 1.0) and increase monotonically, except maybe
 * once, where the progress wraps around. Every pair of consecutive elements counts, the last and
 * first included: (0.0, 0.3, 0.6) is valid, and so are (0.3, 0.6, 0.0) and (0.6, 0.3, 0.0), but
 * (0.5, 0.0, 0.7) isn't, since it goes down twice: from 0.5 to 0.0, and from 0.7 to 0.5.
 */
export function validateProgress(p: readonly number[]): void {
  let prev = p[p.length - 1]!;
  let wraps = 0;
  for (const curr of p) {
    if (!(curr >= 0 && curr < 1)) {
      throw new Error(`FloatMapping - Progress outside of range: ${p.join(', ')}`);
    }
    if (!(progressDistance(curr, prev) > DISTANCE_EPSILON)) {
      throw new Error(`FloatMapping - Progress repeats a value: ${p.join(', ')}`);
    }
    if (curr < prev) {
      wraps++;
      if (wraps > 1) {
        throw new Error(`FloatMapping - Progress wraps more than once: ${p.join(', ')}`);
      }
    }
    prev = curr;
  }
}

/** The distance between two progress values. Progress wraps around, so 0.99 apart is 0.01. */
export function progressDistance(p1: number, p2: number): number {
  const d = Math.abs(p1 - p2);
  return Math.min(d, 1 - d);
}
