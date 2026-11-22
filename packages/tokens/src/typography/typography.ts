import { TOKEN_PREFIX } from '../prefix';

export const TYPE_STYLES = [
  'display-large',
  'display-medium',
  'display-small',
  'headline-large',
  'headline-medium',
  'headline-small',
  'title-large',
  'title-medium',
  'title-small',
  'body-large',
  'body-medium',
  'body-small',
  'label-large',
  'label-medium',
  'label-small',
] as const;

export type TypeStyle = (typeof TYPE_STYLES)[number];

/** `brand` sets the larger styles (display, headline, title large); `plain` sets the rest. */
export type Typeface = 'brand' | 'plain';

/** Font-family values for the two typefaces. */
export type TypefaceOverrides = Partial<Record<Typeface, string>>;

export interface TypeStyleSpec {
  typeface: Typeface;
  /** In px. */
  size: number;
  /** In px. */
  lineHeight: number;
  /** Letter spacing, in px. */
  tracking: number;
  weight: number;
}

/**
 * How tall the script is, for its line heights: `small` for Latin (but Vietnamese), Greek,
 * Cyrillic, and Hebrew; `medium` for most others, such as Chinese, Japanese, Korean, Arabic, and
 * Thai; `large` for Burmese and Telugu; `extra-large` for Nastaliq.
 */
export const LANGUAGE_HEIGHTS = ['small', 'medium', 'large', 'extra-large'] as const;
export type LanguageHeight = (typeof LANGUAGE_HEIGHTS)[number];

/**
 * The type scale: `static`, for a static font as Roboto, or `variable`, the spec's variable type
 * scale (`md.sys.typescale.variable`) for a variable font as Roboto Flex, which sets no letter
 * spacing and its own weights for some emphasized styles.
 */
export const TYPESCALES = ['static', 'variable'] as const;
export type Typescale = (typeof TYPESCALES)[number];

export interface TypeStyleOptions {
  /** The M3E emphasized set: heavier, for selection, actions, and editorial emphasis. */
  emphasized?: boolean;
  /** The line heights for a script's height. Defaults to `'small'`, the type scale's own. */
  languageHeight?: LanguageHeight;
  /** The type scale. Defaults to `'static'`. */
  typescale?: Typescale;
}

export type TypescalePart = 'font' | 'size' | 'line-height' | 'weight' | 'tracking';

type Row = readonly [
  typeface: Typeface,
  size: number,
  lineHeight: number,
  tracking: number,
  weight: number,
];

/**
 * Material Web `tokens/versions/latest` (Material 3 v34.0.21, platform web, static fonts), checked
 * against the type scale tokens on m3.material.io. Values are in px. Compose's `TypeScaleTokens`
 * (v0_103) rounds some tracking values (for example -0.2 instead of -0.25), so it isn't used here.
 */
const BASELINE: Record<TypeStyle, Row> = {
  'display-large': ['brand', 57, 64, -0.25, 400],
  'display-medium': ['brand', 45, 52, 0, 400],
  'display-small': ['brand', 36, 44, 0, 400],
  'headline-large': ['brand', 32, 40, 0, 400],
  'headline-medium': ['brand', 28, 36, 0, 400],
  'headline-small': ['brand', 24, 32, 0, 400],
  'title-large': ['brand', 22, 28, 0, 400],
  'title-medium': ['plain', 16, 24, 0.15, 500],
  'title-small': ['plain', 14, 20, 0.1, 500],
  'body-large': ['plain', 16, 24, 0.5, 400],
  'body-medium': ['plain', 14, 20, 0.25, 400],
  'body-small': ['plain', 12, 16, 0.4, 400],
  'label-large': ['plain', 14, 20, 0.1, 500],
  'label-medium': ['plain', 12, 16, 0.5, 500],
  'label-small': ['plain', 11, 16, 0.5, 500],
};

/** Same source. Only the weights differ from the baseline set today. */
const EMPHASIZED: Record<TypeStyle, Row> = {
  'display-large': ['brand', 57, 64, -0.25, 500],
  'display-medium': ['brand', 45, 52, 0, 500],
  'display-small': ['brand', 36, 44, 0, 500],
  'headline-large': ['brand', 32, 40, 0, 500],
  'headline-medium': ['brand', 28, 36, 0, 500],
  'headline-small': ['brand', 24, 32, 0, 500],
  'title-large': ['brand', 22, 28, 0, 500],
  'title-medium': ['plain', 16, 24, 0.15, 700],
  'title-small': ['plain', 14, 20, 0.1, 700],
  'body-large': ['plain', 16, 24, 0.5, 500],
  'body-medium': ['plain', 14, 20, 0.25, 500],
  'body-small': ['plain', 12, 16, 0.4, 500],
  'label-large': ['plain', 14, 20, 0.1, 700],
  'label-medium': ['plain', 12, 16, 0.5, 700],
  'label-small': ['plain', 11, 16, 0.5, 700],
};

/**
 * Line heights by language height, small to extra large, in px: m3.material.io's typography token
 * data, `md.ref.typeface.<style>.line-height` under the `language.height` context. The small ones
 * are the type scale's own. The emphasized styles take them too.
 */
const LANGUAGE_LINE_HEIGHTS: Record<TypeStyle, readonly [number, number, number, number]> = {
  'display-large': [64, 73, 89, 120],
  'display-medium': [52, 56, 71, 99],
  'display-small': [44, 47, 57, 80],
  'headline-large': [40, 42, 50, 75],
  'headline-medium': [36, 38, 45, 66],
  'headline-small': [32, 35, 41, 59],
  'title-large': [28, 31, 36, 53],
  'title-medium': [24, 27, 31, 42],
  'title-small': [20, 23, 26, 36],
  'body-large': [24, 27, 31, 41],
  'body-medium': [20, 23, 26, 35],
  'body-small': [16, 18, 21, 30],
  'label-large': [20, 23, 26, 36],
  'label-medium': [16, 18, 21, 30],
  'label-small': [16, 18, 21, 29],
};

