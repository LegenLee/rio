// Springs a value toward a target that CSS declares per state. The stylesheet sets a registered
// custom property (the target) for each state, such as a <length> or an <angle>, read in px or
// deg. The spring heads for the target whenever it changes, keeping its velocity if a change
// interrupts it. The animated value goes to `apply`; at rest `apply(undefined)` hands back to the
// stylesheet.
//
// The stylesheet also gives the target an instant transition, `<target> 1ms step-end`, in the
// element's `transition` list. The browser then reports every change of the target as a
// transition event, whatever caused it: a state attribute, :hover or :focus-visible, a theme
// variable set on an ancestor, or a selector such as :first-child. So the spring knows the value on
// screen, even while it rests. `step-end` holds the old value until the spring takes over.
// Without the transition (or if the app's CSS replaces the `transition` list) the spring never
// moves, and the stylesheet's value shows directly.
//
// An element that isn't rendered (display: none, or out of the document) gets no transitions, so
// a target that changed meanwhile is caught up, without animating, when the element shows again.
//
// A drag can take manual control with `hold()` and give it back with `release(velocity)`.

import { prefersReducedMotion } from '../reduced-motion/reduced-motion';
import { createSpring, readSpringParams } from '../spring/spring';

export interface SpringPropertyOptions {
  /**
   * A registered custom property that holds the target for the current state: a <length>, read
   * in px, or an <angle>, read in deg. The stylesheet has to transition it (see above).
   */
  target: string;
  /** Writes the animated value (px or deg), or clears it with `undefined` at rest. */
  apply: (value: number | undefined) => void;
  /** The motion token whose spring drives the value. Defaults to `'fast-spatial'`. */
  token?: string;
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

/** The transition events that report a change of the target. */
const EVENTS = ['transitionrun', 'transitionend', 'transitioncancel'] as const;

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

  // While the transition holds the old value, the read finds nothing new; `transitionend` brings
  // the new one. Events from other properties, or bubbling up from inside, don't count.
  const onTransition = (event: TransitionEvent) => {
    if (event.target !== element || event.propertyName !== options.target) return;
    if (!held && read() !== spring.target) go();
  };
  for (const type of EVENTS) element.addEventListener(type, onTransition);

  // Showing the element again changes its size from nothing, which is when to catch up with a
  // target that changed while it was hidden. The screen already shows that target, so jump. While
  // a transition holds the old value the read finds nothing new, so this leaves visible changes to
  // the transition events.
  const resync = new ResizeObserver(() => {
    if (held || spring.moving) return;
    const now = read();
    if (Number.isFinite(now) && now !== spring.target) spring.jump(now);
  });
  resync.observe(element);

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
      for (const type of EVENTS) element.removeEventListener(type, onTransition);
      resync.disconnect();
      spring.stop();
      options.apply(undefined);
    },
  };
}
