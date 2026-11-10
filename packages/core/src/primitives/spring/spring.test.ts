import { describe, expect, test, vi } from 'vitest';
import { createSpring, readSpringParams, solveSpring, type SpringParams } from './spring';

const UNDERDAMPED: SpringParams = { dampingRatio: 0.6, stiffness: 800 }; // expressive fast spatial
const CRITICAL: SpringParams = { dampingRatio: 1, stiffness: 1600 }; // default effects
const OVERDAMPED: SpringParams = { dampingRatio: 1.5, stiffness: 800 };

const sample = (params: SpringParams, velocity = 0) =>
  Array.from({ length: 300 }, (_, i) => solveSpring(params, 0, 100, velocity, i / 200).value);

describe('solveSpring', () => {
  test.each([UNDERDAMPED, CRITICAL, OVERDAMPED])('starts where it was told (%o)', (params) => {
    const { value, velocity } = solveSpring(params, 0, 100, 25, 0);
    // Floating point leaves crumbs around 1e-15 in the overdamped case.
    expect(value).toBeCloseTo(0, 10);
    expect(velocity).toBeCloseTo(25, 10);
  });

  test.each([UNDERDAMPED, CRITICAL, OVERDAMPED])('settles on the target (%o)', (params) => {
    const { value, velocity } = solveSpring(params, 0, 100, 0, 5);
    expect(value).toBeCloseTo(100, 3);
    expect(velocity).toBeCloseTo(0, 3);
  });

  test('an underdamped spring overshoots', () => {
    expect(Math.max(...sample(UNDERDAMPED))).toBeGreaterThan(100);
  });

  test.each([CRITICAL, OVERDAMPED])('a spring with damping ≥ 1 never overshoots (%o)', (params) => {
    expect(Math.max(...sample(params))).toBeLessThanOrEqual(100);
  });

  test.each([UNDERDAMPED, CRITICAL, OVERDAMPED])(
    'velocity is the derivative of position (%o)',
    (params) => {
      const h = 1e-6;
      for (const t of [0.01, 0.05, 0.1, 0.3]) {
        const before = solveSpring(params, 0, 100, 40, t - h).value;
        const after = solveSpring(params, 0, 100, 40, t + h).value;
        const { velocity } = solveSpring(params, 0, 100, 40, t);
        expect(velocity).toBeCloseTo((after - before) / (2 * h), 1);
      }
    },
  );
});

describe('createSpring', () => {
  test('animates to the target and comes to rest there', async () => {
    const onUpdate = vi.fn();
    const onRest = vi.fn();
    const spring = createSpring({ value: 0, onUpdate, onRest });
    spring.to(100, UNDERDAMPED);
    expect(spring.moving).toBe(true);
    await vi.waitFor(() => expect(onRest).toHaveBeenCalled(), { timeout: 2000 });
    expect(spring.moving).toBe(false);
    expect(onUpdate).toHaveBeenLastCalledWith(100);
    expect(onUpdate.mock.calls.length).toBeGreaterThan(2);
  });

  test('a new target takes over from the current position and velocity', async () => {
    const spring = createSpring({ value: 0, onUpdate: () => {} });
    spring.to(100, UNDERDAMPED);
    await new Promise((r) => setTimeout(r, 60));
    const before = { value: spring.value, velocity: spring.velocity };
    expect(before.velocity).toBeGreaterThan(0);

    spring.to(0, UNDERDAMPED);
    // Same instant, so nothing jumps: the spring is still moving toward 100 for now.
    expect(spring.value).toBeCloseTo(before.value, 0);
    expect(spring.velocity).toBeCloseTo(before.velocity, -1);
    spring.stop();
  });

  test('jump moves at once', () => {
    const onUpdate = vi.fn();
    const spring = createSpring({ value: 0, onUpdate });
    spring.jump(42);
    expect(onUpdate).toHaveBeenCalledWith(42);
    expect(spring.value).toBe(42);
    expect(spring.moving).toBe(false);
  });
});

describe('readSpringParams', () => {
  test('reads a token from CSS variables, or returns undefined', () => {
    const el = document.createElement('div');
    document.body.append(el);
    expect(readSpringParams(el, 'fast-spatial')).toBeUndefined();
    el.style.setProperty('--rio-motion-fast-spatial-damping', '0.6');
    el.style.setProperty('--rio-motion-fast-spatial-stiffness', '800');
    expect(readSpringParams(el, 'fast-spatial')).toEqual(UNDERDAMPED);
    el.remove();
  });
});
