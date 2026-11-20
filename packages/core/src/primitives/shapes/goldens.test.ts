// The port against the Kotlin original: each golden case, built with the port, matches what the
// original computed (scripts/shapes-goldens), within the original tests' tolerance.

import { describe, expect, test } from 'vitest';
import morphs from './__goldens__/morphs.json';
import polygons from './__goldens__/polygons.json';
import serializer from './__goldens__/serializer.json';
import svg from './__goldens__/svg.json';
import {
  asCubic,
  asFeature,
  buildPolygon,
  usesMaterialShape,
  type GoldenFeature,
  type GoldenInput,
  type GoldenPolygon,
} from './goldens';
import { pointOnCurve, zeroLength, type Cubic } from './cubic';
import { parseFeatures, serializeFeatures } from './feature-serializer';
import type { PolygonFeature } from './features';
import { createMorph } from './morph';
import {
  calculateBounds,
  calculateMaxBounds,
  normalizePolygon,
  polygonFromFeatures,
  type RoundedPolygon,
} from './polygon';
import { featuresFromSvgPath, parseCubics } from './svg-path-parser';
import { assertCubicListsEqualish, assertEqualish, assertFeaturesEqualish } from './test-utils';

function assertBoundsEqualish(
  expected: readonly number[],
  actual: readonly number[],
  message: string,
) {
  expected.forEach((v, i) => assertEqualish(v, actual[i]!, `${message} [${i}]`));
}

export function assertMatchesGolden(golden: GoldenPolygon, polygon: RoundedPolygon) {
  expect(polygon.features).toHaveLength(golden.features.length);
  golden.features.forEach((feature, i) =>
    assertFeaturesEqualish(asFeature(feature), polygon.features[i]!, `feature ${i}`),
  );
  assertGeometryMatchesGolden(golden, polygon);
}

/** The center, outline, and bounds match the original's. */
function assertGeometryMatchesGolden(golden: GoldenPolygon, polygon: RoundedPolygon) {
  assertEqualish(golden.center[0], polygon.center.x, 'center x');
  assertEqualish(golden.center[1], polygon.center.y, 'center y');
  assertCubicListsEqualish(golden.cubics.map(asCubic), polygon.cubics, 'cubics');
  assertBoundsEqualish(golden.bounds, calculateBounds(polygon), 'bounds');
  assertBoundsEqualish(golden.exactBounds, calculateBounds(polygon, false), 'exact bounds');
  assertBoundsEqualish(golden.maxBounds, calculateMaxBounds(polygon), 'max bounds');
}

const polygonCases = polygons as unknown as {
  name: string;
  input: GoldenInput;
  polygon: GoldenPolygon;
}[];

/**
 * Where the port deliberately differs from the original, with how the test checks it instead. A
 * pill star with a startLocation above 0: the original misplaces the vertices past the start, and
 * puts a vertex whose t is the perimeter away from where the outline starts, by half a vertical
 * side on a tall pill and by half the straight side (hSegHalf) on a wide one (shapes.ts;
 * shapes.test.ts covers the second, which this case happens not to hit).
 */
const DEVIATIONS = new Set(['pill-star-start-location']);

const polygonCase = (name: string) => polygonCases.find((c) => c.name === name)!;

describe('polygons match the original', () => {
  test.each(
    polygonCases
      .filter((c) => !usesMaterialShape(c.input) && !DEVIATIONS.has(c.name))
      .map((c) => [c.name, c] as const),
  )('%s', (_, { input, polygon }) => {
    assertMatchesGolden(polygon, buildPolygon(input));
  });

  // The original misplaces a pill star's vertices past the start when startLocation is above 0.
  // 0.3 of the way around 20 vertices is 6 vertices on: the port's features are the original's
  // for a start of 0, 12 features (6 corners and their edges) on.
  test('pill-star-start-location, against pill-star-spacing 6 vertices on', () => {
    const shifted = buildPolygon(polygonCase('pill-star-start-location').input);
    const reference = polygonCase('pill-star-spacing').polygon.features;
    expect(shifted.features).toHaveLength(reference.length);
    shifted.features.forEach((feature, i) =>
      assertFeaturesEqualish(
        asFeature(reference[(i + 12) % reference.length]!),
        feature,
        `feature ${i}`,
      ),
    );
  });
});

