// Morphs: shapes in between two polygons, at any progress from one to the other.
//
// Ported from androidx graphics-shapes, Morph.kt, at androidx 079e2e3. Copyright 2022 The Android
// Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; `createMorph` returns an object rather than constructing a class, `asCubics` is
// `cubics`, bounds are `{ left, top, right, bottom }` objects, and `forEachCubic` (which reused a
// `MutableCubic`) and the debug logging are left out.

import { interpolateCubic, type Cubic } from './cubic';
import { featureMapper } from './feature-mapping';
import { ANGLE_EPSILON, positiveModulo } from './math';
import { LengthMeasurer, MeasuredPolygon, type MeasuredCubic } from './polygon-measure';
import {
  calculateBounds,
  calculateMaxBounds,
  type RoundedPolygon,
  type ShapeBounds,
} from './polygon';

/** The shapes between a start and an end polygon. Make one with `createMorph`. */
export interface Morph {
  /**
   * The shape at `progress`, as one closed run of cubics. 0 is the start shape, 1 the end shape,
   * and values in between interpolate linearly. Values just outside 0..1 exaggerate the change,
   * for a bounce or an overshoot; values far outside make undefined shapes.
   */
  cubics(progress: number): Cubic[];
  /**
   * The axis-aligned bounds of the start and end shapes together. With `approximate`, the default,
   * from all their anchor and control points, which is faster; without, the true bounds of their
   * curves.
   */
  bounds(options?: { approximate?: boolean }): ShapeBounds;
  /**
   * A square that holds the start and end shapes in any rotation, from the largest distance from
   * each one's center to the start or middle of its cubics.
   */
  maxBounds(): ShapeBounds;
}

const union = (a: readonly number[], b: readonly number[]): ShapeBounds => ({
  left: Math.min(a[0]!, b[0]!),
  top: Math.min(a[1]!, b[1]!),
  right: Math.max(a[2]!, b[2]!),
  bottom: Math.max(a[3]!, b[3]!),
});

/**
 * Prepares the shapes between two polygons.
 *
 * Morphing between arbitrary shapes is hard, since it isn't clear how the points of one map to
 * the points of the other. Polygons make it simpler: each one's outline is contiguous from start
 * to end, and all of it is cubics, so two polygons differ only in the number and placement of
 * their curves. The morph maps the curves of the two shapes to each other, by proximity, distance
 * to the vertices, and concavity, and splits curves where the shapes have different numbers of them
 * or place them very differently.
 *
 * The matching happens here, once; `cubics(progress)` then only interpolates.
 */
export function createMorph(start: RoundedPolygon, end: RoundedPolygon): Morph {
  const morphMatch = match(start, end);
  return {
    cubics(progress) {
      // The first/last mechanism makes the final anchor point exactly the first one: rendering
      // artifacts can come from those points being slightly off, even by much less than a pixel.
      const cubics: Cubic[] = [];
      let firstCubic: Cubic | undefined;
      let lastCubic: Cubic | undefined;
      for (const [c1, c2] of morphMatch) {
        const cubic = interpolateCubic(c1, c2, progress);
        if (!firstCubic) firstCubic = cubic;
        if (lastCubic) cubics.push(lastCubic);
        lastCubic = cubic;
      }
      if (lastCubic && firstCubic) {
        cubics.push([...lastCubic.slice(0, 6), firstCubic[0], firstCubic[1]] as unknown as Cubic);
      }
      return cubics;
    },
    bounds(options = {}) {
      const approximate = options.approximate ?? true;
      return union(calculateBounds(start, approximate), calculateBounds(end, approximate));
    },
    maxBounds() {
      return union(calculateMaxBounds(start), calculateMaxBounds(end));
    },
  };
}

/**
 * The pairs of cubics a morph interpolates between, matched one to one: the first of each pair
 * holds the start shape's geometry, the second the end shape's. Curves are matched where possible,
 * and cut where one shape has more of them than the other. A `Measurer` finds where the points lie
 * along each outline, and `featureMapper` decides how the curves map to each other.
 */
export function match(p1: RoundedPolygon, p2: RoundedPolygon): [Cubic, Cubic][] {
  // Measure the polygons: their measured cubics are what we match.
  const measuredPolygon1 = MeasuredPolygon.measurePolygon(new LengthMeasurer(), p1);
  const measuredPolygon2 = MeasuredPolygon.measurePolygon(new LengthMeasurer(), p2);

  // The corners (just the inner circular curve) of each polygon, with the progress at their
  // middle, which the two polygons are compared and matched by
  const features1 = measuredPolygon1.features;
  const features2 = measuredPolygon2.features;

  // Map the features of each shape to the closest feature of the other. Given progress on one
  // shape, the mapper finds the matching progress on the other, both ways.
  const doubleMapper = featureMapper(features1, features2);

  // The cut point on polygon 2 is where the 0 point of polygon 1 maps to.
  const polygon2CutPoint = doubleMapper.map(0);

  // Cut and rotate. Both polygons start at progress 0, and the mapper matches progress 0 on the
  // first to polygon2CutPoint on the second, so cut the second there and rotate it: walking
  // through both polygons then finds the matches. bs1 and bs2 are measured polygons whose cubics
  // start from outline progress 0 and increase to 1.
  const bs1 = measuredPolygon1;
  const bs2 = measuredPolygon2.cutAndShift(polygon2CutPoint);

  // Match: compare the two lists of measured cubics, and pair the start and end curves that make
  // the morph, which interpolates between them.
  const ret: [Cubic, Cubic][] = [];
  // The index of the current cubic on the start (1) and end (2) shapes
  let i1 = 0;
  let i2 = 0;
  // The current measured cubic of each polygon
  let b1: MeasuredCubic | undefined = bs1.get(i1++);
  let b2: MeasuredCubic | undefined = bs2.get(i2++);
  // Until every curve is matched
  while (b1 && b2) {
    // Progress, from shape 1's perspective: where the current measured cubics end, in [0, 1]
    const b1a = i1 === bs1.size ? 1 : b1.endOutlineProgress;
    const b2a =
      i2 === bs2.size
        ? 1
        : doubleMapper.mapBack(positiveModulo(b2.endOutlineProgress + polygon2CutPoint, 1));
    const minb = Math.min(b1a, b2a);
    // minb is the progress at which the curve that ends first ends. If both curves end roughly
    // there, they match without a cut; if one extends beyond, it is cut.
    let seg1: MeasuredCubic;
    let newb1: MeasuredCubic | undefined;
    if (b1a > minb + ANGLE_EPSILON) [seg1, newb1] = b1.cutAtProgress(minb);
    else [seg1, newb1] = [b1, bs1.get(i1++)];
    let seg2: MeasuredCubic;
    let newb2: MeasuredCubic | undefined;
    if (b2a > minb + ANGLE_EPSILON) {
      [seg2, newb2] = b2.cutAtProgress(
        positiveModulo(doubleMapper.map(minb) - polygon2CutPoint, 1),
      );
    } else [seg2, newb2] = [b2, bs2.get(i2++)];
    ret.push([seg1.cubic, seg2.cubic]);
    b1 = newb1;
    b2 = newb2;
  }
  if (b1 || b2) throw new Error("Expected both Polygon's Cubic to be fully matched");
  return ret;
}
