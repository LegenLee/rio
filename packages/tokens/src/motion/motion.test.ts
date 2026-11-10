import { describe, expect, test } from 'vitest';
import {
  MOTION_TOKENS,
  createMotionVariables,
  getMotionCurve,
  getMotionSpring,
  motionVar,
  type MotionScheme,
  type MotionToken,
} from './motion';

type Row = [scheme: MotionScheme, token: MotionToken, easing: string, duration: number];

// Transcribed from the "Web: Convert springs to curves" table on m3.material.io, independently of the source.
const SPEC_CURVES: Row[] = [
  ['expressive', 'fast-spatial', 'cubic-bezier(0.42, 1.67, 0.21, 0.9)', 350],
  ['expressive', 'default-spatial', 'cubic-bezier(0.38, 1.21, 0.22, 1)', 500],
  ['expressive', 'slow-spatial', 'cubic-bezier(0.39, 1.29, 0.35, 0.98)', 650],
  ['expressive', 'fast-effects', 'cubic-bezier(0.31, 0.94, 0.34, 1)', 150],
  ['expressive', 'default-effects', 'cubic-bezier(0.34, 0.8, 0.34, 1)', 200],
  ['expressive', 'slow-effects', 'cubic-bezier(0.34, 0.88, 0.34, 1)', 300],
  ['standard', 'fast-spatial', 'cubic-bezier(0.27, 1.06, 0.18, 1)', 350],
  ['standard', 'default-spatial', 'cubic-bezier(0.27, 1.06, 0.18, 1)', 500],
  ['standard', 'slow-spatial', 'cubic-bezier(0.27, 1.06, 0.18, 1)', 750],
  ['standard', 'fast-effects', 'cubic-bezier(0.31, 0.94, 0.34, 1)', 150],
  ['standard', 'default-effects', 'cubic-bezier(0.34, 0.8, 0.34, 1)', 200],
  ['standard', 'slow-effects', 'cubic-bezier(0.34, 0.88, 0.34, 1)', 300],
];

// Transcribed from Compose `ExpressiveMotionTokens` / `StandardMotionTokens` (v0_14_0).
const COMPOSE_SPRINGS: [MotionScheme, MotionToken, number, number][] = [
  ['expressive', 'fast-spatial', 0.6, 800],
  ['expressive', 'default-spatial', 0.8, 380],
  ['expressive', 'slow-spatial', 0.8, 200],
  ['expressive', 'fast-effects', 1, 3800],
  ['expressive', 'default-effects', 1, 1600],
  ['expressive', 'slow-effects', 1, 800],
  ['standard', 'fast-spatial', 0.9, 1400],
  ['standard', 'default-spatial', 0.9, 700],
  ['standard', 'slow-spatial', 0.9, 300],
  ['standard', 'fast-effects', 1, 3800],
  ['standard', 'default-effects', 1, 1600],
  ['standard', 'slow-effects', 1, 800],
];

describe('getMotionCurve', () => {
  test.each(SPEC_CURVES)('%s %s matches the spec', (scheme, token, easing, duration) => {
    expect(getMotionCurve(scheme, token)).toEqual({ easing, duration });
  });
});

describe('getMotionSpring', () => {
  test.each(COMPOSE_SPRINGS)('%s %s matches Compose', (scheme, token, dampingRatio, stiffness) => {
    expect(getMotionSpring(scheme, token)).toEqual({ dampingRatio, stiffness });
  });

  test('effects springs never overshoot', () => {
    for (const scheme of ['expressive', 'standard'] as const) {
      for (const token of MOTION_TOKENS.filter((t) => t.endsWith('-effects'))) {
        expect(getMotionSpring(scheme, token).dampingRatio).toBe(1);
      }
    }
  });
});

describe('motionVar', () => {
  test('names the shorthand and its parts', () => {
    expect(motionVar('fast-spatial')).toBe('--rio-motion-fast-spatial');
    expect(motionVar('fast-spatial', 'duration')).toBe('--rio-motion-fast-spatial-duration');
    expect(motionVar('fast-spatial', 'easing')).toBe('--rio-motion-fast-spatial-easing');
  });
});

describe('createMotionVariables', () => {
  test('defines a shorthand, a duration, and an easing per token', () => {
    const vars = createMotionVariables();
    expect(Object.keys(vars)).toHaveLength(MOTION_TOKENS.length * 3);
    expect(vars['--rio-motion-fast-spatial']).toBe('350ms cubic-bezier(0.42, 1.67, 0.21, 0.9)');
    expect(vars['--rio-motion-fast-spatial-duration']).toBe('350ms');
    expect(vars['--rio-motion-fast-spatial-easing']).toBe('cubic-bezier(0.42, 1.67, 0.21, 0.9)');
  });

  test('defaults to the expressive scheme', () => {
    expect(createMotionVariables()).toEqual(createMotionVariables('expressive'));
  });

  test('uses the same names for every scheme', () => {
    expect(Object.keys(createMotionVariables('standard'))).toEqual(
      Object.keys(createMotionVariables('expressive')),
    );
  });
});
