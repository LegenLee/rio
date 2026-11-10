import {
  COLOR_ROLES,
  colorVar,
  createColorScheme,
  type ColorSchemeOptions,
  type ColorVar,
} from './color/color';
import { createElevationVariables, type ElevationVar } from './elevation/elevation';
import { createMotionVariables, type MotionScheme, type MotionVar } from './motion/motion';
import { createShapeVariables, type ShapeOverrides, type ShapeVar } from './shape/shape';

export interface ThemeOptions extends Omit<ColorSchemeOptions, 'dark'> {
  /** Defaults to `'expressive'`. */
  motion?: MotionScheme;
  /** Resizes steps of the corner radius scale, in px: `{ medium: 16 }`. */
  shapes?: ShapeOverrides;
}

export type ThemeVar = ColorVar | ElevationVar | MotionVar | ShapeVar;

/**
 * Every CSS variable in the theme.
 * - Colors: light and dark values are combined with `light-dark()`. Which one applies depends on the
 *   `color-scheme` of the element that uses the variable.
 * - Elevation: fixed values that don't depend on the options.
 * - Motion: curves for the chosen scheme. The variable names are the same for every scheme, so a
 *   subtree can switch schemes by overriding them.
 * - Shape: the corner radius scale, with any overrides applied.
 */
export function createThemeVariables(options: ThemeOptions): Record<ThemeVar, string> {
  const { motion = 'expressive', shapes, ...color } = options;
  const light = createColorScheme({ ...color, dark: false });
  const dark = createColorScheme({ ...color, dark: true });
  const vars = {} as Record<ThemeVar, string>;
  for (const role of COLOR_ROLES) {
    vars[colorVar(role)] = `light-dark(${light[role]}, ${dark[role]})`;
  }
  return Object.assign(
    vars,
    createElevationVariables(),
    createMotionVariables(motion),
    createShapeVariables(shapes),
  );
}

/** A CSS string for SSR or static stylesheets. Includes `color-scheme: light dark`. */
export function createThemeCss(options: ThemeOptions & { selector?: string }): string {
  const { selector = ':root', ...rest } = options;
  const lines = Object.entries(createThemeVariables(rest)).map(([k, v]) => `  ${k}: ${v};`);
  return `${selector} {\n  color-scheme: light dark;\n${lines.join('\n')}\n}\n`;
}

/**
 * Sets the theme variables as inline styles on an element.
 * It doesn't touch `color-scheme`; set that yourself.
 */
export function applyTheme(target: HTMLElement, options: ThemeOptions): void {
  for (const [k, v] of Object.entries(createThemeVariables(options))) {
    target.style.setProperty(k, v);
  }
}
