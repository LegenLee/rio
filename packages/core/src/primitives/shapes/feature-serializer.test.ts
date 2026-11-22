// Ported from androidx graphics-shapes, commonTest's FeatureSerializerTest.kt, at androidx
// 079e2e3. Copyright 2024 The Android Open Source Project, licensed under the Apache License,
// Version 2.0. Changed: ported to TypeScript and Vitest; the tests the original skips on JS, for
// float rounding, pass here. The tests for full precision and exponents are new.

import { describe, expect, test } from 'vitest';
import type { Cubic } from './cubic';
import { parseFeatures, serializeFeatures } from './feature-serializer';
import { corner, edge, type PolygonFeature } from './features';
import { assertFeaturesEqualish } from './test-utils';

const c = (...points: number[]) => points as unknown as Cubic;

function assertFeatureListsEqualish(expected: PolygonFeature[], actual: PolygonFeature[]) {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((feature, i) => assertFeaturesEqualish(feature, actual[i]!, `feature ${i}`));
}

describe('parseFeatures', () => {
  test.each([
    ['empty', ''],
    ['blank', '                    '],
    ['only a version, no tags', 'V1                    '],
    ['too few coordinates: none', 'V1c'],
    ['too few coordinates: 4', 'V1o1,1,2,2'],
    ['too few coordinates: 12', 'V1o1,1,2,2,3,3,4,4,5,5,6,6'],
    ['too few coordinates, then a feature', 'V1o1,1,2,2,3,3,4,4n4,4'],
    ['the wrong separator', 'V1o1 1 2 2 3 3 4 4'],
    ['words for numbers', 'V1o1,1,two,2,3,three,4,4'],
    ['the tag after the coordinates', 'V11,1,2,2,3,4,4,4o'],
    ['a comma between tag and coordinates', 'V1o,1,1,2,2,3,4,4,4'],
  ])('throws for %s', (_, serialized) => {
    expect(() => parseFeatures(serialized)).toThrow();
  });

  test('reads an unknown feature tag as an edge', () =>
    assertFeaturesEqualish(
      edge([c(1, 1, 2, 2, 3, 3, 4, 4)]),
      parseFeatures('V1 h1,1,2,2,3,3,4,4')[0]!,
    ));

  test('reads an unknown version as version 1', () =>
    assertFeatureListsEqualish(
      parseFeatures('V1 n1,1,2,2,3,3,4,4x4,4,5,5,6,6,7,7o7,7,8,8,9,9,10,10'),
      parseFeatures('V999 n1,1,2,2,3,3,4,4x4,4,5,5,6,6,7,7o7,7,8,8,9,9,10,10'),
    ));

  test('reads a missing version as version 1', () =>
    assertFeatureListsEqualish(
      parseFeatures('V1 n1,1,2,2,3,3,4,4x4,4,5,5,6,6,7,7o7,7,8,8,9,9,10,10'),
      parseFeatures('n1,1,2,2,3,3,4,4x4,4,5,5,6,6,7,7o7,7,8,8,9,9,10,10'),
    ));

  test('ignores extra spaces', () =>
    assertFeaturesEqualish(
      edge([c(1, 1, 2, 2, 3, 3, 4, 4)]),
      parseFeatures('V1       n  1 ,  1  ,2  ,  2 , 3  ,  3  , 4 , 4   ')[0]!,
    ));

  test.each([
    ['an edge', 'V1 n1,1,2,2,3,3,4,4', edge([c(1, 1, 2, 2, 3, 3, 4, 4)])],
    [
      'an edge with decimals',
      'V1n1.1,1.1,2.12,2.12,3.123,3.123,4.1234,4.1234',
      edge([c(1.1, 1.1, 2.12, 2.12, 3.123, 3.123, 4.1234, 4.1234)]),
    ],
    ['a convex corner', 'V1x1,1,2,2,3,3,4,4', corner([c(1, 1, 2, 2, 3, 3, 4, 4)], true)],
    ['a concave corner', 'V1o1,1,2,2,3,3,4,4', corner([c(1, 1, 2, 2, 3, 3, 4, 4)], false)],
    [
      'an edge of several cubics',
      'V1n1,1,2,2,3,3,4,4,5,5,6,6,7,7',
      edge([c(1, 1, 2, 2, 3, 3, 4, 4), c(4, 4, 5, 5, 6, 6, 7, 7)]),
    ],
    [
      'a convex corner of several cubics',
      'V1x1,1,2,2,3,3,4,4,5,5,6,6,7,7',
      corner([c(1, 1, 2, 2, 3, 3, 4, 4), c(4, 4, 5, 5, 6, 6, 7, 7)], true),
    ],
    [
      'a concave corner of several cubics',
      'V1o1,1,2,2,3,3,4,4,5,5,6,6,7,7',
      corner([c(1, 1, 2, 2, 3, 3, 4, 4), c(4, 4, 5, 5, 6, 6, 7, 7)], false),
    ],
    [
      'a convex corner of a lot of cubics',
      'V1x1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16',
      corner(
        [
          c(1, 1, 2, 2, 3, 3, 4, 4),
          c(4, 4, 5, 5, 6, 6, 7, 7),
          c(7, 7, 8, 8, 9, 9, 10, 10),
          c(10, 10, 11, 11, 12, 12, 13, 13),
          c(13, 13, 14, 14, 15, 15, 16, 16),
        ],
        true,
      ),
    ],
  ])('reads %s', (_, serialized, expected) =>
    assertFeaturesEqualish(expected, parseFeatures(serialized)[0]!),
  );

  test('reads several features of several cubics', () =>
    assertFeatureListsEqualish(
      [
        edge([c(1, 1, 2, 2, 3, 3, 4, 4)]),
        corner([c(4, 4, 5, 5, 6, 6, 7, 7)], true),
        corner([c(7, 7, 8, 8, 9, 9, 10, 10)], false),
      ],
      parseFeatures('V1n1,1,2,2,3,3,4,4x4,4,5,5,6,6,7,7o7,7,8,8,9,9,10,10'),
    ));
});

