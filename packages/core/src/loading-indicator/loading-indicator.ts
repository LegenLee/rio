// The loading indicator (M3 Expressive): a shape that morphs through Material shapes as it turns,
// for waits too short for a progress indicator. Props, parts, and the shape at any moment.
//
// The shapes, their scale, and the motion follow Compose Material3's LoadingIndicator.kt at androidx
// 079e2e3, with the spring's duration from Compose's SpringEstimation.kt. Copyright 2024 The
// Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; the motion is a function of the time since it started rather than coroutines, the
// morphs' spring runs until it is within 0.01 rather than 0.1, and under reduced motion the morphs
// don't overshoot (Rio's choices).

import type { PartAttrs, PartNode } from '../parts';
import { materialShape, type MaterialShapeName } from '../primitives/shapes/material-shapes';
import { createMorph, type Morph } from '../primitives/shapes/morph';
import { cubicsPath } from '../primitives/shapes/path';
import {
  calculateBounds,
  calculateMaxBounds,
  normalizePolygon,
  transformPolygon,
  type RoundedPolygon,
} from '../primitives/shapes/polygon';
import type { Cubic } from '../primitives/shapes/cubic';
import { solveSpring, type SpringParams } from '../primitives/spring/spring';
import { resolveProps } from '../utils/object';
import { progressBarAttrs, progressFraction } from '../utils/progress';

export interface LoadingIndicatorProps {
  /**
   * The progress, from 0 to `max`, as a pull-to-refresh gesture's. Without it, the indicator loops
   * (indeterminate), its main use: the spec keeps it for waits whose progress isn't known.
   */
  value?: number;
  /** The value of complete progress. Defaults to 1. */
  max?: number;
  /**
   * Draws the indicator on a circle of the primary container color, for over other content. The
   * spec also asks for it with pull-to-refresh.
   */
  contained?: boolean;
  /** The width and height, in px. Defaults to 48; the spec keeps it from 24 to 240. */
  size?: number;
  /**
   * The shapes to morph through, at least two: names from `MATERIAL_SHAPES`, or polygons. Defaults
   * to the spec's: seven shapes in a loop, or while determinate, a circle to a soft burst.
   */
  shapes?: readonly (MaterialShapeName | RoundedPolygon)[];
}

export const loadingIndicatorDefaults = {
  max: 1,
  contained: false,
  size: 48,
} satisfies Required<Omit<LoadingIndicatorProps, 'value' | 'shapes'>>;

/** The shapes the indeterminate indicator loops through, as Compose's */
export const LOADING_INDICATOR_SHAPES: readonly MaterialShapeName[] = [
  'soft-burst',
  'cookie-9-sided',
  'pentagon',
  'pill',
  'sunny',
  'cookie-4-sided',
  'oval',
];

/** How often a new morph starts */
export const MORPH_INTERVAL_MS = 650;
/** One turn of the rotation the indeterminate indicator adds to its morphs' quarter turns */
export const GLOBAL_ROTATION_MS = 4666;
/** The share of the size the shapes take: the spec's 38dp active indicator in 48dp */
export const ACTIVE_INDICATOR_SCALE = 38 / 48;

/** The morph's spring, as Compose's */
const MORPH_SPRING: SpringParams = { dampingRatio: 0.6, stiffness: 200 };
/**
 * Where the morph's spring ends: within 0.01 of the shape, Compose's default `visibilityThreshold`,
 * at 569ms, before the next morph starts (Rio's choice). Compose raises it to 0.1 to end the spring
 * sooner, at 297ms, but that is just after its overshoot peaks, and the drawing snaps back 8.5° and
 * the shape 9% in a frame; within 0.01, the spring comes back by itself and the end hardly shows.
 */
const MORPH_THRESHOLD = 0.01;
/** Under reduced motion, the morph doesn't overshoot (Rio's choice). */
const REDUCED_MORPH_SPRING: SpringParams = { dampingRatio: 1, stiffness: 200 };

/**
 * How long a spring from 0 to 1 runs before it is ended, in whole ms, as Compose counts them: once
 * it is within `threshold` of 1. An underdamped spring ends once its envelope is (SpringEstimation.kt's
 * estimate); a critically damped one, which Compose estimates by Newton's method, when it gets
 * there, found here by bisection.
 */
export function springDurationMs(
  { dampingRatio: zeta, stiffness }: SpringParams,
  threshold = MORPH_THRESHOLD,
): number {
  if (zeta < 1) {
    const w0 = Math.sqrt(stiffness);
    const r = -zeta * w0;
    const imaginary = w0 * Math.sqrt(1 - zeta * zeta);
    // The displacement starts at 1 with no velocity: c1 = 1, c2 = (0 - r * c1) / imaginary.
    const c = Math.hypot(1, -r / imaginary);
    return Math.trunc((Math.log(threshold / c) / r) * 1000);
  }
  let low = 0;
  let high = 10;
  for (let i = 0; i < 60; i++) {
    const t = (low + high) / 2;
    const { value } = solveSpring({ dampingRatio: zeta, stiffness }, 0, 1, 0, t);
    if (1 - value > threshold) low = t;
    else high = t;
  }
  return Math.trunc(high * 1000);
}

