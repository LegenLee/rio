// Cubics as an SVG path, for a `<path>`'s `d` or CSS's `path()`.
//
// Rio's counterpart of the path Compose Material3 builds from cubics (pathFromCubics in
// internal/ShapeUtil.kt, at androidx 079e2e3; Copyright 2024 The Android Open Source Project,
// licensed under the Apache License, Version 2.0), without its rotation to a start angle, which
// the loading indicator doesn't use.

import type { Cubic } from './cubic';

/**
 * The cubics as the data of an SVG path, closed: a move to the first anchor, then a curve to each
 * cubic's end. Draw a polygon with `cubicsPath(polygon.cubics)`, or a morph with
 * `cubicsPath(morph.cubics(progress))`. Empty for no cubics.
 */
export function cubicsPath(cubics: readonly Cubic[]): string {
  if (cubics.length === 0) return '';
  let d = `M${cubics[0]![0]} ${cubics[0]![1]}`;
  for (const c of cubics) d += `C${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6]} ${c[7]}`;
  return d + 'Z';
}
