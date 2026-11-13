import { describe, expect, test } from 'vitest';
import {
  TYPE_STYLES,
  createTypographyVariables,
  typefaceVar,
  typescaleVar,
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
