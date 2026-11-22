// Ported from androidx graphics-shapes, commonTest's SvgPathParserTest.kt, at androidx 079e2e3.
// Copyright 2024 The Android Open Source Project, licensed under the Apache License, Version 2.0.
// Changed: ported to TypeScript and Vitest. The absolute arc expects 2 cubics of 45 degrees, as the
// original means; on Android, Float rounding makes 3 (the original skips the test on JS, where it
// makes 2). Quadratic curves expect the cubics that draw them exactly, where the original expects
// its approximation. The tests for featuresFromSvgPath and for errors are new; the first of them
// checks a difference from the original, which takes the first shape one cubic short.

import { describe, expect, test } from 'vitest';
import { pointOnCurve, straightCubic, type Cubic } from './cubic';
import type { PolygonFeature } from './features';
import { doMapping } from './feature-mapping';
import {
  normalizePolygon,
  polygonFromFeatures,
  roundedPolygon,
  type RoundedPolygon,
} from './polygon';
import { LengthMeasurer, MeasuredPolygon } from './polygon-measure';
import { featuresFromSvgPath, parseCubics } from './svg-path-parser';
import { assertCubicListsEqualish, assertCubicsEqualish, assertPointsEqualish } from './test-utils';

function parsingIsEqualish(pathA: string, pathB: string) {
  assertCubicListsEqualish(parseCubics(pathA), parseCubics(pathB));
}

function parsingMatches(path: string, expected: Cubic[]) {
  assertCubicListsEqualish(expected, parseCubics(path));
}

