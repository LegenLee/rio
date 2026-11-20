import { describe, expect, test } from 'vitest';
import golden from '../primitives/shapes/__goldens__/loading-indicator.json';
import { materialShape } from '../primitives/shapes/material-shapes';
import { transformPolygon } from '../primitives/shapes/polygon';
import { solveSpring } from '../primitives/spring/spring';
import {
  ACTIVE_INDICATOR_SCALE,
  createLoadingIndicator,
  determinateMoment,
  GLOBAL_ROTATION_MS,
  indeterminateMoment,
  LOADING_INDICATOR_SHAPES,
  loadingIndicatorScale,
  MORPH_INTERVAL_MS,
  springDurationMs,
  type LoadingIndicatorProps,
} from './loading-indicator';

const rotateZ = (degrees: number) => {
  const r = (degrees * Math.PI) / 180;
  return (x: number, y: number) =>
    [Math.cos(r) * x - Math.sin(r) * y, Math.sin(r) * x + Math.cos(r) * y] as const;
};

describe('the spec and Compose values', () => {
  test('a 38dp shape in 48dp, and a morph every 650ms on a turn every 4666ms', () => {
    expect(ACTIVE_INDICATOR_SCALE).toBe(38 / 48);
    expect(MORPH_INTERVAL_MS).toBe(650);
    expect(GLOBAL_ROTATION_MS).toBe(4666);
  });

  test("the loop's seven shapes, as Compose's", () => {
    expect(LOADING_INDICATOR_SHAPES).toEqual([
      'soft-burst',
      'cookie-9-sided',
      'pentagon',
      'pill',
      'sunny',
      'cookie-4-sided',
      'oval',
    ]);
  });

  test("the shapes' scale, against the original's", () => {
    expect(loadingIndicatorScale(LOADING_INDICATOR_SHAPES.map(materialShape))).toBeCloseTo(
      golden.indeterminateScaleFactor * golden.activeIndicatorScale,
      5,
    );
    const determinate = [
      transformPolygon(materialShape('circle'), rotateZ(18)),
      materialShape('soft-burst'),
    ];
    expect(loadingIndicatorScale(determinate)).toBeCloseTo(
      golden.determinateScaleFactor * golden.activeIndicatorScale,
      5,
    );
  });
});

describe('springDurationMs', () => {
  // Damping 0.6 and stiffness 200: the envelope starts at 1 / sqrt(1 - 0.6²) = 1.25 and decays at
  // 0.6 · sqrt(200) a second.
  const morph = { dampingRatio: 0.6, stiffness: 200 };
  const envelopeMs = (threshold: number) =>
    (Math.log(1.25 / threshold) / (0.6 * Math.sqrt(200))) * 1000;

  test("ends an underdamped spring once its envelope is within the threshold, in whole ms, as Compose's", () => {
    expect(envelopeMs(0.1)).toBeCloseTo(297.66, 2);
    expect(springDurationMs(morph, 0.1)).toBe(297);
  });

  test("ends the morph's spring within 0.01, before the next morph, where Compose's 0.1 cuts its overshoot", () => {
    expect(envelopeMs(0.01)).toBeCloseTo(569.02, 2);
    expect(springDurationMs(morph)).toBe(569);
    expect(springDurationMs(morph)).toBeLessThan(MORPH_INTERVAL_MS);
    // At Compose's end, the spring is still 9% past the shape.
    expect(solveSpring(morph, 0, 1, 0, 0.297).value).toBeGreaterThan(1.09);
  });

  test.each([0.1, 0.01])('a critically damped spring ends the ms it is within %d', (threshold) => {
    const params = { dampingRatio: 1, stiffness: 200 };
    const end = springDurationMs(params, threshold);
    const off = (ms: number) => 1 - solveSpring(params, 0, 1, 0, ms / 1000).value;
    expect(off(end)).toBeGreaterThan(threshold);
    expect(off(end + 1)).toBeLessThanOrEqual(threshold);
  });
});

