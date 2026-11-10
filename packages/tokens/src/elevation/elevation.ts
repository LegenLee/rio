import { colorVar } from '../color/color';
import { TOKEN_PREFIX } from '../prefix';

export const ELEVATION_LEVELS = [0, 1, 2, 3, 4, 5] as const;

/** 0–3 are resting states. 4–5 are for interaction states only, such as hover and drag. */
export type ElevationLevel = (typeof ELEVATION_LEVELS)[number];

export type ElevationVar = `${typeof TOKEN_PREFIX}-elevation-level${ElevationLevel}`;

type Layer = readonly [y: number, blur: number, spread: number];

/**
 * The `M3/Elevation` effect styles from the M3 Figma Design Kit. Light and dark values are identical.
 * Each level has two layers: a key shadow (30%) and an ambient shadow (15%).
 */
const SHADOWS: Record<Exclude<ElevationLevel, 0>, readonly [key: Layer, ambient: Layer]> = {
  1: [
    [1, 2, 0],
    [1, 3, 1],
  ],
  2: [
    [1, 2, 0],
    [2, 6, 2],
  ],
  3: [
    [1, 3, 0],
    [4, 8, 3],
  ],
  4: [
    [2, 3, 0],
    [6, 10, 4],
  ],
  5: [
    [4, 4, 0],
    [8, 12, 6],
  ],
};

/** CSS variable name for a level. `3` → `--rio-elevation-level3` */
export function elevationVar(level: ElevationLevel): ElevationVar {
  return `${TOKEN_PREFIX}-elevation-level${level}`;
}

const layer = ([y, blur, spread]: Layer, opacity: number) =>
  `0 ${y}px ${blur}px ${spread}px color-mix(in srgb, var(${colorVar('shadow')}) ${opacity}%, transparent)`;

/** `box-shadow` values by level. The shadow color follows the theme's shadow role. */
export function createElevationVariables(): Record<ElevationVar, string> {
  const vars = { [elevationVar(0)]: 'none' } as Record<ElevationVar, string>;
  for (const level of ELEVATION_LEVELS) {
    if (level === 0) continue;
    const [key, ambient] = SHADOWS[level];
    vars[elevationVar(level)] = `${layer(key, 30)}, ${layer(ambient, 15)}`;
  }
  return vars;
}