describe('parseCubics', () => {
  test('handles empty input', () => parsingMatches('', []));

  test('parses both parameter separators equally', () =>
    parsingIsEqualish('M 10,10 L 30,10 L 20,30 z', 'M 10 10 L 30 10 L 20 30 z'));

  test('parses whitespace equally', () =>
    parsingIsEqualish('M 10,10  L    30,10    L 20,30 z', 'M10,10L30,10L20,30z'));

  test('parses several absolute paths', () =>
    parsingMatches('M 10,10 30,10 20,30 z M 20,20 50,10 40,30 z', [
      straightCubic(10, 10, 30, 10),
      straightCubic(30, 10, 20, 30),
      straightCubic(20, 30, 10, 10),
      straightCubic(20, 20, 50, 10),
      straightCubic(50, 10, 40, 30),
      straightCubic(40, 30, 20, 20),
    ]));

  test('parses several relative paths', () =>
    parsingIsEqualish(
      'M 10,10 30,10 20,30 z M 20,20 50,10 40,30 z',
      'm 10,10 20,0 -10,20 z m 10,10, 30,-10, -10,20 z',
    ));

  test('parses an absolute move-to with several points', () =>
    parsingMatches('M 10,10 30,10 20,30 z', [
      straightCubic(10, 10, 30, 10),
      straightCubic(30, 10, 20, 30),
      straightCubic(20, 30, 10, 10),
    ]));

  test('parses a relative move-to with several points like an absolute one', () =>
    parsingIsEqualish('M 10,10 30,10 20,30 z', 'm 10,10 20,0 -10,20 z'));

  test('parses an absolute line', () =>
    parsingMatches('M 10,10 L 30,10 20,30 z', [
      straightCubic(10, 10, 30, 10),
      straightCubic(30, 10, 20, 30),
      straightCubic(20, 30, 10, 10),
    ]));

  test('parses a relative line like an absolute one', () =>
    parsingIsEqualish('M 10,10 L 30,10 20,30 z', 'm 10,10 l 20,0 l -10,20 z'));

  test('parses negative floating point parameters', () =>
    parsingMatches('M-10.5555,10.5L-30.5555,10.5L-20.5555,30z', [
      straightCubic(-10.5555, 10.5, -30.5555, 10.5),
      straightCubic(-30.5555, 10.5, -20.5555, 30),
      straightCubic(-20.5555, 30, -10.5555, 10.5),
    ]));

  test('parses horizontal lines like lines', () => {
    parsingIsEqualish('M 10,10 L 30,10 L 40,10 z', 'M 10,10 H 30 40 z');
    parsingIsEqualish('M 10,10 L 30,10 L 40,10 z', 'M 10,10 h 20 10 z');
  });

  test('parses vertical lines like lines', () => {
    parsingIsEqualish('M 10,10 L 10,30 L 10,40 z', 'M 10,10 V 30 40 z');
    parsingIsEqualish('M 10,10 L 10,30 L 10,40 z', 'M 10,10 v 20 10 z');
  });

  test('parses absolute cubics', () =>
    parsingMatches('M 0,0 C 10,10 30,20, 10,10 C 23, 23 48,40 20,20 z', [
      [0, 0, 10, 10, 30, 20, 10, 10],
      [10, 10, 23, 23, 48, 40, 20, 20],
      straightCubic(20, 20, 0, 0),
    ]));

  test('parses relative cubics like absolute ones', () =>
    parsingIsEqualish(
      'M 0,0 C 10,10 30,20, 10,10 C 23, 23 48,40 20,20 z',
      'M 0,0 c 10,10 30,20, 10,10 c 13, 13 38,30 10,10 z',
    ));

  test('parses smooth curves like cubics', () => {
    parsingIsEqualish(
      'M 0,0 C 0,10 10,10 10,0 S 20,-10 20,0 z',
      'M 0,0 C 0,10 10,10 10,0 C 10,-10 20,-10 20,0 z',
    );
    parsingIsEqualish(
      'M 0,0 C 0,10 10,10 10,0 S 20,-10 20,0 z',
      'M 0,0 C 0,10 10,10 10,0 s 10,-10 10,0 z',
    );
  });

  test('a smooth curve with no curve before starts at the current position', () =>
    parsingMatches('M 10,10 S 20,-10, 20,0', [[10, 10, 10, 10, 20, -10, 20, 0]]));

  test('parses quadratic curves as the cubics that draw them exactly', () => {
    // The cubic's controls are 2/3 of the way from each end to the quadratic's control.
    parsingMatches('M 0,0 Q 5,10 10,0 z', [
      [0, 0, 10 / 3, 20 / 3, 20 / 3, 20 / 3, 10, 0],
      straightCubic(10, 0, 0, 0),
    ]);
    parsingIsEqualish('M 10,10 Q 15,20 20,10 z', 'M 10,10 q 5, 10 10,0 z');
  });

  test('parses smooth quadratic curves as quadratics with the control reflected', () => {
    parsingIsEqualish('M 0,0 Q 5,10 10,0 T 20,0 z', 'M 0,0 Q 5,10 10,0 Q 15,-10 20,0 z');
    parsingIsEqualish('M 0,0 Q 5,10 10,0 T 20,0 z', 'M 0,0 Q 5,10 10,0 t 10,0 z');
    parsingIsEqualish(
      'M 0,0 Q 5,10 10,0 T 20,0 T 30,0',
      'M 0,0 Q 5,10 10,0 Q 15,-10 20,0 Q 25,10 30,0',
    );
  });

  test('a smooth quadratic curve with no curve before has its control at the current position', () =>
    parsingMatches('M 10,10 T 20,0', [[10, 10, 10, 10, 40 / 3, 20 / 3, 20, 0]]));

  test('a quadratic curve follows the quadratic Bézier formula', () => {
    const [cubic] = parseCubics('M 2,3 Q 9,-4 12,7');
    for (let t = 0; t <= 1; t += 0.125) {
      const u = 1 - t;
      const x = u * u * 2 + 2 * t * u * 9 + t * t * 12;
      const y = u * u * 3 + 2 * t * u * -4 + t * t * 7;
      assertPointsEqualish({ x, y }, pointOnCurve(cubic!, t));
    }
  });

  test('parses an absolute arc into cubics of 45 degrees', () => {
    // A quarter of a pie chart, around (300, 200)
    const cubics = parseCubics('M300,200 v-150 A150,150 0 0,0 150,200 z');
    expect(cubics).toHaveLength(4);
    assertCubicsEqualish(straightCubic(300, 200, 300, 50), cubics[0]!);
    // The arc goes from straight up (-90 degrees) to straight left (-180), in two halves.
    const angle = (-135 * Math.PI) / 180;
    const half = { x: 300 + 150 * Math.cos(angle), y: 200 + 150 * Math.sin(angle) };
    assertPointsEqualish({ x: 300, y: 50 }, { x: cubics[1]![0], y: cubics[1]![1] });
    assertPointsEqualish(half, { x: cubics[1]![6], y: cubics[1]![7] });
    assertPointsEqualish({ x: 150, y: 200 }, { x: cubics[2]![6], y: cubics[2]![7] });
    for (const arc of cubics.slice(1, 3)) {
      for (let t = 0; t <= 1; t += 0.125) {
        const p = pointOnCurve(arc, t);
        expect(Math.abs(Math.hypot(p.x - 300, p.y - 200) - 150)).toBeLessThan(0.01);
      }
    }
    assertCubicsEqualish(straightCubic(150, 200, 300, 200), cubics[3]!);
  });

  test.each([
    'M 10,0 A 10,10 0 0 1 20,10',
    'M 16,0 A 4,4 0 0 1 20,4',
    // atan2 makes this one's sweep a rounding error over 90 degrees.
    'M -11,-18.5 A 1.5,1.5 0 0 1 -12.5,-20',
    'M 0,24 A 24,24 0 0 0 24,0',
  ])('a quarter circle takes 2 cubics: %s', (path) => {
    expect(parseCubics(path)).toHaveLength(2);
  });

  test('a T or S after Z has its control at the current point', () => {
    // After Z the current point is the start, (0, 0).
    assertCubicsEqualish(
      [0, 0, 0, 0, 20 / 3, 0, 20, 0],
      parseCubics('M 0,0 Q 5,10 10,0 Z T 20,0').at(-1)!,
    );
    assertCubicsEqualish(
      [0, 0, 0, 0, 20, -10, 20, 0],
      parseCubics('M 0,0 C 0,10 10,10 10,0 Z S 20,-10 20,0').at(-1)!,
    );
  });

  test('parses a relative arc like an absolute one', () =>
    parsingIsEqualish(
      'M300,200 v-150 A150,150 0 0,0 150,200 z',
      'M300,200 v-150 a150,150 0 0,0 -150,150 z',
    ));

  test("parses Material Symbols' favorite", () => {
    // https://fonts.google.com/icons?selected=Material+Symbols+Outlined:favorite:FILL
    const path = [
      'm 480 -120',
      'l -58 -52',
      'q -101 -91 -167 -157',
      'T 150 -447.5',
      'Q 111 -500 95.5 -544',
      'T 80 -634 q 0 -94 63 -157',
      't 157 -63',
      'q 52 0 99 22',
      't 81 62',
      'q 34 -40 81 -62',
      't 99 -22',
      'q 94 0 157 63',
      't 63 157',
      'q 0 46 -15.5 90',
      'T 810 -447.5',
      'Q 771 -395 705 -329',
      'T 538 -172',
      'l -58 52',
      'Z',
    ].join('\n');
    expect(parseCubics(path)).toHaveLength(19);
  });

  test("parses Material Symbols' eco", () => {
    // https://fonts.google.com/icons?selected=Material+Symbols+Outlined:eco:FILL
    const path = [
      'M 450 -80',
      'q -33 0 -66.5 -7.5',
      'T 315 -109',
      'q 12 -121 70 -226',
      't 149 -185',
      'q -110 56 -190.5 148',
      'T 231 -162',
      'q -4 -3 -7.5 -6.5',
      'L 216 -176',
      'q -47 -47 -71.5 -105',
      'T 120 -402',
      'q 0 -68 27 -130',
      't 75 -110',
      'q 81 -81 210 -105.5',
      't 362 -4.5',
      'q 18 239 -6 364.5',
      'T 684 -182',
      'q -49 49 -109.5 75.5',
      'T 450 -80',
      'Z',
    ].join('\n');
    expect(parseCubics(path)).toHaveLength(19);
  });

  test.each([
    // Numbers run together, as minified icons have them
    'M12 21.35l-1.45-1.32L5 15z',
    // An exponent reads as a command letter, which the original doesn't know.
    'M 0,0 L 1e-5,10 L 10,10 z',
    // Too few parameters for a command
    'M 0,0 L 10 z',
  ])('throws for %j, as the original does', (path) => {
    expect(() => parseCubics(path)).toThrow();
  });
});

