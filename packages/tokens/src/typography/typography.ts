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

export interface TypeStyleOptions {
  /** The M3E emphasized set: heavier, for selection, actions, and editorial emphasis. */
  emphasized?: boolean;
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

const DEFAULT_TYPEFACE = 'Roboto, system-ui, sans-serif';

export type TypefaceVar = `${typeof TOKEN_PREFIX}-typeface-${Typeface}`;

export type TypescaleVar =
  | `${typeof TOKEN_PREFIX}-typescale-${'' | 'emphasized-'}${TypeStyle}`
  | `${typeof TOKEN_PREFIX}-typescale-${'' | 'emphasized-'}${TypeStyle}-${TypescalePart}`;

export type TypographyVar = TypefaceVar | TypescaleVar;

/** The values behind a style, in px. */
export function getTypeStyle(style: TypeStyle, options: TypeStyleOptions = {}): TypeStyleSpec {
  const [typeface, size, lineHeight, tracking, weight] = (
    options.emphasized ? EMPHASIZED : BASELINE
  )[style];
  return { typeface, size, lineHeight, tracking, weight };
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

/** Typeface and type scale variables for both the baseline and emphasized sets. */
export function createTypographyVariables(
  typefaces: TypefaceOverrides = {},
): Record<TypographyVar, string> {
  const vars = {
    [typefaceVar('brand')]: typefaces.brand ?? DEFAULT_TYPEFACE,
    [typefaceVar('plain')]: typefaces.plain ?? DEFAULT_TYPEFACE,
  } as Record<TypographyVar, string>;

  for (const emphasized of [false, true]) {
    for (const style of TYPE_STYLES) {
      const { typeface, size, lineHeight, tracking, weight } = getTypeStyle(style, { emphasized });
      const v = (part?: TypescalePart) => typescaleVar(style, { emphasized, part });
      const font = `var(${typefaceVar(typeface)})`;
      vars[v()] = `${weight} ${rem(size)}/${rem(lineHeight)} ${font}`;
      vars[v('font')] = font;
      vars[v('size')] = rem(size);
      vars[v('line-height')] = rem(lineHeight);
      vars[v('weight')] = String(weight);
      vars[v('tracking')] = rem(tracking);
    }
  }
  return vars;
}
