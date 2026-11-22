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
import { createStateVariables, type StateVar } from './state/state';
import {
  createTypographyVariables,
  type LanguageHeight,
  type Typescale,
  type TypefaceOverrides,
  type TypographyVar,
} from './typography/typography';

/**
 * The `color-scheme` that picks each color's light or dark value: `'light dark'` follows the
 * system. `false` writes none, for an app that sets it itself.
 */
export type ThemeColorScheme = 'light dark' | 'light' | 'dark' | false;

export interface ThemeOptions extends Omit<ColorSchemeOptions, 'dark'> {
  /** Defaults to `'expressive'`. */
  motion?: MotionScheme;
  /** Resizes steps of the corner radius scale, in px: `{ medium: 16 }`. */
  shapes?: ShapeOverrides;
  /**
   * Font-family values: `{ brand: '"Roboto Flex", sans-serif' }`. Both default to Roboto, or to
   * Roboto Flex with `typescale: 'variable'`.
   */
  typefaces?: TypefaceOverrides;
  /**
   * The line heights for how tall the text's script is: `languageHeightOf` gives it for a
   * language tag. Defaults to `'small'`, the type scale's own, for Latin, Greek, Cyrillic, and
   * Hebrew.
   */
  languageHeight?: LanguageHeight;
  /**
   * The type scale: `'variable'` sets the spec's variable type scale, for a variable font as
   * Roboto Flex, with no letter spacing and its weights, and makes Roboto Flex the typefaces'
   * default. Defaults to `'static'`, for a static font as Roboto.
   */
  typescale?: Typescale;
  /**
   * The `color-scheme` `attachTheme` and `createThemeCss` write with the variables. Defaults to
   * `'light dark'`. The variables alone (`createThemeVariables`) leave it out.
   */
  colorScheme?: ThemeColorScheme;
}

export type ThemeVar = ColorVar | ElevationVar | MotionVar | ShapeVar | StateVar | TypographyVar;

const DEFAULT_COLOR_SCHEME: ThemeColorScheme = 'light dark';

/**
 * Every CSS variable in the theme.
 * - Colors: light and dark values are combined with `light-dark()`. Which one applies depends on the
 *   `color-scheme` of the element that uses the variable.
 * - Elevation: fixed values that don't depend on the options.
 * - Motion: curves for the chosen scheme. The variable names are the same for every scheme, so a
 *   subtree can switch schemes by overriding them.
 * - Shape: the corner radius scale, with any overrides applied.
 * - Typography: the baseline and emphasized type scales, in rem, on top of two typefaces.
 * - State: state-layer opacities and focus indicator dimensions. Fixed values.
 */
export function createThemeVariables(options: ThemeOptions): Record<ThemeVar, string> {
  const {
    motion = 'expressive',
    shapes,
    typefaces,
    languageHeight,
    typescale,
    colorScheme: _,
    ...color
  } = options;
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
    createTypographyVariables(typefaces, { languageHeight, typescale }),
    createStateVariables(),
  );
}

/** A CSS string for SSR or static stylesheets: the variables and the `color-scheme` */
export function createThemeCss(options: ThemeOptions & { selector?: string }): string {
  const { selector = ':root', colorScheme = DEFAULT_COLOR_SCHEME, ...rest } = options;
  const lines = Object.entries(createThemeVariables(rest)).map(([k, v]) => `  ${k}: ${v};`);
  if (colorScheme) lines.unshift(`  color-scheme: ${colorScheme};`);
  return `${selector} {\n${lines.join('\n')}\n}\n`;
}

export interface ThemeHandle {
  /** Writes another theme in place of the one written, or takes it off without one. */
  update(options: ThemeOptions | undefined): void;
  /** Takes off everything it wrote. */
  detach(): void;
}

/**
 * Writes the theme on an element, as inline styles: the variables and the `color-scheme`. Pass the
 * document's root for the whole page. Only what it wrote changes later: `update` writes another
 * theme over it, taking off what the new one leaves out, and `detach` takes it all off.
 */
export function attachTheme(target: HTMLElement, options?: ThemeOptions): ThemeHandle {
  let written = new Set<string>();
  const update = (theme: ThemeOptions | undefined) => {
    const next = new Map<string, string>();
    if (theme) {
      const { colorScheme = DEFAULT_COLOR_SCHEME } = theme;
      for (const [name, value] of Object.entries(createThemeVariables(theme))) {
        next.set(name, value);
      }
      if (colorScheme) next.set('color-scheme', colorScheme);
    }
    for (const name of written) if (!next.has(name)) target.style.removeProperty(name);
    for (const [name, value] of next) target.style.setProperty(name, value);
    written = new Set(next.keys());
  };
  update(options);
  return { update, detach: () => update(undefined) };
}
