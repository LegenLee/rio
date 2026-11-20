// Polygons with optionally rounded vertices: the shapes that morphs go between.
//
// Ported from androidx graphics-shapes, RoundedPolygon.kt, at androidx 079e2e3. Copyright 2022 The
// Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; a polygon is a plain object rather than a class, its constructors are
// `roundedPolygon` and `polygonFromFeatures` with options objects, its methods are functions, and
// bounds are `{ left, top, right, bottom }` objects.

import type { CornerRounding } from './corner-rounding';
import {
  arcCubic,
  cubicBounds,
  cubicFromPoints,
  pointOnCurve,
  reverseCubic,
  splitCubic,
  straightCubic,
  zeroLength,
  type Cubic,
  type PointTransformer,
} from './cubic';
import { corner, edge, transformFeature, type PolygonFeature } from './features';
import {
  convex,
  directionVector,
  distance,
  distanceSquared,
  DISTANCE_EPSILON,
  FLOAT_MAX_VALUE,
  FLOAT_MIN_VALUE,
  FLOAT_PI,
  radialToCartesian,
  square,
} from './math';
import { interpolatePoint, Point } from './point';

/** A point, as the shape API takes and gives them */
export interface ShapePoint {
  readonly x: number;
  readonly y: number;
}

/** An axis-aligned bounding box */
export interface ShapeBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/**
 * A polygonal shape with optionally rounded vertices. Make one with `roundedPolygon`, the shape
 * functions (`circlePolygon`, `starPolygon`, ...), `polygonFromFeatures`, or `materialShape`.
 */
export interface RoundedPolygon {
  /** The edges and corners of the outline, which a morph maps between shapes */
  readonly features: readonly PolygonFeature[];
  /** The outline as one closed run of cubics, the features flattened */
  readonly cubics: readonly Cubic[];
  readonly center: ShapePoint;
}

/**
 * Flattens the features into one closed run of cubics. The first/last mechanism makes the final
 * anchor point exactly the first one: rendering artifacts can come from those points being
 * slightly off, even by much less than a pixel.
 */
function flatten(features: readonly PolygonFeature[], center: Point): Cubic[] {
  const cubics: Cubic[] = [];
  let firstCubic: Cubic | undefined;
  let lastCubic: Cubic | undefined;
  let firstFeatureSplitStart: Cubic[] | undefined;
  let firstFeatureSplitEnd: Cubic[] | undefined;
  if (features.length > 0 && features[0]!.cubics.length === 3) {
    const centerCubic = features[0]!.cubics[1]!;
    const [start, end] = splitCubic(centerCubic, 0.5);
    firstFeatureSplitStart = [features[0]!.cubics[0]!, start];
    firstFeatureSplitEnd = [end, features[0]!.cubics[2]!];
  }
  // Iterating one past the features allows inserting the initial split cubic, if there is one.
  for (let i = 0; i <= features.length; i++) {
    let featureCubics: readonly Cubic[];
    if (i === 0 && firstFeatureSplitEnd) featureCubics = firstFeatureSplitEnd;
    else if (i === features.length) {
      if (firstFeatureSplitStart) featureCubics = firstFeatureSplitStart;
      else break;
    } else featureCubics = features[i]!.cubics;
    for (const cubic of featureCubics) {
      // Skip zero-length curves; they add nothing and can trigger rendering artifacts
      if (!zeroLength(cubic)) {
        if (lastCubic) cubics.push(lastCubic);
        lastCubic = cubic;
        if (!firstCubic) firstCubic = cubic;
      } else if (lastCubic) {
        // Dropping several zero-ish length curves in a row can lead to enough discontinuity to
        // throw an error later, even though the distances are quite small. Account for that by
        // making the last cubic use the latest anchor point, always.
        lastCubic = [...lastCubic.slice(0, 6), cubic[6], cubic[7]] as unknown as Cubic;
      }
    }
  }
  if (lastCubic && firstCubic) {
    cubics.push([...lastCubic.slice(0, 6), firstCubic[0], firstCubic[1]] as unknown as Cubic);
  } else {
    // Empty / 0-sized polygon
    cubics.push([center.x, center.y, center.x, center.y, center.x, center.y, center.x, center.y]);
  }
  return cubics;
}

