// Ported from androidx graphics-shapes, commonTest's FloatMappingTest.kt, at androidx 079e2e3.
// Copyright 2023 The Android Open Source Project, licensed under the Apache License, Version 2.0.
// Changed: ported to TypeScript and Vitest.

import { describe, expect, test } from 'vitest';
import { DoubleMapper } from './float-mapping';
import { assertEqualish } from './test-utils';

function validateMapping(mapper: DoubleMapper, expectedFunction: (x: number) => number) {
  for (let i = 0; i <= 9999; i++) {
    const source = i / 10000;
    const target = expectedFunction(source);
    assertEqualish(target, mapper.map(source), `map(${source})`);
    assertEqualish(source, mapper.mapBack(target), `mapBack(${target})`);
  }
}

describe('DoubleMapper', () => {
  test('identity', () => validateMapping(DoubleMapper.Identity, (x) => x));

  test('simple mapping', () =>
    // Maps the first half of the source to the first quarter of the target.
    validateMapping(new DoubleMapper([0, 0], [0.5, 0.25]), (x) =>
      x < 0.5 ? x / 2 : (3 * x - 1) / 2,
    ));

  test('the target wraps', () =>
    // The mapping adds 0.5.
    validateMapping(new DoubleMapper([0, 0.5], [0.1, 0.6]), (x) => (x + 0.5) % 1));

  test('the source wraps', () =>
    // Values on the source wrap (this is still "+ 0.5").
    validateMapping(new DoubleMapper([0.5, 0], [0.1, 0.6]), (x) => (x + 0.5) % 1));

  test('both wrap', () =>
    // Just the identity
    validateMapping(
      new DoubleMapper([0.5, 0.5], [0.75, 0.75], [0.1, 0.1], [0.49, 0.49]),
      (x) => x,
    ));

  test('several points', () =>
    validateMapping(new DoubleMapper([0.4, 0.2], [0.5, 0.22], [0, 0.8]), (x) => {
      if (x < 0.4) return (0.8 + x) % 1;
      if (x < 0.5) return 0.2 + (x - 0.4) / 5;
      // Maps a change of 0.5 in the source to a change of 0.58 in the target, hence the 1.16
      return 0.22 + (x - 0.5) * 1.16;
    }));

  test('throws when the target wraps twice', () => {
    expect(() => new DoubleMapper([0, 0], [0.3, 0.6], [0.6, 0.3], [0.9, 0.9])).toThrow();
  });

  test('throws when the source wraps twice', () => {
    expect(() => new DoubleMapper([0, 0], [0.6, 0.3], [0.3, 0.6], [0.9, 0.9])).toThrow();
  });
});
