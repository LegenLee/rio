// Common shapes as polygons: circles, rectangles, stars, pills, and pill-shaped stars.
//
// Ported from androidx graphics-shapes, Shapes.kt, at androidx 079e2e3. Copyright 2022 The Android
// Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; the `RoundedPolygon.Companion` extensions are functions that take an options object.

import type { CornerRounding } from './corner-rounding';
import { FLOAT_PI, interpolate, radialToCartesian, TWO_PI } from './math';
import { Point } from './point';
import { roundedPolygon, type RoundedPolygon, type ShapePoint } from './polygon';

const ORIGIN: ShapePoint = { x: 0, y: 0 };

export interface CirclePolygonOptions {
  /** The number of vertices of the polygon that approximates the circle. Defaults to 8. */
  numVertices?: number;
  /** Defaults to 1. */
  radius?: number;
  /** Defaults to (0, 0). */
  center?: ShapePoint;
}

/**
 * A circle, as a polygon with every vertex rounded.
 *
 * @throws If `numVertices` is less than 3.
 */
export function circlePolygon(options: CirclePolygonOptions = {}): RoundedPolygon {
  const { numVertices = 8, radius = 1, center = ORIGIN } = options;
  if (numVertices < 3) throw new Error('Circle must have at least three vertices');

  // Half of the angle between two adjacent vertices on the polygon
  const theta = FLOAT_PI / numVertices;
  // The radius of the underlying polygon that gives the circle its radius
  const polygonRadius = radius / Math.cos(theta);
  return roundedPolygon({ numVertices, rounding: { radius }, radius: polygonRadius, center });
}

export interface RectanglePolygonOptions {
  /** Defaults to 2. */
  width?: number;
  /** Defaults to 2. */
  height?: number;
  /** How every corner is rounded, unless `perVertexRounding` is given. Defaults to unrounded. */
  rounding?: CornerRounding;
  /**
   * How each of the four corners is rounded, from the bottom right going clockwise (bottom left,
   * top left, top right). Overrides `rounding`.
   */
  perVertexRounding?: readonly CornerRounding[];
  /** Defaults to (0, 0). */
  center?: ShapePoint;
}

/**
 * A rectangle, optionally with rounded corners. Like every polygon, the default one fits the 2x2
 * box around (0, 0), and usually needs transforming to its place in the UI.
 */
export function rectanglePolygon(options: RectanglePolygonOptions = {}): RoundedPolygon {
  const { width = 2, height = 2, rounding, perVertexRounding, center = ORIGIN } = options;
  const left = center.x - width / 2;
  const top = center.y - height / 2;
  const right = center.x + width / 2;
  const bottom = center.y + height / 2;
  return roundedPolygon({
    vertices: [right, bottom, left, bottom, left, top, right, top],
    rounding,
    perVertexRounding,
    center,
  });
}

/** What a star and a pill star share */
interface StarRoundingOptions {
  /** The number of vertices on each of the two radii */
  numVerticesPerRadius?: number;
  /** How every vertex is rounded, unless `perVertexRounding` is given. Defaults to unrounded. */
  rounding?: CornerRounding;
  /**
   * How the inner vertices are rounded. Defaults to `rounding`, or to `perVertexRounding` when
   * that is given.
   */
  innerRounding?: CornerRounding;
  /** How each vertex is rounded, `2 * numVerticesPerRadius` of them. Overrides `rounding`. */
  perVertexRounding?: readonly CornerRounding[];
  /** Defaults to (0, 0). */
  center?: ShapePoint;
}

export interface StarPolygonOptions extends StarRoundingOptions {
  numVerticesPerRadius: number;
  /** The outer radius, greater than 0. Defaults to 1. */
  radius?: number;
  /**
   * The inner radius, greater than 0 and less than `radius`. Defaults to 0.5. Equal radii would make
   * a regular polygon with `2 * numVerticesPerRadius` vertices.
   */
  innerRadius?: number;
}

