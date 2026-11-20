// Ported from androidx graphics-shapes, commonTest's PolygonMeasureTest.kt, at androidx 079e2e3.
// Copyright 2023 The Android Open Source Project, licensed under the Apache License, Version 2.0.
// Changed: ported to TypeScript and Vitest.

import { describe, expect, test } from 'vitest';
import type { CornerRounding } from './corner-rounding';
import { straightCubic } from './cubic';
import { cornerFeature } from './features';
import { polygonFromFeatures, roundedPolygon, type RoundedPolygon } from './polygon';
import { LengthMeasurer, MeasuredPolygon } from './polygon-measure';
import { circlePolygon } from './shapes';
import { assertEqualish } from './test-utils';

const measurer = new LengthMeasurer();

function irregularPolygonMeasure(
  polygon: RoundedPolygon,
  extraChecks: (measuredPolygon: MeasuredPolygon) => void = () => {},
) {
  const measuredPolygon = MeasuredPolygon.measurePolygon(measurer, polygon);
  const cubics = [...measuredPolygon];

  expect(cubics[0]!.startOutlineProgress).toBe(0);
  expect(cubics[cubics.length - 1]!.endOutlineProgress).toBe(1);

  cubics.forEach((measuredCubic, index) => {
    if (index > 0) {
      expect(measuredCubic.startOutlineProgress).toBe(cubics[index - 1]!.endOutlineProgress);
    }
    expect(measuredCubic.endOutlineProgress).toBeGreaterThanOrEqual(
      measuredCubic.startOutlineProgress,
    );
  });

  measuredPolygon.features.forEach((progressableFeature, index) => {
    expect(
      progressableFeature.progress >= 0 && progressableFeature.progress < 1,
      `Feature #${index} has invalid progress: ${progressableFeature.progress}`,
    ).toBe(true);
  });

  extraChecks(measuredPolygon);
}

function regularPolygonMeasure(sides: number, rounding: CornerRounding = {}) {
  irregularPolygonMeasure(roundedPolygon({ numVertices: sides, rounding }), (measuredPolygon) => {
    expect(measuredPolygon.size).toBe(sides);
    [...measuredPolygon].forEach((measuredCubic, index) =>
      assertEqualish(index / sides, measuredCubic.startOutlineProgress),
    );
  });
}

function customPolygonMeasure(polygon: RoundedPolygon, progresses: number[]) {
  irregularPolygonMeasure(polygon, (measuredPolygon) => {
    expect(measuredPolygon.size).toBe(progresses.length);
    [...measuredPolygon].forEach((measuredCubic, index) =>
      assertEqualish(
        progresses[index]!,
        measuredCubic.endOutlineProgress - measuredCubic.startOutlineProgress,
      ),
    );
  });
}

describe('MeasuredPolygon', () => {
  test.each([3, 5, 8, 12, 20])('measures a sharp polygon with %i sides', (sides) =>
    regularPolygonMeasure(sides),
  );

  test.each([0.15, 0.5, 1])('measures a hexagon rounded %f', (radius) =>
    irregularPolygonMeasure(roundedPolygon({ numVertices: 6, rounding: { radius } })),
  );

  test('measures a circle', () => {
    // White box: the length measurer approximates arcs by straight segments, and the chosen
    // segment count should be within 1.5% of the true length.
    const polygon = circlePolygon({ numVertices: 4 });
    const actualLength = polygon.cubics.reduce((sum, c) => sum + measurer.measureCubic(c), 0);
    const expectedLength = 2 * Math.PI;
    expect(Math.abs(actualLength - expectedLength)).toBeLessThan(0.015 * expectedLength);
  });

  test('measures an irregular triangle', () =>
    irregularPolygonMeasure(
      roundedPolygon({
        vertices: [0, -1, 1, 1, 0, 0.5, -1, 1],
        perVertexRounding: [
          { radius: 0.2, smoothing: 0.5 },
          { radius: 0.2, smoothing: 0.5 },
          { radius: 0.4, smoothing: 0 },
          { radius: 0.2, smoothing: 0.5 },
        ],
      }),
    ));

  test('measures a square with one rounded corner', () =>
    irregularPolygonMeasure(
      roundedPolygon({
        vertices: [-1, -1, 1, -1, 1, 1, -1, 1],
        perVertexRounding: [{}, {}, { radius: 0.5, smoothing: 0.5 }, {}],
      }),
    ));

  test('measures an hourglass', () => {
    // Regression test: the legacy measurer (AngleMeasurer) skipped the diagonal sides, as they
    // are 0 degrees from the center.
    const unit = 1;
    const coordinates = [
      // lower glass
      0,
      0,
      unit,
      unit,
      -unit,
      unit,
      // upper glass
      0,
      0,
      -unit,
      -unit,
      unit,
      -unit,
    ];
    const diagonal = Math.sqrt(unit * unit + unit * unit);
    const horizontal = 2 * unit;
    const total = 4 * diagonal + 2 * horizontal;
    customPolygonMeasure(roundedPolygon({ vertices: coordinates }), [
      diagonal / total,
      horizontal / total,
      diagonal / total,
      diagonal / total,
      horizontal / total,
      diagonal / total,
    ]);
  });

  test('handles an empty feature at the end', () => {
    const triangle = polygonFromFeatures([
      cornerFeature([straightCubic(0, 0, 1, 1)], true),
      cornerFeature([straightCubic(1, 1, 1, 0)], true),
      cornerFeature([straightCubic(1, 0, 0, 0)], true),
      // Empty feature at the end
      cornerFeature([straightCubic(0, 0, 0, 0)], true),
    ]);
    irregularPolygonMeasure(triangle);
  });
});
