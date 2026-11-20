// The port against the Kotlin original: each golden case, built with the port, matches what the
// original computed (scripts/shapes-goldens), within the original tests' tolerance.

import { describe, expect, test } from 'vitest';
import morphs from './__goldens__/morphs.json';
import polygons from './__goldens__/polygons.json';
import {
  asCubic,
  asFeature,
  buildPolygon,
  usesMaterialShape,
  type GoldenInput,
  type GoldenPolygon,
} from './goldens';
import { pointOnCurve, type Cubic } from './cubic';
import { createMorph } from './morph';
import {
  calculateBounds,
  calculateMaxBounds,
  normalizePolygon,
  type RoundedPolygon,
} from './polygon';
import { assertCubicListsEqualish, assertEqualish, assertFeaturesEqualish } from './test-utils';

function assertBoundsEqualish(
  expected: readonly number[],
  actual: readonly number[],
  message: string,
) {
  expected.forEach((v, i) => assertEqualish(v, actual[i]!, `${message} [${i}]`));
}

export function assertMatchesGolden(golden: GoldenPolygon, polygon: RoundedPolygon) {
  assertEqualish(golden.center[0], polygon.center.x, 'center x');
  assertEqualish(golden.center[1], polygon.center.y, 'center y');
  expect(polygon.features).toHaveLength(golden.features.length);
  golden.features.forEach((feature, i) =>
    assertFeaturesEqualish(asFeature(feature), polygon.features[i]!, `feature ${i}`),
  );
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
 * Morphs between symmetric shapes whose feature mapping has exact ties in 64-bit numbers. The
 * original breaks them by Float rounding and the port by order, so they may match the curves
 * differently: equally valid, as the original on Kotlin/JS (which also uses 64-bit numbers) would.
 * These are checked for tracing the start and end shapes instead.
 */
const TIED_MORPHS = new Set(['triangle-to-square']);

/** Every point of the first outline is on the second, and back, sampled along the cubics. */
function assertSameOutline(a: readonly Cubic[], b: readonly Cubic[], message: string) {
  const sample = (cubics: readonly Cubic[], steps: number) =>
    cubics.flatMap((c) => Array.from({ length: steps + 1 }, (_, i) => pointOnCurve(c, i / steps)));
  for (const [from, to] of [
    [a, b],
    [b, a],
  ] as const) {
    const dense = sample(to, 200);
    for (const p of sample(from, 4)) {
      const nearest = Math.min(...dense.map((q) => q.minus(p).getDistance()));
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
