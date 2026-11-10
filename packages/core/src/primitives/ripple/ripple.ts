// Press ripple, attachable to any element, like Flutter's InkWell. It draws on the element's
// `::after` (see `@rio-m3e/styles/base/ripple.css`), so it composes with the state layer on `::before`.
//
// Behavior follows Material Web's ripple, Google's web implementation: a touch delay so scrolling
// doesn't ripple, a minimum visible time, and a centered ripple for keyboard activation.

/** Touch presses wait this long, so a scroll that starts on the element doesn't ripple. */
const TOUCH_DELAY_MS = 150;
/** A press stays visible at least this long, even for a quick tap. */
const MINIMUM_PRESS_MS = 225;
const GROW_MS = 450;
/** M3's legacy "standard" easing, which Material Web's ripple uses. */
const GROW_EASING = 'cubic-bezier(0.2, 0, 0, 1)';
/** The ripple starts at this fraction of the element's larger side. */
const INITIAL_SCALE = 0.2;
const PADDING = 10;
const SOFT_EDGE_RATIO = 0.35;
const SOFT_EDGE_MINIMUM = 75;

export interface RippleHandle {
  /** Removes the listeners and the `data-ripple` marker. */
  detach(): void;
}

const isDisabled = (el: Element) => el.matches(':disabled, [aria-disabled="true"]');

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Adds a press ripple to an element. While pressed, the element has `data-pressed`.
 * Load `@rio-m3e/styles/base/ripple.css` for the visuals; it styles elements marked `data-ripple`.
 */
export function attachRipple(element: HTMLElement): RippleHandle {
  let pointerId: number | undefined;
  let touchTimer: ReturnType<typeof setTimeout> | undefined;
  let animation: Animation | undefined;
  let pressedAt = 0;

  const start = (event?: PointerEvent) => {
    const { width, height, left, top } = element.getBoundingClientRect();
    const larger = Math.max(width, height);
    const softEdge = Math.max(SOFT_EDGE_RATIO * larger, SOFT_EDGE_MINIMUM);
    const from = event
      ? { x: event.clientX - left, y: event.clientY - top }
      : { x: width / 2, y: height / 2 };
    const to = { x: width / 2, y: height / 2 };
    const radius = {
      from: (larger * INITIAL_SCALE) / 2,
      to: (Math.hypot(width, height) + PADDING + softEdge) / 2,
    };
    const frame = (point: { x: number; y: number }, r: number) => ({
      '--rio-ripple-x': `${point.x}px`,
      '--rio-ripple-y': `${point.y}px`,
      '--rio-ripple-radius': `${r}px`,
    });

    animation?.cancel();
    animation = element.animate([frame(from, radius.from), frame(to, radius.to)], {
      pseudoElement: '::after',
      duration: reducedMotion() ? 0 : GROW_MS,
      easing: GROW_EASING,
      fill: 'forwards',
    });
    pressedAt = performance.now();
    element.dataset.pressed = '';
  };

  const end = () => {
    pointerId = undefined;
    clearTimeout(touchTimer);
    touchTimer = undefined;
    if (!('pressed' in element.dataset)) return;
    const current = animation;
    const remaining = MINIMUM_PRESS_MS - (performance.now() - pressedAt);
    const release = () => {
      // A newer press replaced this one, so it owns `data-pressed` now.
      if (animation === current) delete element.dataset.pressed;
    };
    if (remaining > 0) setTimeout(release, remaining);
    else release();
  };

  const isOwnPointer = (event: PointerEvent) =>
    event.isPrimary && (pointerId === undefined || pointerId === event.pointerId);

  const onPointerDown = (event: PointerEvent) => {
    if (isDisabled(element) || !event.isPrimary) return;
    const touch = event.pointerType === 'touch';
    if (!touch && event.buttons !== 1) return;
    pointerId = event.pointerId;
    if (!touch) {
      start(event);
      return;
    }
    touchTimer = setTimeout(() => {
      touchTimer = undefined;
      start(event);
    }, TOUCH_DELAY_MS);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!isOwnPointer(event) || pointerId === undefined) return;
    // A tap shorter than the touch delay still gets a ripple.
    if (touchTimer !== undefined) start(event);
    end();
  };

  const onPointerLeave = (event: PointerEvent) => {
    // Touch pointers leave on release, which pointerup already handles.
    if (event.pointerType !== 'touch' && isOwnPointer(event)) end();
  };

  const onCancel = (event: Event) => {
    if (event instanceof PointerEvent && !isOwnPointer(event)) return;
    end();
  };

  const onClick = (event: MouseEvent) => {
    // detail is 0 for clicks without a pointer: Enter or Space, or element.click().
    if (event.detail !== 0 || isDisabled(element)) return;
    start();
    end();
  };

  element.dataset.ripple = '';
  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointerup', onPointerUp);
  element.addEventListener('pointerleave', onPointerLeave);
  element.addEventListener('pointercancel', onCancel);
  element.addEventListener('contextmenu', onCancel);
  element.addEventListener('click', onClick);

  return {
    detach() {
      clearTimeout(touchTimer);
      animation?.cancel();
      delete element.dataset.ripple;
      delete element.dataset.pressed;
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointerleave', onPointerLeave);
      element.removeEventListener('pointercancel', onCancel);
      element.removeEventListener('contextmenu', onCancel);
      element.removeEventListener('click', onClick);
    },
  };
}