/**
 * A polygon from its features and center (the original's internal constructor). Throws if the
 * cubics don't join end to end.
 */
export function polygonOf(features: readonly PolygonFeature[], center: Point): RoundedPolygon {
  const cubics = flatten(features, center);
  let prevCubic = cubics[cubics.length - 1]!;
  for (const cubic of cubics) {
    if (
      Math.abs(cubic[0] - prevCubic[6]) > DISTANCE_EPSILON ||
      Math.abs(cubic[1] - prevCubic[7]) > DISTANCE_EPSILON
    ) {
      throw new Error(
        'RoundedPolygon must be contiguous, with the anchor points of all curves matching the ' +
          'anchor points of the preceding and succeeding cubics',
      );
    }
    prevCubic = cubic;
  }
  return { features, cubics, center: { x: center.x, y: center.y } };
}

const centerOf = (polygon: RoundedPolygon) => new Point(polygon.center.x, polygon.center.y);

/**
 * The polygon with each of its points, center included, transformed by `f`: scaled, translated,
 * rotated, and so on.
 */
export function transformPolygon(polygon: RoundedPolygon, f: PointTransformer): RoundedPolygon {
  const center = centerOf(polygon).transformed(f);
  return polygonOf(
    polygon.features.map((feature) => transformFeature(feature, f)),
    center,
  );
}

/**
 * The polygon moved and resized to fit the square from (0, 0) to (1, 1), centered in the
 * direction that has room to spare.
 */
export function normalizePolygon(polygon: RoundedPolygon): RoundedPolygon {
  const bounds = calculateBounds(polygon);
  const width = bounds[2] - bounds[0];
  const height = bounds[3] - bounds[1];
  const side = Math.max(width, height);
  // Center the shape if the bounds aren't a square
  const offsetX = (side - width) / 2 - bounds[0]; /* left */
  const offsetY = (side - height) / 2 - bounds[1]; /* top */
  return transformPolygon(polygon, (x, y) => [(x + offsetX) / side, (y + offsetY) / side]);
}

/** `polygonMaxBounds`, as `[left, top, right, bottom]` (the original's `calculateMaxBounds`) */
export function calculateMaxBounds(
  polygon: RoundedPolygon,
): [left: number, top: number, right: number, bottom: number] {
  const { x: centerX, y: centerY } = polygon.center;
  let maxDistSquared = 0;
  for (const cubic of polygon.cubics) {
    const anchorDistance = distanceSquared(cubic[0] - centerX, cubic[1] - centerY);
    const middlePoint = pointOnCurve(cubic, 0.5);
    const middleDistance = distanceSquared(middlePoint.x - centerX, middlePoint.y - centerY);
    maxDistSquared = Math.max(maxDistSquared, Math.max(anchorDistance, middleDistance));
  }
  const d = Math.sqrt(maxDistSquared);
  return [centerX - d, centerY - d, centerX + d, centerY + d];
}

/** `polygonBounds`, as `[left, top, right, bottom]` (the original's `calculateBounds`) */
export function calculateBounds(
  polygon: RoundedPolygon,
  approximate = true,
): [left: number, top: number, right: number, bottom: number] {
  // As in the original, the maximums start from the smallest positive number rather than the most
  // negative one, so a right or bottom edge below 0 comes out as about 0.
  let minX = FLOAT_MAX_VALUE;
  let minY = FLOAT_MAX_VALUE;
  let maxX = FLOAT_MIN_VALUE;
  let maxY = FLOAT_MIN_VALUE;
  for (const cubic of polygon.cubics) {
    const bounds = cubicBounds(cubic, approximate);
    minX = Math.min(minX, bounds[0]);
    minY = Math.min(minY, bounds[1]);
    maxX = Math.max(maxX, bounds[2]);
    maxY = Math.max(maxY, bounds[3]);
  }
  return [minX, minY, maxX, maxY];
}

const toBounds = ([left, top, right, bottom]: readonly number[]): ShapeBounds => ({
  left: left!,
  top: top!,
  right: right!,
  bottom: bottom!,
});

/**
 * A square around the polygon's center that holds it in any rotation: its size is the largest
 * distance from the center to the start or middle of a cubic. For the room a UI element needs to
 * show the shape rotating.
 */
export function polygonMaxBounds(polygon: RoundedPolygon): ShapeBounds {
  return toBounds(calculateMaxBounds(polygon));
}

