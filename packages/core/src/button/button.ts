import type { ButtonGroupValue } from '../button-group/button-group';
import { omitUndefined } from '../utils/object';

export const BUTTON_VARIANTS = ['filled', 'tonal', 'outlined', 'elevated', 'text'] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

/** M3E button sizes. `small` is the default. */
export const BUTTON_SIZES = ['xsmall', 'small', 'medium', 'large', 'xlarge'] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export type ButtonShape = 'round' | 'square';

export interface ButtonProps {
  /** Defaults to `'filled'`. */
  variant?: ButtonVariant;
  /** Defaults to `'small'`. */
  size?: ButtonSize;
  /** Defaults to `'round'`. */
  shape?: ButtonShape;
  /**
   * Makes it a toggle button, which reports `selected` changes. The spec has no toggle for text
   * buttons, so `toggle` is ignored on them.
   */
  toggle?: boolean;
  /** Whether a toggle button is on. */
  selected?: boolean;
  /** Native disabled: not focusable and not pressable. This is the spec's behavior. */
  disabled?: boolean;
  /**
   * Disabled but still focusable, so it stays discoverable, for example in a toolbar. Clicks are
   * blocked in JavaScript instead. This deviates from the spec, which says disabled components
   * can't be focused.
   */
  softDisabled?: boolean;
  /** Defaults to `'button'`, so a button inside a form doesn't submit it by accident. */
  type?: 'button' | 'submit' | 'reset';
  /**
   * Identifies the button inside a button group that keeps a selection. Such a group makes the
   * button a toggle and decides whether it is selected.
   */
  value?: ButtonGroupValue;
}

export const buttonDefaults = {
  variant: 'filled',
  size: 'small',
  shape: 'round',
  toggle: false,
  selected: false,
  disabled: false,
  softDisabled: false,
  type: 'button',
} satisfies Omit<Required<ButtonProps>, 'value'>;

export interface ButtonOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => ButtonProps;
  /** Called for a click that isn't blocked. */
  onClick: (event: MouseEvent) => void;
  /** Called after an unblocked click on a toggle button, with the new value. */
  onSelectedChange: (selected: boolean) => void;
}

export interface ButtonApi {
  rootAttrs: () => Record<string, string | undefined>;
  /** Attach to the root element's `click`. */
  handleClick: (event: MouseEvent) => void;
}

const isToggle = (p: ButtonProps) => !!p.toggle && p.variant !== 'text';

/** Defaults under the given props, skipping props that are explicitly `undefined`. */
const resolve = (props: ButtonProps) => ({ ...buttonDefaults, ...omitUndefined(props) });

export function createButton(options: ButtonOptions): ButtonApi {
  return {
    rootAttrs() {
      const p = resolve(options.props());
      const toggle = isToggle(p);
      return {
        type: p.type,
        disabled: p.disabled ? '' : undefined,
        // Native disabled already says it; aria-disabled is only for the soft variant.
        'aria-disabled': p.softDisabled && !p.disabled ? 'true' : undefined,
        'aria-pressed': toggle ? String(p.selected) : undefined,
        'data-variant': p.variant,
        'data-size': p.size,
        'data-shape': p.shape,
        'data-selected': toggle ? String(p.selected) : undefined,
      };
    },
    handleClick(event) {
      const p = options.props();
      if (p.disabled || p.softDisabled) {
        // Keyboard and pointer clicks still reach a soft-disabled button. Stop form submission too.
        event.preventDefault();
        return;
      }
      options.onClick(event);
      if (isToggle(p)) options.onSelectedChange(!p.selected);
    },
  };
}
