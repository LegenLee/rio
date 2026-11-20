// Measures a polygon's outline, so morphs can match curves that lie at similar places along two
// shapes. Not exported from the package.
//
// Ported from androidx graphics-shapes, PolygonMeasure.kt, at androidx 079e2e3. Copyright 2023 The
// Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; `MeasuredPolygon` is iterable and indexable rather than a Kotlin `AbstractList`, and
// `MeasuredCubic` takes the measurer rather than being an inner class. The debug logging is left
// out.

import { pointOnCurve, splitCubic, type Cubic } from './cubic';
import type { ProgressableFeature } from './feature-mapping';
import { DISTANCE_EPSILON, positiveModulo } from './math';
import { Point } from './point';
import type { RoundedPolygon } from './polygon';

/**
 * Measures cubics. Implementations can measure however they like (angle, length, ...), producing
 * values of 0 or more.
 */
export interface Measurer {
  /** The size of the cubic, however the implementation measures it: 0 or more. */
  measureCubic(c: Cubic): number;
  /**
   * The parameter t of the cubic at which the measure `m` is reached. `m` should be between 0 and
   * what `measureCubic` returns; it is capped otherwise.
   */
  findCubicCutPoint(c: Cubic, m: number): number;
}

/**
 * Approximates the arc length of a cubic by splitting it into segments and adding their lengths.
 * More segments come closer to the true length; the default is at least 98.5% accurate on a
 * circular arc, the worst case for the standard shapes.
 */
export class LengthMeasurer implements Measurer {
  // The minimum needed for up to 98.5% accuracy from the true arc length (see the circle test).
  private readonly segments = 3;

  measureCubic(c: Cubic): number {
    return this.closestProgressTo(c, Number.POSITIVE_INFINITY)[1];
  }

  findCubicCutPoint(c: Cubic, m: number): number {
    return this.closestProgressTo(c, m)[0];
  }

  private closestProgressTo(cubic: Cubic, threshold: number): [number, number] {
    let total = 0;
    let remainder = threshold;
    let prev = new Point(cubic[0], cubic[1]);

    for (let i = 1; i <= this.segments; i++) {
      const progress = i / this.segments;
      const point = pointOnCurve(cubic, progress);
      const segment = point.minus(prev).getDistance();

      if (segment >= remainder) {
        return [progress - (1 - remainder / segment) / this.segments, threshold];
      }

      remainder -= segment;
      total += segment;
      prev = point;
    }
    return [1, total];
  }
}

/**
 * A cubic, with the outline progress (start and end) it spans: a value in [0..1) for the distance
 * along the shape's whole outline. Morphs match cubics that lie at similar outline progress on
 * their shapes, after matching features and shifting.
 */
export class MeasuredCubic {
  readonly measuredSize: number;
  private _startOutlineProgress: number;
  private _endOutlineProgress: number;

  constructor(
    private readonly measurer: Measurer,
    readonly cubic: Cubic,
    startOutlineProgress: number,
    endOutlineProgress: number,
  ) {
    if (!(endOutlineProgress >= startOutlineProgress)) {
      throw new Error(
        'endOutlineProgress is expected to be equal or greater than startOutlineProgress',
      );
    }
    this.measuredSize = measurer.measureCubic(cubic);
    this._startOutlineProgress = startOutlineProgress;
    this._endOutlineProgress = endOutlineProgress;
  }

  get startOutlineProgress(): number {
    return this._startOutlineProgress;
  }

  get endOutlineProgress(): number {
    return this._endOutlineProgress;
  }

  updateProgressRange(
    startOutlineProgress = this._startOutlineProgress,
    endOutlineProgress = this._endOutlineProgress,
  ): void {
    if (!(endOutlineProgress >= startOutlineProgress)) {
      throw new Error(
        'endOutlineProgress is expected to be equal or greater than startOutlineProgress',
      );
    }
    this._startOutlineProgress = startOutlineProgress;
    this._endOutlineProgress = endOutlineProgress;
  }

