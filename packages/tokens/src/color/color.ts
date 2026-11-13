import {
  DynamicScheme,
  Hct,
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

export interface ColorSchemeOptions {
  /** Source color, as `#rgb` or `#rrggbb`. */
  sourceColor: string;
  /** Defaults to `'tonal-spot'`. */
  variant?: SchemeVariant;
  /** From -1 (reduced) through 0 (standard) to 1 (high). Defaults to 0. */
  contrast?: number;
  /** Defaults to `false`. */
  dark?: boolean;
}

export function createColorScheme(options: ColorSchemeOptions): ColorScheme {
  const scheme = new DynamicScheme({
    sourceColorHct: Hct.fromInt(argbFromHex(options.sourceColor)),
    variant: VARIANTS[options.variant ?? 'tonal-spot'],
    contrastLevel: Math.min(1, Math.max(-1, options.contrast ?? 0)),
    isDark: options.dark ?? false,
    specVersion: '2025',
  });

  const result = {} as ColorScheme;
  for (const role of COLOR_ROLES) {
    const color = scheme.colors[role]();
    // The 2025 spec defines every role, the dim ones included. A missing role means MCU fell back.
    if (!color)
      throw new Error(`[rio] color role "${role}" is undefined; MCU fell back from the 2025 spec`);
    result[role] = hexFromArgb(scheme.getArgb(color));
  }
  return result;
}
