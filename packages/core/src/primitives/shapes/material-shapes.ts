// The Material 3 Expressive shape library: 35 shapes, each a normalized polygon.
//
// Ported from Compose Material3, MaterialShapes.kt, at androidx 079e2e3. Copyright 2024 The Android
// Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; the `MaterialShapes` properties are `materialShape(name)`, with kebab-case names,
// and Compose's `Matrix` rotations and scales are point transforms. The Compose-only `toPath` and
// `toShape` are left out (see `cubicsPath`).

import type { CornerRounding } from './corner-rounding';
import type { PointTransformer } from './cubic';
import {
  normalizePolygon,
  roundedPolygon,
  transformPolygon,
  type RoundedPolygon,
  type ShapePoint,
} from './polygon';
import { circlePolygon, rectanglePolygon, starPolygon } from './shapes';

/** The shapes' names, in the original's order */
export const MATERIAL_SHAPES = [
  'circle',
  'square',
  'slanted',
  'arch',
  'fan',
  'arrow',
  'semi-circle',
  'oval',
  'pill',
  'triangle',
  'diamond',
  'clam-shell',
  'pentagon',
  'gem',
  'sunny',
  'very-sunny',
  'cookie-4-sided',
  'cookie-6-sided',
  'cookie-7-sided',
  'cookie-9-sided',
  'cookie-12-sided',
  'ghostish',
  'clover-4-leaf',
  'clover-8-leaf',
  'burst',
  'soft-burst',
  'boom',
  'soft-boom',
  'flower',
  'puffy',
  'puffy-diamond',
  'pixel-circle',
  'pixel-triangle',
  'bun',
  'heart',
] as const;

/** A shape of the Material 3 Expressive shape library */
export type MaterialShapeName = (typeof MATERIAL_SHAPES)[number];

const cornerRound15: CornerRounding = { radius: 0.15 };
const cornerRound20: CornerRounding = { radius: 0.2 };
const cornerRound30: CornerRounding = { radius: 0.3 };
const cornerRound50: CornerRounding = { radius: 0.5 };
const cornerRound100: CornerRounding = { radius: 1 };
const unrounded: CornerRounding = {};

/** Compose's `Matrix().apply { rotateZ(degrees) }`, mapping points around (0, 0) */
const rotateZ = (degrees: number): PointTransformer => {
  const r = (degrees * Math.PI) / 180;
  const s = Math.sin(r);
  const c = Math.cos(r);
  return (x, y) => [c * x - s * y, s * x + c * y];
};

/** Compose's `Matrix().apply { scale(x, y) }` */
const scale =
  (sx: number, sy: number): PointTransformer =>
  (x, y) => [x * sx, y * sy];

const rotateNeg45 = rotateZ(-45);
const rotateNeg90 = rotateZ(-90);
const rotateNeg135 = rotateZ(-135);

/** A point, and how its vertex is rounded */
interface PointNRound {
  o: ShapePoint;
  r: CornerRounding;
}

const pnr = (x: number, y: number, r: CornerRounding = unrounded): PointNRound => ({
  o: { x, y },
  r,
});
const rounding = (radius: number, smoothing = 0): CornerRounding => ({ radius, smoothing });

const toRadians = (degrees: number) => (degrees / 360) * 2 * Math.PI;
const angleDegrees = (x: number, y: number) => (Math.atan2(y, x) * 180) / Math.PI;

function rotateDegrees(point: ShapePoint, angle: number, center: ShapePoint): ShapePoint {
  const a = toRadians(angle);
  const offX = point.x - center.x;
  const offY = point.y - center.y;
  return {
    x: offX * Math.cos(a) - offY * Math.sin(a) + center.x,
    y: offX * Math.sin(a) + offY * Math.cos(a) + center.y,
  };
}

/**
 * The points repeated `reps` times around `center`. With `mirroring`, every other repetition is
 * the points mirrored, which makes `2 * reps` sections.
 */
function doRepeat(
  points: readonly PointNRound[],
  reps: number,
  center: ShapePoint,
  mirroring: boolean,
): PointNRound[] {
  if (mirroring) {
    const result: PointNRound[] = [];
    const angles = points.map((p) => angleDegrees(p.o.x - center.x, p.o.y - center.y));
    const distances = points.map((p) => Math.hypot(p.o.x - center.x, p.o.y - center.y));
    const actualReps = reps * 2;
    const sectionAngle = 360 / actualReps;
    for (let it = 0; it < actualReps; it++) {
      for (let index = 0; index < points.length; index++) {
        const i = it % 2 === 0 ? index : points.length - 1 - index;
        if (i > 0 || it % 2 === 0) {
          const a = toRadians(
            sectionAngle * it +
              (it % 2 === 0 ? angles[i]! : sectionAngle - angles[i]! + 2 * angles[0]!),
          );
          result.push({
            o: {
              x: Math.cos(a) * distances[i]! + center.x,
              y: Math.sin(a) * distances[i]! + center.y,
            },
            r: points[i]!.r,
          });
        }
      }
    }
    return result;
  }
  const np = points.length;
  return Array.from({ length: np * reps }, (_, it) => ({
    o: rotateDegrees(points[it % np]!.o, (Math.trunc(it / np) * 360) / reps, center),
    r: points[it % np]!.r,
  }));
}

