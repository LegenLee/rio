// The time picker's behavior in the DOM.
//
// - A press on the dial picks the number nearest the pointer, and the selector follows it while
//   the pointer moves. The release picks it for good: on an hour, the dial goes on to the minutes.
//   On a 24-hour clock, the inner ring holds 12 to 23.
// - The dial's numbers are out of the tab order. Enter or Space on the hour or minute toggle moves
//   the focus onto the dial, at hour 12 (on a 24-hour clock, the inner ring's) or minute 0.
// - On the dial's numbers, Right and Down move the focus to the next number, clockwise, Left and
//   Up to the one before; on a 24-hour clock, 11 leads to 12 on the inner ring, and 23 back to 0.
//   Enter and Space pick the number, without going on to the minutes.
// - The numbers overlap, 60 of them for the minutes, so the pointer goes through them to the dial:
//   `onHover` reports the number nearest the pointer, the one a press would pick, for its hover
//   state, rather than the one drawn on top.
// - On the AM and PM buttons, the arrow keys choose the other one, as in a radio group.
// - A text field focused other than by the pointer, as by Tab or as the dialog opens, has its text
//   selected, so typing replaces both digits.
// - After the adapter shows the other field's numbers, the focus, when it was on a number, goes to
//   where the dial starts, whether the adapter replaced the numbers or reused them.

/** The rings' radii, as fractions of the dial's size */
const OUTER = 102 / 256;
const INNER = 74 / 256;

export interface TimePickerDomOptions {
  /** Which field the dial sets */
  selection: () => 'hour' | 'minute';
  hourCycle: () => 12 | 24;
  /** A number picked on the dial; `release` when the pointer let go */
  onPick: (value: number, release: boolean) => void;
  /** AM or PM chosen with the arrow keys */
  onPeriod: (pm: boolean) => void;
  /** The number nearest a pointer that hovers over the dial, or none, as it changes */
  onHover: (value: number | undefined) => void;
}

export interface TimePickerDomHandle {
  /** Call it after each render. */
  sync(): void;
  detach(): void;
}

