// Maps the corners of one shape to the corners of another, for a morph. Not exported from the
// package.
//
// Ported from androidx graphics-shapes, FeatureMapping.kt, at androidx 079e2e3. Copyright 2023 The
// Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; the data classes are plain objects, compared by identity where the original puts
// them in sets. The debug logging is left out.

import type { PolygonFeature } from './features';
import { DoubleMapper, progressDistance, progressInRange } from './float-mapping';
import { DISTANCE_EPSILON, FLOAT_MAX_VALUE } from './math';
import { Point } from './point';

/** A feature of a polygon, with the [0..1] outline progress at it */
export interface ProgressableFeature {
  readonly progress: number;
  readonly feature: PolygonFeature;
}

/** All the features of a polygon, with their progress */
export type MeasuredFeatures = readonly ProgressableFeature[];

/** A mapping between the features (rounded corners) of two shapes */
export function featureMapper(
  features1: MeasuredFeatures,
  features2: MeasuredFeatures,
): DoubleMapper {
  // Only corners count for the mapping.
  const filteredFeatures1 = features1.filter((f) => f.feature.type === 'corner');
  const filteredFeatures2 = features2.filter((f) => f.feature.type === 'corner');
  const featureProgressMapping = doMapping(filteredFeatures1, filteredFeatures2);
  return new DoubleMapper(...featureProgressMapping);
}

interface DistanceVertex {
  readonly distance: number;
  readonly f1: ProgressableFeature;
  readonly f2: ProgressableFeature;
}

const IDENTITY_MAPPING: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.5, 0.5],
];

/**
 * A mapping of features1 to features2: pairs of a feature's progress in features1 and the progress
 * of the feature in features2 it maps to, sorted by the first. To do this:
 *
 * 1. Compute the distance of every pair of features in (features1 x features2),
 * 2. Sort the pairs ascending by that distance,
 * 3. Add them, from the smallest distance to the biggest, as long as a) neither feature is mapped
 *    yet, and b) the mapping gains no crossing. Since the mapping is sorted by the first element of
 *    each pair, that means the second elements increase monotonically, except maybe once (counting
 *    every pair of consecutive elements, and the last to the first).
 */
export function doMapping(
  features1: readonly ProgressableFeature[],
  features2: readonly ProgressableFeature[],
): (readonly [number, number])[] {
  const distanceVertexList: DistanceVertex[] = [];
  for (const f1 of features1) {
    for (const f2 of features2) {
      const d = featureDistSquared(f1.feature, f2.feature);
      if (d !== FLOAT_MAX_VALUE) distanceVertexList.push({ distance: d, f1, f2 });
    }
  }
  // Stable, as Kotlin's sortedBy
  distanceVertexList.sort((a, b) => a.distance - b.distance);

  // Special cases
  if (distanceVertexList.length === 0) return [...IDENTITY_MAPPING];
  if (distanceVertexList.length === 1) {
    const f1 = distanceVertexList[0]!.f1.progress;
    const f2 = distanceVertexList[0]!.f2.progress;
    return [
      [f1, f2],
      [(f1 + 0.5) % 1, (f2 + 0.5) % 1],
    ];
  }

  const helper = new MappingHelper();
  for (const { f1, f2 } of distanceVertexList) helper.addMapping(f1, f2);
  return helper.mapping;
}

/**
 * Kotlin's `binarySearchBy`: the index of the element whose key is `key`, or, if there is none,
 * `-(insertion point) - 1`.
 */
function binarySearchBy<T>(list: readonly T[], key: number, selector: (t: T) => number): number {
  let low = 0;
  let high = list.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    const midVal = selector(list[mid]!);
    if (midVal < key) low = mid + 1;
    else if (midVal > key) high = mid - 1;
    else return mid;
  }
  return -(low + 1);
}

class MappingHelper {
  /** Mappings from progress in the start shape to progress in the end shape, sorted by the first */
  readonly mapping: (readonly [number, number])[] = [];

  // The features already used in the start shape and in the end shape
  private readonly usedF1 = new Set<ProgressableFeature>();
  private readonly usedF2 = new Set<ProgressableFeature>();

  addMapping(f1: ProgressableFeature, f2: ProgressableFeature): void {
    // Don't map the same feature twice.
    if (this.usedF1.has(f1) || this.usedF2.has(f2)) return;

    // The mapping is sorted: find where this one goes.
    const index = binarySearchBy(this.mapping, f1.progress, (m) => m[0]);
    if (index >= 0) throw new Error("There can't be two features with the same progress");

    const insertionIndex = -index - 1;
    const n = this.mapping.length;

    // The first element can always go in.
    if (n >= 1) {
      const [before1, before2] = this.mapping[(insertionIndex + n - 1) % n]!;
      const [after1, after2] = this.mapping[insertionIndex % n]!;

      // Features too close to each other would make the DoubleMapper unstable.
      if (
        progressDistance(f1.progress, before1) < DISTANCE_EPSILON ||
        progressDistance(f1.progress, after1) < DISTANCE_EPSILON ||
        progressDistance(f2.progress, before2) < DISTANCE_EPSILON ||
        progressDistance(f2.progress, after2) < DISTANCE_EPSILON
      ) {
        return;
      }

      // With 2 or more elements, make sure this adds no crossings.
      if (n > 1 && !progressInRange(f2.progress, before2, after2)) return;
    }

    // All good: add the mapping.
    this.mapping.splice(insertionIndex, 0, [f1.progress, f2.progress]);
    this.usedF1.add(f1);
    this.usedF2.add(f2);
  }
}

/**
 * The squared distance between two features of different shapes, which decides how their
 * features (and the curves that make them up) are mapped. Corners of different concavity are
 * never mapped to each other: their distance is `FLOAT_MAX_VALUE`.
 */
export function featureDistSquared(f1: PolygonFeature, f2: PolygonFeature): number {
  // From the original: concave-convex matching might be wanted in some situations, which this
  // approach doesn't allow.
  if (f1.type === 'corner' && f2.type === 'corner' && f1.convex !== f2.convex) {
    return FLOAT_MAX_VALUE;
  }
  return featureRepresentativePoint(f1).minus(featureRepresentativePoint(f2)).getDistanceSquared();
}

/** The point between a feature's first and last anchors */
export function featureRepresentativePoint(feature: PolygonFeature): Point {
  const first = feature.cubics[0]!;
  const last = feature.cubics[feature.cubics.length - 1]!;
  return new Point((first[0] + last[6]) / 2, (first[1] + last[7]) / 2);
}
