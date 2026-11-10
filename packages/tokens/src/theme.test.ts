import { describe, expect, test } from 'vitest';
import { COLOR_ROLES } from './color/color';
import { ELEVATION_LEVELS } from './elevation/elevation';
import { applyTheme, createThemeCss, createThemeVariables } from './theme';

const options = { sourceColor: '#6750a4' };

describe('createThemeVariables', () => {
  const vars = createThemeVariables(options);

  test('includes every color and elevation variable', () => {
    expect(Object.keys(vars)).toHaveLength(COLOR_ROLES.length + ELEVATION_LEVELS.length);
  });

  test('wraps colors in light-dark()', () => {
    expect(vars['--rio-color-primary']).toMatch(/^light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\)$/);
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
