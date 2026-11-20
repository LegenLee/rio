// The port against the Kotlin original: each golden case, built with the port, matches what the
// original computed (scripts/shapes-goldens), within the original tests' tolerance.

import { describe, expect, test } from 'vitest';
import polygons from './__goldens__/polygons.json';
import {
  asCubic,
  asFeature,
  buildPolygon,
  usesMaterialShape,
  type GoldenInput,
  type GoldenPolygon,
} from './goldens';
import { calculateBounds, calculateMaxBounds, type RoundedPolygon } from './polygon';
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

/** Where the port deliberately differs from the original, with how the test checks it instead */
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