/** The per-vertex rounding a star takes from its outer and inner rounding, if it has inner rounding */
function starRounding(
  numVerticesPerRadius: number,
  rounding: CornerRounding = {},
  innerRounding: CornerRounding | undefined,
  perVertexRounding: readonly CornerRounding[] | undefined,
): readonly CornerRounding[] | undefined {
  if (perVertexRounding || !innerRounding) return perVertexRounding;
  return Array.from({ length: numVerticesPerRadius }, () => [rounding, innerRounding]).flat();
}

/**
 * A star: a polygon whose vertices alternate between an outer and an inner radius.
 *
 * @throws If either radius is 0 or less, or `innerRadius` isn't less than `radius`.
 */
export function starPolygon(options: StarPolygonOptions): RoundedPolygon {
  const {
    numVerticesPerRadius,
    radius = 1,
    innerRadius = 0.5,
    rounding,
    innerRounding,
    perVertexRounding,
    center = ORIGIN,
  } = options;
  if (radius <= 0 || innerRadius <= 0) throw new Error('Star radii must both be greater than 0');
  if (innerRadius >= radius) throw new Error('innerRadius must be less than radius');

  // A star is a polygon with all its vertices given, generated on the inner and outer radii.
  return roundedPolygon({
    vertices: starVerticesFromNumVerts(numVerticesPerRadius, radius, innerRadius, center),
    rounding,
    perVertexRounding: starRounding(
      numVerticesPerRadius,
      rounding,
      innerRounding,
      perVertexRounding,
    ),
    center,
  });
}

export interface PillPolygonOptions {
  /** Defaults to 2. */
  width?: number;
  /** Defaults to 1. */
  height?: number;
  /**
   * How far the curve of each end cap extends from its circular arc toward the straight edges,
   * from 0 to 1. Defaults to 0: the ends are only circular arcs.
   */
  smoothing?: number;
  /** Defaults to (0, 0). */
  center?: ShapePoint;
}

/**
 * A pill: a rectangle with a semicircle on each of its two shorter ends.
 *
 * @throws If `width` or `height` is 0 or less.
 */
export function pillPolygon(options: PillPolygonOptions = {}): RoundedPolygon {
  const { width = 2, height = 1, smoothing = 0, center = ORIGIN } = options;
  if (!(width > 0 && height > 0)) {
    throw new Error('Pill shapes must have positive width and height');
  }
  const wHalf = width / 2;
  const hHalf = height / 2;
  return roundedPolygon({
    vertices: [
      wHalf + center.x,
      hHalf + center.y,
      -wHalf + center.x,
      hHalf + center.y,
      -wHalf + center.x,
      -hHalf + center.y,
      wHalf + center.x,
      -hHalf + center.y,
    ],
    rounding: { radius: Math.min(wHalf, hHalf), smoothing },
    center,
  });
}

export interface PillStarPolygonOptions extends StarRoundingOptions {
  /** Defaults to 2. */
  width?: number;
  /** Defaults to 1. */
  height?: number;
  /** Defaults to 8. */
  numVerticesPerRadius?: number;
  /**
   * The inner radius as a ratio of the outer one, greater than 0 and at most 1. Defaults to 0.5. A
   * value of 1 is close to a pill with more vertices.
   */
  innerRadiusRatio?: number;
  /**
   * How the vertices on the curved ends are spaced, from 0 to 1. 0 spaces the inner vertices like
   * those along the straight edges, which leaves the outer ones further apart; 1 does the same for
   * the outer vertices. Defaults to 0.5, the average.
   */
  vertexSpacing?: number;
  /**
   * How far along the outline, from 0 to 1, its curves start. It rarely shows, but matters when
   * stroking the outline gradually. Defaults to 0.
   */
  startLocation?: number;
}

/**
 * A pill-shaped star: like a pill, but its outline alternates between inner and outer radii, as
 * a star's does around a circle. A shape with its outer vertices along the curved ends has its
 * inner ones closer together there, because of the curve; `vertexSpacing` shifts that balance.
 *
 * @throws If `width` or `height` is 0 or less, or `innerRadiusRatio` is outside (0, 1].
 */