describe('featuresFromSvgPath', () => {
  test('makes a closed polygon of the first shape only', () => {
    const features = featuresFromSvgPath('M 10,10 30,10 20,30 z M 20,20 50,10 40,30 z');
    const anchors = features.flatMap((f) => f.cubics.map((c) => [c[0], c[1]]));
    // The second shape, from (20, 20), is left out.
    expect(anchors.some(([x, y]) => x === 50 && y === 10)).toBe(false);
    expect(features.filter((f) => f.type === 'corner')).toHaveLength(3);
  });

  const kinds = (path: string) =>
    featuresFromSvgPath(path)
      .map((f) => (f.type === 'edge' ? 'E' : f.convex ? 'x' : 'o'))
      .join('');

  test('a square drawn with curves is the square drawn with lines', () => {
    // Some tools write straight lines as curves, with the controls on the anchors.
    const curves = featuresFromSvgPath('M 0,0 C 0,0 10,0 10,0 C 10,0 10,10 10,10 L 0,10 Z');
    const lines = featuresFromSvgPath('M 0,0 L 10,0 L 10,10 L 0,10 Z');
    expect(kinds('M 0,0 L 10,0 L 10,10 L 0,10 Z')).toBe('ExExExEx');
    const anchors = (features: typeof lines) =>
      features.map((f) => [
        f.type,
        f.cubics[0]![0],
        f.cubics[0]![1],
        f.cubics.at(-1)![6],
        f.cubics.at(-1)![7],
      ]);
    expect(anchors(curves)).toEqual(anchors(lines));
    expect(kinds('M 0,0 C 0,0 10,0 10,0 C 10,0 10,10 10,10 L 0,10 Z')).toBe('ExExExEx');
  });

  test('a path that starts with an empty segment keeps its first corner', () => {
    expect(kinds('M 0,0 L 0,0 L 10,0 L 10,10 L 0,10 Z')).toBe('ExExExEx');
  });

  test.each([
    // A concave L, and an arrow head with its notch
    [[2, 2, 6, 2, 6, 3, 3, 3, 3, 6, 2, 6]],
    [[0, -1, 1, 1, 0, 0.4, -1, 1]],
  ])("a polygon's corners are convex or concave as its vertices are: %j", (vertices) => {
    const path = `M ${vertices.slice(0, 2)} L ${vertices.slice(2).join(' ')} Z`;
    const at = (f: PolygonFeature) => `${f.cubics[0]![0]},${f.cubics[0]![1]}`;
    const flags = (features: readonly PolygonFeature[]) =>
      new Map(
        features
          .filter((f) => f.type === 'corner')
          .map((f) => [at(f), f.type === 'corner' && f.convex]),
      );
    expect(flags(featuresFromSvgPath(path))).toEqual(flags(roundedPolygon({ vertices }).features));
  });

  test("a polygon's sharp corners are convex, whichever way the path goes", () => {
    for (const path of ['M 0,0 L 10,0 L 10,10 L 0,10 z', 'M 0,0 L 0,10 L 10,10 L 10,0 z']) {
      const corners = featuresFromSvgPath(path).filter((f) => f.type === 'corner');
      expect(corners.map((f) => f.type === 'corner' && f.convex)).toEqual([true, true, true, true]);
    }
  });

  test("its corners map to another polygon's in a morph", () => {
    const svgSquare = polygonFromFeatures(featuresFromSvgPath('M 0,0 L 10,0 L 10,10 L 0,10 z'));
    const square = roundedPolygon({ vertices: [0, 0, 10, 0, 10, 10, 0, 10] });
    const features = (p: RoundedPolygon) =>
      MeasuredPolygon.measurePolygon(new LengthMeasurer(), normalizePolygon(p)).features;
    // Four corners mapped to four, rather than the identity a morph falls back to
    expect(doMapping(features(svgSquare), features(square))).toHaveLength(4);
  });

  test('turns an anticlockwise path clockwise', () => {
    // The original's orientation check: a negative sum of (x1 - x0)(y1 + y0) is clockwise.
    const signedArea = (path: string) =>
      polygonFromFeatures(featuresFromSvgPath(path)).cubics.reduce(
        (sum, c) => sum + (c[6] - c[0]) * (c[7] + c[1]),
        0,
      );
    expect(signedArea('M 0,0 L 10,0 L 10,10 L 0,10 z')).toBeLessThan(0);
    expect(signedArea('M 0,0 L 0,10 L 10,10 L 10,0 z')).toBeLessThan(0);
  });
});