/**
 * The polygon's axis-aligned bounds. With `approximate`, the default, it is the faster box around
 * all its anchor and control points; without, the true bounds of its curves.
 *
 * Like the original, the right and bottom edges are never less than 0: a polygon entirely left of,
 * or above, the origin reports 0 there.
 */
export function polygonBounds(
  polygon: RoundedPolygon,
  options: { approximate?: boolean } = {},
): ShapeBounds {
  return toBounds(calculateBounds(polygon, options.approximate ?? true));
}

interface RoundingOptions {
  /**
   * How every vertex is rounded, unless `perVertexRounding` is given. Defaults to unrounded: the
   * outline goes through the vertices themselves.
   */
  rounding?: CornerRounding;
  /** How each vertex is rounded, one for each vertex. Overrides `rounding`. */
  perVertexRounding?: readonly CornerRounding[];
}

/** A regular polygon: `numVertices` vertices equally spaced on a circle */
export interface RegularPolygonOptions extends RoundingOptions {
  /** At least 3 */
  numVertices: number;
  /**
   * The distance of each vertex from the center. Defaults to 1, which makes a shape 2 wide and
   * tall that usually needs transforming to its size in the UI.
   */
  radius?: number;
  /** Defaults to (0, 0). */
  center?: ShapePoint;
}

/** A polygon through the given vertices */
export interface VerticesPolygonOptions extends RoundingOptions {
  /**
   * The vertices as x, y pairs, in order: the outline goes from each to the next. At least 3
   * vertices.
   */
  vertices: readonly number[];
  /** Defaults to the average of the vertices. */
  center?: ShapePoint;
}

/**
 * A polygon with optionally rounded vertices: either `numVertices` vertices equally spaced on a
 * circle of `radius` around `center`, or the given `vertices` in order.
 *
 * @throws If there are fewer than 3 vertices, or `perVertexRounding` doesn't have one rounding
 *   for each vertex.
 */
export function roundedPolygon(
  options: RegularPolygonOptions | VerticesPolygonOptions,
): RoundedPolygon {
  if ('numVertices' in options) {
    const {
      numVertices,
      radius = 1,
      center = { x: 0, y: 0 },
      rounding,
      perVertexRounding,
    } = options;
    return polygonFromVertices(
      verticesFromNumVerts(numVertices, radius, center.x, center.y),
      rounding,
      perVertexRounding,
      center,
    );
  }
  return polygonFromVertices(
    options.vertices,
    options.rounding,
    options.perVertexRounding,
    options.center,
  );
}

/**
 * Builds the polygon around the vertices, rounding them (or not) as given: the original's
 * constructor from vertices, with an absent center where it takes `Float.MIN_VALUE`.
 */
