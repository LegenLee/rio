// Cubic Bézier curves, the pieces every shape's outline is made of.
//
// Ported from androidx graphics-shapes, Cubic.kt, at androidx 079e2e3. Copyright 2022 The Android
// Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; a cubic is a tuple of eight numbers rather than a class, its methods and operators
// are functions, and `MutableCubic` is left out.

import { convex, directionVector, distance, DISTANCE_EPSILON, interpolate } from './math';
import { Point } from './point';

/**
 * A cubic Bézier curve: the first anchor point, the two control points that set its slope, and the
 * second anchor point, as `[anchor0X, anchor0Y, control0X, control0Y, control1X, control1Y,
 * anchor1X, anchor1Y]`.
 */
export type Cubic = readonly [number, number, number, number, number, number, number, number];

/** Transforms a point (to rotate, scale, translate, ...), returning the new `[x, y]`. */
export type PointTransformer = (x: number, y: number) => readonly [number, number];

/** A cubic from its four points (the original's internal constructor) */
export function cubicFromPoints(
  anchor0: Point,
  control0: Point,
  control1: Point,
  anchor1: Point,
): Cubic {
  return [
    anchor0.x,
    anchor0.y,
    control0.x,
    control0.y,
    control1.x,
    control1.y,
    anchor1.x,
    anchor1.y,
  ];
}

/**
 * The point on the curve at `t`, the proportional distance along it from anchor0 (0) to anchor1
 * (1).
 */
export function pointOnCurve(c: Cubic, t: number): Point {
  const u = 1 - t;
  return new Point(
    c[0] * (u * u * u) + c[2] * (3 * t * u * u) + c[4] * (3 * t * t * u) + c[6] * (t * t * t),
    c[1] * (u * u * u) + c[3] * (3 * t * u * u) + c[5] * (3 * t * t * u) + c[7] * (t * t * t),
  );
}

export function zeroLength(c: Cubic): boolean {
  return Math.abs(c[0] - c[6]) < DISTANCE_EPSILON && Math.abs(c[1] - c[7]) < DISTANCE_EPSILON;
}

export function convexTo(c: Cubic, next: Cubic): boolean {
  const prevVertex = new Point(c[0], c[1]);
  const currVertex = new Point(c[6], c[7]);
  const nextVertex = new Point(next[6], next[7]);
  return convex(prevVertex, currVertex, nextVertex);
}

const zeroIsh = (value: number) => Math.abs(value) < DISTANCE_EPSILON;

const inUnit = (t: number) => t >= 0 && t <= 1;

/**
 * The curve's axis-aligned bounding box, as `[left, top, right, bottom]`: the true one, or with
 * `approximate`, the box around all its anchor and control points, which is faster.
 */
