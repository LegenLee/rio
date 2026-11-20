// Fixes polygons that would otherwise break morphs. Not exported from the package, as in the
// original, until it covers every check.
//
// Ported from androidx graphics-shapes, PolygonValidation.kt, at androidx 079e2e3. Copyright 2024
// The Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported
// to TypeScript; the `PolygonValidator` class is a function, and the debug logging is left out.

import { reverseFeature, type PolygonFeature } from './features';
import { Point } from './point';
import { polygonOf, type RoundedPolygon } from './polygon';

/**
 * A polygon a morph can take. Morphs assume closed geometry, clockwise points, no
 * self-intersections, no holes, and a single polygon; so far this fixes the orientation: it returns
 * the polygon turned clockwise, or the same polygon if it already was.
 */
export function fixPolygon(polygon: RoundedPolygon): RoundedPolygon {
  return isCWOriented(polygon) ? polygon : fixCWOrientation(polygon);
}

function isCWOriented(polygon: RoundedPolygon): boolean {
  let signedArea = 0;
  for (const cubic of polygon.cubics) {
    signedArea += (cubic[6] - cubic[0]) * (cubic[7] + cubic[1]);
  }
  return signedArea < 0;
}

function fixCWOrientation(polygon: RoundedPolygon): RoundedPolygon {
  const { features } = polygon;
  // The first feature stays first, to stay a corner.
  const reversed: PolygonFeature[] = [reverseFeature(features[0]!)];
  for (let i = features.length - 1; i >= 1; i--) reversed.push(reverseFeature(features[i]!));
  return polygonOf(reversed, new Point(polygon.center.x, polygon.center.y));
}
