import { describe, expect, test } from 'vitest';
import { straightCubic } from './cubic';
import { cubicsPath } from './path';
import { roundedPolygon } from './polygon';

describe('cubicsPath', () => {
  test('moves to the first anchor, curves to each end, and closes', () => {
    expect(
      cubicsPath([
        [0, 0, 1, 2, 3, 4, 5, 6],
        [5, 6, 7, 8, 9, 10, 0, 0],
      ]),
    ).toBe('M0 0C1 2 3 4 5 6C7 8 9 10 0 0Z');
  });

  test('draws a polygon from its cubics', () => {
    const square = roundedPolygon({ vertices: [0, 0, 1, 0, 1, 1, 0, 1] });
    expect(cubicsPath(square.cubics)).toMatch(/^M\S+ \S+(C(\S+ ){5}\S+){4}Z$/);
  });

  test('is empty for no cubics', () => {
    expect(cubicsPath([])).toBe('');
  });

  test('reads back in the browser as the same outline', () => {
    const d = cubicsPath([straightCubic(0, 0, 10, 0), straightCubic(10, 0, 0, 0)]);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    expect(path.getTotalLength()).toBeCloseTo(20);
  });
});
