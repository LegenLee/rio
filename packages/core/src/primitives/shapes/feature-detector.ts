// Groups a run of cubics, such as an SVG path's, into features. Not exported from the package.
//
// Ported from androidx graphics-shapes, FeatureDetector.kt, at androidx 079e2e3. Copyright 2024
// The Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported
// to TypeScript; the `Cubic` extensions are functions. Differs from the original, which works from
// the control points as they are: where one sits on its anchor, as when a tool draws a straight
// line as a curve, the next one along gives the tangent. Without that, cubics merged across sharp
// corners, and every empty corner between two cubics that meet at an angle came out concave on a
// clockwise path (convex on an anticlockwise one, once turned clockwise). That corner's convexity
// comes from how the cubics turn, by their tangents where they meet. And the last cubic is compared
// with the first that has a length, so a path that starts with an empty one keeps its first corner.

import { convexTo, emptyCubic, zeroLength, type Cubic } from './cubic';
import { corner, edge, type PolygonFeature } from './features';
import { collinearIsh, convex, RELAXED_DISTANCE_EPSILON } from './math';
import { Point } from './point';

/**
 * Converts cubics to features one to one (`asFeature`), except where:
 *
 * - two cubics in a row don't join smoothly: an empty corner goes in between. For C1 and C2:
 *   /C1\/C2\ -> /C\C/C\.
 * - several cubics in a row make one feature: --C1----C2-- -> -----E----. The first and last
 *   cubics are an exception, and stay as they are, to keep the start position.
 *
 * Assumes the cubics are continuous.
 */
export function detectFeatures(cubics: readonly Cubic[]): PolygonFeature[] {
  if (cubics.length === 0) return [];

  // From the original: try other heuristics for grouping corners (b/372651969).
  const features: PolygonFeature[] = [];
  let current = cubics[0]!;
  // What the last cubic meets: the first with a length
  const first = cubics.find((c) => !zeroLength(c)) ?? cubics[0]!;

  // One round in which (current == last, next == first) is the last iteration. Like a snowball,
  // cubics in a row that align to one feature merge until the streak breaks; then the result is
  // added, and a new streak starts.
  for (let i = 0; i < cubics.length; i++) {
    const next = i < cubics.length - 1 ? cubics[i + 1]! : first;

    if (i < cubics.length - 1 && alignsIshWith(current, next)) {
      current = extend(current, next);
      continue;
    }

    features.push(asFeature(current, next));

    if (!smoothesIntoIsh(current, next)) {
      features.push(corner([emptyCubic(current[6], current[7])], turnsClockwise(current, next)));
    }

    current = next;
  }
  return features;
}

/** The nearest point that isn't on `anchor`, which gives the tangent there; the anchor if none. */
const away = (anchor: Point, points: Point[]) =>
  points.find((p) => p.minus(anchor).getDistance() > 0) ?? anchor;

/** A point before the cubic's end along its tangent there */
const beforeEnd = (c: Cubic) =>
  away(new Point(c[6], c[7]), [
    new Point(c[4], c[5]),
    new Point(c[2], c[3]),
    new Point(c[0], c[1]),
  ]);

/** A point after the cubic's start along its tangent there */
const afterStart = (c: Cubic) =>
  away(new Point(c[0], c[1]), [
    new Point(c[2], c[3]),
    new Point(c[4], c[5]),
    new Point(c[6], c[7]),
  ]);

/**
 * Whether the path turns clockwise, and so makes a convex corner, where `current` ends and `next`
 * starts: from `current`'s tangent there to `next`'s.
 */
function turnsClockwise(current: Cubic, next: Cubic): boolean {
  return convex(beforeEnd(current), new Point(current[6], current[7]), afterStart(next));
}

/** An edge if the cubic is a straight line, otherwise a corner, convex or not (`convexTo`) */
export function asFeature(cubic: Cubic, next: Cubic): PolygonFeature {
  return straightIsh(cubic) ? edge([cubic]) : corner([cubic], convexTo(cubic, next));
}

/** Whether the cubic is close to a straight line. Empty cubics aren't. */
export function straightIsh(c: Cubic): boolean {
  return (
    !zeroLength(c) &&
    collinearIsh(c[0], c[1], c[6], c[7], c[2], c[3], RELAXED_DISTANCE_EPSILON) &&
    collinearIsh(c[0], c[1], c[6], c[7], c[4], c[5], RELAXED_DISTANCE_EPSILON)
  );
}

/**
 * Whether `next` continues the cubic smoothly: its tangent where it starts lines up with the
 * cubic's where it ends (its first control point mirrors the cubic's second one, as with SVG's S/s
 * or T/t commands).
 */
export function smoothesIntoIsh(c: Cubic, next: Cubic): boolean {
  const before = beforeEnd(c);
  const after = afterStart(next);
  return collinearIsh(before.x, before.y, after.x, after.y, c[6], c[7], RELAXED_DISTANCE_EPSILON);
}

/**
 * Whether all of the cubic's points line up with `next`'s. For straight lines, that is whether
 * `next` continues the cubic.
 */
export function alignsIshWith(c: Cubic, next: Cubic): boolean {
  return (
    (straightIsh(c) && straightIsh(next) && smoothesIntoIsh(c, next)) ||
    zeroLength(c) ||
    zeroLength(next)
  );
}

/** A cubic that extends `a` to `b`'s second anchor point */
function extend(a: Cubic, b: Cubic): Cubic {
  return zeroLength(a)
    ? [a[0], a[1], b[2], b[3], b[4], b[5], b[6], b[7]]
    : [a[0], a[1], a[2], a[3], a[4], a[5], b[6], b[7]];
}