export function attachTimePicker(
  root: HTMLElement,
  options: TimePickerDomOptions,
): TimePickerDomHandle {
  const document = root.ownerDocument;
  const dial = () => root.querySelector<HTMLElement>('.rio-time-picker__dial');
  /** Where the focus starts on the dial: hour 12, or minute 0 */
  const start = () => {
    const face = dial();
    const value = face?.dataset.selection === 'hour' && options.hourCycle() === 24 ? 12 : 0;
    return face?.querySelector<HTMLElement>(`.rio-time-picker__number[data-value="${value}"]`);
  };

  /** The number under a point, from its angle and, on a 24-hour clock, its distance */
  const valueAt = (face: HTMLElement, x: number, y: number) => {
    const box = face.getBoundingClientRect();
    const dx = x - (box.left + box.width / 2);
    const dy = y - (box.top + box.height / 2);
    const angle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    if (options.selection() === 'minute') return Math.round(angle / 6) % 60;
    const index = Math.round(angle / 30) % 12;
    if (options.hourCycle() === 12) return index;
    const inner = Math.hypot(dx, dy) < ((OUTER + INNER) / 2) * box.width;
    return index + (inner ? 12 : 0);
  };

  /**
   * Where a pointer that hovers is over the dial, and which dial: one rendered afresh, as on
   * opening again, has no pointer over it until the pointer moves.
   */
  let hoverAt: { x: number; y: number; face: Element | null } | undefined;
  let hovered: number | undefined;
  const showHover = () => {
    const face = dial();
    if (hoverAt && hoverAt.face !== face) hoverAt = undefined;
    const value = face && hoverAt ? valueAt(face, hoverAt.x, hoverAt.y) : undefined;
    if (value === hovered) return;
    hovered = value;
    options.onHover(value);
  };
  const onHover = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const over = (event.target as Element).closest('.rio-time-picker__dial');
    hoverAt = over || dragging ? { x: event.clientX, y: event.clientY, face: dial() } : undefined;
    showHover();
  };
  const onPointerLeave = () => {
    hoverAt = undefined;
    showHover();
  };

  let dragging: { face: HTMLElement; id: number } | undefined;
  /** The text field the pointer is focusing, which keeps the caret where the press put it */
  let pressedField: Element | undefined;
  const onPointerDown = (event: PointerEvent) => {
    pressedField = (event.target as Element).closest('.rio-time-picker__input') ?? undefined;
    const face = (event.target as Element).closest<HTMLElement>('.rio-time-picker__dial');
    if (!face || event.button !== 0) return;
    // The dial takes the press; the focus stays where it is.
    event.preventDefault();
    dragging = { face, id: event.pointerId };
    face.setPointerCapture?.(event.pointerId);
    options.onPick(valueAt(face, event.clientX, event.clientY), false);
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== dragging.id) return;
    options.onPick(valueAt(dragging.face, event.clientX, event.clientY), false);
  };
  const onPointerUp = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== dragging.id) return;
    const { face } = dragging;
    dragging = undefined;
    options.onPick(valueAt(face, event.clientX, event.clientY), true);
  };
  const onPointerCancel = () => (dragging = undefined);

  /** The field whose numbers had the focus, so it moves when the dial shows the other field */
  let focusedField: string | undefined;
  /** The field whose toggle was activated from the keyboard, until the dial shows it */
  let entering: string | undefined;
  const enterDial = () => {
    if (entering === undefined || dial()?.dataset.selection !== entering) return;
    entering = undefined;
    start()?.focus();
  };
  // A click without a pointer: Enter, Space, or assistive technology
  const onClick = (event: MouseEvent) => {
    const toggle = (event.target as Element).closest<HTMLElement>('button[data-field]');
    if (!toggle || !root.contains(toggle) || event.detail !== 0) return;
    entering = toggle.dataset.field;
    // After the adapter has shown that field's numbers, if it does so before the next sync
    queueMicrotask(enterDial);
  };
  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement;
    const forward = ['ArrowRight', 'ArrowDown'].includes(event.key);
    const back = ['ArrowLeft', 'ArrowUp'].includes(event.key);
    if (!forward && !back) return;
    if (target.matches('.rio-time-picker__number')) {
      event.preventDefault();
      // The numbers in order, clockwise, and across the rings on a 24-hour clock
      const numbers = [
        ...(dial()?.querySelectorAll<HTMLElement>('.rio-time-picker__number') ?? []),
      ];
      const at = numbers.indexOf(target);
      numbers[(at + (forward ? 1 : -1) + numbers.length) % numbers.length]?.focus();
      return;
    }
    if (target.matches('.rio-time-picker__period-button')) {
      event.preventDefault();
      const buttons = [...root.querySelectorAll<HTMLElement>('.rio-time-picker__period-button')];
      const other = buttons.find((button) => button !== target);
      options.onPeriod(other === buttons[1]);
      other?.focus();
    }
  };
  const onFocusIn = (event: FocusEvent) => {
    const target = event.target as Element;
    focusedField = target.matches('.rio-time-picker__number')
      ? dial()?.dataset.selection
      : undefined;
    if (target.matches('.rio-time-picker__input') && target !== pressedField) {
      (target as HTMLInputElement).select();
    }
    pressedField = undefined;
  };

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointermove', onHover);
  root.addEventListener('pointerleave', onPointerLeave);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerCancel);
  root.addEventListener('keydown', onKeydown);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('click', onClick);

  return {
    sync() {
      enterDial();
      // The dial may show the other field's numbers now, another one under the pointer.
      showHover();
      if (focusedField === undefined) return;
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected;
      if (lost || dial()?.dataset.selection !== focusedField) start()?.focus();
    },
    detach() {
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointermove', onHover);
      root.removeEventListener('pointerleave', onPointerLeave);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerCancel);
      root.removeEventListener('keydown', onKeydown);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('click', onClick);
    },
  };
}