export function pillStarPolygon(options: PillStarPolygonOptions = {}): RoundedPolygon {
  const {
    width = 2,
    height = 1,
    numVerticesPerRadius = 8,
    innerRadiusRatio = 0.5,
    rounding,
    innerRounding,
    perVertexRounding,
    vertexSpacing = 0.5,
    startLocation = 0,
    center = ORIGIN,
  } = options;
  if (!(width > 0 && height > 0)) {
    throw new Error('Pill shapes must have positive width and height');
  }
  if (!(innerRadiusRatio > 0 && innerRadiusRatio <= 1)) {
    throw new Error('innerRadius must be between 0 and 1');
  }
  return roundedPolygon({
    vertices: pillStarVerticesFromNumVerts(
      numVerticesPerRadius,
      width,
      height,
      innerRadiusRatio,
      vertexSpacing,
      startLocation,
      center,
    ),
    rounding,
    perVertexRounding: starRounding(
      numVerticesPerRadius,
      rounding,
      innerRounding,
      perVertexRounding,
    ),
    center,
  });
}

function pillStarVerticesFromNumVerts(
  numVerticesPerRadius: number,
  width: number,
  height: number,
  innerRadius: number,
  vertexSpacing: number,
  startLocation: number,
  center: ShapePoint,
): number[] {
  // The approach: take the perimeter of the underlying pill outline, then the t value of each
  // vertex as we walk that perimeter. That tells where on the outline the vertex goes, and its
  // place depends on the section it is in: the vertical edges on the sides, the circular sections
  // on the four corners, or the horizontal edges on the top and bottom. Either the vertical or the
  // horizontal edges are of length zero (the smaller dimension gets only the pill's curvature).
  const endcapRadius = Math.min(width, height);
  const vSegLen = Math.max(height - width, 0);
  const hSegLen = Math.max(width - height, 0);
  const vSegHalf = vSegLen / 2;
  const hSegHalf = hSegLen / 2;
  // vertexSpacing places the vertices on the end caps. The caller can space the inner (0) or outer
  // (1) vertices like those along the edges, which puts the others further apart (0) or closer
  // (1). The default, 0.5, averages them.
  const circlePerimeter = TWO_PI * endcapRadius * interpolate(innerRadius, 1, vertexSpacing);
  // The circle's perimeter plus the horizontal and vertical sections of the inner rectangle, of
  // which either (or both) may be of length zero
  const perimeter = 2 * hSegLen + 2 * vSegLen + circlePerimeter;

  // The t at which each part of the outline starts: which section a vertex lies in, from its t,
  // and where in that section it lies.
  const sections: number[] = [];
  sections[0] = 0;
  sections[1] = vSegLen / 2;
  sections[2] = sections[1] + circlePerimeter / 4;
  sections[3] = sections[2] + hSegLen;
  sections[4] = sections[3] + circlePerimeter / 4;
  sections[5] = sections[4] + vSegLen;
  sections[6] = sections[5] + circlePerimeter / 4;
  sections[7] = sections[6] + hSegLen;
  sections[8] = sections[7] + circlePerimeter / 4;
  sections[9] = sections[8] + vSegLen / 2;
  sections[10] = perimeter;

  // t is the length along the outline to a vertex; with the vertices spaced evenly along it, each
  // one's place follows.
  const tPerVertex = perimeter / (2 * numVerticesPerRadius);
  // Inner and outer vertices take turns, each with its own calculation, since they can lie in
  // different quadrants.
  let inner = false;
  // The section we are in, as we walk around the pill with increasing t
  let currSecIndex = 0;
  // Where the current section starts and ends, for how far along it a vertex lies
  let secStart = 0;
  let secEnd = sections[1];
  // 0 is on the positive x axis, in section 0. startLocation, from 0 to 1, moves the start
  // anywhere on the perimeter.
  let t = startLocation * perimeter;
  const result: number[] = [];
  const rectBR = new Point(hSegHalf, vSegHalf);
  const rectBL = new Point(-hSegHalf, vSegHalf);
  const rectTL = new Point(-hSegHalf, -vSegHalf);
  const rectTR = new Point(hSegHalf, -vSegHalf);
  for (let i = 0; i < numVerticesPerRadius * 2; i++) {
    // t can start (and end) after 0; boundedT does the right thing when crossing 0 again.
    const boundedT = t % perimeter;
    // Deviation from the original, twice over, both only with a startLocation above 0. First, it
    // goes back to section 0 without its bounds, so the vertices past the start land in the wrong
    // places. Second, see section 9 below.
    if (boundedT < secStart) {
      currSecIndex = 0;
      secStart = sections[0]!;
      secEnd = sections[1]!;
    }
    while (boundedT >= sections[(currSecIndex + 1) % sections.length]!) {
      currSecIndex = (currSecIndex + 1) % sections.length;
      secStart = sections[currSecIndex]!;
      secEnd = sections[(currSecIndex + 1) % sections.length]!;
    }

    // t within the section, and its proportion of the section's length
    const tInSection = boundedT - secStart;
    const tProportion = tInSection / (secEnd - secStart);

    // On the end caps, tProportion gives the angle along the cap, from the section's starting
    // angle; on the straight edges, a linear position between the edge's ends.
    const currRadius = inner ? endcapRadius * innerRadius : endcapRadius;
    let vertex: Point;
    switch (currSecIndex) {
      case 0:
        vertex = new Point(currRadius, tProportion * vSegHalf);
        break;
      case 1:
        vertex = radialToCartesian(currRadius, (tProportion * FLOAT_PI) / 2).plus(rectBR);
        break;
      case 2:
        vertex = new Point(hSegHalf - tProportion * hSegLen, currRadius);
        break;
      case 3:
        vertex = radialToCartesian(currRadius, FLOAT_PI / 2 + (tProportion * FLOAT_PI) / 2).plus(
          rectBL,
        );
        break;
      case 4:
        vertex = new Point(-currRadius, vSegHalf - tProportion * vSegLen);
        break;
      case 5:
        vertex = radialToCartesian(currRadius, FLOAT_PI + (tProportion * FLOAT_PI) / 2).plus(
          rectTL,
        );
        break;
      case 6:
        vertex = new Point(-hSegHalf + tProportion * hSegLen, -currRadius);
        break;
      case 7:
        vertex = radialToCartesian(currRadius, FLOAT_PI * 1.5 + (tProportion * FLOAT_PI) / 2).plus(
          rectTR,
        );
        break;
      case 8:
        vertex = new Point(currRadius, -vSegHalf + tProportion * vSegHalf);
        break;
      default:
        // Section 9 has no length: it starts where the perimeter ends, which the sum of the
        // sections can miss by a rounding error, so a vertex lands in it when its t is the
        // perimeter. That is where the outline starts: section 0's start on a tall pill, and on a
        // wide one, where section 0 has no length either, section 1's, hSegHalf further right.
        // The original takes it as section 8 at its start: half a vertical side away on a tall
        // pill, hSegHalf away on a wide one.
        vertex = new Point(currRadius + hSegHalf, 0);
    }
    result.push(vertex.x + center.x, vertex.y + center.y);
    t += tPerVertex;
    inner = !inner;
  }
  return result;
}

function starVerticesFromNumVerts(
  numVerticesPerRadius: number,
  radius: number,
  innerRadius: number,
  center: ShapePoint,
): number[] {
  const result: number[] = [];
  for (let i = 0; i < numVerticesPerRadius; i++) {
    let vertex = radialToCartesian(radius, (FLOAT_PI / numVerticesPerRadius) * 2 * i);
    result.push(vertex.x + center.x, vertex.y + center.y);
    vertex = radialToCartesian(innerRadius, (FLOAT_PI / numVerticesPerRadius) * (2 * i + 1));
    result.push(vertex.x + center.x, vertex.y + center.y);
  }
  return result;
}
