// Writes a polygon's features as text and reads them back.
//
// Ported from androidx graphics-shapes, FeatureSerializer.kt, at androidx 079e2e3. Copyright 2024
// The Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported
// to TypeScript; `FeatureSerializer.serialize` and `parse` are `serializeFeatures` and
// `parseFeatures`, numbers are read with Kotlin's rules (`parseFloatStrict`) but kept at 64 bits,
// and the debug logging is left out. Deviation from the original: numbers are written in full
// 64-bit precision and never with an exponent. The original writes Kotlin's Float strings, whose
// exponents (`1.0E-5`) `parse` takes for feature tags, and trims an exponent's trailing zeros
// (`1.0E10` becomes `1.0E1`).

import { parseFloatStrict } from '../../utils/number';
import type { Cubic } from './cubic';
import { corner, edge, type PolygonFeature } from './features';

const SEPARATOR = ',';
const CONVEX_CORNER_CHAR = 'x';
const CONCAVE_CORNER_CHAR = 'o';
const EDGE_CHAR = 'n';
const FEATURE_TAG_ARRAY = [EDGE_CHAR, CONVEX_CORNER_CHAR, CONCAVE_CORNER_CHAR];

/**
 * Writes features as text, in version 1 of the feature format, for `parseFeatures` to read back:
 * faster than reading an SVG path again. Read a path once with `featuresFromSvgPath`, keep this
 * text, and in production make the polygon from `parseFeatures(text)`.
 *
 * The format: `V` and the version number (`V1`), then each feature, as a tag (`n` for an edge, `x`
 * for a convex corner, `o` for a concave one) followed by its cubics' points as comma-separated x,
 * y coordinates. A cubic after the first leaves out its first anchor, which is the previous one's
 * last. An edge with the cubic (0, 0), (1, 1), (2, 2), (3, 3) and a convex corner with (0, 0),
 * (1, 1), (2, 2), (3, 3) and (3, 3), (4, 4), (5, 5), (6, 6) are `V1n0,0,1,1,2,2,3,3x0,0,1,1,2,2,3,3,
 * 4,4,5,5,6,6`.
 */
export function serializeFeatures(features: readonly PolygonFeature[]): string {
  return 'V1' + features.map(serializeFeature).join('');
}

/**
 * Reads features that `serializeFeatures` wrote (or the original's `FeatureSerializer`). A tag
 * version 1 doesn't know reads as an edge, and a missing or unknown version reads as version 1.
 *
 * @throws If there are no feature tags, a feature is short of the numbers for its cubics, or a
 *   coordinate isn't a number.
 */
export function parseFeatures(serializedFeatures: string): PolygonFeature[] {
  const version = /^\s*V(\d+)/.exec(serializedFeatures);
  // Without a version, or with another one, it reads as version 1.
  const tagsSearchStart = version ? version[0].length : 0;

  const tagPattern = /[a-zA-Z]/g;
  tagPattern.lastIndex = tagsSearchStart;
  let currentMatch = tagPattern.exec(serializedFeatures);
  if (!currentMatch) {
    throw new Error(
      `Could not find any feature tags. Please mark all cubic bezier curve points belonging to a ` +
        `feature with one of {${FEATURE_TAG_ARRAY.join(', ')}} for V1, e.g. 'n1,1,2,2,3,3,4,4' for ` +
        `an edge (n) with anchor 0 (1,1), control 0 (2,2), control 1 (3,3) and anchor 1 (4,4).`,
    );
  }

  const features: PolygonFeature[] = [];
  while (currentMatch) {
    const featureStart = currentMatch.index;
    currentMatch = tagPattern.exec(serializedFeatures);
    const featureEnd = currentMatch ? currentMatch.index : serializedFeatures.length;
    features.push(parseFeature(serializedFeatures, featureStart, featureEnd));
  }
  return features;
}

function serializeFeature(feature: PolygonFeature): string {
  const tag =
    feature.type === 'edge' ? EDGE_CHAR : feature.convex ? CONVEX_CORNER_CHAR : CONCAVE_CORNER_CHAR;
  return tag + serializeCubics(feature.cubics);
}

