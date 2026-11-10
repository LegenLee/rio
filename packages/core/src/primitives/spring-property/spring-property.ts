// Springs a value toward a target that CSS declares per state. The stylesheet sets a registered
// <length> custom property (the target) for each state; when one of the watched attributes
// changes, the target is read again in px and the spring heads there, keeping its velocity if a
// change interrupts it. The animated value goes to `apply`; at rest `apply(undefined)` hands back
// to the stylesheet.
//
// A drag can take manual control with `hold()` and give it back with `release(velocity)`.

import { createSpring, readSpringParams } from '../spring/spring';

export interface SpringPropertyOptions {
  /** A registered <length> custom property that holds the target for the current state. */
  target: string;
  /** Writes the animated value in px, or clears it with `undefined` at rest. */
  apply: (value: number | undefined) => void;
  /** The motion token whose spring drives the value. Defaults to `'fast-spatial'`. */
  token?: string;
  /** Attributes whose changes can move the target. Defaults to Rio's state attributes. */
  watch?: string[];
}

export interface SpringPropertyHandle {
  /** The current animated value. */
  readonly value: number;
  /** Takes manual control and sets the value at once, for example while dragging. */
  hold(value: number): void;
  /** Gives control back: springs from the held value to the CSS target, starting at `velocity`. */
  release(velocity?: number): void;
  detach(): void;
}

/** The data attributes Rio's components use for state. */
export const STATE_ATTRIBUTES = [
  'data-pressed',
  'data-dragging',
  'data-selected',
  'data-shape',
  'data-size',
  'data-icon',
];

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function attachSpringProperty(
  element: HTMLElement,
  options: SpringPropertyOptions,
): SpringPropertyHandle {
  const token = options.token ?? 'fast-spatial';
  const read = () => parseFloat(getComputedStyle(element).getPropertyValue(options.target));
  const initial = read();
  let held = false;

  const spring = createSpring({
    value: Number.isFinite(initial) ? initial : 0,
    onUpdate: (value) => options.apply(value),
    onRest: () => {
      if (!held) options.apply(undefined);
    },
  });

  const go = (velocity?: number) => {
    const target = read();
    // Without the stylesheet the target isn't a length, so leave the element alone.
    if (!Number.isFinite(target)) return;
    const params = readSpringParams(element, token);
    if (!params || reducedMotion()) spring.jump(target);
    else spring.to(target, params, velocity);
  };

  const observer = new MutationObserver(() => {
    if (!held && read() !== spring.target) go();
  });
  observer.observe(element, {
    attributes: true,
    attributeFilter: options.watch ?? STATE_ATTRIBUTES,
  });

  return {
    get value() {
      return spring.value;
    },
    hold(value) {
      held = true;
      spring.jump(value);
    },
    release(velocity = 0) {
      held = false;
      go(velocity);
    },
    detach() {
      observer.disconnect();
      spring.stop();
      options.apply(undefined);
    },
  };
}
