// Reads the goldens that scripts/shapes-goldens writes from the Kotlin original, and builds the
// polygon each case describes with the port. For tests only.

import type { CornerRounding } from './corner-rounding';
import type { Cubic } from './cubic';
import type { PolygonFeature } from './features';
import {
  normalizePolygon,
  roundedPolygon,
  transformPolygon,
  type RoundedPolygon,
  type ShapePoint,
} from './polygon';
import {
  circlePolygon,
  pillPolygon,
  pillStarPolygon,
  rectanglePolygon,
  starPolygon,
} from './shapes';

type Bounds = [left: number, top: number, right: number, bottom: number];

export interface GoldenFeature {
  type: 'edge' | 'corner';
  convex?: boolean;
  cubics: number[][];
}

export interface GoldenPolygon {
  center: [number, number];
  features: GoldenFeature[];
  cubics: number[][];
  bounds: Bounds;
  exactBounds: Bounds;
  maxBounds: Bounds;
}

/** How a case was built, in the original's function and parameter names */
export type GoldenInput =
  | { fn: 'then'; base: GoldenInput; steps: Record<string, unknown>[] }
  | { fn: string; args: Record<string, unknown> };

export const asCubic = (c: readonly number[]) => c as unknown as Cubic;

export const asFeature = (f: GoldenFeature): PolygonFeature =>
  f.type === 'edge'
    ? { type: 'edge', cubics: f.cubics.map(asCubic) }
    : { type: 'corner', cubics: f.cubics.map(asCubic), convex: f.convex! };

/** Whether a case needs `materialShape`, which the port doesn't have yet */
export function usesMaterialShape(input: GoldenInput): boolean {
  return input.fn === 'then'
    ? usesMaterialShape((input as { base: GoldenInput }).base)
    : input.fn === 'materialShape';
}

const center = (args: Record<string, unknown>): ShapePoint | undefined =>
  args.centerX === undefined ? undefined : { x: args.centerX as number, y: args.centerY as number };

const rounding = (r: unknown) => r as CornerRounding | undefined;
const roundings = (r: unknown) => r as CornerRounding[] | undefined;

/** Compose's `Matrix.rotateZ`, as the generator's ComposeCompat.kt applies it */
const rotate = (degrees: number) => {
  const r = (degrees * Math.PI) / 180;
  const s = Math.sin(r);
  const c = Math.cos(r);
  return (x: number, y: number) => [c * x - s * y, s * x + c * y] as const;
};

export function buildPolygon(input: GoldenInput): RoundedPolygon {
  if (input.fn === 'then') {
    const { base, steps } = input as { base: GoldenInput; steps: Record<string, unknown>[] };
    let polygon = buildPolygon(base);
    for (const step of steps) {
      if ('rotate' in step) polygon = transformPolygon(polygon, rotate(step.rotate as number));
      else if ('scale' in step) {
        const [sx, sy] = step.scale as [number, number];
        polygon = transformPolygon(polygon, (x, y) => [x * sx, y * sy]);
      } else if ('translate' in step) {
        const [dx, dy] = step.translate as [number, number];
        polygon = transformPolygon(polygon, (x, y) => [x + dx, y + dy]);
      } else if ('normalize' in step) polygon = normalizePolygon(polygon);
      else throw new Error(`Unknown step ${JSON.stringify(step)}`);
    }
    return polygon;
  }
  const { args } = input as { args: Record<string, unknown> };
  const a = args as Record<string, never>;
  switch (input.fn) {
    case 'roundedPolygon':
      return 'numVertices' in args
        ? roundedPolygon({
            numVertices: a.numVertices,
            radius: a.radius,
            center: center(args),
            rounding: rounding(a.rounding),
            perVertexRounding: roundings(a.perVertexRounding),
          })
        : roundedPolygon({
            vertices: a.vertices,
            center: center(args),
            rounding: rounding(a.rounding),
            perVertexRounding: roundings(a.perVertexRounding),
          });
    case 'circle':
      return circlePolygon({ numVertices: a.numVertices, radius: a.radius, center: center(args) });
    case 'rectangle':
      return rectanglePolygon({
        width: a.width,
        height: a.height,
        rounding: rounding(a.rounding),
        perVertexRounding: roundings(a.perVertexRounding),
        center: center(args),
      });
    case 'star':
      return starPolygon({
        numVerticesPerRadius: a.numVerticesPerRadius,
        radius: a.radius,
        innerRadius: a.innerRadius,
        rounding: rounding(a.rounding),
        innerRounding: rounding(a.innerRounding),
        perVertexRounding: roundings(a.perVertexRounding),
        center: center(args),
      });
    case 'pill':
      return pillPolygon({
        width: a.width,
        height: a.height,
        smoothing: a.smoothing,
        center: center(args),
      });
    case 'pillStar':
      return pillStarPolygon({
        width: a.width,
        height: a.height,
        numVerticesPerRadius: a.numVerticesPerRadius,
        innerRadiusRatio: a.innerRadiusRatio,
        rounding: rounding(a.rounding),
        innerRounding: rounding(a.innerRounding),
        perVertexRounding: roundings(a.perVertexRounding),
        vertexSpacing: a.vertexSpacing,
        startLocation: a.startLocation,
        center: center(args),
      });
    default:
      throw new Error(`Unknown polygon function ${input.fn}`);
  }
}
