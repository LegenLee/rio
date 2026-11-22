/** The two ways a control can be disabled. */
export interface DisabledProps {
  disabled?: boolean;
  /** Disabled, but still focusable. */
  softDisabled?: boolean;
}

/** Whether the person can't use the control now: disabled, or soft-disabled. */
export function isBlocked(p: DisabledProps): boolean {
  return !!p.disabled || !!p.softDisabled;
}

/**
 * A native control's attributes for its disabled states: `disabled`, or while only soft-disabled,
 * `aria-disabled`, which leaves it focusable. Native `disabled` already says it to assistive
 * technology, so `aria-disabled` is only for the soft variant.
 */
export function disabledAttrs(p: DisabledProps) {
  return {
    disabled: p.disabled ? '' : undefined,
    'aria-disabled': p.softDisabled && !p.disabled ? 'true' : undefined,
  };
}