  /** Cuts this measured cubic in two at the given outline progress. */
  cutAtProgress(cutOutlineProgress: number): [MeasuredCubic, MeasuredCubic] {
    // Floating point errors further up can land the cut just outside this cubic's progress, so
    // limit it to those bounds to avoid further errors later.
    const boundedCutOutlineProgress = Math.min(
      Math.max(cutOutlineProgress, this._startOutlineProgress),
      this._endOutlineProgress,
    );
    const outlineProgressSize = this._endOutlineProgress - this._startOutlineProgress;
    const progressFromStart = boundedCutOutlineProgress - this._startOutlineProgress;

    // Earlier parts of the computation have empty measured cubics (with a progress size of 0),
    // but those are filtered out before this is called.
    const relativeProgress = progressFromStart / outlineProgressSize;
    const t = this.measurer.findCubicCutPoint(this.cubic, relativeProgress * this.measuredSize);
    if (!(t >= 0 && t <= 1)) throw new Error('Cubic cut point is expected to be between 0 and 1');

    // c1 and c2 are the two new cubics
    const [c1, c2] = splitCubic(this.cubic, t);
    return [
      new MeasuredCubic(this.measurer, c1, this._startOutlineProgress, boundedCutOutlineProgress),
      new MeasuredCubic(this.measurer, c2, boundedCutOutlineProgress, this._endOutlineProgress),
    ];
  }
}

/** A polygon's cubics, measured along its outline, and its corners with their progress */
export class MeasuredPolygon implements Iterable<MeasuredCubic> {
  private readonly cubics: MeasuredCubic[];

  private constructor(
    private readonly measurer: Measurer,
    readonly features: readonly ProgressableFeature[],
    cubics: readonly Cubic[],
    outlineProgress: readonly number[],
  ) {
    if (outlineProgress.length !== cubics.length + 1) {
      throw new Error('Outline progress size is expected to be the cubics size + 1');
    }
    if (outlineProgress[0] !== 0) {
      throw new Error('First outline progress value is expected to be zero');
    }
    if (outlineProgress[outlineProgress.length - 1] !== 1) {
      throw new Error('Last outline progress value is expected to be one');
    }

    const measuredCubics: MeasuredCubic[] = [];
    let startOutlineProgress = 0;
    for (let index = 0; index < cubics.length; index++) {
      // Filter out "empty" cubics
      if (outlineProgress[index + 1]! - outlineProgress[index]! > DISTANCE_EPSILON) {
        measuredCubics.push(
          new MeasuredCubic(
            measurer,
            cubics[index]!,
            startOutlineProgress,
            outlineProgress[index + 1]!,
          ),
        );
        // The next measured cubic starts exactly where this one ends.
        startOutlineProgress = outlineProgress[index + 1]!;
      }
    }
    // Empty cubics may have been removed at the end: make the last measured cubic end at 1.
    measuredCubics[measuredCubics.length - 1]!.updateProgressRange(undefined, 1);
    this.cubics = measuredCubics;
  }

  get size(): number {
    return this.cubics.length;
  }

  /** The measured cubic at `index`, or undefined (Kotlin's `getOrNull`) */
  get(index: number): MeasuredCubic | undefined {
    return this.cubics[index];
  }

  [Symbol.iterator](): Iterator<MeasuredCubic> {
    return this.cubics[Symbol.iterator]();
  }

