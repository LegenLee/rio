import { describe, expect, test } from 'vitest';
import {
  LANGUAGE_HEIGHTS,
  TYPE_STYLES,
  createTypographyVariables,
  getTypeStyle,
  languageHeightOf,
  typefaceVar,
  typescaleVar,
  type LanguageHeight,
  type TypeStyle,
} from './typography';

type Row = [style: TypeStyle, font: string, size: string, lineHeight: string, tracking: string];

// Transcribed from Material Web `tokens/versions/latest` (v34.0.21), independently of the source.
const MWC: Row[] = [
  ['display-large', 'brand', '3.5625rem', '4rem', '-0.015625rem'],
  ['display-medium', 'brand', '2.8125rem', '3.25rem', '0rem'],
  ['display-small', 'brand', '2.25rem', '2.75rem', '0rem'],
  ['headline-large', 'brand', '2rem', '2.5rem', '0rem'],
  ['headline-medium', 'brand', '1.75rem', '2.25rem', '0rem'],
  ['headline-small', 'brand', '1.5rem', '2rem', '0rem'],
  ['title-large', 'brand', '1.375rem', '1.75rem', '0rem'],
  ['title-medium', 'plain', '1rem', '1.5rem', '0.009375rem'],
  ['title-small', 'plain', '0.875rem', '1.25rem', '0.00625rem'],
  ['body-large', 'plain', '1rem', '1.5rem', '0.03125rem'],
  ['body-medium', 'plain', '0.875rem', '1.25rem', '0.015625rem'],
  ['body-small', 'plain', '0.75rem', '1rem', '0.025rem'],
  ['label-large', 'plain', '0.875rem', '1.25rem', '0.00625rem'],
  ['label-medium', 'plain', '0.75rem', '1rem', '0.03125rem'],
  ['label-small', 'plain', '0.6875rem', '1rem', '0.03125rem'],
];

// Weights from the same files: [baseline, emphasized].
const WEIGHTS: Record<TypeStyle, [string, string]> = {
  'display-large': ['400', '500'],
  'display-medium': ['400', '500'],
  'display-small': ['400', '500'],
  'headline-large': ['400', '500'],
  'headline-medium': ['400', '500'],
  'headline-small': ['400', '500'],
  'title-large': ['400', '500'],
  'title-medium': ['500', '700'],
  'title-small': ['500', '700'],
  'body-large': ['400', '500'],
  'body-medium': ['400', '500'],
  'body-small': ['400', '500'],
  'label-large': ['500', '700'],
  'label-medium': ['500', '700'],
  'label-small': ['500', '700'],
};

describe('createTypographyVariables', () => {
  const vars = createTypographyVariables();

  test('defines two typefaces plus six variables per style in both sets', () => {
    expect(Object.keys(vars)).toHaveLength(2 + TYPE_STYLES.length * 2 * 6);
  });

  test.each(MWC)('%s matches Material Web', (style, font, size, lineHeight, tracking) => {
    for (const emphasized of [false, true]) {
      const v = (part: 'font' | 'size' | 'line-height' | 'tracking' | 'weight') =>
        vars[typescaleVar(style, { emphasized, part })];
      expect(v('font')).toBe(`var(--rio-typeface-${font})`);
      expect(v('size')).toBe(size);
      expect(v('line-height')).toBe(lineHeight);
      expect(v('tracking')).toBe(tracking);
      expect(v('weight')).toBe(WEIGHTS[style][emphasized ? 1 : 0]);
    }
  });

  test('the shorthand fits the CSS font property', () => {
    expect(vars['--rio-typescale-label-large']).toBe(
      '500 0.875rem/1.25rem var(--rio-typeface-plain)',
    );
    expect(vars['--rio-typescale-emphasized-label-large']).toBe(
      '700 0.875rem/1.25rem var(--rio-typeface-plain)',
    );
  });

  test('defaults both typefaces to Roboto with fallbacks', () => {
    expect(vars['--rio-typeface-brand']).toBe('Roboto, system-ui, sans-serif');
    expect(vars['--rio-typeface-plain']).toBe('Roboto, system-ui, sans-serif');
  });

  test('typeface overrides replace only the given typeface', () => {
    const custom = createTypographyVariables({ brand: '"Roboto Flex", sans-serif' });
    expect(custom['--rio-typeface-brand']).toBe('"Roboto Flex", sans-serif');
    expect(custom['--rio-typeface-plain']).toBe('Roboto, system-ui, sans-serif');
  });
});