function polygonFromVertices(
  vertices: readonly number[],
  rounding: CornerRounding = {},
  perVertexRounding: readonly CornerRounding[] | undefined,
  center: ShapePoint | undefined,
): RoundedPolygon {
  if (vertices.length < 6) throw new Error('Polygons must have at least 3 vertices');
  if (vertices.length % 2 === 1) throw new Error('The vertices array should have even size');
  if (perVertexRounding && perVertexRounding.length * 2 !== vertices.length) {
    throw new Error(
      'perVertexRounding list should be either null or the same size as the number of vertices ' +
        '(vertices.size / 2)',
    );
  }
  const vertex = (i: number) => new Point(vertices[i * 2]!, vertices[i * 2 + 1]!);
  const n = vertices.length / 2;
  const roundedCorners: RoundedCorner[] = [];
  for (let i = 0; i < n; i++) {
    const vtxRounding = perVertexRounding?.[i] ?? rounding;
    roundedCorners.push(
      new RoundedCorner(vertex((i + n - 1) % n), vertex(i), vertex((i + 1) % n), vtxRounding),
    );
  }

  // For each side, check if there is enough space for the cuts needed, and if not, split the
  // available space, first for round cuts, then for smoothing if there is space left. Each element
  // is how much of the cut the side can take (side i goes from corner i to corner i + 1): first,
  // how much of expectedRoundCut, then how much of expectedCut.
  const cutAdjusts: [number, number][] = [];
  for (let ix = 0; ix < n; ix++) {
    const next = roundedCorners[(ix + 1) % n]!;
    const expectedRoundCut = roundedCorners[ix]!.expectedRoundCut + next.expectedRoundCut;
    const expectedCut = roundedCorners[ix]!.expectedCut + next.expectedCut;
    const vtx = vertex(ix);
    const nextVtx = vertex((ix + 1) % n);
    const sideSize = distance(vtx.x - nextVtx.x, vtx.y - nextVtx.y);

    // Check expectedRoundCut first, and fulfill rounding needs first for both corners before
    // using space for smoothing.
    if (expectedRoundCut > sideSize) {
      // Not enough room for fully rounding: see how much we can actually do.
      cutAdjusts.push([sideSize / expectedRoundCut, 0]);
    } else if (expectedCut > sideSize) {
      // Full rounding, but not full smoothing
      cutAdjusts.push([1, (sideSize - expectedRoundCut) / (expectedCut - expectedRoundCut)]);
    } else {
      // Enough room for rounding and smoothing
      cutAdjusts.push([1, 1]);
    }
  }

  // The cubics for each (potentially) rounded corner
  const corners: Cubic[][] = [];
  for (let i = 0; i < n; i++) {
    // allowedCuts[0] is for the side from the previous corner to this one, allowedCuts[1] for the
    // side from this corner to the next one.
    const allowedCuts: number[] = [];
    const rc = roundedCorners[i]!;
    for (let delta = 0; delta <= 1; delta++) {
      const [roundCutRatio, cutRatio] = cutAdjusts[(i + n - 1 + delta) % n]!;
      allowedCuts.push(
        rc.expectedRoundCut * roundCutRatio + (rc.expectedCut - rc.expectedRoundCut) * cutRatio,
      );
    }
    corners.push(rc.getCubics(allowedCuts[0]!, allowedCuts[1]!));
  }

  // The rounded corners, with new cubics for the edges between them
  const features: PolygonFeature[] = [];
  for (let i = 0; i < n; i++) {
    const isConvex = convex(vertex((i + n - 1) % n), vertex(i), vertex((i + 1) % n));
    features.push(corner(corners[i]!, isConvex));
    const last = corners[i]![corners[i]!.length - 1]!;
    const first = corners[(i + 1) % n]![0]!;
    features.push(edge([straightCubic(last[6], last[7], first[0], first[1])]));
  }

  return polygonOf(features, center ? new Point(center.x, center.y) : calculateCenter(vertices));
}

/**
 * A polygon from features that describe each part of its outline. Giving the features directly
 * controls how a morph maps the shape: it maps curves of the same type (convex or concave) to each
 * other.
 *
 * @param center Defaults to the average of the cubics' anchor points.
 * @throws If there are fewer than 2 features, or they don't make a closed shape.
 */
export function polygonFromFeatures(
  features: readonly PolygonFeature[],
  center?: ShapePoint,
): RoundedPolygon {
  if (features.length < 2) throw new Error('Polygons must have at least 2 features');
  const vertices: number[] = [];
  for (const feature of features) {
    for (const cubic of feature.cubics) vertices.push(cubic[0], cubic[1]);
  }
  // The original takes each coordinate of the center separately, NaN where it's missing.
  return polygonOf(features, center ? new Point(center.x, center.y) : calculateCenter(vertices));
}

/**
 * An estimate of the polygon's center: the average of the vertices. It moves with the shape when
 * the shape is transformed.
 */
export function calculateCenter(vertices: readonly number[]): Point {
  let cumulativeX = 0;
  let cumulativeY = 0;
  let index = 0;
  while (index < vertices.length) {
    cumulativeX += vertices[index++]!;
    cumulativeY += vertices[index++]!;
  }
  return new Point(cumulativeX / (vertices.length / 2), cumulativeY / (vertices.length / 2));
}

/**
 * One corner of a polygon. Without rounding, the corner is the point `p1`, as a cubic of length 0.
 * With it, the corner follows a curve that approximates a circular arc of the rounding's radius,
 * or three curves when the rounding has smoothing: a circular arc in the middle and two
 * symmetrical flanking curves, whose curvature the smoothing sets.
 *
 * It is a class because the work takes two steps, with state kept between them: first how much to
 * cut to meet the rounding, then, given how much there is room to cut, the curves.
 *
 * @param p0 the vertex before the one being rounded
 * @param p1 the vertex of this rounded corner
 * @param p2 the vertex after the one being rounded
 */