/** Which morph is showing, how far along, and the drawing's rotation in degrees (clockwise) */
export interface LoadingIndicatorMoment {
  index: number;
  progress: number;
  rotation: number;
}

/**
 * The indeterminate indicator `elapsedMs` after it started, as Compose runs it: every 650ms a morph
 * starts, on its spring; when the spring ends (see `springDurationMs`) the next morph is
 * lined up at its start, and the drawing turns a quarter further. On top, the whole drawing turns
 * once every 4666ms. The progress overshoots past 1 on the spring, and the shape with it.
 */
export function indeterminateMoment(
  elapsedMs: number,
  morphCount: number,
  reducedMotion = false,
): LoadingIndicatorMoment {
  const spring = reducedMotion ? REDUCED_MORPH_SPRING : MORPH_SPRING;
  const duration = springDurationMs(spring);
  const period = Math.max(MORPH_INTERVAL_MS, duration);
  const cycle = Math.floor(elapsedMs / period);
  const inCycle = elapsedMs - cycle * period;
  // The spring runs, or it has ended and the next morph waits at its start.
  const running = inCycle < duration;
  const finished = running ? cycle : cycle + 1;
  const progress = running ? solveSpring(spring, 0, 1, 0, inCycle / 1000).value : 0;
  // Compose starts the morphs' rotation at a quarter turn and adds one as each morph ends.
  const morphRotation = (90 + 90 * finished) % 360;
  const globalRotation = ((elapsedMs % GLOBAL_ROTATION_MS) / GLOBAL_ROTATION_MS) * 360;
  return {
    index: finished % morphCount,
    progress,
    rotation: progress * 90 + morphRotation + globalRotation,
  };
}

/**
 * The determinate indicator at `fraction` of its progress: the morphs share the range in turn,
 * and the drawing turns a half turn counterclockwise over all of it.
 */
export function determinateMoment(fraction: number, morphCount: number): LoadingIndicatorMoment {
  const index = Math.min(Math.floor(morphCount * fraction), morphCount - 1);
  // At 1 on the last morph, it is 1 rather than 0.
  const progress = fraction === 1 && index === morphCount - 1 ? 1 : (fraction * morphCount) % 1;
  return { index, progress, rotation: -fraction * 180 };
}

/**
 * The scale that fits the shapes in the indicator as they turn, at the spec's ratio: for each
 * shape, its bounds against the square that holds it in any rotation, the smallest over all of
 * them (LoadingIndicator.kt's `calculateScaleFactor`), times `ACTIVE_INDICATOR_SCALE`.
 */
export function loadingIndicatorScale(polygons: readonly RoundedPolygon[]): number {
  let scaleFactor = 1;
  for (const polygon of polygons) {
    const [left, top, right, bottom] = calculateBounds(polygon);
    const [maxLeft, maxTop, maxRight, maxBottom] = calculateMaxBounds(polygon);
    const scaleX = (right - left) / (maxRight - maxLeft);
    const scaleY = (bottom - top) / (maxBottom - maxTop);
    // The larger of the two keeps a shape such as a pill from throwing off the whole result.
    scaleFactor = Math.min(scaleFactor, Math.max(scaleX, scaleY));
  }
  return scaleFactor * ACTIVE_INDICATOR_SCALE;
}

/** Compose's `Matrix().apply { rotateZ(degrees) }`, around (0, 0) */
const rotateZ = (degrees: number) => {
  const r = (degrees * Math.PI) / 180;
  const s = Math.sin(r);
  const c = Math.cos(r);
  return (x: number, y: number) => [c * x - s * y, s * x + c * y] as const;
};

let determinateShapes: readonly RoundedPolygon[] | undefined;

/** The determinate default: a circle, turned to line up with the soft burst it morphs to */
const defaultDeterminateShapes = () =>
  (determinateShapes ??= [
    transformPolygon(materialShape('circle'), rotateZ(360 / 20)),
    materialShape('soft-burst'),
  ]);

/** The morphs between the shapes in turn, each between the shapes normalized; looping, back to the first. */
function morphSequence(polygons: readonly RoundedPolygon[], loop: boolean): Morph[] {
  const morphs: Morph[] = [];
  for (let i = 0; i < polygons.length; i++) {
    const next = i + 1 < polygons.length ? polygons[i + 1] : loop ? polygons[0] : undefined;
    if (next) morphs.push(createMorph(normalizePolygon(polygons[i]!), normalizePolygon(next)));
  }
  return morphs;
}

/** The indicator's drawing at a moment: its path in the unit square, and its rotation */
export interface LoadingIndicatorDrawing {
  /** The path's data, in a 1 by 1 view box */
  d: string;
  /** Degrees, clockwise, around the center */
  rotation: number;
}

/** A coordinate in the unit square, to 1e-4: 0.012px off at the largest size, 240px. */
const round = (v: number) => Math.round(v * 1e4) / 1e4;

