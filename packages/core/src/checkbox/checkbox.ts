import type { PartAttrs, PartNode } from '../parts';
import { resolveProps } from '../utils/object';

export interface CheckboxProps {
  /** Whether the checkbox is checked. */
  selected?: boolean;
  /**
   * Shows the checkbox as neither checked nor unchecked, as a parent checkbox does when only some
   * of its children are checked. Checking it, from either state, makes it checked.
   */
  indeterminate?: boolean;
  /** Shows the checkbox in the error color, and marks it invalid for assistive technology. */
  error?: boolean;
  /** Native disabled: not focusable and not pressable. This is the spec's behavior. */
  disabled?: boolean;
  /**
   * Disabled but still focusable, so it stays discoverable. Presses are blocked in JavaScript
   * instead. This deviates from the spec, which says disabled components can't be focused.
   */
  softDisabled?: boolean;
}

export const checkboxDefaults = {
  selected: false,
  indeterminate: false,
  error: false,
  disabled: false,
  softDisabled: false,
} satisfies Required<CheckboxProps>;

export interface CheckboxOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => CheckboxProps;
}

/** The checkbox's markup, part by part. `checkboxSkeleton` says how the adapter nests them. */
export interface CheckboxParts {
  /** Lays out at the 48px target, with the checkbox drawn in the middle. */
  root: () => PartAttrs;
  /**
   * The native `<input type="checkbox">`, invisible over the whole target. It takes the focus,
   * the presses, and the label's clicks, and submits the value with a form. `attachCheckable`
   * keeps its `checked` and `indeterminate` in line with the props.
   */
  input: () => PartAttrs;
  /** The circle where the state layer and the ripple draw. */
  state: () => PartAttrs;
  /** The 18px box: its outline, and the fill when checked. */
  container: () => PartAttrs;
  /** The checkmark, or the indeterminate dash. */
  icon: () => PartAttrs;
}

export const checkboxSkeleton: PartNode<keyof CheckboxParts> = {
  part: 'root',
  tag: 'span',
  children: [
    { part: 'input', tag: 'input' },
    { part: 'state', tag: 'span' },
    { part: 'container', tag: 'span', children: [{ part: 'icon', tag: 'span' }] },
  ],
};

export interface CheckboxApi {
  parts: CheckboxParts;
  /** Whether a press can't change it now: disabled or soft-disabled. For `attachCheckable`. */
  blocked: () => boolean;
  /**
   * The value a change by the person asks for, given what the input shows after it: checked,
   * when it was indeterminate, whatever the input says. Report this to the app.
   */
  next: (checked: boolean) => boolean;
}

export function createCheckbox(options: CheckboxOptions): CheckboxApi {
  const props = () => resolveProps(checkboxDefaults, options.props());
  const unavailable = () => {
    const p = props();
    return !!p.disabled || !!p.softDisabled;
  };

  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-checkbox',
          'data-selected': String(!!p.selected && !p.indeterminate),
          'data-indeterminate': p.indeterminate ? '' : undefined,
          'data-error': p.error ? '' : undefined,
          'data-disabled': unavailable() ? '' : undefined,
        };
      },
      input() {
        const p = props();
        return {
          class: 'rio-checkbox__input',
          type: 'checkbox',
          disabled: p.disabled ? '' : undefined,
          'aria-disabled': p.softDisabled && !p.disabled ? 'true' : undefined,
          'aria-invalid': p.error ? 'true' : undefined,
        };
      },
      state: () => ({ class: 'rio-checkbox__state', 'aria-hidden': 'true' }),
      container: () => ({ class: 'rio-checkbox__container', 'aria-hidden': 'true' }),
      icon: () => ({ class: 'rio-checkbox__icon' }),
    },
    blocked: unavailable,
    next: (checked) => (props().indeterminate ? true : checked),
  };
}