function serializeCubics(cubics: readonly Cubic[]): string {
  // The cubics of a polygon are continuous, so each one's end coordinates are left out, as the
  // next one's start, the way SVG path commands do.
  let text = '';
  for (const cubic of cubics) {
    // As Kotlin's joinToString(limit = 6, truncated = ""): six coordinates, each followed by the
    // separator
    for (const value of cubic.slice(0, 6)) text += formatNumber(value) + SEPARATOR;
  }
  const last = cubics[cubics.length - 1]!;
  return text + formatNumber(last[6]) + SEPARATOR + formatNumber(last[7]);
}

/**
 * The shortest text that reads back as the same 64-bit number, without an exponent, which
 * `parseFeatures` would take for a tag.
 */
function formatNumber(value: number): string {
  const text = String(value);
  const exponential = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(text);
  if (!exponential) return text;
  const [, sign, lead, rest = '', exponentText] = exponential as unknown as string[];
  const digits = lead! + rest;
  const exponent = Number(exponentText);
  if (exponent < 0) return `${sign}0.${'0'.repeat(-exponent - 1)}${digits}`;
  // JavaScript writes an exponent only from 1e21, past the 17 digits a number has: an integer.
  return sign + digits.padEnd(exponent + 1, '0');
}

function parseFeature(serialized: string, startIndex: number, endIndex: number): PolygonFeature {
  const cubics = parseCubics(serialized, startIndex + 1, endIndex);
  switch (serialized[startIndex]) {
    case CONVEX_CORNER_CHAR:
      return corner(cubics, true);
    case CONCAVE_CORNER_CHAR:
      return corner(cubics, false);
    default:
      // An edge, or a tag version 1 doesn't know, which reads as an edge
      return edge(cubics);
  }
}

function parseCubics(serialized: string, startIndex: number, endIndex: number): Cubic[] {
  // A low-level walk, as the original's, which avoids allocations since parsing can happen every
  // frame: windows of 8 numbers, 6 apart, each one cubic.
  const windowSize = 8;
  const windowStep = 6;

  let pointStart = startIndex;
  let pointEnd = startIndex;
  let pointCount = 0;
  let points: number[] = Array.from({ length: windowSize }, () => 0);
  const cubics: Cubic[] = [];

  while (pointEnd < endIndex) {
    // The number goes on: move to the next character.
    if (serialized[pointEnd] !== SEPARATOR) {
      pointEnd++;
      continue;
    }

    // A number ended: add it to the points and count it.
    points[pointCount++] = parseFloatStrict(serialized.substring(pointStart, pointEnd));
    pointStart = pointEnd + 1;

    // A full window makes a cubic; the next window starts at its end.
    if (pointCount === windowSize) {
      cubics.push(points as unknown as Cubic);
      const nextStartX = points[windowSize - 2]!;
      const nextStartY = points[windowSize - 1]!;
      points = Array.from({ length: windowSize }, () => 0);
      points[0] = nextStartX;
      points[1] = nextStartY;
      pointCount -= windowStep;
    }

    pointEnd++;
  }

  if (pointCount + 1 !== windowSize) {
    let neededPoints: number;
    try {
      parseFloatStrict(serialized.substring(pointStart, pointEnd));
      neededPoints = windowSize - (pointCount + 1);
    } catch {
      neededPoints = windowSize - pointCount;
    }
    throw new Error(
      `Received a feature with an insufficient amount of numbers for substring ` +
        `'${serialized.substring(startIndex - 1, endIndex)}'. Wanted to create ` +
        `${cubics.length + 1} continuous cubic bezier curves for this feature, but the last one ` +
        `is missing ${neededPoints} more numbers separated by '${SEPARATOR}'.`,
    );
  }

  // The last point, and the last cubic
  points[windowSize - 1] = parseFloatStrict(serialized.substring(pointStart, pointEnd));
  cubics.push(points as unknown as Cubic);
  return cubics;
}