function customPolygon(
  points: readonly PointNRound[],
  reps: number,
  mirroring = false,
  center: ShapePoint = { x: 0.5, y: 0.5 },
): RoundedPolygon {
  const actualPoints = doRepeat(points, reps, center, mirroring);
  return roundedPolygon({
    vertices: actualPoints.flatMap((p) => [p.o.x, p.o.y]),
    perVertexRounding: actualPoints.map((p) => p.r),
    center,
  });
}

const star = (numVerticesPerRadius: number, innerRadius: number, r: CornerRounding) =>
  starPolygon({ numVerticesPerRadius, innerRadius, rounding: r });

const BUILDERS: Record<MaterialShapeName, () => RoundedPolygon> = {
  circle: () => circlePolygon({ numVertices: 10 }),
  square: () => rectanglePolygon({ width: 1, height: 1, rounding: cornerRound30 }),
  slanted: () =>
    customPolygon(
      [pnr(0.926, 0.97, rounding(0.189, 0.811)), pnr(-0.021, 0.967, rounding(0.187, 0.057))],
      2,
    ),
  arch: () =>
    transformPolygon(
      roundedPolygon({
        numVertices: 4,
        perVertexRounding: [cornerRound100, cornerRound100, cornerRound20, cornerRound20],
      }),
      rotateNeg135,
    ),
  fan: () =>
    customPolygon(
      [
        pnr(1.004, 1.0, rounding(0.148, 0.417)),
        pnr(0.0, 1.0, rounding(0.151)),
        pnr(0.0, -0.003, rounding(0.148)),
        pnr(0.978, 0.02, rounding(0.803)),
      ],
      1,
    ),
  arrow: () =>
    customPolygon(
      [
        pnr(0.5, 0.892, rounding(0.313)),
        pnr(-0.216, 1.05, rounding(0.207)),
        pnr(0.499, -0.16, rounding(0.215, 1.0)),
        pnr(1.225, 1.06, rounding(0.211)),
      ],
      1,
    ),
  'semi-circle': () =>
    rectanglePolygon({
      width: 1.6,
      height: 1,
      perVertexRounding: [cornerRound20, cornerRound20, cornerRound100, cornerRound100],
    }),
  oval: () => transformPolygon(transformPolygon(circlePolygon(), scale(1, 0.64)), rotateNeg45),
  pill: () =>
    customPolygon(
      [pnr(0.961, 0.039, rounding(0.426)), pnr(1.001, 0.428), pnr(1.0, 0.609, rounding(1.0))],
      2,
      true,
    ),
  triangle: () =>
    transformPolygon(roundedPolygon({ numVertices: 3, rounding: cornerRound20 }), rotateNeg90),
  diamond: () =>
    customPolygon([pnr(0.5, 1.096, rounding(0.151, 0.524)), pnr(0.04, 0.5, rounding(0.159))], 2),
  'clam-shell': () =>
    customPolygon(
      [
        pnr(0.171, 0.841, rounding(0.159)),
        pnr(-0.02, 0.5, rounding(0.14)),
        pnr(0.17, 0.159, rounding(0.159)),
      ],
      2,
    ),
  pentagon: () =>
    customPolygon(
      [
        pnr(0.5, -0.009, rounding(0.172)),
        pnr(1.03, 0.365, rounding(0.164)),
        pnr(0.828, 0.97, rounding(0.169)),
      ],
      1,
      true,
    ),
  gem: () =>
    customPolygon(
      [
        pnr(0.499, 1.023, rounding(0.241, 0.778)),
        pnr(-0.005, 0.792, rounding(0.208)),
        pnr(0.073, 0.258, rounding(0.228)),
        pnr(0.433, -0.0, rounding(0.491)),
      ],
      1,
      true,
    ),
  sunny: () => star(8, 0.8, cornerRound15),
  'very-sunny': () =>
    customPolygon([pnr(0.5, 1.08, rounding(0.085)), pnr(0.358, 0.843, rounding(0.085))], 8),
  'cookie-4-sided': () =>
    customPolygon([pnr(1.237, 1.236, rounding(0.258)), pnr(0.5, 0.918, rounding(0.233))], 4),
  'cookie-6-sided': () =>
    customPolygon([pnr(0.723, 0.884, rounding(0.394)), pnr(0.5, 1.099, rounding(0.398))], 6),
  'cookie-7-sided': () => transformPolygon(star(7, 0.75, cornerRound50), rotateNeg90),
  'cookie-9-sided': () => transformPolygon(star(9, 0.8, cornerRound50), rotateNeg90),
  'cookie-12-sided': () => transformPolygon(star(12, 0.8, cornerRound50), rotateNeg90),
  ghostish: () =>
    customPolygon(
      [
        pnr(0.5, 0, rounding(1.0)),
        pnr(1, 0, rounding(1.0)),
        pnr(1, 1.14, rounding(0.254, 0.106)),
        pnr(0.575, 0.906, rounding(0.253)),
      ],
      1,
      true,
    ),
  'clover-4-leaf': () =>
    customPolygon([pnr(0.5, 0.074), pnr(0.725, -0.099, rounding(0.476))], 4, true),
  'clover-8-leaf': () => customPolygon([pnr(0.5, 0.036), pnr(0.758, -0.101, rounding(0.209))], 8),
  burst: () =>
    customPolygon([pnr(0.5, -0.006, rounding(0.006)), pnr(0.592, 0.158, rounding(0.006))], 12),
  'soft-burst': () =>
    customPolygon([pnr(0.193, 0.277, rounding(0.053)), pnr(0.176, 0.055, rounding(0.053))], 10),
  boom: () =>
    customPolygon([pnr(0.457, 0.296, rounding(0.007)), pnr(0.5, -0.051, rounding(0.007))], 15),
  'soft-boom': () =>
    customPolygon(
      [
        pnr(0.733, 0.454),
        pnr(0.839, 0.437, rounding(0.532)),
        pnr(0.949, 0.449, rounding(0.439, 1.0)),
        pnr(0.998, 0.478, rounding(0.174)),
      ],
      16,
      true,
    ),
  flower: () =>
    customPolygon(
      [pnr(0.37, 0.187), pnr(0.416, 0.049, rounding(0.381)), pnr(0.479, 0.001, rounding(0.095))],
      8,
      true,
    ),
  puffy: () =>
    transformPolygon(
      customPolygon(
        [
          pnr(0.5, 0.053),
          pnr(0.545, -0.04, rounding(0.405)),
          pnr(0.67, -0.035, rounding(0.426)),
          pnr(0.717, 0.066, rounding(0.574)),
          pnr(0.722, 0.128),
          pnr(0.777, 0.002, rounding(0.36)),
          pnr(0.914, 0.149, rounding(0.66)),
          pnr(0.926, 0.289, rounding(0.66)),
          pnr(0.881, 0.346),
          pnr(0.94, 0.344, rounding(0.126)),
          pnr(1.003, 0.437, rounding(0.255)),
        ],
        2,
        true,
      ),
      scale(1, 0.742),
    ),
  'puffy-diamond': () =>
    customPolygon(
      [pnr(0.87, 0.13, rounding(0.146)), pnr(0.818, 0.357), pnr(1.0, 0.332, rounding(0.853))],
      4,
      true,
    ),
  'pixel-circle': () =>
    customPolygon(
      [
        pnr(0.5, 0.0),
        pnr(0.704, 0.0),
        pnr(0.704, 0.065),
        pnr(0.843, 0.065),
        pnr(0.843, 0.148),
        pnr(0.926, 0.148),
        pnr(0.926, 0.296),
        pnr(1.0, 0.296),
      ],
      2,
      true,
    ),
  'pixel-triangle': () =>
    customPolygon(
      [
        pnr(0.11, 0.5),
        pnr(0.113, 0.0),
        pnr(0.287, 0.0),
        pnr(0.287, 0.087),
        pnr(0.421, 0.087),
        pnr(0.421, 0.17),
        pnr(0.56, 0.17),
        pnr(0.56, 0.265),
        pnr(0.674, 0.265),
        pnr(0.675, 0.344),
        pnr(0.789, 0.344),
        pnr(0.789, 0.439),
        pnr(0.888, 0.439),
      ],
      1,
      true,
    ),
  bun: () =>
    customPolygon(
      [
        pnr(0.796, 0.5),
        pnr(0.853, 0.518, rounding(1)),
        pnr(0.992, 0.631, rounding(1)),
        pnr(0.968, 1.0, rounding(1)),
      ],
      2,
      true,
    ),
  heart: () =>
    customPolygon(
      [
        pnr(0.5, 0.268, rounding(0.016)),
        pnr(0.792, -0.066, rounding(0.958)),
        pnr(1.064, 0.276, rounding(1.0)),
        pnr(0.501, 0.946, rounding(0.129)),
      ],
      1,
      true,
    ),
};

const cache = new Map<MaterialShapeName, RoundedPolygon>();

/** Freezes the polygon and everything in it: every caller shares the cached one. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/**
 * A shape of the Material 3 Expressive shape library, normalized to the square from (0, 0) to
 * (1, 1). It is built once, on first use, and the same polygon, frozen, is returned after that.
 *
 * @throws If `name` isn't one of `MATERIAL_SHAPES`.
 */
export function materialShape(name: MaterialShapeName): RoundedPolygon {
  let shape = cache.get(name);
  if (!shape) {
    // Own keys only, so a name such as `constructor` doesn't reach Object's.
    if (!Object.hasOwn(BUILDERS, name)) throw new Error(`Unknown Material shape: ${name}`);
    shape = deepFreeze(normalizePolygon(BUILDERS[name]()));
    cache.set(name, shape);
  }
  return shape;
}
