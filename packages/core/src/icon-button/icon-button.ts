import type { ButtonGroupValue } from '../button-group/button-group';
import {
  createButton,
  type ButtonApi,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from '../button/button';

export const ICON_BUTTON_VARIANTS = ['filled', 'tonal', 'outlined', 'standard'] as const;
export type IconButtonVariant = (typeof ICON_BUTTON_VARIANTS)[number];

/** M3E icon button widths. `default` makes a square (or circle) as wide as it is tall. */
export const ICON_BUTTON_WIDTHS = ['narrow', 'default', 'wide'] as const;
export type IconButtonWidth = (typeof ICON_BUTTON_WIDTHS)[number];

export interface IconButtonProps {
  /**
   * The accessible name. It should describe the action, such as "Add to favorites", not the icon,
   * such as "Heart".
   */
  label: string;
  /** Defaults to `'filled'`, the spec's default. */
  variant?: IconButtonVariant;
  /** Defaults to `'small'`. */
  size?: ButtonSize;
  /** Defaults to `'default'`. */
  width?: IconButtonWidth;
  /** Defaults to `'round'`. */
  shape?: ButtonShape;
  /** Makes it a toggle button, which reports `selected` changes. All four variants can toggle. */
  toggle?: boolean;
  /** Whether a toggle button is on. */
  selected?: boolean;
  /** Native disabled: not focusable and not pressable. This is the spec's behavior. */
  disabled?: boolean;
  /** Disabled but still focusable, as on the button. Deviates from the spec. */
  softDisabled?: boolean;
  /** Defaults to `'button'`, so it doesn't submit a form by accident. */
  type?: 'button' | 'submit' | 'reset';
  /** Identifies the button inside a button group that keeps a selection, as on the button. */
  value?: ButtonGroupValue;
}

export const iconButtonDefaults = {
  variant: 'filled',
  size: 'small',
  width: 'default',
  shape: 'round',
  toggle: false,
  selected: false,
  disabled: false,
  softDisabled: false,
  type: 'button',
} satisfies Omit<Required<IconButtonProps>, 'label' | 'value'>;

export interface IconButtonOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => IconButtonProps;
  /** Called for a click that isn't blocked. */
  onClick: (event: MouseEvent) => void;
  /** Called after an unblocked click on a toggle button, with the new value. */
  onSelectedChange: (selected: boolean) => void;
}

export function createIconButton(options: IconButtonOptions): ButtonApi {
  // An icon button behaves exactly like a button. The button only reads `variant` to write
  // `data-variant` and to keep text buttons from toggling, and no icon button variant is `text`.
  const button = createButton({
    ...options,
    props: () => ({ ...options.props(), variant: options.props().variant as ButtonVariant }),
  });

  return {
    rootAttrs() {
      const p = options.props();
      return {
        ...button.rootAttrs(),
        'aria-label': p.label,
        'data-width': p.width ?? iconButtonDefaults.width,
        'data-variant': p.variant ?? iconButtonDefaults.variant,
      };
    },
    handleClick: button.handleClick,
  };
}