/** Scripts at the small line heights, by their ISO 15924 codes */
const SMALL_SCRIPTS = new Set(['Latn', 'Grek', 'Cyrl', 'Hebr']);
/** Burmese and Telugu */
const LARGE_SCRIPTS = new Set(['Mymr', 'Telu']);

/**
 * The language height for a language tag, by its script: the one it names, as in `ur-Aran` for
 * Urdu in Nastaliq, or its language's usual one. `small` without a tag, or for a language whose
 * script `Intl` doesn't know.
 */
export function languageHeightOf(locale?: string): LanguageHeight {
  if (!locale) return 'small';
  let tag: Intl.Locale;
  try {
    tag = new Intl.Locale(locale).maximize();
  } catch {
    return 'small';
  }
  const { script, language } = tag;
  if (!script) return 'small';
  if (script === 'Aran') return 'extra-large';
  if (LARGE_SCRIPTS.has(script)) return 'large';
  if (SMALL_SCRIPTS.has(script)) return language === 'vi' ? 'medium' : 'small';
  return 'medium';
}

/**
 * The emphasized styles a variable font sets lighter, from the static set's 700: the spec's
 * variable type scale (`md.sys.typescale.variable.emphasized.<style>`, its `.weight` and `.wght`).
 */
const VARIABLE_EMPHASIZED_WEIGHTS: Partial<Record<TypeStyle, number>> = {
  'title-medium': 600,
  'title-small': 600,
  'label-large': 600,
  'label-medium': 600,
  'label-small': 600,
};

/** The typeface stacks for each type scale, both typefaces alike */
const DEFAULT_TYPEFACES: Record<Typescale, string> = {
  static: 'Roboto, system-ui, sans-serif',
  variable: '"Roboto Flex", Roboto, "Noto Sans", system-ui, sans-serif',
};

export type TypefaceVar = `${typeof TOKEN_PREFIX}-typeface-${Typeface}`;

export type TypescaleVar =
  | `${typeof TOKEN_PREFIX}-typescale-${'' | 'emphasized-'}${TypeStyle}`
  | `${typeof TOKEN_PREFIX}-typescale-${'' | 'emphasized-'}${TypeStyle}-${TypescalePart}`;

export type TypographyVar = TypefaceVar | TypescaleVar;

/** The values behind a style, in px. */
export function getTypeStyle(style: TypeStyle, options: TypeStyleOptions = {}): TypeStyleSpec {
  const [typeface, size, , tracking, weight] = (options.emphasized ? EMPHASIZED : BASELINE)[style];
  const lineHeight =
    LANGUAGE_LINE_HEIGHTS[style][LANGUAGE_HEIGHTS.indexOf(options.languageHeight ?? 'small')]!;
  if (options.typescale !== 'variable') return { typeface, size, lineHeight, tracking, weight };
  return {
    typeface,
    size,
    lineHeight,
    tracking: 0,
    weight: (options.emphasized && VARIABLE_EMPHASIZED_WEIGHTS[style]) || weight,
  };
}

/** CSS variable name for a typeface. `brand` → `--rio-typeface-brand` */
export function typefaceVar(typeface: Typeface): TypefaceVar {
  return `${TOKEN_PREFIX}-typeface-${typeface}`;
}

/**
 * CSS variable name for a style. Without `part`, the variable holds a `font` shorthand
 * (`font: var(--rio-typescale-label-large)`). Letter spacing isn't part of `font`, so set it with
 * the `tracking` part.
 */
export function typescaleVar(
  style: TypeStyle,
  options: TypeStyleOptions & { part?: TypescalePart } = {},
): TypescaleVar {
  const set = options.emphasized ? 'emphasized-' : '';
  const part = options.part ? `-${options.part}` : '';
  return `${TOKEN_PREFIX}-typescale-${set}${style}${part}` as TypescaleVar;
}

/** px → rem, so text follows the user's font size setting like Android's sp. */
const rem = (px: number) => `${Number((px / 16).toFixed(6))}rem`;

/**
 * Typeface and type scale variables for both the baseline and emphasized sets. The typefaces
 * default to Roboto for the static type scale, and to Roboto Flex for the variable one.
 */
export function createTypographyVariables(
  typefaces: TypefaceOverrides = {},
  options: Pick<TypeStyleOptions, 'languageHeight' | 'typescale'> = {},
): Record<TypographyVar, string> {
  const { languageHeight = 'small', typescale = 'static' } = options;
  const vars = {
    [typefaceVar('brand')]: typefaces.brand ?? DEFAULT_TYPEFACES[typescale],
    [typefaceVar('plain')]: typefaces.plain ?? DEFAULT_TYPEFACES[typescale],
  } as Record<TypographyVar, string>;

  for (const emphasized of [false, true]) {
    for (const style of TYPE_STYLES) {
      const { typeface, size, lineHeight, tracking, weight } = getTypeStyle(style, {
        emphasized,
        languageHeight,
        typescale,
      });
      const v = (part?: TypescalePart) => typescaleVar(style, { emphasized, part });
      const family = `var(${typefaceVar(typeface)})`;
      vars[v()] = `${weight} ${rem(size)}/${rem(lineHeight)} ${family}`;
      vars[v('font')] = family;
      vars[v('size')] = rem(size);
      vars[v('line-height')] = rem(lineHeight);
      vars[v('weight')] = String(weight);
      vars[v('tracking')] = rem(tracking);
    }
  }
  return vars;
}
