import { describe, expect, test } from 'vitest';
import { COLOR_ROLES, colorVar, createColorScheme, type SchemeVariant } from './color';

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

describe('colorVar', () => {
  test('turns camelCase roles into kebab-case variables', () => {
    expect(colorVar('surface')).toBe('--rio-color-surface');
    expect(colorVar('onPrimaryContainer')).toBe('--rio-color-on-primary-container');
  });
});
