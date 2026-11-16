// Keeps a native checkbox or radio button in line with the adapter's state. The browser checks and
// unchecks the input itself when it is clicked, or when the arrow keys move through a radio group;
// the adapter owns the state, so the input reports what the person asked for and then shows the
// adapter's state, changed or not.
//
// - A change the person makes is reported with `onChange`. The input keeps showing it until
//   `sync()`, which sets `checked` (and `indeterminate`) back from the adapter's state, so a change
//   the adapter turns down doesn't stick.
// - While `blocked()`, as when soft-disabled, a click doesn't change the input at all, and a change
//   that gets through anyway, as the arrow keys make in a radio group, isn't reported.
// - `indeterminate` has no HTML attribute, so it can only be set here.
// - A form's reset puts the input back to its default, unchecked; the input then shows the
//   adapter's state again. Resetting the state is the app's.

export interface CheckableOptions {
  /** Whether the input is checked, as the adapter has it. */
  checked: () => boolean;
  /** Whether a checkbox shows as neither checked nor unchecked. */
  indeterminate?: () => boolean;
  /** Whether the person can't change it now, though it still takes the focus. */
  blocked?: () => boolean;
  /** The person checked or unchecked it. */
  onChange: (checked: boolean) => void;
}

export interface CheckableHandle {
  /**
   * Shows the adapter's state. Call it once attached, after each change of the state, and after
   * each `onChange`, whether or not the adapter followed it.
   */
  sync(): void;
  detach(): void;
}

export function attachCheckable(
  input: HTMLInputElement,
  options: CheckableOptions,
): CheckableHandle {
  const blocked = () => options.blocked?.() ?? false;
  const sync = () => {
    input.checked = options.checked();
    if (options.indeterminate) input.indeterminate = options.indeterminate();
  };

  // Canceling the click puts the input back as it was before it.
  const onClick = (event: MouseEvent) => {
    if (blocked()) event.preventDefault();
  };
  const onChange = () => {
    if (blocked()) sync();
    else options.onChange(input.checked);
  };
  // The reset event comes before the form puts its inputs back.
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  const document = input.ownerDocument;
  const onReset = (event: Event) => {
    if (event.target !== input.form) return;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(sync);
  };
  input.addEventListener('click', onClick);
  input.addEventListener('change', onChange);
  document.addEventListener('reset', onReset, { capture: true });
  sync();

  return {
    sync,
    detach() {
      clearTimeout(resetTimer);
      input.removeEventListener('click', onClick);
      input.removeEventListener('change', onChange);
      document.removeEventListener('reset', onReset, { capture: true });
    },
  };
}
