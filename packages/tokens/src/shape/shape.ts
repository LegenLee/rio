import { TOKEN_PREFIX } from '../prefix';

export const SHAPE_CORNERS = [
  'none',
  'extra-small',
  'small',
  'medium',
  'large',
  'large-increased',
  'extra-large',
  'extra-large-increased',
  'extra-extra-large',
  'full',
] as const;

/** The M3 corner radius scale. The `*-increased` and `extra-extra-large` steps are new in M3E. */
export type ShapeCorner = (typeof SHAPE_CORNERS)[number];

/** The steps a theme may resize. `none` and `full` are fixed, as in Compose's `Shapes`. */
export type CustomizableShapeCorner = Exclude<ShapeCorner, 'none' | 'full'>;

/** Radii in px, overriding the defaults: `{ medium: 16 }`. */
export type ShapeOverrides = Partial<Record<CustomizableShapeCorner, number>>;

export type ShapeVar = `${typeof TOKEN_PREFIX}-shape-corner-${ShapeCorner}`;

/** M3 corner radius scale and Compose `ShapeTokens` (token version 14_1_0), in dp (= CSS px). */
const RADII: Record<CustomizableShapeCorner, number> = {
  'extra-small': 4,
  small: 8,
  medium: 12,
  large: 16,
  'large-increased': 20,
  'extra-large': 28,
  'extra-large-increased': 32,
  'extra-extra-large': 48,
};

/**
 * Fully rounded: a pill or a circle. This works for static shapes but animates badly, because a
 * transition from 9999px to 12px stays fully round until the very end. Components that morph
 * between `full` and another corner must use half their height instead.
 */
const FULL = '9999px';

/** CSS variable name for a corner. `medium` → `--rio-shape-corner-medium` */
export function shapeVar(corner: ShapeCorner): ShapeVar {
  return `${TOKEN_PREFIX}-shape-corner-${corner}`;
}

/**
 * Corner radius variables. Asymmetric shapes (the spec's top, start, and end tokens) need no extra
 * variables: set the individual corners with logical properties such as `border-start-start-radius`.
 */
export function createShapeVariables(overrides: ShapeOverrides = {}): Record<ShapeVar, string> {
  const vars = { [shapeVar('none')]: '0px' } as Record<ShapeVar, string>;
  for (const [corner, radius] of Object.entries(RADII) as [CustomizableShapeCorner, number][]) {
    vars[shapeVar(corner)] = `${overrides[corner] ?? radius}px`;
  }
  vars[shapeVar('full')] = FULL;
  return vars;
}
