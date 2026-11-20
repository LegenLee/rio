// Groups of cubics with a meaning: edges, convex corners, and concave corners.
//
// Ported from androidx graphics-shapes, Features.kt, at androidx 079e2e3. Copyright 2023 The
// Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; the `Feature` class and its `Edge` and `Corner` subclasses are a union of plain
// objects told apart by `type`, and the methods and factory are functions.

import { reverseCubic, transformCubic, type Cubic, type PointTransformer } from './cubic';
import { DISTANCE_EPSILON } from './math';

/**
 * An edge: cubics that lie between corners, with no vertex or concavity of their own. Edges,
 * including those from `ignorableFeature`, are left out of a morph's default mapping.
 */
export interface EdgeFeature {
  readonly type: 'edge';
  readonly cubics: readonly Cubic[];
}

/**
 * A corner: the cubics that round it (or a single point, unrounded), and whether it is convex, an
 * outward point of the shape, or concave, an inward one. A regular polygon has only convex
 * corners; a star usually has convex outer and concave inner ones.
 */
export interface CornerFeature {
  readonly type: 'corner';
  readonly cubics: readonly Cubic[];
  readonly convex: boolean;
}

/**
 * Groups a shape's cubics into straight edges, convex corners, and concave corners. A shape can
 * be drawn from its cubics alone, but features give them context: rounding a rectangle adds many
 * cubics, while it still has four corners. Morphs use them to reduce the noise individual cubics
 * add, as the base of their mapping, and to map convex corners to convex ones and concave to
 * concave.
 */
export type PolygonFeature = EdgeFeature | CornerFeature;

/** An edge, unchecked (the original's `Feature.Edge` constructor) */
export function edge(cubics: readonly Cubic[]): EdgeFeature {
  return { type: 'edge', cubics };
}

/** A corner, unchecked (the original's `Feature.Corner` constructor) */
export function corner(cubics: readonly Cubic[], convex = true): CornerFeature {
  return { type: 'corner', cubics, convex };
}

function isContinuous(feature: PolygonFeature): boolean {
  let prevCubic = feature.cubics[0]!;
  for (let index = 1; index < feature.cubics.length; index++) {
    const cubic = feature.cubics[index]!;
    if (
      Math.abs(cubic[0] - prevCubic[6]) > DISTANCE_EPSILON ||
      Math.abs(cubic[1] - prevCubic[7]) > DISTANCE_EPSILON
    ) {
      return false;
    }
    prevCubic = cubic;
  }
  return true;
}

function validated<F extends PolygonFeature>(feature: F): F {
  if (feature.cubics.length === 0) throw new Error('Features need at least one cubic.');
  if (!isContinuous(feature)) {
    throw new Error(
      'Feature must be continuous, with the anchor points of all cubics matching the anchor ' +
        'points of the preceding and succeeding cubics',
    );
  }
  return feature;
}

/**
 * Groups cubics into a feature that a morph's default mapping ignores. Only the features that
 * aren't ignored transition smoothly between the shapes, and the mapping matches convex corners to
 * convex ones and concave to concave, so marking features ignorable steers it: a 12-pointed star
 * with its concave corners ignorable morphs by its outer points alone, often with fewer
 * crossings and turns.
 *
 * @throws If `cubics` is empty, or the cubics don't join end to end.
 */
export function ignorableFeature(cubics: readonly Cubic[]): EdgeFeature {
  return validated(edge(cubics));
}

/** An edge of a single cubic, neither inward nor outward. */
export function edgeFeature(cubic: Cubic): EdgeFeature {
  return edge([cubic]);
}

/**
 * Groups cubics into a corner: convex, an outward point of the shape, or concave, an inward one.
 * Marking a square's top edge as a convex corner, for one, matches it to a triangle's top corner
 * in a morph.
 *
 * @throws If `cubics` is empty, or the cubics don't join end to end.
 */
export function cornerFeature(cubics: readonly Cubic[], convex: boolean): CornerFeature {
  return validated(corner(cubics, convex));
}

/** The feature with each of its points transformed by `f` */
export function transformFeature<F extends PolygonFeature>(feature: F, f: PointTransformer): F {
  return { ...feature, cubics: feature.cubics.map((c) => transformCubic(c, f)) };
}

/**
 * The feature with its cubics in reverse order, each reversed. A corner's `convex` flips with it.
 */
export function reverseFeature<F extends PolygonFeature>(feature: F): F {
  const cubics: Cubic[] = [];
  for (let i = feature.cubics.length - 1; i >= 0; i--)
    cubics.push(reverseCubic(feature.cubics[i]!));
  // From the original: the flag flips until RoundedPolygon ignores the orientation it was set for
  // (b/369320447).
  return feature.type === 'corner'
    ? ({ ...feature, cubics, convex: !feature.convex } as F)
    : ({ ...feature, cubics } as F);
}
