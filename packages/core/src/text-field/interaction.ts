// The text field's behavior in the DOM.
//
// - The whole container reads as the field, so a press on it outside the input, such as on the
//   padding, the label, or a decorative icon, focuses the input, with the caret at the end. Presses
//   on something that takes the focus itself, such as an icon button, are left to it.
// - A text area can be made taller by dragging the container's corner, but never shorter than
//   its `rows`.

export interface TextFieldDomHandle {
  /** Call it after the props changed, as `rows` may have. */
  update(): void;
  detach(): void;
}

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]';
/** The corner a resizable container is dragged from, in px each way */
const RESIZE_CORNER = 16;

export function attachTextField(
  container: HTMLElement,
  input: () => HTMLInputElement | HTMLTextAreaElement | null,
): TextFieldDomHandle {
  const onPointerDown = (event: PointerEvent) => {
    const control = input();
    if (!control || control.disabled || event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest(FOCUSABLE) || target.closest('label')) return;
    // A press on a text area's resize corner drags it.
    const style = getComputedStyle(container);
    if (target === container && style.resize !== 'none') {
      const box = container.getBoundingClientRect();
      const fromEnd =
        style.direction === 'rtl' ? event.clientX - box.left : box.right - event.clientX;
      if (fromEnd <= RESIZE_CORNER && box.bottom - event.clientY <= RESIZE_CORNER) return;
    }
    // Keeps the focus from leaving the input it is in, or landing nowhere.
    event.preventDefault();
    if (control.ownerDocument.activeElement === control) return;
    control.focus();
    const end = control.value.length;
    try {
      control.setSelectionRange(end, end);
    } catch {
      // Some input types, such as email and number, have no selection.
    }
  };

  // The stylesheet works out a text area's least height from its rows.
  const update = () => {
    const control = input();
    if (control instanceof HTMLTextAreaElement) {
      container.style.setProperty('--rio-text-field-rows', String(control.rows));
    } else {
      container.style.removeProperty('--rio-text-field-rows');
    }
  };

  container.addEventListener('pointerdown', onPointerDown);
  update();
  return {
    update,
    detach() {
      container.removeEventListener('pointerdown', onPointerDown);
      container.style.removeProperty('--rio-text-field-rows');
    },
  };
}
