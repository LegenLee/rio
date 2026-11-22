// The sliders' behavior in the DOM.
//
// - The inputs take the focus, the keys, and assistive technology, as native range inputs do, but
//   not the pointer: the root takes it, so the value under the pointer is the one the stylesheet
//   draws there, and a range slider can move the handle nearest the pointer.
// - The mouse: a press moves the handle there at once, and dragging follows it. Touch and a pen: a
//   tap moves the handle there, and dragging follows once the pointer has moved 8px, so a swipe
//   across the slider can still scroll the page (`touch-action` in the stylesheet).
// - A range slider moves the handle nearest the press. Where both handles sit, it moves the one on
//   the side the pointer goes. Neither handle goes past the other.
// - Each change a press makes goes to the input too, with an `input` event, and a `change` event as
//   the press ends, as a native range input sends them, so the app's and the form's listeners
//   hear about it.
// - A change the keys or assistive technology make on an input is reported too. The input shows
//   what the person asked for until `sync()`, which puts the adapter's value back, so a change the
//   adapter turns down doesn't stick.
// - While blocked (soft-disabled), nothing changes: a press only focuses, and the keys do nothing.
//   With Alt, Ctrl, or Meta, they go on to the browser, as its shortcuts; a change they make on an
//   input doesn't stick.
// - The input being pressed carries `data-pressed`, and while dragging `data-dragging`.
// - With an inset icon, reports whether the active track is too short for it, so the icon moves to
//   the inactive track.
// - A form's reset puts the inputs back to their defaults; they then show the adapter's values
//   again. Resetting the values is the app's.

import { isRtl } from '../primitives/direction/direction';
import { attachFormReset } from '../primitives/form-reset/form-reset';
import { parsePx } from '../utils/css';
import { hasModifier } from '../utils/keyboard';
import { snapSliderValue, type SliderRange } from './slider';

export interface SliderDomOptions {
  /** The handles' inputs, in order: the slider's one, or the range slider's start and end. */
  inputs: readonly HTMLInputElement[];
  /** The handles' values as the adapter has them, in the same order (`value()` of the API). */
  values: () => readonly number[];
  range: () => SliderRange;
  vertical: () => boolean;
  blocked: () => boolean;
  /** A handle moved: its index and its new value (`moveHandle` of the API). */
  onMove: (index: number, value: number) => void;
  /** The active track, while the slider has an inset icon. */
  activeTrack?: () => HTMLElement | null | undefined;
  /** Whether the inset icon has to sit on the inactive track, as it changes. */
  onIconInactiveChange?: (inactive: boolean) => void;
}

export interface SliderDomHandle {
  /**
   * Shows the adapter's values on the inputs, and checks where the inset icon fits. Call it after
   * each render and after each `onMove`, whether or not the adapter followed it.
   */
  sync(): void;
  detach(): void;
}

/** How far touch or a pen moves before a drag starts. */
const DRAG_THRESHOLD = 8;

/** The keys a native range input changes its value with */
const KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
]);

const VALUE_SETTER =
  typeof HTMLInputElement === 'undefined'
    ? undefined
    : Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

interface Gesture {
  pointerId: number;
  /** The handle it moves, until both sit where it started and it hasn't moved off yet */
  index: number | undefined;
  x: number;
  y: number;
  dragging: boolean;
  changed: boolean;
}

