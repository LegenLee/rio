// Animates an element's corner radius with a spring whenever its target changes, for M3E's shape
// morphing (a button's corners change when pressed or selected). See
// `@rio-m3e/styles/base/shape-morph.css` for the CSS side.
//
// CSS declares the target in `--rio-shape-morph-target`, a registered <length>, so it reads back
// in px. When one of the watched attributes changes, the target is read again and the spring
// heads there, keeping its velocity if a change interrupts it. At rest, the inline radius is
// removed and the stylesheet takes over again.

import { createSpring, readSpringParams } from '../spring/spring';

export interface ShapeMorphOptions {
  /** The motion token whose spring drives the morph. Defaults to `'fast-spatial'`. */
  token?: string;
  /** Attributes whose changes can move the target. Defaults to Rio's state attributes. */
  watch?: string[];
}

export interface ShapeMorphHandle {
  detach(): void;
}

const STATE_ATTRIBUTES = ['data-pressed', 'data-selected', 'data-shape', 'data-size'];

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const readTarget = (el: Element) =>
  parseFloat(getComputedStyle(el).getPropertyValue('--rio-shape-morph-target'));

export function attachShapeMorph(
  element: HTMLElement,
  options: ShapeMorphOptions = {},
): ShapeMorphHandle {
  const token = options.token ?? 'fast-spatial';
  const initial = readTarget(element);
  const spring = createSpring({
    value: Number.isFinite(initial) ? initial : 0,
    onUpdate: (radius) => element.style.setProperty('border-radius', `${radius}px`),
    onRest: () => element.style.removeProperty('border-radius'),
  });

  const update = () => {
    const target = readTarget(element);
    // Without the stylesheet the target isn't a length, so leave the element alone.
    if (!Number.isFinite(target) || target === spring.target) return;
    const params = readSpringParams(element, token);
    if (!params || reducedMotion()) spring.jump(target);
    else spring.to(target, params);
  };

  const observer = new MutationObserver(update);
  observer.observe(element, {
    attributes: true,
    attributeFilter: options.watch ?? STATE_ATTRIBUTES,
  });
  element.dataset.shapeMorph = '';

  return {
    detach() {
      observer.disconnect();
      spring.stop();
      element.style.removeProperty('border-radius');
      delete element.dataset.shapeMorph;
    },
  };
}
