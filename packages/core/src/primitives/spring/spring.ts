// Spring physics for animations that can be interrupted or driven by gestures, which curves can't
// imitate. A spring is a damped harmonic oscillator with unit mass, as in Jetpack Compose. It is
// solved in closed form, so position and velocity are exact at any moment, and a new target can
// take over mid-flight from the current position and velocity.

export interface SpringParams {
  /** 1 settles without overshoot; lower values bounce, higher values approach more slowly. */
  dampingRatio: number;
  stiffness: number;
}

export interface SpringState {
  value: number;
  /** Units per second. */
  velocity: number;
}

/**
 * Where a spring is `t` seconds after it starts at `from` with `velocity`, heading to `to`.
 */
export function solveSpring(
  { dampingRatio: zeta, stiffness }: SpringParams,
  from: number,
  to: number,
  velocity: number,
  t: number,
): SpringState {
  const w0 = Math.sqrt(stiffness);
  const x0 = from - to;
  const v0 = velocity;

  if (Math.abs(zeta - 1) < 1e-6) {
    // Critically damped
    const b = v0 + w0 * x0;
    const decay = Math.exp(-w0 * t);
    return {
      value: to + (x0 + b * t) * decay,
      velocity: (b - w0 * (x0 + b * t)) * decay,
    };
  }

  if (zeta < 1) {
    // Underdamped: oscillates around the target while it settles
    const a = zeta * w0;
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const b = (v0 + a * x0) / wd;
    const decay = Math.exp(-a * t);
    const cos = Math.cos(wd * t);
    const sin = Math.sin(wd * t);
    return {
      value: to + decay * (x0 * cos + b * sin),
      velocity: decay * ((wd * b - a * x0) * cos - (a * b + wd * x0) * sin),
    };
  }

  // Overdamped
  const root = w0 * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * w0 + root;
  const r2 = -zeta * w0 - root;
  const c2 = (v0 - r1 * x0) / (r2 - r1);
  const c1 = x0 - c2;
  const e1 = Math.exp(r1 * t);
  const e2 = Math.exp(r2 * t);
  return {
    value: to + c1 * e1 + c2 * e2,
    velocity: r1 * c1 * e1 + r2 * c2 * e2,
  };
}

export interface SpringOptions {
  /** Starting value. */
  value: number;
  /** Called on every frame while moving, and once more with the exact target at rest. */
  onUpdate: (value: number) => void;
  /** Called when the spring comes to rest. */
  onRest?: () => void;
  /**
   * The spring is at rest when it is within this distance of the target and slower than ten times
   * this per second. Defaults to 0.01, which suits pixel values.
   */
  precision?: number;
}

export interface Spring {
  readonly value: number;
  readonly velocity: number;
  readonly target: number;
  readonly moving: boolean;
  /**
   * Heads to a new target from the current position. It keeps the current velocity unless one is
   * given, for example the speed of a finger at the end of a drag.
   */
  to(target: number, params: SpringParams, velocity?: number): void;
  /** Moves to a value at once, without animating. */
  jump(value: number): void;
  /** Stops where it is. */
  stop(): void;
}

const now = () => performance.now() / 1000;

/** A spring that animates a single number with `requestAnimationFrame`. */
export function createSpring(options: SpringOptions): Spring {
  const precision = options.precision ?? 0.01;
  let from = options.value;
  let target = options.value;
  let startVelocity = 0;
  let params: SpringParams | undefined;
  let startedAt = 0;
  let frame: number | undefined;

  const state = (): SpringState =>
    params && frame !== undefined
      ? solveSpring(params, from, target, startVelocity, now() - startedAt)
      : { value: target, velocity: 0 };

  const settle = () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    from = target;
    startVelocity = 0;
    options.onUpdate(target);
    options.onRest?.();
  };

  const tick = () => {
    const { value, velocity } = state();
    if (Math.abs(value - target) < precision && Math.abs(velocity) < precision * 10) {
      settle();
      return;
    }
    options.onUpdate(value);
    frame = requestAnimationFrame(tick);
  };

  return {
    get value() {
      return state().value;
    },
    get velocity() {
      return state().velocity;
    },
    get target() {
      return target;
    },
    get moving() {
      return frame !== undefined;
    },
    to(next, nextParams, velocity) {
      const current = state();
      from = current.value;
      startVelocity = velocity ?? current.velocity;
      target = next;
      params = nextParams;
      startedAt = now();
      if (frame === undefined) frame = requestAnimationFrame(tick);
    },
    jump(value) {
      target = value;
      settle();
    },
    stop() {
      const { value } = state();
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      from = target = value;
      startVelocity = 0;
    },
  };
}

/**
 * Whether the user asked for reduced motion. Spatial springs should jump straight to their target
 * (or be skipped) when it is on; see `docs/foundations.md`, section 3.
 */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reads a motion token's spring from CSS variables on an element, for example
 * `--rio-motion-fast-spatial-damping` and `-stiffness`. Reading them from the element, rather than
 * from the tokens package, lets a subtree that swaps motion schemes change its springs too.
 * Returns `undefined` when the theme doesn't define them.
 */
export function readSpringParams(element: Element, token: string): SpringParams | undefined {
  const style = getComputedStyle(element);
  const dampingRatio = parseFloat(style.getPropertyValue(`--rio-motion-${token}-damping`));
  const stiffness = parseFloat(style.getPropertyValue(`--rio-motion-${token}-stiffness`));
  return Number.isFinite(dampingRatio) && Number.isFinite(stiffness)
    ? { dampingRatio, stiffness }
    : undefined;
}
