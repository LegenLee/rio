// Tracks a drag on an element, for gestures such as sliding a switch's handle. It starts only after
// the pointer moves past a small threshold, so a tap stays a tap. While dragging, the element has
// `data-dragging`. The click that follows the end of a drag is swallowed, so dragging doesn't also
// count as a click.

export interface DragInfo {
  /** Distance from where the press started, in px. */
  dx: number;
  dy: number;
  /** Over the last moments of the drag, in px per second. */
  velocityX: number;
  velocityY: number;
}

export interface DragOptions {
  /** Pointer types that can drag. Defaults to touch and pen, as M3 specifies for the switch. */
  pointerTypes?: readonly string[];
  /** Distance a pointer must move before a drag starts. Defaults to 8px. */
  threshold?: number;
  onStart?: () => void;
  onMove: (info: DragInfo) => void;
  onEnd: (info: DragInfo) => void;
  /** The browser took the pointer, for example to scroll the page. Defaults to `onEnd`. */
  onCancel?: (info: DragInfo) => void;
}

export interface DragHandle {
  detach(): void;
}

/** Velocity is measured over this window, so a pause before release reads as slow. */
const VELOCITY_WINDOW_MS = 100;
/** How long to wait for the click that follows a drag before giving up on swallowing it. */
const CLICK_WINDOW_MS = 400;

const isDisabled = (el: Element) => el.matches(':disabled, [aria-disabled="true"]');

export function attachDrag(element: HTMLElement, options: DragOptions): DragHandle {
  const pointerTypes = options.pointerTypes ?? ['touch', 'pen'];
  const threshold = options.threshold ?? 8;
  let pointerId: number | undefined;
  let start = { x: 0, y: 0 };
  let samples: { t: number; x: number; y: number }[] = [];
  let dragging = false;

  const info = (event: PointerEvent): DragInfo => {
    const first = samples[0];
    const last = samples.at(-1);
    const seconds = first && last ? (last.t - first.t) / 1000 : 0;
    return {
      dx: event.clientX - start.x,
      dy: event.clientY - start.y,
      velocityX: seconds > 0 ? (last!.x - first!.x) / seconds : 0,
      velocityY: seconds > 0 ? (last!.y - first!.y) / seconds : 0,
    };
  };

  const record = (event: PointerEvent) => {
    samples.push({ t: event.timeStamp, x: event.clientX, y: event.clientY });
    samples = samples.filter((s) => event.timeStamp - s.t <= VELOCITY_WINDOW_MS);
  };

  const reset = () => {
    pointerId = undefined;
    samples = [];
    dragging = false;
    delete element.dataset.dragging;
  };

  const swallowNextClick = () => {
    const swallow = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    element.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(
      () => element.removeEventListener('click', swallow, { capture: true }),
      CLICK_WINDOW_MS,
    );
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || !pointerTypes.includes(event.pointerType) || isDisabled(element))
      return;
    pointerId = event.pointerId;
    start = { x: event.clientX, y: event.clientY };
    samples = [];
    record(event);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    record(event);
    if (!dragging) {
      const { dx, dy } = info(event);
      if (Math.hypot(dx, dy) < threshold) return;
      dragging = true;
      try {
        // Keeps the pointer's events coming here even if it leaves the element.
        element.setPointerCapture(event.pointerId);
      } catch {
        // Not an active pointer any more (or a synthetic event). The drag works without capture.
      }
      element.dataset.dragging = '';
      options.onStart?.();
    }
    options.onMove(info(event));
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    if (dragging) {
      record(event);
      options.onEnd(info(event));
      swallowNextClick();
    }
    reset();
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    if (dragging) (options.onCancel ?? options.onEnd)(info(event));
    reset();
  };

  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointermove', onPointerMove);
  element.addEventListener('pointerup', onPointerUp);
  element.addEventListener('pointercancel', onPointerCancel);

  return {
    detach() {
      reset();
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerCancel);
    },
  };
}
