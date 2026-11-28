import { accentStyle, type AccentColor } from '../accent/accent';
import type { ButtonGroupValue } from '../button-group/button-group';
import type { CancelableEvent, PartAttrs, PartNode } from '../parts';
import { disabledAttrs, isBlocked } from '../utils/disabled';
import { linkAttrs } from '../utils/link';
import { resolveProps } from '../utils/object';

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
   * The theme color its accent takes, in place of the spec's: `'error'`, `'tertiary'`, or a static
   * color of the theme. Without it, the button keeps the spec's colors, or the color of a button
   * group around it.
   */
  color?: AccentColor;
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
   * Makes it a link to this address, an `<a>` that looks the same. A link can't toggle, and `type`
   * doesn't apply. Disabled, it keeps no `href`, so nothing can follow it.
   */
  href?: string;
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
} satisfies Omit<Required<ButtonProps>, 'color' | 'value' | 'href'>;

/** What the adapter has to put in the button, which only the adapter can see. */
export interface ButtonContent {
  /** Whether there is a leading icon. */
  icon: boolean;
}

export interface ButtonOptions<E extends CancelableEvent = MouseEvent> {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => ButtonProps;
  /** Returns what content the adapter has. Without it, the button has no icon. */
  content?: () => ButtonContent;
  /** Called for a click that isn't blocked, with the event `handleClick` got. */
  onClick: (event: E) => void;
  /** Called after an unblocked click on a toggle button, with the requested value. */
  onChange: (selected: boolean) => void;
}

/**
 * The button's markup, part by part. `buttonSkeleton` says how the adapter nests them.
 */
export interface ButtonParts {
  root: () => PartAttrs;
  /** Extends small buttons to the 48px target. */
  touch: () => PartAttrs;
  icon: () => PartAttrs;
  label: () => PartAttrs;
}

/** How the adapter renders the button's parts. The icon holds the leading icon. */
export const buttonSkeleton: PartNode<keyof ButtonParts, 'showsIcon'> = {
  part: 'root',
  tag: 'button',
  children: [
    { part: 'touch', tag: 'span' },
    { part: 'icon', tag: 'span', when: 'showsIcon', content: true },
    { part: 'label', tag: 'span', content: true },
  ],
};

/** The same parts in an `<a>`, while `isLink()` */
export const buttonLinkSkeleton: PartNode<keyof ButtonParts, 'showsIcon'> = {
  ...buttonSkeleton,
  tag: 'a',
};

export interface ButtonApi<E extends CancelableEvent = MouseEvent> {
  parts: ButtonParts;
  /** Whether to render the icon part. */
  showsIcon: () => boolean;
  /** Whether the root is an `<a>` (`buttonLinkSkeleton`) rather than a `<button>`. */
  isLink: () => boolean;
  /** Attach to the root element's `click`. */
  handleClick: (event: E) => void;
}

const isLink = (p: ButtonProps) => p.href !== undefined;
const isToggle = (p: ButtonProps) => !!p.toggle && p.variant !== 'text' && !isLink(p);

export function createButton<E extends CancelableEvent = MouseEvent>(
  options: ButtonOptions<E>,
): ButtonApi<E> {
  return {
    parts: {
      root() {
        /** Defaults under the given props, skipping props that are explicitly `undefined`. */
        const p = resolveProps(buttonDefaults, options.props());
        if (isLink(p)) {
          return {
            class: 'rio-button rio-state-layer rio-focus-ring',
            ...linkAttrs(p),
            'data-variant': p.variant,
            'data-size': p.size,
            'data-shape': p.shape,
            style: accentStyle(p.color),
          };
        }
        const toggle = isToggle(p);
        return {
          class: 'rio-button rio-state-layer rio-focus-ring',
          type: p.type,
          ...disabledAttrs(p),
          'aria-pressed': toggle ? String(p.selected) : undefined,
          'data-variant': p.variant,
          'data-size': p.size,
          'data-shape': p.shape,
          'data-selected': toggle ? String(p.selected) : undefined,
          style: accentStyle(p.color),
        };
      },
      touch: () => ({ class: 'rio-button__touch rio-touch-target', 'aria-hidden': 'true' }),
      // The icon only decorates; the label names the button.
      icon: () => ({ class: 'rio-button__icon', 'aria-hidden': 'true' }),
      label: () => ({ class: 'rio-button__label' }),
    },
    showsIcon: () => !!options.content?.().icon,
    isLink: () => isLink(options.props()),
    handleClick(event) {
      const p = options.props();
      if (isBlocked(p)) {
        // Keyboard and pointer clicks still reach a soft-disabled button. Stop form submission too.
        event.preventDefault();
        return;
      }
      options.onClick(event);
      if (isToggle(p)) options.onChange(!p.selected);
    },
  };
}
