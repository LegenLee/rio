import { describe, expect, test } from 'vitest';
import { COLOR_ROLES } from './color/color';
import { ELEVATION_LEVELS } from './elevation/elevation';
import { MOTION_TOKENS, SPATIAL_MOTION_TOKENS, createMotionVariables } from './motion/motion';
import { SHAPE_CORNERS } from './shape/shape';
import { createStateVariables } from './state/state';
import { attachTheme, createThemeCss, createThemeVariables } from './theme';
import { createTypographyVariables } from './typography/typography';

const options = { sourceColor: '#6750a4' };

describe('createThemeVariables', () => {
  const vars = createThemeVariables(options);

  test('includes every color, elevation, motion, shape, typography, and state variable', () => {
    expect(Object.keys(vars)).toHaveLength(
      COLOR_ROLES.length +
        ELEVATION_LEVELS.length +
        MOTION_TOKENS.length * 5 +
        SPATIAL_MOTION_TOKENS.length * 2 +
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

  test('passes the language height through', () => {
    const tall = createThemeVariables({ ...options, languageHeight: 'medium' });
    expect(tall).toMatchObject(createTypographyVariables({}, { languageHeight: 'medium' }));
  });

  test('passes the type scale through', () => {
    const variable = createThemeVariables({ ...options, typescale: 'variable' });
    expect(variable).toMatchObject(createTypographyVariables({}, { typescale: 'variable' }));
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

  test('colorScheme picks the scheme, or leaves it out', () => {
    expect(createThemeCss({ ...options, colorScheme: 'dark' })).toContain(
      ':root {\n  color-scheme: dark;\n',
    );
    const css = createThemeCss({ ...options, colorScheme: false });
    expect(css).not.toContain('color-scheme');
    expect(css.startsWith(':root {\n  --rio-')).toBe(true);
  });
});

describe('attachTheme', () => {
  /** An element's inline style, as far as the theme uses it */
  const element = (initial: Record<string, string> = {}) => {
    const props = new Map(Object.entries(initial));
    const style = {
      setProperty: (name: string, value: string) => props.set(name, value),
      removeProperty: (name: string) => props.delete(name),
      getPropertyValue: (name: string) => props.get(name) ?? '',
    };
    return { target: { style } as unknown as HTMLElement, props };
  };
  const primary = (sourceColor: string) =>
    createThemeVariables({ sourceColor })['--rio-color-primary'];

  test('writes every variable and the color-scheme, following the system by default', () => {
    const { target, props } = element();
    attachTheme(target, options);
    expect(props.get('color-scheme')).toBe('light dark');
    expect(Object.fromEntries([...props].filter(([name]) => name !== 'color-scheme'))).toEqual(
      createThemeVariables(options),
    );
  });

  test('colorScheme picks one, or false leaves the element’s own', () => {
    const dark = element();
    attachTheme(dark.target, { ...options, colorScheme: 'dark' });
    expect(dark.props.get('color-scheme')).toBe('dark');
    const own = element({ 'color-scheme': 'light' });
    const handle = attachTheme(own.target, { ...options, colorScheme: false });
    expect(own.props.get('color-scheme')).toBe('light');
    handle.detach();
    expect(own.props.get('color-scheme')).toBe('light');
  });

  test('update writes another theme over it, and takes off what the new one leaves out', () => {
    const { target, props } = element();
    const handle = attachTheme(target, options);
    handle.update({ sourceColor: '#006a6a', colorScheme: false });
    expect(props.get('--rio-color-primary')).toBe(primary('#006a6a'));
    expect(props.has('color-scheme')).toBe(false);
    handle.update(undefined);
    expect(props.size).toBe(0);
  });

  test('detach takes off what it wrote, and only that', () => {
    const { target, props } = element({ '--app-gutter': '16px' });
    const handle = attachTheme(target);
    expect(props.size).toBe(1);
    handle.update(options);
    handle.detach();
    expect(Object.fromEntries(props)).toEqual({ '--app-gutter': '16px' });
  });
});
