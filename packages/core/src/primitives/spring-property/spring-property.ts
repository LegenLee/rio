// Springs a value toward a target that CSS declares per state. The stylesheet sets a registered
// custom property (the target) for each state, such as a <length> or an <angle>; when one of the
// watched attributes changes, or the pointer or the focus enters or leaves the element (for
// targets that depend on the element's own :hover or :focus-visible), the target is read again,
// in px or deg, and the spring heads there, keeping its velocity if a change interrupts it. The
// animated value goes to `apply`; at rest `apply(undefined)` hands back to the stylesheet.
//
// Other changes are only picked up at the next of these events: an ancestor's :hover, or
// :focus-visible turning on without a focus event (focusing with the mouse, then typing).
//
// A drag can take manual control with `hold()` and give it back with `release(velocity)`.

import { createSpring, prefersReducedMotion, readSpringParams } from '../spring/spring';

export interface SpringPropertyOptions {
  /**
   * A registered custom property that holds the target for the current state: a <length>, read
   * in px, or an <angle>, read in deg.
   */
  target: string;
  /** Writes the animated value (px or deg), or clears it with `undefined` at rest. */
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
  'data-open',
];

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
    if (!params || prefersReducedMotion()) spring.jump(target);
    else spring.to(target, params, velocity);
  };

  const recheck = () => {
    if (!held && read() !== spring.target) go();
  };
  const observer = new MutationObserver(recheck);
  observer.observe(element, {
    attributes: true,
    attributeFilter: options.watch ?? STATE_ATTRIBUTES,
  });

  // :hover and :focus-visible change no attribute. Check when the pointer or the focus comes or
  // goes, and once more a frame later, in case the style hadn't caught up yet.
  let frame: number | undefined;
  const onBoundary = () => {
    recheck();
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = undefined;
      recheck();
    });
  };
  const BOUNDARIES = ['pointerenter', 'pointerleave', 'focusin', 'focusout'] as const;
  for (const type of BOUNDARIES) element.addEventListener(type, onBoundary);

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
      for (const type of BOUNDARIES) element.removeEventListener(type, onBoundary);
      if (frame !== undefined) cancelAnimationFrame(frame);
      spring.stop();
      options.apply(undefined);
    },
  };
}