  /**
   * An equivalent polygon that starts at the given outline progress: the cubic that crosses it is
   * cut (unless the cut is at one of its ends). Given 0.4 and cubics on the outline progress ranges
   * c1 [0 -> 0.2], c2 [0.2 -> 0.5], c3 [0.5 -> 1.0], c2 is cut in two at 0.4, into c2a [0.2 -> 0.4]
   * and c2b [0.4 -> 0.5], and the result has [c2b, c3, c1, c2a], their ranges shifted to start at
   * 0: c2b [0 -> 0.1], c3 [0.1 -> 0.6], c1 [0.6 -> 0.8], c2a [0.8 -> 1.0].
   */
  cutAndShift(cuttingPoint: number): MeasuredPolygon {
    if (!(cuttingPoint >= 0 && cuttingPoint <= 1)) {
      throw new Error('Cutting point is expected to be between 0 and 1');
    }
    if (cuttingPoint < DISTANCE_EPSILON) return this;

    // The cubic to cut
    const targetIndex = this.cubics.findIndex(
      (c) => cuttingPoint >= c.startOutlineProgress && cuttingPoint <= c.endOutlineProgress,
    );
    const target = this.cubics[targetIndex]!;
    // b1 and b2 are the two cubics from the cut
    const [b1, b2] = target.cutAtProgress(cuttingPoint);

    // The cubics: the second part of the target (after the cut), every cubic after the target to
    // the end and from the start to the target, then the first part of the target (before the cut)
    const retCubics: Cubic[] = [b2.cubic];
    for (let i = 1; i < this.cubics.length; i++) {
      retCubics.push(this.cubics[(i + targetIndex) % this.cubics.length]!.cubic);
    }
    retCubics.push(b1.cubic);

    // Their outline progress. With 3 cubics on [0 .. 0.3], [0.3 .. 0.8], and [0.8 .. 1.0], and a cut
    // and shift at 0.6:
    // 0.  0123456789
    //     |--|--/-|-|
    // it starts at 0 (the cutting point, shifted to 0.0), then 0.8 - 0.6 = 0.2, then 1 - 0.6 = 0.4,
    // then 0.3 - 0.6 + 1 = 0.7, then 1 (the cutting point again): (0.0, 0.2, 0.4, 0.7, 1.0).
    const retOutlineProgress: number[] = [];
    for (let index = 0; index < this.cubics.length + 2; index++) {
      if (index === 0) retOutlineProgress.push(0);
      else if (index === this.cubics.length + 1) retOutlineProgress.push(1);
      else {
        const cubicIndex = (targetIndex + index - 1) % this.cubics.length;
        retOutlineProgress.push(
          positiveModulo(this.cubics[cubicIndex]!.endOutlineProgress - cuttingPoint, 1),
        );
      }
    }

    // Shift the features' outline progress too.
    const newFeatures = this.features.map((f) => ({
      progress: positiveModulo(f.progress - cuttingPoint, 1),
      feature: f.feature,
    }));

    // The constructor filters out all empty cubics (whose anchors are (almost) the same point).
    return new MeasuredPolygon(this.measurer, newFeatures, retCubics, retOutlineProgress);
  }

  static measurePolygon(measurer: Measurer, polygon: RoundedPolygon): MeasuredPolygon {
    const cubics: Cubic[] = [];
    const featureToCubic: [RoundedPolygon['features'][number], number][] = [];

    // The polygon's cubics, and its corners, each with the representative cubic to use.
    for (const feature of polygon.features) {
      feature.cubics.forEach((cubic, cubicIndex) => {
        if (feature.type === 'corner' && cubicIndex === Math.trunc(feature.cubics.length / 2)) {
          featureToCubic.push([feature, cubics.length]);
        }
        cubics.push(cubic);
      });
    }
    const measures = [0];
    for (const cubic of cubics) {
      const measure = measurer.measureCubic(cubic);
      if (!(measure >= 0)) {
        throw new Error('Measured cubic is expected to be greater or equal to zero');
      }
      measures.push(measures[measures.length - 1]! + measure);
    }
    const totalMeasure = measures[measures.length - 1]!;
    const outlineProgress = measures.map((m) => m / totalMeasure);

    const features = featureToCubic.map(([feature, ix]) => ({
      progress: positiveModulo((outlineProgress[ix]! + outlineProgress[ix + 1]!) / 2, 1),
      feature,
    }));

    return new MeasuredPolygon(measurer, features, cubics, outlineProgress);
  }
}