type Bounds = [number, number, number, number];

const morphCases = morphs as unknown as {
  name: string;
  start: GoldenInput;
  end: GoldenInput;
  normalized: boolean;
  bounds: Bounds;
  exactBounds: Bounds;
  maxBounds: Bounds;
  frames: { progress: number; cubics: number[][] }[];
}[];

const boundsArray = (b: { left: number; top: number; right: number; bottom: number }) => [
  b.left,
  b.top,
  b.right,
  b.bottom,
];

/**
 * Morphs between symmetric shapes, where the feature mapping meets distances that are equal in
 * theory. In Float they come out equal, and the original's stable sort keeps their list order; in
 * 64 bits they differ by rounding, and the port takes the smaller. The two match the curves
 * differently, both validly; the port stays with 64 bits, as the original on Kotlin/JS does.
 * These are checked for tracing the start and end shapes instead, which doesn't check the mapping.
 */
const TIED_MORPHS = new Set(['triangle-to-square']);

/**
 * Every point of the first outline is on the second, and back: points sampled along each cubic,
 * against the other outline drawn as fine line segments.
 */
function assertSameOutline(a: readonly Cubic[], b: readonly Cubic[], message: string) {
  const sample = (cubics: readonly Cubic[], steps: number) =>
    cubics.flatMap((c) => Array.from({ length: steps + 1 }, (_, i) => pointOnCurve(c, i / steps)));
  const toSegment = (p: { x: number; y: number }, s: typeof q0, e: typeof q0) => {
    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const length = dx * dx + dy * dy;
    const t =
      length === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - s.x) * dx + (p.y - s.y) * dy) / length));
    return Math.hypot(p.x - (s.x + t * dx), p.y - (s.y + t * dy));
  };
  const q0 = { x: 0, y: 0 };
  for (const [from, to] of [
    [a, b],
    [b, a],
  ] as const) {
    const polyline = sample(to, 200);
    for (const p of sample(from, 4)) {
      let nearest = Infinity;
      for (let i = 1; i < polyline.length; i++) {
        nearest = Math.min(nearest, toSegment(p, polyline[i - 1]!, polyline[i]!));
      }
      expect(nearest, `${message}: (${p.x}, ${p.y}) is off the outline`).toBeLessThan(1e-3);
    }
  }
}

describe('morphs match the original', () => {
  test.each(
    morphCases
      .filter(
        (c) => !usesMaterialShape(c.start) && !usesMaterialShape(c.end) && !TIED_MORPHS.has(c.name),
      )
      .map((c) => [c.name, c] as const),
  )('%s', (_, golden) => {
    // As the generator builds them: normalized, as the loading indicator does, or as they are
    const prepare = (p: RoundedPolygon) => (golden.normalized ? normalizePolygon(p) : p);
    const morph = createMorph(
      prepare(buildPolygon(golden.start)),
      prepare(buildPolygon(golden.end)),
    );
    for (const { progress, cubics } of golden.frames) {
      assertCubicListsEqualish(cubics.map(asCubic), morph.cubics(progress), `progress ${progress}`);
    }
    assertBoundsEqualish(golden.bounds, boundsArray(morph.bounds()), 'bounds');
    assertBoundsEqualish(
      golden.exactBounds,
      boundsArray(morph.bounds({ approximate: false })),
      'exact bounds',
    );
    assertBoundsEqualish(golden.maxBounds, boundsArray(morph.maxBounds()), 'max bounds');
  });
});

describe('morphs with tied mappings trace their shapes', () => {
  test.each(morphCases.filter((c) => TIED_MORPHS.has(c.name)).map((c) => [c.name, c] as const))(
    '%s',
    (_, golden) => {
      const prepare = (p: RoundedPolygon) => (golden.normalized ? normalizePolygon(p) : p);
      const morph = createMorph(
        prepare(buildPolygon(golden.start)),
        prepare(buildPolygon(golden.end)),
      );
      for (const progress of [0, 1]) {
        const frame = golden.frames.find((f) => f.progress === progress)!;
        assertSameOutline(
          frame.cubics.map(asCubic),
          morph.cubics(progress),
          `progress ${progress}`,
        );
      }
    },
  );
});

