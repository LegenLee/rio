import { describe, expect, test } from 'vitest';
import { SHAPE_CORNERS, createShapeVariables, shapeVar, type ShapeCorner } from './shape';

// Transcribed from the M3 corner radius scale on m3.material.io, independently of the source.
const SPEC: [ShapeCorner, string][] = [
  ['none', '0px'],
  ['extra-small', '4px'],
  ['small', '8px'],
  ['medium', '12px'],
  ['large', '16px'],
  ['large-increased', '20px'],
  ['extra-large', '28px'],
  ['extra-large-increased', '32px'],
  ['extra-extra-large', '48px'],
  ['full', '9999px'],
];

describe('createShapeVariables', () => {
  const vars = createShapeVariables();

  test('defines one variable per step, in scale order', () => {
    expect(Object.keys(vars)).toEqual(SHAPE_CORNERS.map(shapeVar));
  });

  test.each(SPEC)('%s matches the spec', (corner, radius) => {
    expect(vars[shapeVar(corner)]).toBe(radius);
  });

  test('overrides resize only the given steps', () => {
    const custom = createShapeVariables({ medium: 16 });
    expect(custom['--rio-shape-corner-medium']).toBe('16px');
    expect(custom['--rio-shape-corner-small']).toBe('8px');
  });
});

describe('shapeVar', () => {
  test('names the variable after the step', () => {
    expect(shapeVar('extra-large-increased')).toBe('--rio-shape-corner-extra-large-increased');
  });
});
