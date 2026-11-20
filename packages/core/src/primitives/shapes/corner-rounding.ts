// How much, and how smoothly, a polygon's vertex is rounded.
//
// Ported from androidx graphics-shapes, CornerRounding.kt, at androidx 079e2e3. Copyright 2022 The
// Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; a plain object with optional fields replaces the class and its `Unrounded`.

/**
 * How a vertex of a shape is rounded. Each corner is either:
 *
 * - unrounded, with a radius of 0 and no smoothing (the default: `{}`);
 * - rounded with only a circular arc, with a smoothing of 0: the corner follows an approximate
 *   circular arc between the edges to the vertices on either side;
 * - rounded with three curves: an inner circular arc and two symmetric flanking curves, which set
 *   the curvature from the inner curve to the edges.
 */
export interface CornerRounding {
  /**
   * The radius of the circle that forms the inner rounding arc of the corner. 0, the default, is a
   * sharp corner. The radius is an absolute size relative to the shape's own: a shape in canonical
   * form, such as the (-1, -1) to (1, 1) of a polygon made from a number of vertices, takes a
   * radius on that scale. It scales with the shape when the shape is transformed.
   */
  radius?: number;
  /**
   * How far the curve extends from the inner circular arc toward the edges, from 0 to 1. 0, the
   * default, rounds the corner with only the circular arc, with no flanking curves; 1 leaves no
   * circular arc in the middle, and the flanking curves on either side meet there.
   */
  smoothing?: number;
}