export function attachSlider(root: HTMLElement, options: SliderDomOptions): SliderDomHandle {
  const { inputs } = options;
  let gesture: Gesture | undefined;
  let dispatching = false;
  let iconInactive = false;

  /** Where the pointer is along the track, from 0 at `min` to 1 at `max` */
  const fractionAt = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    const inset = parsePx(getComputedStyle(root).getPropertyValue('--rio-slider-inset'));
    const vertical = options.vertical();
    const travel = (vertical ? rect.height : rect.width) - 2 * inset;
    if (travel <= 0) return 0;
    let offset: number;
    if (vertical) offset = rect.bottom - inset - event.clientY;
    else if (isRtl(root)) offset = rect.right - inset - event.clientX;
    else offset = event.clientX - rect.left - inset;
    return Math.min(1, Math.max(0, offset / travel));
  };

  const valueAt = (event: PointerEvent) => {
    const range = options.range();
    return snapSliderValue(range.min + fractionAt(event) * (range.max - range.min), range);
  };

  const pick = (value: number): number | undefined => {
    if (inputs.length === 1) return 0;
    const [start = 0, end = 0] = options.values();
    if (value < start) return 0;
    if (value > end) return 1;
    if (start === end) return undefined;
    return value - start <= end - value ? 0 : 1;
  };

  // Focus from the pointer shows no focus ring, as a click on a native input doesn't.
  const focus = (index: number) =>
    inputs[index]?.focus({ preventScroll: true, focusVisible: false });

  const mark = (index: number | undefined) => {
    inputs.forEach((input, i) => {
      if (i === index) input.dataset.pressed = '';
      else delete input.dataset.pressed;
    });
  };

  const dispatch = (input: HTMLInputElement, type: 'input' | 'change') => {
    dispatching = true;
    try {
      input.dispatchEvent(new Event(type, { bubbles: true }));
    } finally {
      dispatching = false;
    }
  };

  const moveTo = (index: number, value: number) => {
    const values = options.values();
    let next = value;
    if (inputs.length === 2) {
      next = index === 0 ? Math.min(next, values[1] ?? next) : Math.max(next, values[0] ?? next);
    }
    if (next === values[index]) return;
    const input = inputs[index]!;
    // Through the prototype's setter, past any wrapper a framework puts on the input's own `value`,
    // so the `input` event that follows reads as a change there too.
    if (VALUE_SETTER) VALUE_SETTER.call(input, String(next));
    else input.value = String(next);
    if (gesture) gesture.changed = true;
    dispatch(input, 'input');
    options.onMove(index, next);
  };

  const end = () => {
    if (!gesture) return;
    const { index, changed, pointerId } = gesture;
    gesture = undefined;
    mark(undefined);
    for (const input of inputs) delete input.dataset.dragging;
    if (root.hasPointerCapture?.(pointerId)) root.releasePointerCapture(pointerId);
    if (changed && index !== undefined) dispatch(inputs[index]!, 'change');
  };

  const startDragging = (event: PointerEvent) => {
    if (!gesture) return;
    gesture.dragging = true;
    try {
      // Keeps the pointer's events coming here even when it leaves the slider.
      root.setPointerCapture(event.pointerId);
    } catch {
      // Not an active pointer any more (or a synthetic event). The drag works without capture.
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || gesture) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (inputs.every((input) => input.disabled)) return;
    const mouse = event.pointerType === 'mouse';
    const value = valueAt(event);
    const index = pick(value);
    // No text selection, and no compatibility mouse events after touch, whose `mousedown` would
    // take the focus off the input. The page still scrolls by `touch-action`.
    event.preventDefault();
    if (options.blocked()) {
      if (mouse) focus(index ?? 0);
      return;
    }
    gesture = {
      pointerId: event.pointerId,
      index,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
      changed: false,
    };
    mark(index);
    if (!mouse) return;
    startDragging(event);
    focus(index ?? inputs.length - 1);
    if (index !== undefined) {
      inputs[index]!.dataset.dragging = '';
      moveTo(index, value);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (!gesture.dragging) {
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < DRAG_THRESHOLD) return;
      startDragging(event);
      if (gesture.index !== undefined) focus(gesture.index);
    }
    const value = valueAt(event);
    if (gesture.index === undefined) {
      const at = options.values()[0];
      if (value === at) return;
      gesture.index = value < at! ? 0 : 1;
      mark(gesture.index);
      focus(gesture.index);
    }
    inputs[gesture.index]!.dataset.dragging = '';
    moveTo(gesture.index, value);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (!gesture.dragging) {
      // A tap, with touch or a pen. Where both handles sat, the side it lifts on picks one.
      const value = valueAt(event);
      const index = gesture.index ?? pick(value) ?? inputs.length - 1;
      focus(index);
      moveTo(index, value);
    }
    end();
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (gesture && event.pointerId === gesture.pointerId) end();
  };

  const sync = () => {
    const values = options.values();
    inputs.forEach((input, i) => {
      const value = String(values[i]);
      if (input.value !== value) input.value = value;
    });
    const track = options.activeTrack?.();
    if (!track || !options.onIconInactiveChange) return;
    const rect = track.getBoundingClientRect();
    const length = options.vertical() ? rect.height : rect.width;
    const inactive =
      length < parsePx(getComputedStyle(root).getPropertyValue('--rio-slider-icon-room'));
    if (inactive === iconInactive) return;
    iconInactive = inactive;
    options.onIconInactiveChange(inactive);
  };

  const onInput = (event: Event) => {
    if (dispatching) return;
    const index = inputs.indexOf(event.target as HTMLInputElement);
    if (index < 0) return;
    if (options.blocked()) {
      sync();
      return;
    }
    options.onMove(index, Number(inputs[index]!.value));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (options.blocked() && !hasModifier(event) && KEYS.has(event.key)) event.preventDefault();
  };

  // The icon's room changes with the slider's length.
  const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(sync);
  resize?.observe(root);

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerCancel);
  root.addEventListener('lostpointercapture', onPointerCancel);
  for (const input of inputs) {
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeyDown);
  }
  const reset = attachFormReset(inputs, sync);
  sync();

  return {
    sync,
    detach() {
      end();
      reset.detach();
      resize?.disconnect();
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerCancel);
      root.removeEventListener('lostpointercapture', onPointerCancel);
      for (const input of inputs) {
        input.removeEventListener('input', onInput);
        input.removeEventListener('keydown', onKeyDown);
      }
    },
  };
}