// The line heights by language height, small to extra large, in pt: transcribed from
// m3.material.io's typography token data (`md.ref.typeface.<style>.line-height` under the
// `language.height` context), independently of the source.
const LANGUAGE: Record<TypeStyle, [number, number, number, number]> = {
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

describe('language height', () => {
  test('sets the line heights for the script’s height, in both sets, the shorthand too', () => {
    for (const [i, height] of LANGUAGE_HEIGHTS.entries()) {
      const vars = createTypographyVariables({}, { languageHeight: height });
      for (const style of TYPE_STYLES) {
        const lineHeight = `${LANGUAGE[style][i]! / 16}rem`;
        for (const emphasized of [false, true]) {
          expect(vars[typescaleVar(style, { emphasized, part: 'line-height' })]).toBe(lineHeight);
          expect(vars[typescaleVar(style, { emphasized })]).toContain(`/${lineHeight} `);
        }
      }
    }
  });

  test('small is the type scale’s own, and the default', () => {
    expect(createTypographyVariables({}, { languageHeight: 'small' })).toEqual(
      createTypographyVariables(),
    );
    for (const style of TYPE_STYLES) {
      expect(getTypeStyle(style, { languageHeight: 'small' })).toEqual(getTypeStyle(style));
    }
  });

  test('a language tag’s script picks it', () => {
    const cases: [string | undefined, LanguageHeight][] = [
      ['en', 'small'],
      ['de-CH', 'small'],
      ['ru', 'small'],
      ['el', 'small'],
      ['he', 'small'],
      ['sr-Latn', 'small'],
      ['vi', 'medium'],
      ['ko', 'medium'],
      ['ja', 'medium'],
      ['zh-Hant', 'medium'],
      ['ar', 'medium'],
      ['hi', 'medium'],
      ['th', 'medium'],
      ['hy', 'medium'],
      ['ur', 'medium'],
      ['my', 'large'],
      ['te', 'large'],
      ['ur-Aran', 'extra-large'],
      ['xx', 'small'],
      ['not a tag!', 'small'],
      ['', 'small'],
      [undefined, 'small'],
    ];
    for (const [locale, height] of cases)
      expect([locale, languageHeightOf(locale)]).toEqual([locale, height]);
  });
});

// The weights of the variable type scale, [baseline, emphasized]: transcribed from m3.material.io's
// typography token data (`md.sys.typescale.variable[.emphasized].<style>`, its `.weight` and
// `.wght` alike), independently of the source. Its letter spacing is 0 throughout.
const VARIABLE_WEIGHTS: Record<TypeStyle, [string, string]> = {
  'display-large': ['400', '500'],
  'display-medium': ['400', '500'],
  'display-small': ['400', '500'],
  'headline-large': ['400', '500'],
  'headline-medium': ['400', '500'],
  'headline-small': ['400', '500'],
  'title-large': ['400', '500'],
  'title-medium': ['500', '600'],
  'title-small': ['500', '600'],
  'body-large': ['400', '500'],
  'body-medium': ['400', '500'],
  'body-small': ['400', '500'],
  'label-large': ['500', '600'],
  'label-medium': ['500', '600'],
  'label-small': ['500', '600'],
};

describe('the variable type scale', () => {
  const vars = createTypographyVariables({}, { typescale: 'variable' });

  test.each(MWC)(
    '%s: its weights, no letter spacing, the same sizes',
    (style, font, size, lineHeight) => {
      for (const emphasized of [false, true]) {
        const v = (part?: 'font' | 'size' | 'line-height' | 'tracking' | 'weight') =>
          vars[typescaleVar(style, { emphasized, part })];
        const weight = VARIABLE_WEIGHTS[style][emphasized ? 1 : 0];
        expect([v('font'), v('size'), v('line-height')]).toEqual([
          `var(--rio-typeface-${font})`,
          size,
          lineHeight,
        ]);
        expect(v('tracking')).toBe('0rem');
        expect(v('weight')).toBe(weight);
        expect(v()).toBe(`${weight} ${size}/${lineHeight} var(--rio-typeface-${font})`);
      }
    },
  );

  test('defaults both typefaces to Roboto Flex, then Roboto and Noto Sans', () => {
    const stack = '"Roboto Flex", Roboto, "Noto Sans", system-ui, sans-serif';
    expect([vars['--rio-typeface-brand'], vars['--rio-typeface-plain']]).toEqual([stack, stack]);
    const custom = createTypographyVariables(
      { plain: 'Inter, sans-serif' },
      { typescale: 'variable' },
    );
    expect([custom['--rio-typeface-brand'], custom['--rio-typeface-plain']]).toEqual([
      stack,
      'Inter, sans-serif',
    ]);
  });

  test('takes the language heights too', () => {
    const tall = createTypographyVariables({}, { typescale: 'variable', languageHeight: 'medium' });
    expect(tall['--rio-typescale-emphasized-label-large']).toBe(
      '600 0.875rem/1.4375rem var(--rio-typeface-plain)',
    );
  });

  test('static is the default', () => {
    expect(createTypographyVariables({}, { typescale: 'static' })).toEqual(
      createTypographyVariables(),
    );
  });
});

describe('variable names', () => {
  test('follow the md.sys.typescale token names', () => {
    expect(typescaleVar('body-large')).toBe('--rio-typescale-body-large');
    expect(typescaleVar('body-large', { part: 'tracking' })).toBe(
      '--rio-typescale-body-large-tracking',
    );
    expect(typescaleVar('body-large', { emphasized: true })).toBe(
      '--rio-typescale-emphasized-body-large',
    );
    expect(typefaceVar('plain')).toBe('--rio-typeface-plain');
  });
});
