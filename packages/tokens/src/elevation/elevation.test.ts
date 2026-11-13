import { describe, expect, test } from 'vitest';
import { ELEVATION_LEVELS, createElevationVariables, elevationVar } from './elevation';

const shadow = (y: number, blur: number, spread: number, opacity: number) =>
  `0 ${y}px ${blur}px ${spread}px color-mix(in srgb, var(--rio-color-shadow) ${opacity}%, transparent)`;

// Transcribed from the M3 Figma Design Kit (`M3/Elevation Light/1–5`), independently of the source.
const KIT: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: `${shadow(1, 2, 0, 30)}, ${shadow(1, 3, 1, 15)}`,
  2: `${shadow(1, 2, 0, 30)}, ${shadow(2, 6, 2, 15)}`,
  3: `${shadow(1, 3, 0, 30)}, ${shadow(4, 8, 3, 15)}`,
  4: `${shadow(2, 3, 0, 30)}, ${shadow(6, 10, 4, 15)}`,
  5: `${shadow(4, 4, 0, 30)}, ${shadow(8, 12, 6, 15)}`,
};

describe('createElevationVariables', () => {
  const vars = createElevationVariables();

  test('defines one variable per level', () => {
    expect(Object.keys(vars)).toEqual(ELEVATION_LEVELS.map(elevationVar));
  });

  test('level 0 has no shadow', () => {
    expect(vars['--rio-elevation-level0']).toBe('none');
  });

  test.each([1, 2, 3, 4, 5] as const)('level %i matches the M3 Figma Design Kit', (level) => {
    expect(vars[elevationVar(level)]).toBe(KIT[level]);
  });
});

describe('elevationVar', () => {
  test('names the variable after the level', () => {
    expect(elevationVar(3)).toBe('--rio-elevation-level3');
  });
});
