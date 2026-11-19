// Progress indicators, linear and circular: props, parts, and the waves the wavy shape draws.

import type { PartAttrs, PartNode } from '../parts';
import { resolveProps } from '../utils/object';

/** What the linear and the circular indicator share. */
export interface ProgressCommonProps {
  /**
   * The progress, from 0 to `max`. Without it, the indicator shows progress it can't measure
   * (indeterminate), as a native `<progress>` does.
   */
  value?: number;
  /** The value of complete progress. Defaults to 1. */
  max?: number;
  /** Draws the active indicator as a wave, the M3 Expressive shape. */
  wavy?: boolean;
  /** The thickness of the active indicator and the track, in px. Defaults to 4. */
  thickness?: number;
}

export type LinearProgressProps = ProgressCommonProps;

export interface CircularProgressProps extends ProgressCommonProps {
  /**
   * The width and height, in px. Defaults to 36px more than the thickness, or 44px more when wavy:
   * 40 and 48 at the default thickness.
   */
  size?: number;
}

export const progressDefaults = {
  max: 1,
  wavy: false,
  thickness: 4,
} satisfies Required<Omit<ProgressCommonProps, 'value'>>;

/** The wave's amplitude on a circular indicator, in px, which its default size leaves room for. */
const CIRCULAR_AMPLITUDE = 1.6;

/** How much of the range the progress covers, from 0 to 1, or `undefined` while indeterminate. */
const fractionOf = (p: { value?: number; max: number }) => {
  if (p.value === undefined || !Number.isFinite(p.value)) return undefined;
  const max = Number.isFinite(p.max) && p.max > 0 ? p.max : progressDefaults.max;
  return Math.min(1, Math.max(0, p.value / max));
};

/** The props the root of both indicators shares, for assistive technology and the stylesheet. */
const rootAttrs = (p: ProgressCommonProps & { max: number; wavy: boolean; thickness: number }) => {
  const fraction = fractionOf(p);
  const max = Number.isFinite(p.max) && p.max > 0 ? p.max : progressDefaults.max;
  const determinate = fraction !== undefined;
  return {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': String(max),
    'aria-valuenow': determinate ? String(Math.min(max, Math.max(0, p.value!))) : undefined,
    'data-indeterminate': determinate ? undefined : '',
    'data-wavy': p.wavy ? '' : undefined,
    'data-empty': fraction === 0 ? '' : undefined,
    'data-full': fraction === 1 ? '' : undefined,
    // The wave lies flat near the ends of determinate progress, below 10% and from 95%.
    'data-flat': p.wavy && determinate && (fraction <= 0.1 || fraction >= 0.95) ? '' : undefined,
    style: `--rio-progress-value: ${fraction ?? 0}; --rio-progress-thickness: ${p.thickness}px`,
  };
};

export interface ProgressOptions<P> {
  /** Returns the current prop values. */
  props: () => P;
}

/** The linear indicator's markup, part by part. `linearProgressSkeleton` nests them. */
export interface LinearProgressParts {
  /**
   * A progress bar. Its `style` carries the progress as a fraction (`--rio-progress-value`) and
   * the thickness (`--rio-progress-thickness`).
   */
  root: () => PartAttrs;
  /** The track below the trailing indicator, while indeterminate. */
  trackLower: () => PartAttrs;
  /** The second indicator that moves along the track while indeterminate. */
  indicatorLower: () => PartAttrs;
  /** The track between the indicators. */
  trackMiddle: () => PartAttrs;
  /** The progress; while indeterminate, the leading of the two indicators. */
  indicator: () => PartAttrs;
  /** The track after the progress, which ends in the stop indicator while determinate. */
  trackUpper: () => PartAttrs;
  /** Holds the indicators' waves while wavy, which `attachLinearProgress` draws. */
  wave: () => PartAttrs;
  indicatorWave: () => PartAttrs;
  indicatorLowerWave: () => PartAttrs;
}

export const linearProgressSkeleton: PartNode<keyof LinearProgressParts, 'showsWave'> = {
  part: 'root',
  tag: 'div',
  children: [
    { part: 'trackLower', tag: 'span' },
    { part: 'indicatorLower', tag: 'span' },
    { part: 'trackMiddle', tag: 'span' },
    { part: 'indicator', tag: 'span' },
    { part: 'trackUpper', tag: 'span' },
    {
      part: 'wave',
      tag: 'svg',
      when: 'showsWave',
      children: [
        { part: 'indicatorLowerWave', tag: 'path' },
        { part: 'indicatorWave', tag: 'path' },
      ],
    },
  ],
};

export interface LinearProgressApi {
  parts: LinearProgressParts;
  /** Whether the wave part renders: while wavy. */
  showsWave: () => boolean;
  /** Whether the progress is unknown. */
  indeterminate: () => boolean;
}

export function createLinearProgress(
  options: ProgressOptions<LinearProgressProps>,
): LinearProgressApi {
  const props = () => resolveProps(progressDefaults, options.props());
  const part = (name: string) => () => ({
    class: `rio-linear-progress__${name}`,
    'aria-hidden': 'true',
  });

  return {
    parts: {
      root: () => ({ class: 'rio-linear-progress', ...rootAttrs(props()) }),
      trackLower: part('track-lower'),
      indicatorLower: part('indicator-lower'),
      trackMiddle: part('track-middle'),
      indicator: part('indicator'),
      trackUpper: part('track-upper'),
      wave: part('wave'),
      indicatorWave: () => ({ class: 'rio-linear-progress__indicator-wave' }),
      indicatorLowerWave: () => ({ class: 'rio-linear-progress__indicator-lower-wave' }),
    },
    showsWave: () => props().wavy,
    indeterminate: () => fractionOf(props()) === undefined,
  };
}

