import { Contrast, Hct, argbFromHex } from '@material/material-color-utilities';
import { describe, expect, test } from 'vitest';
import {
  COLOR_ROLES,
  colorVar,
  createColorScheme,
  createStaticColors,
  staticColorVars,
  type SchemeVariant,
} from './color';

const BASELINE = '#6750a4';
const VARIANTS: SchemeVariant[] = ['tonal-spot', 'neutral', 'vibrant', 'expressive'];

describe('createColorScheme', () => {
  test('returns every role as #rrggbb', () => {
    const scheme = createColorScheme({ sourceColor: BASELINE });
    expect(Object.keys(scheme)).toEqual([...COLOR_ROLES]);
    for (const value of Object.values(scheme)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
  });

  test('light and dark schemes differ', () => {
    const light = createColorScheme({ sourceColor: BASELINE });
    const dark = createColorScheme({ sourceColor: BASELINE, dark: true });
    expect(dark.surface).not.toBe(light.surface);
    expect(dark.primary).not.toBe(light.primary);
  });

  test.each(VARIANTS)('%s stays on the 2025 spec', (variant) => {
    // The dim roles only exist in the 2025 spec, so a fallback to 2021 would throw.
    expect(() => createColorScheme({ sourceColor: BASELINE, variant })).not.toThrow();
  });

  test('clamps contrast to [-1, 1]', () => {
    const high = createColorScheme({ sourceColor: BASELINE, contrast: 1 });
    expect(createColorScheme({ sourceColor: BASELINE, contrast: 5 })).toEqual(high);
  });

  // Catches silent output changes, for example after an MCU upgrade.
  test.each(VARIANTS)('%s output is stable', (variant) => {
    expect({
      light: createColorScheme({ sourceColor: BASELINE, variant }),
      dark: createColorScheme({ sourceColor: BASELINE, variant, dark: true }),
    }).toMatchSnapshot();
  });
});

const hct = (hex: string) => Hct.fromInt(argbFromHex(hex));
/** How far apart two hues are, in degrees, either way round */
const hueGap = (a: string, b: string) => {
  const d = Math.abs(hct(a).hue - hct(b).hue) % 360;
  return Math.min(d, 360 - d);
};
const contrastOf = (a: string, b: string) => Contrast.ratioOfTones(hct(a).tone, hct(b).tone);

describe('keyColors', () => {
  const plain = createColorScheme({ sourceColor: BASELINE });

  test('make the palettes they name from their own hue, and leave the primary color', () => {
    const keyed = createColorScheme({
      sourceColor: BASELINE,
      keyColors: { secondary: '#006a6a', neutral: '#5d5f5f', error: '#d32f2f' },
    });
    expect(keyed.primary).toBe(plain.primary);
    expect(keyed.tertiary).toBe(plain.tertiary);
    expect(hueGap(keyed.secondary, '#006a6a')).toBeLessThan(3);
    expect(hueGap(keyed.error, '#d32f2f')).toBeLessThan(3);
    expect(keyed.surfaceContainer).not.toBe(plain.surfaceContainer);
  });

  test('without any, the scheme is the source color’s', () => {
    expect(createColorScheme({ sourceColor: BASELINE, keyColors: {} })).toEqual(plain);
  });
});

describe('createStaticColors', () => {
  const success = '#2e7d32';

  test('four roles each, light and dark', () => {
    const light = createStaticColors({ sourceColor: BASELINE }, { success });
    const dark = createStaticColors({ sourceColor: BASELINE, dark: true }, { success });
    expect(Object.keys(light.success!)).toEqual([
      'color',
      'onColor',
      'colorContainer',
      'onColorContainer',
    ]);
    for (const value of Object.values(light.success!)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    expect(dark.success!.color).not.toBe(light.success!.color);
  });

  test('harmonized toward the source color, unless harmonize is false', () => {
    const { harmonized, own } = createStaticColors(
      { sourceColor: BASELINE },
      { harmonized: success, own: { color: success, harmonize: false } },
    );
    expect(hueGap(own!.color, success)).toBeLessThan(3);
    expect(hueGap(harmonized!.color, BASELINE)).toBeLessThan(hueGap(success, BASELINE) - 5);
  });

  test('the pairs keep the scheme’s contrast, and more at a higher contrast', () => {
    for (const dark of [false, true]) {
      const [standard, high] = [0, 1].map(
        (contrast) =>
          createStaticColors({ sourceColor: BASELINE, contrast, dark }, { success }).success!,
      );
      expect(contrastOf(standard!.color, standard!.onColor)).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastOf(standard!.colorContainer, standard!.onColorContainer),
      ).toBeGreaterThanOrEqual(4.5);
      expect(contrastOf(high!.color, high!.onColor)).toBeGreaterThan(
        contrastOf(standard!.color, standard!.onColor),
      );
    }
  });

  // Catches silent output changes, for example after an MCU upgrade.
  test.each(VARIANTS)('%s output is stable', (variant) => {
    const colors = { success, warning: '#f9a825' };
    expect({
      light: createStaticColors({ sourceColor: BASELINE, variant }, colors),
      dark: createStaticColors({ sourceColor: BASELINE, variant, dark: true }, colors),
    }).toMatchSnapshot();
  });
});

describe('staticColorVars', () => {
  test('names the four roles as the accent roles are named', () => {
    expect(staticColorVars('success')).toEqual({
      color: '--rio-color-success',
      onColor: '--rio-color-on-success',
      colorContainer: '--rio-color-success-container',
      onColorContainer: '--rio-color-on-success-container',
    });
    expect(staticColorVars('brandAccent').color).toBe('--rio-color-brand-accent');
    expect(staticColorVars('brand-accent').color).toBe('--rio-color-brand-accent');
  });

  test.each(['Success', '1st', 'a--b', 'a_b', 'a-', ''])('rejects "%s"', (name) => {
    expect(() => staticColorVars(name)).toThrow(/static color name/);
  });
});

describe('colorVar', () => {
  test('turns camelCase roles into kebab-case variables', () => {
    expect(colorVar('surface')).toBe('--rio-color-surface');
    expect(colorVar('onPrimaryContainer')).toBe('--rio-color-on-primary-container');
  });
});
