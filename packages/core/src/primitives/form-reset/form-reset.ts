// Tells when a form has put its controls back to their defaults, so a component can show its
// adapter's state on them again.
//
// - The `reset` event comes before the form puts its controls back, so `onReset` runs a task later,
//   once it has.
// - Only the reset of a form one of the controls belongs to counts, by each control's `form` at
//   the time. Several resets before the callback runs call it once.

/** A form control: an input, a select, a textarea, or a button. */
export type FormControl = Element & { readonly form: HTMLFormElement | null };

export interface FormResetHandle {
  detach(): void;
}

export function attachFormReset(
  controls: readonly FormControl[],
  onReset: () => void,
): FormResetHandle {
  const document = controls[0]?.ownerDocument;
  if (!document) return { detach() {} };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const onFormReset = (event: Event) => {
    if (!controls.some((control) => control.form === event.target)) return;
    clearTimeout(timer);
    timer = setTimeout(onReset);
  };
  document.addEventListener('reset', onFormReset, { capture: true });
  return {
    detach() {
      clearTimeout(timer);
      document.removeEventListener('reset', onFormReset, { capture: true });
    },
  };
}