describe('serializeFeatures', () => {
  test.each([
    'V1n1,1,2,2,3,3,4,4',
    'V1n1.1,1.1,2.12,2.12,3.123,3.123,4.1234,4.1234',
    'V1x1,1,2,2,3,3,4,4',
    'V1o1,1,2,2,3,3,4,4',
    'V1n1,1,2,2,3,3,4,4,5,5,6,6,7,7',
    'V1x1,1,2,2,3,3,4,4,5,5,6,6,7,7',
    'V1o1,1,2,2,3,3,4,4,5,5,6,6,7,7',
    'V1x1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16',
    'V1n1,1,2,2,3,3,4,4x4,4,5,5,6,6,7,7o7,7,8,8,9,9,10,10',
  ])('writes back what it read: %s', (serialized) => {
    expect(serializeFeatures(parseFeatures(serialized))).toBe(serialized);
  });

  test('keeps every bit of a number', () => {
    const features = [edge([c(0.1 + 0.2, 1 / 3, -2 / 7, Math.PI, 0, 0, 1e-7, 123456.789)])];
    expect(parseFeatures(serializeFeatures(features))).toEqual(features);
  });

  test('writes tiny and huge numbers without an exponent, so they read back', () => {
    const features = [edge([c(1e-7, -2.5e-12, 0, 0, 0, 0, 1e21, -3e22)])];
    const serialized = serializeFeatures(features);
    expect(serialized).not.toMatch(/e/i);
    expect(serialized).toBe(
      'V1n0.0000001,-0.0000000000025,0,0,0,0,1000000000000000000000,-30000000000000000000000',
    );
    expect(parseFeatures(serialized)).toEqual(features);
  });
});