const svgCases = svg as unknown as {
  path: string;
  features?: GoldenFeature[];
  error?: string;
  polygon?: GoldenPolygon;
}[];

/**
 * Paths with 90 degree arcs. In Float, the original makes each one 3 cubics; the port makes 2 of
 * 45 degrees, as the original means. The arcs' cubics are corners, so the features differ too.
 * These are checked for drawing the same outline instead, with no arc cubic over 45 degrees.
 */
const QUARTER_ARC_PATHS = new Map([
  // An arc of 2 cubics, a line, and the closing line
  ['M 10,0 A 10,10 0 0 1 20,10 L 0,10 Z', 4],
  // 4 arcs of 2 cubics, 4 lines, and the closing line of no length
  [
    'M 4,0 H 16 A 4,4 0 0 1 20,4 V 16 A 4,4 0 0 1 16,20 H 4 A 4,4 0 0 1 0,16 V 4 A 4,4 0 0 1 4,0 Z',
    13,
  ],
]);

/**
 * Paths of several shapes. The original takes the first shape one cubic short, losing its last
 * side; the port takes all of it. These are checked against a path of the first shape alone.
 */
const SEVERAL_SHAPES: Record<string, string> = {
  'M 10,10 30,10 20,30 z M 20,20 50,10 40,30 z': 'M 10,10 L 30,10 L 20,30 z',
};

/**
 * Paths with quadratic curves, which the port draws exactly and the original bulges, with the
 * same curves as cubics. These are checked against that path, and for the original's kinds of
 * features.
 */
const QUADRATIC_PATHS: Record<string, string> = Object.fromEntries(
  ['M 0,0 Q 10,10 20,0 T 40,0 L 40,20 L 0,20 Z', 'M 0,0 q 10,10 20,0 t 20,0 l 0,20 l -40,0 z'].map(
    (path) => [
      path,
      `M 0,0 C ${20 / 3},${20 / 3} ${40 / 3},${20 / 3} 20,0 ` +
        `C ${80 / 3},${-20 / 3} ${100 / 3},${-20 / 3} 40,0 L 40,20 L 0,20 Z`,
    ],
  ),
);

/**
 * Whether the outline turns clockwise at (x, y), from points just before and just after it on the
 * cubics that end and start there, apart from their control points. Two distances along the
 * curves have to agree.
 */
function turnsClockwiseAt(outline: readonly Cubic[], x: number, y: number): boolean {
  const at = (px: number, py: number) => Math.abs(px - x) < 1e-4 && Math.abs(py - y) < 1e-4;
  const incoming = outline.find((c) => at(c[6], c[7]))!;
  const outgoing = outline.find((c) => at(c[0], c[1]))!;
  const turn = (h: number) => {
    const before = pointOnCurve(incoming, 1 - h);
    const after = pointOnCurve(outgoing, h);
    return (x - before.x) * (after.y - y) - (y - before.y) * (after.x - x) > 0;
  };
  expect(turn(1e-4), `the turn at (${x}, ${y}) depends on the distance`).toBe(turn(1e-2));
  return turn(1e-4);
}

/**
 * The features match the original's, except the convexity of the empty corners at sharp angles,
 * which the port takes from how the path turns there (see feature-detector.ts) and the original
 * gets backwards: those are checked against the turn of the outline.
 */
function assertSvgFeatures(
  golden: readonly GoldenFeature[],
  outline: readonly Cubic[],
  features: readonly PolygonFeature[],
) {
  expect(features).toHaveLength(golden.length);
  golden.forEach((g, i) => {
    const expected = asFeature(g);
    const actual = features[i]!;
    const sharp =
      expected.type === 'corner' && expected.cubics.length === 1 && zeroLength(expected.cubics[0]!);
    if (sharp) {
      const [x, y] = expected.cubics[0]!;
      const convex = turnsClockwiseAt(outline, x, y);
      assertFeaturesEqualish({ ...expected, convex }, actual, `feature ${i}`);
    } else assertFeaturesEqualish(expected, actual, `feature ${i}`);
  });
}

