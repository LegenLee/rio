// Animates an element's corner radius with a spring whenever its target changes, for M3E's shape
// morphing (a button's corners change when pressed or selected). See
// `@rio-m3e/styles/base/shape-morph.css` for the CSS side: the stylesheet declares the target
// radius for each state in `--rio-shape-morph-target`.

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

export function attachShapeMorph(
  element: HTMLElement,
  options: ShapeMorphOptions = {},
): ShapeMorphHandle {
  const radius = attachSpringProperty(element, {
    ...options,
    target: '--rio-shape-morph-target',
    apply: (value) =>
      value === undefined
        ? element.style.removeProperty('border-radius')
        : element.style.setProperty('border-radius', `${value}px`),
  });
  element.dataset.shapeMorph = '';

  return {
    detach() {
      radius.detach();
      delete element.dataset.shapeMorph;
    },
  };
}
