import {
  Blend,
  DynamicScheme,
  Hct,
  TonalPalette,
  Variant,
  argbFromHex,
  hexFromArgb,
  type MaterialDynamicColors,
} from '@material/material-color-utilities';
import { TOKEN_PREFIX } from '../prefix';

/** M3 color roles. The names match the method names on MCU's `MaterialDynamicColors`. */
export const COLOR_ROLES = [
  'background',
  'onBackground',
  'surface',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'inverseSurface',
  'inverseOnSurface',
  'outline',
  'outlineVariant',
  'shadow',
  'scrim',
  'surfaceTint',
  'primary',
  'primaryDim',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'primaryFixed',
  'primaryFixedDim',
  'onPrimaryFixed',
  'onPrimaryFixedVariant',
  'inversePrimary',
  'secondary',
  'secondaryDim',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'secondaryFixed',
  'secondaryFixedDim',
  'onSecondaryFixed',
  'onSecondaryFixedVariant',
  'tertiary',
  'tertiaryDim',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'tertiaryFixed',
  'tertiaryFixedDim',
  'onTertiaryFixed',
  'onTertiaryFixedVariant',
  'error',
  'errorDim',
  'onError',
  'errorContainer',
  'onErrorContainer',
] as const satisfies readonly (keyof MaterialDynamicColors)[];

export type ColorRole = (typeof COLOR_ROLES)[number];

export type ColorVar = `${typeof TOKEN_PREFIX}-color-${string}`;

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** CSS variable name for a role. `onPrimaryContainer` → `--rio-color-on-primary-container` */
export function colorVar(role: ColorRole): ColorVar {
  return `${TOKEN_PREFIX}-color-${kebab(role)}`;
}

/** Colors by role, as `#rrggbb`. */
export type ColorScheme = Record<ColorRole, string>;

/**
 * Only the variants that support M3E (the 2025 color spec) are exposed.
 * For the others (monochrome, fidelity, and so on), MCU silently falls back to the 2021 spec.
 */
export type SchemeVariant = 'tonal-spot' | 'neutral' | 'vibrant' | 'expressive';

const VARIANTS: Record<SchemeVariant, Variant> = {
  'tonal-spot': Variant.TONAL_SPOT,
  neutral: Variant.NEUTRAL,
  vibrant: Variant.VIBRANT,
  expressive: Variant.EXPRESSIVE,
};

/**
 * The key colors of the scheme's palettes, as `#rgb` or `#rrggbb`. Each becomes a palette of its
 * own hue and chroma, in place of the one the variant derives from the source color.
 */
export interface KeyColors {
  primary?: string;
  secondary?: string;
  tertiary?: string;
  neutral?: string;
  neutralVariant?: string;
  error?: string;
}

export interface ColorSchemeOptions {
  /**
   * The seed every palette is derived from, as `#rgb` or `#rrggbb`. It isn't the primary color:
   * the variant takes its hue and sets the chroma, so even white makes a colored primary.
   */
  sourceColor: string;
  /** Defaults to `'tonal-spot'`. */
  variant?: SchemeVariant;
  /** From -1 (reduced) through 0 (standard) to 1 (high). Defaults to 0. */
  contrast?: number;
  /** Defaults to `false`. */
  dark?: boolean;
  /** Palettes from colors of the app's own, in place of the ones derived from the source color. */
  keyColors?: KeyColors;
}

const paletteOf = (color: string | undefined) =>
  color === undefined ? undefined : TonalPalette.fromInt(argbFromHex(color));

/** The 2025 spec's scheme for the options, with `primaryPalette` in place of the primary one */
function dynamicScheme(options: ColorSchemeOptions, primaryPalette?: TonalPalette) {
  const keys = options.keyColors ?? {};
  return new DynamicScheme({
    sourceColorHct: Hct.fromInt(argbFromHex(options.sourceColor)),
    variant: VARIANTS[options.variant ?? 'tonal-spot'],
    contrastLevel: Math.min(1, Math.max(-1, options.contrast ?? 0)),
    isDark: options.dark ?? false,
    specVersion: '2025',
    primaryPalette: primaryPalette ?? paletteOf(keys.primary),
    secondaryPalette: paletteOf(keys.secondary),
    tertiaryPalette: paletteOf(keys.tertiary),
    neutralPalette: paletteOf(keys.neutral),
    neutralVariantPalette: paletteOf(keys.neutralVariant),
    errorPalette: paletteOf(keys.error),
  });
}

/** A role's color as `#rrggbb`. The 2025 spec defines every role, the dim ones included. */
function hexOf(scheme: DynamicScheme, role: ColorRole): string {
  const color = scheme.colors[role]();
  // A missing role means MCU fell back from the 2025 spec.
  if (!color)
    throw new Error(`[rio] color role "${role}" is undefined; MCU fell back from the 2025 spec`);
  return hexFromArgb(scheme.getArgb(color));
}

export function createColorScheme(options: ColorSchemeOptions): ColorScheme {
  const scheme = dynamicScheme(options);
  const result = {} as ColorScheme;
  for (const role of COLOR_ROLES) result[role] = hexOf(scheme, role);
  return result;
}

/**
 * A static color, as `#rgb` or `#rrggbb`: a color that stays the same whatever the source color,
 * as for success or a warning. It is harmonized toward the scheme's primary color, its hue turned
 * a little closer to it, unless `harmonize` is `false`, as for a brand color.
 */
export type StaticColor = string | { color: string; harmonize?: boolean };

/** A static color's four roles, as `#rrggbb`: the color, on it, its container, and on that */
export interface StaticColorRoles {
  color: string;
  onColor: string;
  colorContainer: string;
  onColorContainer: string;
}

/**
 * The four roles of each static color, made the way the primary color's are: the static color's
 * palette in the primary one's place, with the scheme's variant, contrast, and light or dark.
 */
export function createStaticColors(
  options: ColorSchemeOptions,
  staticColors: Record<string, StaticColor>,
): Record<string, StaticColorRoles> {
  const primary = dynamicScheme(options).primaryPalette.keyColor.toInt();
  const result: Record<string, StaticColorRoles> = {};
  for (const [name, value] of Object.entries(staticColors)) {
    const { color, harmonize = true } = typeof value === 'string' ? { color: value } : value;
    const argb = argbFromHex(color);
    const palette = TonalPalette.fromInt(harmonize ? Blend.harmonize(argb, primary) : argb);
    const scheme = dynamicScheme(options, palette);
    result[name] = {
      color: hexOf(scheme, 'primary'),
      onColor: hexOf(scheme, 'onPrimary'),
      colorContainer: hexOf(scheme, 'primaryContainer'),
      onColorContainer: hexOf(scheme, 'onPrimaryContainer'),
    };
  }
  return result;
}

const STATIC_COLOR_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * The CSS variables of a static color's roles, named as the accent roles are: `success` →
 * `--rio-color-success`, `--rio-color-on-success`, `--rio-color-success-container`, and
 * `--rio-color-on-success-container`. A name is camelCase or kebab-case, starting with a letter.
 */
export function staticColorVars(name: string): Record<keyof StaticColorRoles, ColorVar> {
  const kebabName = kebab(name);
  if (!STATIC_COLOR_NAME.test(kebabName))
    throw new Error(
      `[rio] static color name "${name}" isn't camelCase or kebab-case, starting with a letter`,
    );
  const color = (role: string): ColorVar => `${TOKEN_PREFIX}-color-${role}`;
  return {
    color: color(kebabName),
    onColor: color(`on-${kebabName}`),
    colorContainer: color(`${kebabName}-container`),
    onColorContainer: color(`on-${kebabName}-container`),
  };
}
