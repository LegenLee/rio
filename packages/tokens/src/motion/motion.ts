import { TOKEN_PREFIX } from '../prefix';

export const MOTION_SCHEMES = ['expressive', 'standard'] as const;

/** `expressive` is the M3E default. `standard` is for utilitarian products. */
export type MotionScheme = (typeof MOTION_SCHEMES)[number];

export const MOTION_TOKENS = [
  'fast-spatial',
  'default-spatial',
  'slow-spatial',
  'fast-effects',
  'default-effects',
  'slow-effects',
] as const;

/**
 * Spatial tokens move things (position, size, rotation, corner radius) and may overshoot.
 * Effects tokens change color and opacity and never overshoot.
 */
export type MotionToken = (typeof MOTION_TOKENS)[number];

export interface MotionSpring {
  /** 1 settles without overshoot; lower values bounce. */
  dampingRatio: number;
  stiffness: number;
}

export interface MotionCurve {
  /** A CSS `cubic-bezier()` that mimics the spring. */
  easing: string;
  /** In milliseconds. */
  duration: number;
}

/**
 * Jetpack Compose Material3 `ExpressiveMotionTokens` and `StandardMotionTokens`
 * (token version v0_14_0, androidx 079e2e3). Pairs are [dampingRatio, stiffness].
 */
const SPRINGS: Record<MotionScheme, Record<MotionToken, readonly [number, number]>> = {
  expressive: {
    'fast-spatial': [0.6, 800],
    'default-spatial': [0.8, 380],
    'slow-spatial': [0.8, 200],
    'fast-effects': [1, 3800],
    'default-effects': [1, 1600],
    'slow-effects': [1, 800],
  },
  standard: {
    'fast-spatial': [0.9, 1400],
    'default-spatial': [0.9, 700],
    'slow-spatial': [0.9, 300],
    'fast-effects': [1, 3800],
    'default-effects': [1, 1600],
    'slow-effects': [1, 800],
  },
};

/**
 * The "Web: Convert springs to curves" table from the M3 motion specs.
 * Tuples are [x1, y1, x2, y2, durationMs].
 */
const CURVES: Record<
  MotionScheme,
  Record<MotionToken, readonly [number, number, number, number, number]>
> = {
  expressive: {
    'fast-spatial': [0.42, 1.67, 0.21, 0.9, 350],
    'default-spatial': [0.38, 1.21, 0.22, 1, 500],
    'slow-spatial': [0.39, 1.29, 0.35, 0.98, 650],
    'fast-effects': [0.31, 0.94, 0.34, 1, 150],
    'default-effects': [0.34, 0.8, 0.34, 1, 200],
    'slow-effects': [0.34, 0.88, 0.34, 1, 300],
  },
  standard: {
    'fast-spatial': [0.27, 1.06, 0.18, 1, 350],
    'default-spatial': [0.27, 1.06, 0.18, 1, 500],
    'slow-spatial': [0.27, 1.06, 0.18, 1, 750],
    'fast-effects': [0.31, 0.94, 0.34, 1, 150],
    'default-effects': [0.34, 0.8, 0.34, 1, 200],
    'slow-effects': [0.34, 0.88, 0.34, 1, 300],
  },
};

/** Raw spring values, for animations that can be interrupted or driven by gestures. */
export function getMotionSpring(scheme: MotionScheme, token: MotionToken): MotionSpring {
  const [dampingRatio, stiffness] = SPRINGS[scheme][token];
  return { dampingRatio, stiffness };
}

/** The curve that mimics a spring, for animations that are never interrupted. */
export function getMotionCurve(scheme: MotionScheme, token: MotionToken): MotionCurve {
  const [x1, y1, x2, y2, duration] = CURVES[scheme][token];
  return { easing: `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`, duration };
}

/** `duration` and `easing` describe the curve; `damping` and `stiffness` the raw spring. */
export type MotionVarPart = 'duration' | 'easing' | 'damping' | 'stiffness';

export type MotionVar =
  | `${typeof TOKEN_PREFIX}-motion-${MotionToken}`
  | `${typeof TOKEN_PREFIX}-motion-${MotionToken}-${MotionVarPart}`;

/**
 * CSS variable name for a token. Without `part`, the variable holds `<duration> <easing>`
 * and fits straight into `transition` or `animation`:
 * `transition: transform var(--rio-motion-fast-spatial)`.
 */
export function motionVar(token: MotionToken, part?: MotionVarPart): MotionVar {
  return part ? `${TOKEN_PREFIX}-motion-${token}-${part}` : `${TOKEN_PREFIX}-motion-${token}`;
}

/**
 * CSS variables for one scheme: the curve for CSS transitions, and the raw spring for the spring
 * solver in `@rio-m3e/core`, which reads them from the element it animates. The names don't
 * include the scheme.
 */
export function createMotionVariables(
  scheme: MotionScheme = 'expressive',
): Record<MotionVar, string> {
  const vars = {} as Record<MotionVar, string>;
  for (const token of MOTION_TOKENS) {
    const { easing, duration } = getMotionCurve(scheme, token);
    const { dampingRatio, stiffness } = getMotionSpring(scheme, token);
    vars[motionVar(token)] = `${duration}ms ${easing}`;
    vars[motionVar(token, 'duration')] = `${duration}ms`;
    vars[motionVar(token, 'easing')] = easing;
    vars[motionVar(token, 'damping')] = String(dampingRatio);
    vars[motionVar(token, 'stiffness')] = String(stiffness);
  }
  return vars;
}
