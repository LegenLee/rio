import type { ButtonGroupValue } from '../button-group/button-group';
import {
  createButton,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from '../button/button';
import type { CancelableEvent, PartAttrs, PartNode } from '../parts';

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

/** What the adapter has to put in the icon button, which only the adapter can see. */
export interface IconButtonContent {
  /** Whether there is an icon for the selected state. */
  selectedIcon: boolean;
}

export interface IconButtonOptions<E extends CancelableEvent = MouseEvent> {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => IconButtonProps;
  /** Returns what content the adapter has. Without it, there is no selected icon. */
  content?: () => IconButtonContent;
  /** Called for a click that isn't blocked, with the event `handleClick` got. */
  onClick: (event: E) => void;
  /** Called after an unblocked click on a toggle button, with the requested value. */
  onChange: (selected: boolean) => void;
}

/**
 * The icon button's markup, part by part. `iconButtonSkeleton` says how the adapter nests them.
 */
export interface IconButtonParts {
  root: () => PartAttrs;
  /** Extends small icon buttons to the 48px target. */
  touch: () => PartAttrs;
  icon: () => PartAttrs;
}

/**
 * How the adapter renders the icon button's parts. The icon holds the selected icon when
 * `showsSelectedIcon()`, otherwise the default one.
 */
export const iconButtonSkeleton: PartNode<keyof IconButtonParts> = {
  part: 'root',
  tag: 'button',
  children: [
    { part: 'touch', tag: 'span' },
    { part: 'icon', tag: 'span', content: true },
  ],
};

export interface IconButtonApi<E extends CancelableEvent = MouseEvent> {
  parts: IconButtonParts;
  /** Whether the icon part shows the selected icon instead of the default one. */
  showsSelectedIcon: () => boolean;
  /** Attach to the root element's `click`. */
  handleClick: (event: E) => void;
}

export function createIconButton<E extends CancelableEvent = MouseEvent>(
  options: IconButtonOptions<E>,
): IconButtonApi<E> {
  // An icon button behaves exactly like a button. The button only reads `variant` to write
  // `data-variant` and to keep text buttons from toggling, and no icon button variant is `text`.
  const button = createButton<E>({
    props: () => ({ ...options.props(), variant: options.props().variant as ButtonVariant }),
    onClick: options.onClick,
    onChange: options.onChange,
  });

  return {
    parts: {
      root() {
        const p = options.props();
        const root = button.parts.root();
        return {
          ...root,
          class: `${root.class} rio-icon-button`,
          'aria-label': p.label,
          'data-width': p.width ?? iconButtonDefaults.width,
          'data-variant': p.variant ?? iconButtonDefaults.variant,
        };
      },
      touch: button.parts.touch,
      icon: button.parts.icon,
    },
    showsSelectedIcon() {
      const p = options.props();
      return !!(p.toggle && p.selected && options.content?.().selectedIcon);
    },
    handleClick: button.handleClick,
  };
}
