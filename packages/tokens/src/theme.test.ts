import { describe, expect, test } from 'vitest';
import { COLOR_ROLES } from './color/color';
import { ELEVATION_LEVELS } from './elevation/elevation';
import { MOTION_TOKENS, createMotionVariables } from './motion/motion';
import { SHAPE_CORNERS } from './shape/shape';
import { createStateVariables } from './state/state';
import { applyTheme, createThemeCss, createThemeVariables } from './theme';
import { createTypographyVariables } from './typography/typography';

const options = { sourceColor: '#6750a4' };

describe('createThemeVariables', () => {
  const vars = createThemeVariables(options);

  test('includes every color, elevation, motion, shape, typography, and state variable', () => {
    expect(Object.keys(vars)).toHaveLength(
      COLOR_ROLES.length +
        ELEVATION_LEVELS.length +
        MOTION_TOKENS.length * 5 +
        SHAPE_CORNERS.length +
        Object.keys(createTypographyVariables()).length +
        Object.keys(createStateVariables()).length,
    );
  });

  test('passes shape overrides through', () => {
    const custom = createThemeVariables({ ...options, shapes: { medium: 16 } });
    expect(custom['--rio-shape-corner-medium']).toBe('16px');
  });

  test('passes typeface overrides through', () => {
    const custom = createThemeVariables({ ...options, typefaces: { plain: 'Inter, sans-serif' } });
    expect(custom['--rio-typeface-plain']).toBe('Inter, sans-serif');
  });

  test('wraps colors in light-dark()', () => {
    expect(vars['--rio-color-primary']).toMatch(/^light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\)$/);
  });

  test('uses the expressive motion scheme by default', () => {
    expect(vars).toMatchObject(createMotionVariables('expressive'));
  });

  test('switches the motion scheme without renaming variables', () => {
    expect(createThemeVariables({ ...options, motion: 'standard' })).toMatchObject(
      createMotionVariables('standard'),
    );
  });
});

describe('createThemeCss', () => {
  test('emits one rule with color-scheme and every variable', () => {
    const css = createThemeCss({ ...options, selector: '.app' });
    expect(css.startsWith('.app {\n  color-scheme: light dark;\n')).toBe(true);
    expect(css).toContain('--rio-color-surface: light-dark(');
    expect(css).toContain('--rio-elevation-level0: none;');
  });
});

describe('applyTheme', () => {
  test('sets every variable on the target without touching color-scheme', () => {
    const set = new Map<string, string>();
    const target = { style: { setProperty: (k: string, v: string) => set.set(k, v) } };
    applyTheme(target as unknown as HTMLElement, options);
    expect(Object.fromEntries(set)).toEqual(createThemeVariables(options));
  });
});