describe('indeterminateMoment', () => {
  const n = LOADING_INDICATOR_SHAPES.length;
  const global = (ms: number) => ((ms % GLOBAL_ROTATION_MS) / GLOBAL_ROTATION_MS) * 360;

  test('starts at the first morph, a quarter turn in', () => {
    expect(indeterminateMoment(0, n)).toEqual({ index: 0, progress: 0, rotation: 90 });
  });

  test('runs the spring, overshooting, and turns with it', () => {
    // Damping 0.6 peaks at pi / (sqrt(200) · 0.8), about 278ms, long before the spring ends at 569ms.
    const at = 270;
    const progress = solveSpring({ dampingRatio: 0.6, stiffness: 200 }, 0, 1, 0, at / 1000).value;
    expect(progress).toBeGreaterThan(1);
    expect(indeterminateMoment(at, n)).toEqual({
      index: 0,
      progress,
      rotation: progress * 90 + 90 + global(at),
    });
  });

  test('once the spring ends, waits at the next morph, a quarter turn further', () => {
    const at = 600;
    expect(indeterminateMoment(at, n)).toEqual({
      index: 1,
      progress: 0,
      rotation: 180 + global(at),
    });
  });

  test('starts a morph every 650ms, and loops back to the first', () => {
    expect(indeterminateMoment(MORPH_INTERVAL_MS, n).index).toBe(1);
    expect(indeterminateMoment(MORPH_INTERVAL_MS * 3 + 10, n).index).toBe(3);
    expect(indeterminateMoment(MORPH_INTERVAL_MS * n, n).index).toBe(0);
  });

  test('where a spring ends, hardly jumps', () => {
    const end = springDurationMs({ dampingRatio: 0.6, stiffness: 200 });
    const before = indeterminateMoment(end - 1e-6, n);
    const after = indeterminateMoment(end + 1e-6, n);
    expect(after.index).toBe(before.index + 1);
    expect(Math.abs(after.rotation - before.rotation)).toBeLessThanOrEqual(1);
  });

  test('under reduced motion, a spring ends in time for the next, and hardly jumps', () => {
    const end = springDurationMs({ dampingRatio: 1, stiffness: 200 });
    expect(end).toBeLessThan(MORPH_INTERVAL_MS);
    const before = indeterminateMoment(end - 1e-6, n, true);
    const after = indeterminateMoment(end + 1e-6, n, true);
    expect(after.index).toBe(before.index + 1);
    expect(Math.abs(after.rotation - before.rotation)).toBeLessThanOrEqual(1);
  });

  test("under reduced motion, the morph doesn't overshoot", () => {
    for (let ms = 0; ms < MORPH_INTERVAL_MS; ms += 5) {
      expect(indeterminateMoment(ms, n, true).progress).toBeLessThanOrEqual(1);
    }
  });
});

describe('determinateMoment', () => {
  test('shares the range among the morphs, and turns half a turn back', () => {
    expect(determinateMoment(0, 1)).toEqual({ index: 0, progress: 0, rotation: -0 });
    expect(determinateMoment(0.5, 1)).toEqual({ index: 0, progress: 0.5, rotation: -90 });
    expect(determinateMoment(1, 1)).toEqual({ index: 0, progress: 1, rotation: -180 });
    expect(determinateMoment(0.5, 2)).toEqual({ index: 1, progress: 0, rotation: -90 });
    expect(determinateMoment(0.75, 2)).toEqual({ index: 1, progress: 0.5, rotation: -135 });
  });
});

describe('createLoadingIndicator', () => {
  const api = (props: LoadingIndicatorProps) => createLoadingIndicator({ props: () => props });
  const numbers = (d: string) => [...d.matchAll(/-?[\d.]+(?:e-?\d+)?/g)].map((m) => Number(m[0]));

  test('is an indeterminate progress bar without a value', () => {
    const root = api({}).parts.root();
    expect(root).toMatchObject({ role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '1' });
    expect(root['aria-valuenow']).toBeUndefined();
    expect(root['data-indeterminate']).toBe('');
    expect(api({}).indeterminate()).toBe(true);
  });

  test('reports its value while determinate', () => {
    const root = api({ value: 3, max: 4 }).parts.root();
    expect(root).toMatchObject({ 'aria-valuemax': '4', 'aria-valuenow': '3' });
    expect(root['data-indeterminate']).toBeUndefined();
  });

  test('carries its size and containment', () => {
    expect(api({ contained: true, size: 96 }).parts.root()).toMatchObject({
      'data-contained': '',
      style: '--rio-loading-indicator-size: 96px',
    });
    expect(api({}).parts.root().style).toBe('--rio-loading-indicator-size: 48px');
  });

  test.each([0, 200, 900, 2500])('draws a shape centered in the unit square, at %ims', (ms) => {
    const { d } = api({}).drawing(ms);
    expect(d).toMatch(/^M.*Z$/);
    const values = numbers(d);
    const xs = values.filter((_, i) => i % 2 === 0);
    const ys = values.filter((_, i) => i % 2 === 1);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(0.5, 6);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(0.5, 6);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(1);
  });

  test('starts its path at the first moment, for the first render', () => {
    const indicator = api({}).parts.indicator();
    expect(indicator.d).toBe(api({}).drawing(0).d);
    expect(indicator.transform).toBe('rotate(90 0.5 0.5)');
  });

  test('draws the progress while determinate, whatever the time', () => {
    const half = api({ value: 0.5 });
    expect(half.drawing(0)).toEqual(half.drawing(1000));
    expect(half.drawing(0).rotation).toBe(-90);
    expect(api({ value: 0.2 }).drawing(0).d).not.toBe(half.drawing(0).d);
  });

  test('morphs through the shapes it is given, by name or as polygons', () => {
    const named = api({ shapes: ['circle', 'heart'] }).drawing(0).d;
    const given = api({ shapes: [materialShape('circle'), materialShape('heart')] }).drawing(0).d;
    expect(given).toBe(named);
    expect(named).not.toBe(api({}).drawing(0).d);
  });

  test('needs at least two shapes', () => {
    expect(() => api({ shapes: ['heart'] }).drawing(0)).toThrow();
  });
});
