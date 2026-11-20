// A point or a vector, for the shape code's own use: it isn't exported from the package, where
// points are plain `{ x, y }` objects.
//
// Ported from androidx graphics-shapes, Point.kt (and `rotate90` from Utils.kt), at androidx
// 079e2e3. Copyright 2022-2023 The Android Open Source Project, licensed under the Apache License,
// Version 2.0. Changed: ported to TypeScript; Kotlin's operators are methods (`a - b` is
// `a.minus(b)`), and the numbers are 64-bit.

import type { PointTransformer } from './cubic';

export class Point {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  /**
   * The magnitude of the Point, which is the distance of this point from (0, 0). To compare it to
   * another point's distance, `getDistanceSquared` is cheaper.
   */
  getDistance(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** The square of the distance of this point from (0, 0) */
  getDistanceSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  dotProduct(other: Point): number;
  dotProduct(otherX: number, otherY: number): number;
  dotProduct(other: Point | number, otherY?: number): number {
    return typeof other === 'number'
      ? this.x * other + this.y * otherY!
      : this.x * other.x + this.y * other.y;
  }

  /**
   * The Z coordinate of the cross product of two vectors, to check if the second vector is going
   * clockwise (> 0) or counterclockwise (< 0) compared with the first one. It could also be 0, if
   * the vectors are co-linear.
   */
  clockwise(other: Point): boolean {
    return this.x * other.y - this.y * other.x > 0;
  }

  /** The unit vector in the direction of this point from (0, 0) */
  getDirection(): Point {
    const d = this.getDistance();
    if (!(d > 0)) throw new Error("Can't get the direction of a 0-length vector");
    return this.div(d);
  }

  /** The same arrow pointing the other way (Kotlin's unary minus) */
  negate(): Point {
    return new Point(-this.x, -this.y);
  }

  minus(other: Point): Point {
    return new Point(this.x - other.x, this.y - other.y);
  }

  plus(other: Point): Point {
    return new Point(this.x + other.x, this.y + other.y);
  }

  times(operand: number): Point {
    return new Point(this.x * operand, this.y * operand);
  }

  div(operand: number): Point {
    return new Point(this.x / operand, this.y / operand);
  }

  rem(operand: number): Point {
    return new Point(this.x % operand, this.y % operand);
  }

  rotate90(): Point {
    return new Point(-this.y, this.x);
  }

  transformed(f: PointTransformer): Point {
    const [x, y] = f(this.x, this.y);
    return new Point(x, y);
  }
}

export const ZERO = new Point(0, 0);

/**
 * Linearly interpolates between two points. A `fraction` of 0 is `start`, 1 is `stop`; values
 * outside 0..1 extrapolate.
 */
export function interpolatePoint(start: Point, stop: Point, fraction: number): Point {
  return new Point(
    (1 - fraction) * start.x + fraction * stop.x,
    (1 - fraction) * start.y + fraction * stop.y,
  );
}
