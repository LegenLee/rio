// Animates an element's corner radii with a spring whenever their targets change, for M3E's shape
// morphing (a button's corners change when pressed or selected). See
// `@rio-m3e/styles/base/shape-morph.css` for the CSS side: the stylesheet declares the target
// radius for each state in `--rio-shape-morph-target`, or, for shapes whose sides differ (a
// button at the end of a connected button group), per side in `--rio-shape-morph-start-target`
// and `--rio-shape-morph-end-target`. Sides follow the writing direction, so right-to-left
// layouts mirror the shape.

import { attachSpringProperty } from '../spring-property/spring-property';

export interface ShapeMorphOptions {
  /** The motion token whose spring drives the morph. Defaults to `'fast-spatial'`. */
  token?: string;
  /** Attributes whose changes can move the target. Defaults to Rio's state attributes. */
  watch?: string[];
}

export interface ShapeMorphHandle {
  detach(): void;
}

const CORNERS = {
  start: ['border-start-start-radius', 'border-end-start-radius'],
  end: ['border-start-end-radius', 'border-end-end-radius'],
} as const;

export function attachShapeMorph(
  element: HTMLElement,
  options: ShapeMorphOptions = {},
): ShapeMorphHandle {
  // Set first: the stylesheet derives the per-side targets from `--rio-shape-morph-target` on
  // marked elements, and the springs read their starting value right away.
  element.dataset.shapeMorph = '';

  const springs = (['start', 'end'] as const).map((side) =>
    attachSpringProperty(element, {
      ...options,
      target: `--rio-shape-morph-${side}-target`,
      apply: (value) => {
        for (const corner of CORNERS[side]) {
          if (value === undefined) element.style.removeProperty(corner);
          else element.style.setProperty(corner, `${value}px`);
        }
      },
    }),
  );

  return {
    detach() {
      for (const spring of springs) spring.detach();
      delete element.dataset.shapeMorph;
    },
  };
}
