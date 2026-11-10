import {
  DynamicScheme,
  Hct,
  Variant,
  argbFromHex,
  hexFromArgb,
  type MaterialDynamicColors,
} from '@material/material-color-utilities'

/** M3 색상 역할 목록. 이름은 MCU `MaterialDynamicColors`의 메서드 이름과 같다. */
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
] as const satisfies readonly (keyof MaterialDynamicColors)[]

export type ColorRole = (typeof COLOR_ROLES)[number]

/** 역할별 색상. 값은 `#rrggbb`. */
export type ColorScheme = Record<ColorRole, string>

/**
 * M3E(2025 색상 스펙)를 지원하는 변형만 노출한다.
 * MCU는 나머지 변형(monochrome, fidelity 등)을 경고 없이 2021 스펙으로 되돌린다.
 */
export type SchemeVariant = 'tonal-spot' | 'neutral' | 'vibrant' | 'expressive'

const VARIANTS: Record<SchemeVariant, Variant> = {
  'tonal-spot': Variant.TONAL_SPOT,
  neutral: Variant.NEUTRAL,
  vibrant: Variant.VIBRANT,
  expressive: Variant.EXPRESSIVE,
}

export interface ColorSchemeOptions {
  /** 시드 색상. `#rgb` 또는 `#rrggbb`. */
  sourceColor: string
  /** 기본값 `'tonal-spot'`. */
  variant?: SchemeVariant
  /** -1(낮음) ~ 0(표준) ~ 1(높음). 기본값 0. */
  contrast?: number
  /** 기본값 `false`. */
  dark?: boolean
}

export function createColorScheme(options: ColorSchemeOptions): ColorScheme {
  const scheme = new DynamicScheme({
    sourceColorHct: Hct.fromInt(argbFromHex(options.sourceColor)),
    variant: VARIANTS[options.variant ?? 'tonal-spot'],
    contrastLevel: Math.min(1, Math.max(-1, options.contrast ?? 0)),
    isDark: options.dark ?? false,
    specVersion: '2025',
  })

  const result = {} as ColorScheme
  for (const role of COLOR_ROLES) {
    const color = scheme.colors[role]()
    // 2025 스펙에서는 dim 계열까지 전부 정의된다. 비어 있으면 MCU가 스펙을 되돌렸다는 뜻이다.
    if (!color) throw new Error(`[rio] color role "${role}" is undefined; MCU fell back from the 2025 spec`)
    result[role] = hexFromArgb(scheme.getArgb(color))
  }
  return result
}