/** The circular indicator's markup, part by part. `circularProgressSkeleton` nests them. */
export interface CircularProgressParts {
  /**
   * A progress bar. Its `style` carries the progress, the thickness, and the circle's size and
   * radius (`--rio-circular-progress-size`, `--rio-circular-progress-radius`).
   */
  root: () => PartAttrs;
  /** Draws the circles, from the top, clockwise. */
  svg: () => PartAttrs;
  /** The track: the rest of the circle, while determinate. */
  track: () => PartAttrs;
  indicator: () => PartAttrs;
  /** The indicator's wave while wavy, which `attachCircularProgress` draws. */
  indicatorWave: () => PartAttrs;
}

export const circularProgressSkeleton: PartNode<keyof CircularProgressParts, 'showsWave'> = {
  part: 'root',
  tag: 'div',
  children: [
    {
      part: 'svg',
      tag: 'svg',
      children: [
        { part: 'track', tag: 'circle' },
        { part: 'indicator', tag: 'circle' },
        { part: 'indicatorWave', tag: 'path', when: 'showsWave' },
      ],
    },
  ],
};

export interface CircularProgressApi {
  parts: CircularProgressParts;
  showsWave: () => boolean;
  indeterminate: () => boolean;
  /** The width and height, in px, with the default filled in. */
  size: () => number;
  /** The radius the indicator and the track lie on, in px. */
  radius: () => number;
}

export function createCircularProgress(
  options: ProgressOptions<CircularProgressProps>,
): CircularProgressApi {
  const props = () => resolveProps(progressDefaults, options.props());
  const size = () => {
    const p = props();
    return Number.isFinite(p.size) && p.size! > 0 ? p.size! : (p.wavy ? 44 : 36) + p.thickness;
  };
  // The wave's peaks reach the edge of the box.
  const radius = () => {
    const p = props();
    return Math.max(0, (size() - p.thickness - (p.wavy ? 2 * CIRCULAR_AMPLITUDE : 0)) / 2);
  };
  const circle = (name: string) => () => {
    const center = String(size() / 2);
    return { class: `rio-circular-progress__${name}`, cx: center, cy: center, r: String(radius()) };
  };

  return {
    parts: {
      root() {
        const attrs = rootAttrs(props());
        return {
          class: 'rio-circular-progress',
          ...attrs,
          style:
            `${attrs.style}; --rio-circular-progress-size: ${size()}px; ` +
            `--rio-circular-progress-radius: ${radius()}px`,
        };
      },
      svg: () => ({
        class: 'rio-circular-progress__svg',
        viewBox: `0 0 ${size()} ${size()}`,
        'aria-hidden': 'true',
      }),
      track: circle('track'),
      indicator: circle('indicator'),
      indicatorWave: () => ({ class: 'rio-circular-progress__indicator-wave' }),
    },
    showsWave: () => props().wavy,
    indeterminate: () => fractionOf(props()) === undefined,
    size,
    radius,
  };
}

// Waves

export interface LinearWave {
  /** Where the wave's line starts and ends, in px along the track, from its start. */
  from: number;
  to: number;
  /** The track's middle, in px from the top. */
  y: number;
  amplitude: number;
  wavelength: number;
  /** How far the wave has moved toward the end, in px. */
  shift: number;
}

/** Px between the points a wave is drawn through: smooth at any wavelength the spec uses */
const STEP = 1.5;

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A sine wave along the track, as an SVG path: from `from` to `to`, its peaks `amplitude` either
 * side of `y`. The wave is fixed to the track, so it doesn't slide as its ends move, and moves by
 * `shift`.
 */
export function linearWavePath({ from, to, y, amplitude, wavelength, shift }: LinearWave): string {
  if (!(to >= from)) return '';
  const at = (x: number) =>
    round(y + amplitude * Math.sin((2 * Math.PI * (x - shift)) / wavelength));
  const count = Math.max(1, Math.ceil((to - from) / STEP));
  let d = `M${round(from)} ${at(from)}`;
  for (let i = 1; i <= count; i++) {
    const x = from + ((to - from) * i) / count;
    d += `L${round(x)} ${at(x)}`;
  }
  return d;
}

export interface CircularWave {
  /** The circle's center and radius, in px. */
  cx: number;
  cy: number;
  radius: number;
  /** Where the arc starts and ends, in px along the circle, from its start. */
  from: number;
  to: number;
  amplitude: number;
  /** The wavelength wanted; a whole number of waves goes round the circle, so it stays seamless. */
  wavelength: number;
  /** How far the wave has moved along the circle, in px. */
  shift: number;
}

/**
 * An arc that waves in and out from the circle, as an SVG path: its peaks `amplitude` either side,
 * from `from` to `to` along it. Angles go as an SVG circle's path does, from 3 o'clock, clockwise.
 */
export function circularWavePath(wave: CircularWave): string {
  const { cx, cy, radius, from, to, amplitude, shift } = wave;
  if (!(to >= from) || radius <= 0) return '';
  const circumference = 2 * Math.PI * radius;
  const wavelength = circumference / Math.max(1, Math.round(circumference / wave.wavelength));
  const count = Math.max(1, Math.ceil((to - from) / STEP));
  let d = '';
  for (let i = 0; i <= count; i++) {
    const s = from + ((to - from) * i) / count;
    const r = radius + amplitude * Math.sin((2 * Math.PI * (s - shift)) / wavelength);
    const angle = s / radius;
    d += `${i === 0 ? 'M' : 'L'}${round(cx + r * Math.cos(angle))} ${round(cy + r * Math.sin(angle))}`;
  }
  return d;
}