class RoundedCorner {
  readonly d1: Point;
  readonly d2: Point;
  readonly cornerRadius: number;
  readonly smoothing: number;
  readonly cosAngle: number;
  readonly sinAngle: number;
  readonly expectedRoundCut: number;
  /**
   * The center of the circle the rounding curve approximates (or the middle of the three curves,
   * with smoothing). It is p1 if there is no rounding.
   */
  center = new Point(0, 0);

  constructor(
    readonly p0: Point,
    readonly p1: Point,
    readonly p2: Point,
    readonly rounding?: CornerRounding,
  ) {
    const v01 = p0.minus(p1);
    const v21 = p2.minus(p1);
    const d01 = v01.getDistance();
    const d21 = v21.getDistance();
    if (d01 > 0 && d21 > 0) {
      this.d1 = v01.div(d01);
      this.d2 = v21.div(d21);
      this.cornerRadius = rounding?.radius ?? 0;
      this.smoothing = rounding?.smoothing ?? 0;

      // The cosine of the angle at p1 is the dot product of the unit vectors to the other two
      // vertices.
      this.cosAngle = this.d1.dotProduct(this.d2);

      // Identity: sin^2 + cos^2 = 1; sinAngle gives us the intersection
      this.sinAngle = Math.sqrt(1 - square(this.cosAngle));
      // How much to cut, as measured on a side, to get the required radius: where the rounding
      // circle hits the edge. This uses the identity tan(A/2) = sinA/(1 + cosA), where tan(A/2) =
      // radius/cut.
      this.expectedRoundCut =
        this.sinAngle > 1e-3 ? (this.cornerRadius * (this.cosAngle + 1)) / this.sinAngle : 0;
    } else {
      // One (or both) of the sides is empty; not much we can do.
      this.d1 = new Point(0, 0);
      this.d2 = new Point(0, 0);
      this.cornerRadius = 0;
      this.smoothing = 0;
      this.cosAngle = 0;
      this.sinAngle = 0;
      this.expectedRoundCut = 0;
    }
  }

  /** Smoothing changes the actual cut: 0 is the same as expectedRoundCut, 1 doubles it. */
  get expectedCut(): number {
    return (1 + this.smoothing) * this.expectedRoundCut;
  }

  getCubics(allowedCut0: number, allowedCut1 = allowedCut0): Cubic[] {
    const { p0, p1, p2, d1, d2 } = this;
    // The minimum of both cuts sets the radius, but more space on one side can go to smoothing.
    const allowedCut = Math.min(allowedCut0, allowedCut1);
    // Nothing to do: just use lines, or a point
    if (
      this.expectedRoundCut < DISTANCE_EPSILON ||
      allowedCut < DISTANCE_EPSILON ||
      this.cornerRadius < DISTANCE_EPSILON
    ) {
      this.center = p1;
      return [straightCubic(p1.x, p1.y, p1.x, p1.y)];
    }
    // How much of the cut the rounding needs
    const actualRoundCut = Math.min(allowedCut, this.expectedRoundCut);
    // One smoothing value for each side of the vertex. Space goes to rounding first; smoothing,
    // if requested, gets what is left.
    const actualSmoothing0 = this.calculateActualSmoothingValue(allowedCut0);
    const actualSmoothing1 = this.calculateActualSmoothingValue(allowedCut1);
    // Scale the radius if needed
    const actualR = (this.cornerRadius * actualRoundCut) / this.expectedRoundCut;
    // Distance from the corner (p1) to the center
    const centerDistance = Math.sqrt(square(actualR) + square(actualRoundCut));
    // Center of the arc we will use for rounding
    this.center = p1.plus(d1.plus(d2).div(2).getDirection().times(centerDistance));
    const circleIntersection0 = p1.plus(d1.times(actualRoundCut));
    const circleIntersection2 = p1.plus(d2.times(actualRoundCut));
    const flanking0 = computeFlankingCurve(
      actualRoundCut,
      actualSmoothing0,
      p1,
      p0,
      circleIntersection0,
      circleIntersection2,
      this.center,
      actualR,
    );
    const flanking2 = reverseCubic(
      computeFlankingCurve(
        actualRoundCut,
        actualSmoothing1,
        p1,
        p2,
        circleIntersection2,
        circleIntersection0,
        this.center,
        actualR,
      ),
    );
    return [
      flanking0,
      arcCubic(
        this.center.x,
        this.center.y,
        flanking0[6],
        flanking0[7],
        flanking2[0],
        flanking2[1],
      ),
      flanking2,
    ];
  }