export function cubicBounds(
  c: Cubic,
  approximate = false,
): [left: number, top: number, right: number, bottom: number] {
  const [anchor0X, anchor0Y, control0X, control0Y, control1X, control1Y, anchor1X, anchor1Y] = c;

  // A curve might be of zero length, with both anchors at the same place: the point itself.
  if (zeroLength(c)) return [anchor0X, anchor0Y, anchor0X, anchor0Y];

  let minX = Math.min(anchor0X, anchor1X);
  let minY = Math.min(anchor0Y, anchor1Y);
  let maxX = Math.max(anchor0X, anchor1X);
  let maxY = Math.max(anchor0Y, anchor1Y);

  if (approximate) {
    // The bounding box of all anchors and controls
    return [
      Math.min(minX, Math.min(control0X, control1X)),
      Math.min(minY, Math.min(control0Y, control1Y)),
      Math.max(maxX, Math.max(control0X, control1X)),
      Math.max(maxY, Math.max(control0Y, control1Y)),
    ];
  }

  // Find the derivative, which is a quadratic Bézier. Then we can solve for t using the quadratic
  // formula.
  const xa = -anchor0X + 3 * control0X - 3 * control1X + anchor1X;
  const xb = 2 * anchor0X - 4 * control0X + 2 * control1X;
  const xc = -anchor0X + control0X;

  const extendX = (t: number) => {
    if (!inUnit(t)) return;
    const x = pointOnCurve(c, t).x;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  };

  if (zeroIsh(xa)) {
    // Try Muller's method instead; it can find a single root when a is 0
    if (xb !== 0) extendX((2 * xc) / (-2 * xb));
  } else {
    const xs = xb * xb - 4 * xa * xc;
    if (xs >= 0) {
      extendX((-xb + Math.sqrt(xs)) / (2 * xa));
      extendX((-xb - Math.sqrt(xs)) / (2 * xa));
    }
  }

  // Repeat the above for the y coordinate
  const ya = -anchor0Y + 3 * control0Y - 3 * control1Y + anchor1Y;
  const yb = 2 * anchor0Y - 4 * control0Y + 2 * control1Y;
  const yc = -anchor0Y + control0Y;

  const extendY = (t: number) => {
    if (!inUnit(t)) return;
    const y = pointOnCurve(c, t).y;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  if (zeroIsh(ya)) {
    if (yb !== 0) extendY((2 * yc) / (-2 * yb));
  } else {
    const ys = yb * yb - 4 * ya * yc;
    if (ys >= 0) {
      extendY((-yb + Math.sqrt(ys)) / (2 * ya));
      extendY((-yb - Math.sqrt(ys)) / (2 * ya));
    }
  }
  return [minX, minY, maxX, maxY];
}

/**
 * Splits a cubic at `t`, the proportional distance along it from its first anchor (0) to its
 * second (1), into the two curves on either side.
 */
export function splitCubic(c: Cubic, t: number): [Cubic, Cubic] {
  const [anchor0X, anchor0Y, control0X, control0Y, control1X, control1Y, anchor1X, anchor1Y] = c;
  const u = 1 - t;
  const p = pointOnCurve(c, t);
  return [
    [
      anchor0X,
      anchor0Y,
      anchor0X * u + control0X * t,
      anchor0Y * u + control0Y * t,
      anchor0X * (u * u) + control0X * (2 * u * t) + control1X * (t * t),
      anchor0Y * (u * u) + control0Y * (2 * u * t) + control1Y * (t * t),
      p.x,
      p.y,
    ],
    [
      p.x,
      p.y,
      control0X * (u * u) + control1X * (2 * u * t) + anchor1X * (t * t),
      control0Y * (u * u) + control1Y * (2 * u * t) + anchor1Y * (t * t),
      control1X * u + anchor1X * t,
      control1Y * u + anchor1Y * t,
      anchor1X,
      anchor1Y,
    ],
  ];
}

/** The same curve, run from its second anchor to its first */
export function reverseCubic(c: Cubic): Cubic {
  return [c[6], c[7], c[4], c[5], c[2], c[3], c[0], c[1]];
}

/** Adds two cubics point by point (the original's `+`). */
export function addCubics(a: Cubic, b: Cubic): Cubic {
  return a.map((v, i) => v + b[i]!) as unknown as Cubic;
}

/** Multiplies every point of a cubic by `x` (the original's `*`). */
export function scaleCubic(c: Cubic, x: number): Cubic {
  return c.map((v) => v * x) as unknown as Cubic;
}

/** Divides every point of a cubic by `x` (the original's `/`). */
export function divideCubic(c: Cubic, x: number): Cubic {
  return scaleCubic(c, 1 / x);
}

/** The cubic with each of its points transformed by `f` */
export function transformCubic(c: Cubic, f: PointTransformer): Cubic {
  const [a0x, a0y] = f(c[0], c[1]);
  const [c0x, c0y] = f(c[2], c[3]);
  const [c1x, c1y] = f(c[4], c[5]);
  const [a1x, a1y] = f(c[6], c[7]);
  return [a0x, a0y, c0x, c0y, c1x, c1y, a1x, a1y];
}

/** Linearly interpolates each point of two cubics (`MutableCubic.interpolate` in the original). */
export function interpolateCubic(c1: Cubic, c2: Cubic, progress: number): Cubic {
  return c1.map((v, i) => interpolate(v, c2[i]!, progress)) as unknown as Cubic;
}

/**
 * A straight line from (x0, y0) to (x1, y1) as a cubic, its control points a third of the way from
 * either end.
 */
export function straightCubic(x0: number, y0: number, x1: number, y1: number): Cubic {
  return [
    x0,
    y0,
    interpolate(x0, x1, 1 / 3),
    interpolate(y0, y1, 1 / 3),
    interpolate(x0, x1, 2 / 3),
    interpolate(y0, y1, 2 / 3),
    x1,
    y1,
  ];
}

/**
 * A cubic that approximates a circular arc around (centerX, centerY), from (x0, y0) to (x1, y1):
 * the shorter of the two arcs between them. An arc of more than 180 degrees takes more than one
 * cubic. Both points should be the same distance from the center.
 */
export function arcCubic(
  centerX: number,
  centerY: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Cubic {
  const p0d = directionVector(x0 - centerX, y0 - centerY);
  const p1d = directionVector(x1 - centerX, y1 - centerY);
  const rotatedP0 = p0d.rotate90();
  const rotatedP1 = p1d.rotate90();
  const clockwise = rotatedP0.dotProduct(x1 - centerX, y1 - centerY) >= 0;
  const cosa = p0d.dotProduct(p1d);
  if (cosa > 0.999) /* p0 ~= p1 */ return straightCubic(x0, y0, x1, y1);
  const k =
    ((((distance(x0 - centerX, y0 - centerY) * 4) / 3) *
      (Math.sqrt(2 * (1 - cosa)) - Math.sqrt(1 - cosa * cosa))) /
      (1 - cosa)) *
    (clockwise ? 1 : -1);
  return [
    x0,
    y0,
    x0 + rotatedP0.x * k,
    y0 + rotatedP0.y * k,
    x1 - rotatedP1.x * k,
    y1 - rotatedP1.y * k,
    x1,
    y1,
  ];
}

/** A cubic of zero length at (x0, y0) */
export function emptyCubic(x0: number, y0: number): Cubic {
  return [x0, y0, x0, y0, x0, y0, x0, y0];
}
