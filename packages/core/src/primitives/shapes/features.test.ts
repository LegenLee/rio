// Ported from androidx graphics-shapes, commonTest's FeaturesTest.kt, at androidx 079e2e3.
// Copyright 2024 The Android Open Source Project, licensed under the Apache License, Version 2.0.
// Changed: ported to TypeScript and Vitest; `transformFeature` and `reverseFeature` are new tests.

import { describe, expect, test } from 'vitest';
import { straightCubic } from './cubic';
import {
  corner,
  cornerFeature,
  edge,
  edgeFeature,
  ignorableFeature,
  reverseFeature,
  transformFeature,
} from './features';
import { assertFeaturesEqualish, translateTransform } from './test-utils';

describe('features', () => {
  test("can't build empty features", () => {
    expect(() => cornerFeature([], true)).toThrow();
    expect(() => cornerFeature([], false)).toThrow();
    expect(() => ignorableFeature([])).toThrow();
  });

  test("can't build non-continuous features", () => {
    const cubic1 = straightCubic(0, 0, 1, 1);
    const cubic2 = straightCubic(10, 10, 11, 11);
    expect(() => cornerFeature([cubic1, cubic2], true)).toThrow();
    expect(() => cornerFeature([cubic1, cubic2], false)).toThrow();
    expect(() => ignorableFeature([cubic1, cubic2])).toThrow();
  });

  test('builds a concave corner', () => {
    const cubic = straightCubic(0, 0, 1, 0);
    assertFeaturesEqualish(corner([cubic], false), cornerFeature([cubic], false));
  });

  test('builds a convex corner', () => {
    const cubic = straightCubic(0, 0, 1, 0);
    assertFeaturesEqualish(corner([cubic], true), cornerFeature([cubic], true));
  });

  test('builds an edge', () => {
    const cubic = straightCubic(0, 0, 1, 0);
    assertFeaturesEqualish(edge([cubic]), edgeFeature(cubic));
  });

  test('builds an ignorable feature as an edge', () => {
    const cubic = straightCubic(0, 0, 1, 0);
    assertFeaturesEqualish(edge([cubic]), ignorableFeature([cubic]));
  });

  test('transforms the cubics and keeps the kind', () => {
    const feature = corner([straightCubic(0, 0, 1, 0)], false);
    const moved = transformFeature(feature, translateTransform(1, 2));
    assertFeaturesEqualish(corner([straightCubic(1, 2, 2, 2)], false), moved);
  });

  test('reverses the cubics, and flips a corner', () => {
    const feature = corner([straightCubic(0, 0, 1, 0), straightCubic(1, 0, 1, 1)], true);
    assertFeaturesEqualish(
      corner([straightCubic(1, 1, 1, 0), straightCubic(1, 0, 0, 0)], false),
      reverseFeature(feature),
    );
    assertFeaturesEqualish(
      edge([straightCubic(1, 0, 0, 0)]),
      reverseFeature(edge([straightCubic(0, 0, 1, 0)])),
    );
  });
});