/**
 * The morph's shape at `progress`, scaled by `scale` and centered in the unit square by the bounds
 * of all its points, as LoadingIndicator.kt's `processPath` centers the path by Android's
 * `Path.getBounds`, which takes control points too. Rounded, the path is a fifth as long, which
 * every frame writes, and the same in every engine, for server rendering.
 */
function shapeAt(morph: Morph, progress: number, scale: number): string {
  const cubics = morph.cubics(progress);
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const c of cubics) {
    for (let i = 0; i < 8; i += 2) {
      left = Math.min(left, c[i]!);
      right = Math.max(right, c[i]!);
      top = Math.min(top, c[i + 1]!);
      bottom = Math.max(bottom, c[i + 1]!);
    }
  }
  const dx = 0.5 - ((left + right) / 2) * scale;
  const dy = 0.5 - ((top + bottom) / 2) * scale;
  return cubicsPath(
    cubics.map(
      (c) => c.map((v, i) => round(v * scale + (i % 2 === 0 ? dx : dy))) as unknown as Cubic,
    ),
  );
}

export interface LoadingIndicatorOptions {
  /** Returns the current prop values. */
  props: () => LoadingIndicatorProps;
}

/** The indicator's markup, part by part. `loadingIndicatorSkeleton` nests them. */
export interface LoadingIndicatorParts {
  /**
   * A progress bar, sized by `--rio-loading-indicator-size`. The app names it, as with
   * `aria-label="Loading news"`, describing what is loading.
   */
  root: () => PartAttrs;
  /** Holds the shape, in a 1 by 1 view box. */
  svg: () => PartAttrs;
  /** The shape. Its `d` and `transform` are the first moment's, which `attachLoadingIndicator` moves on from. */
  indicator: () => PartAttrs;
}

export const loadingIndicatorSkeleton: PartNode<keyof LoadingIndicatorParts> = {
  part: 'root',
  tag: 'div',
  children: [{ part: 'svg', tag: 'svg', children: [{ part: 'indicator', tag: 'path' }] }],
};

export interface LoadingIndicatorApi {
  parts: LoadingIndicatorParts;
  /** Whether the progress is unknown, so the indicator loops. */
  indeterminate: () => boolean;
  /**
   * The drawing `elapsedMs` after the indicator started: the loop's moment while indeterminate,
   * the progress's otherwise.
   */
  drawing: (elapsedMs: number, reducedMotion?: boolean) => LoadingIndicatorDrawing;
}

export function createLoadingIndicator(options: LoadingIndicatorOptions): LoadingIndicatorApi {
  const props = () => resolveProps(loadingIndicatorDefaults, options.props());
  const fraction = () => {
    const p = props();
    return progressFraction(p.value, p.max);
  };
  const indeterminate = () => fraction() === undefined;

  // Building morphs is the costly part: they are made again only when the shapes, or whether
  // they loop, change.
  let cached:
    | { key: readonly unknown[]; loop: boolean; morphs: Morph[]; scale: number }
    | undefined;
  const prepared = () => {
    const loop = indeterminate();
    const shapes = options.props().shapes;
    const key = shapes ?? [];
    if (
      !cached ||
      cached.loop !== loop ||
      cached.key.length !== key.length ||
      cached.key.some((s, i) => s !== key[i])
    ) {
      const polygons = shapes
        ? shapes.map((s) => (typeof s === 'string' ? materialShape(s) : s))
        : loop
          ? LOADING_INDICATOR_SHAPES.map(materialShape)
          : defaultDeterminateShapes();
      if (polygons.length < 2) throw new Error('A loading indicator needs at least two shapes');
      cached = {
        key: [...key],
        loop,
        morphs: morphSequence(polygons, loop),
        scale: loadingIndicatorScale(polygons),
      };
    }
    return cached;
  };

  const drawing = (elapsedMs: number, reducedMotion = false): LoadingIndicatorDrawing => {
    const { morphs, scale } = prepared();
    const f = fraction();
    const moment =
      f === undefined
        ? indeterminateMoment(elapsedMs, morphs.length, reducedMotion)
        : determinateMoment(f, morphs.length);
    return { d: shapeAt(morphs[moment.index]!, moment.progress, scale), rotation: moment.rotation };
  };

  return {
    parts: {
      root: () => {
        const p = props();
        return {
          ...progressBarAttrs(p.value, p.max),
          class: 'rio-loading-indicator',
          'data-indeterminate': indeterminate() ? '' : undefined,
          'data-contained': p.contained ? '' : undefined,
          style: `--rio-loading-indicator-size: ${p.size}px`,
        };
      },
      svg: () => ({
        class: 'rio-loading-indicator__svg',
        viewBox: '0 0 1 1',
        'aria-hidden': 'true',
      }),
      indicator: () => {
        const { d, rotation } = drawing(0);
        return {
          class: 'rio-loading-indicator__indicator',
          d,
          transform: `rotate(${rotation} 0.5 0.5)`,
        };
      },
    },
    indeterminate,
    drawing,
  };
}
