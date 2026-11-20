// Animates an element's corner radii with a spring whenever their targets change, as a button's
// corners change when it is pressed or selected. See
// `@rio-m3e/styles/base/corner-morph.css` for the CSS side: the stylesheet declares the target
// radius for each state in `--rio-corner-morph-target`, or, for shapes whose sides differ (a
// button at the end of a connected button group), per side in `--rio-corner-morph-start-target`
// and `--rio-corner-morph-end-target`. Sides follow the writing direction, so right-to-left
// layouts mirror the shape. Like every spring target, the per-side targets need an instant
// transition in the element's `transition` list (see spring-property).

import { attachSpringProperty } from '../spring-property/spring-property';

export interface CornerMorphOptions {
  /** The motion token whose spring drives the morph. Defaults to `'fast-spatial'`. */
  token?: string;
}

export interface CornerMorphHandle {
  detach(): void;
}

const CORNERS = {
  start: ['border-start-start-radius', 'border-end-start-radius'],
  end: ['border-start-end-radius', 'border-end-end-radius'],
} as const;

export function attachCornerMorph(
  element: HTMLElement,
  options: CornerMorphOptions = {},
): CornerMorphHandle {
  // Set first: the stylesheet derives the per-side targets from `--rio-corner-morph-target` on
  // marked elements, and the springs read their starting value right away.
  element.dataset.cornerMorph = '';

  const springs = (['start', 'end'] as const).map((side) =>
    attachSpringProperty(element, {
      ...options,
      target: `--rio-corner-morph-${side}-target`,
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
      delete element.dataset.cornerMorph;
    },
  };
}