describe('SVG paths read as in the original', () => {
  test.each(
    svgCases
      .filter(
        (c) =>
          !QUARTER_ARC_PATHS.has(c.path) &&
          !(c.path in SEVERAL_SHAPES) &&
          !(c.path in QUADRATIC_PATHS),
      )
      .map((c) => [c.path, c] as const),
  )('%s', (_, golden) => {
    if (golden.error) {
      expect(() => featuresFromSvgPath(golden.path)).toThrow();
      return;
    }
    const features = featuresFromSvgPath(golden.path);
    const outline = golden.polygon!.cubics.map(asCubic);
    assertSvgFeatures(golden.features!, outline, features);
    assertGeometryMatchesGolden(golden.polygon!, polygonFromFeatures(features));
  });

  test.each(Object.entries(SEVERAL_SHAPES))('%s, as %s alone', (path, alone) => {
    const golden = svgCases.find((c) => c.path === alone)!;
    const outline = golden.polygon!.cubics.map(asCubic);
    assertSvgFeatures(golden.features!, outline, featuresFromSvgPath(path));
  });

  test.each(Object.entries(QUADRATIC_PATHS))('%s, as %s', (path, cubicPath) => {
    const golden = svgCases.find((c) => c.path === path)!;
    const features = featuresFromSvgPath(path);
    const expected = featuresFromSvgPath(cubicPath);
    expect(features).toHaveLength(expected.length);
    expected.forEach((f, i) => assertFeaturesEqualish(f, features[i]!, `feature ${i}`));
    expect(features.map((f) => f.type)).toEqual(golden.features!.map((f) => f.type));
  });

  test.each([...QUARTER_ARC_PATHS])('%s, with arcs of 45 degrees', (path, cubicCount) => {
    expect(parseCubics(path)).toHaveLength(cubicCount);
    const golden = svgCases.find((c) => c.path === path)!;
    const polygon = polygonFromFeatures(featuresFromSvgPath(path));
    assertSameOutline(golden.polygon!.cubics.map(asCubic), polygon.cubics, 'outline');
    // Each arc cubic turns at most 45 degrees: its end tangents are at most that far apart.
    for (const c of parseCubics(path)) {
      const t0 = Math.atan2(c[3] - c[1], c[2] - c[0]);
      const t1 = Math.atan2(c[7] - c[5], c[6] - c[4]);
      const turn = Math.abs(((t1 - t0 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      expect(turn).toBeLessThanOrEqual(Math.PI / 4 + 1e-9);
    }
  });
});

const serializerGolden = serializer as unknown as {
  serialize: { name: string; input: GoldenInput; serialized: string }[];
  parse: { serialized: string; features?: GoldenFeature[]; error?: string }[];
};

function assertFeatureListsEqualish(expected: PolygonFeature[], actual: PolygonFeature[]) {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((f, i) => assertFeaturesEqualish(f, actual[i]!, `feature ${i}`));
}

describe('features serialize as in the original', () => {
  // The port writes 64-bit numbers in full, so the text differs from the original's Float text:
  // both read back as the same features.
  test.each(
    serializerGolden.serialize
      .filter((c) => !usesMaterialShape(c.input))
      .map((c) => [c.name, c] as const),
  )('%s', (_, golden) => {
    const features = buildPolygon(golden.input).features;
    const ours = serializeFeatures(features);
    expect(parseFeatures(ours)).toEqual(features);
    // The original writes tiny numbers with an exponent (1.0E-8), whose E its parser takes for a
    // tag: its text doesn't read back, so it is compared only where it has none.
    if (!/E/.test(golden.serialized.slice(2))) {
      const tags = (s: string) => s.replace(/[^a-zA-Z]/g, '');
      expect(tags(ours)).toBe(tags(golden.serialized));
      assertFeatureListsEqualish(parseFeatures(golden.serialized), parseFeatures(ours));
    }
  });

  test.each(serializerGolden.parse.map((c) => [c.serialized, c] as const))(
    'reads %j',
    (_, golden) => {
      if (golden.error) {
        expect(() => parseFeatures(golden.serialized)).toThrow();
        return;
      }
      assertFeatureListsEqualish(golden.features!.map(asFeature), parseFeatures(golden.serialized));
    },
  );
});