  /**
   * If the allowed cut is more than the cut without smoothing, there is room to smooth: the actual
   * smoothing value.
   */
  private calculateActualSmoothingValue(allowedCut: number): number {
    if (allowedCut > this.expectedCut) return this.smoothing;
    if (allowedCut > this.expectedRoundCut) {
      return (
        (this.smoothing * (allowedCut - this.expectedRoundCut)) /
        (this.expectedCut - this.expectedRoundCut)
      );
    }
    return 0;
  }
}

/**
 * A Bézier that joins the straight side from `sideStart` to `corner` with the circular segment
 * around `circleCenter`, smoothly: it starts on the side and ends on the circle.
 *
 * @param actualRoundCut How much of the corner the circular segment cuts, before smoothing cuts
 *   some more
 * @param actualSmoothingValues How much to smooth: the smoothing, reduced if there isn't room
 * @param circleSegmentIntersection Where the side meets the circle
 * @param otherCircleSegmentIntersection Where the opposite side meets the circle
 * @param actualR The circle's radius
 */
function computeFlankingCurve(
  actualRoundCut: number,
  actualSmoothingValues: number,
  corner: Point,
  sideStart: Point,
  circleSegmentIntersection: Point,
  otherCircleSegmentIntersection: Point,
  circleCenter: Point,
  actualR: number,
): Cubic {
  // sideStart is the anchor, 'anchor' is the actual control point
  const sideDirection = sideStart.minus(corner).getDirection();
  const curveStart = corner.plus(sideDirection.times(actualRoundCut * (1 + actualSmoothingValues)));
  // An approximation cuts a part of the circle section proportional to 1 - smooth: with smooth = 0
  // we take the full section, with smooth = 1, nothing. (From the original: this can be a problem
  // as it approaches 180 degrees.)
  const p = interpolatePoint(
    circleSegmentIntersection,
    circleSegmentIntersection.plus(otherCircleSegmentIntersection).div(2),
    actualSmoothingValues,
  );
  // The flanking curve ends on the circle
  const curveEnd = circleCenter.plus(
    directionVector(p.x - circleCenter.x, p.y - circleCenter.y).times(actualR),
  );
  // The anchor on the circle side is where the tangent to the circle at the circle/flanking curve
  // boundary crosses the straight side.
  const circleTangent = curveEnd.minus(circleCenter).rotate90();
  const anchorEnd =
    lineIntersection(sideStart, sideDirection, curveEnd, circleTangent) ??
    circleSegmentIntersection;
  // From what remains, pick a point for the start anchor. (2/3 seems to come from design tools.)
  const anchorStart = curveStart.plus(anchorEnd.times(2)).div(3);
  return cubicFromPoints(curveStart, anchorStart, anchorEnd, curveEnd);
}

/** Where the lines p0 + t d0 and p1 + t d1 cross, or undefined if they don't */
function lineIntersection(p0: Point, d0: Point, p1: Point, d1: Point): Point | undefined {
  const rotatedD1 = d1.rotate90();
  const den = d0.dotProduct(rotatedD1);
  if (Math.abs(den) < DISTANCE_EPSILON) return undefined;
  const num = p1.minus(p0).dotProduct(rotatedD1);
  // Also check the relative value. This is equivalent to abs(den/num) < DistanceEpsilon, but
  // avoids a division.
  if (Math.abs(den) < DISTANCE_EPSILON * Math.abs(num)) return undefined;
  const k = num / den;
  return p0.plus(d0.times(k));
}

function verticesFromNumVerts(
  numVertices: number,
  radius: number,
  centerX: number,
  centerY: number,
): number[] {
  const result: number[] = [];
  for (let i = 0; i < numVertices; i++) {
    const vertex = radialToCartesian(radius, (FLOAT_PI / numVertices) * 2 * i).plus(
      new Point(centerX, centerY),
    );
    result.push(vertex.x, vertex.y);
  }
  return result;
}
