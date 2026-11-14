import { createButton, type ButtonSize } from '../button/button';
import type { PartAttrs, PartNode } from '../parts';
import { omitUndefined } from '../utils/object';

/** Split button colors: the button's, without text. */
export const SPLIT_BUTTON_VARIANTS = ['filled', 'tonal', 'outlined', 'elevated'] as const;
export type SplitButtonVariant = (typeof SPLIT_BUTTON_VARIANTS)[number];

/** What the trailing button opens, for `aria-haspopup`. */
export type SplitButtonPopup = 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';

export interface SplitButtonProps {
  /**
   * Names the trailing button. It should say that more choices for the leading action are there,
   * such as "More watch options" next to "Watch later".
   */
  menuLabel: string;
  /**
   * Names the leading button when it has no label text, only an icon. Ignored when there is label
   * text, so the visible label stays the name (WCAG 2.5.3).
   */
  label?: string;
  /** Defaults to `'filled'`. */
  variant?: SplitButtonVariant;
  /** Defaults to `'small'`. */
  size?: ButtonSize;
  /** Whether what the trailing button opens is open. */
  open?: boolean;
  /** What the trailing button opens. Defaults to `'menu'`. */
  popup?: SplitButtonPopup;
  /** Native disabled, on both buttons: not focusable and not pressable. The spec's behavior. */
  disabled?: boolean;
  /** Disabled but still focusable, on both buttons, as on the button. Deviates from the spec. */
  softDisabled?: boolean;
  /** The leading button's type. Defaults to `'button'`; the trailing button is always `'button'`. */
  type?: 'button' | 'submit' | 'reset';
}

export const splitButtonDefaults = {
  variant: 'filled',
  size: 'small',
  open: false,
  popup: 'menu',
  disabled: false,
  softDisabled: false,
  type: 'button',
} satisfies Omit<Required<SplitButtonProps>, 'menuLabel' | 'label'>;

/** What the adapter has to put in the leading button, which only the adapter can see. */
export interface SplitButtonContent {
  /** Whether there is a leading icon. */
  icon: boolean;
  /** Whether there is label text. */
  label: boolean;
}

export interface SplitButtonOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => SplitButtonProps;
  /** Returns what content the adapter has. Without it, the leading button has only a label. */
  content?: () => SplitButtonContent;
  /** Called for a click on the leading button that isn't blocked. */
  onClick: (event: MouseEvent) => void;
  /** Called with the requested `open` when the trailing button is clicked and isn't blocked. */
  onChange: (open: boolean) => void;
}

/** The split button's markup, part by part. `splitButtonSkeleton` says how the adapter nests them. */
export interface SplitButtonParts {
  root: () => PartAttrs;
  /** The main action, a button with an icon, label text, or both. */
  leading: () => PartAttrs;
  /** The button that opens the menu. */
  trailing: () => PartAttrs;
  /** Extends each button to the 48px target. Both buttons have one. */
  touch: () => PartAttrs;
  icon: () => PartAttrs;
  label: () => PartAttrs;
  /** Holds the expand icon, which turns when the menu opens. */
  menuIcon: () => PartAttrs;
}

/**
 * How the adapter renders the split button's parts. The icon and the label hold the leading
 * button's content; the menu icon holds the expand icon the app provides.
 */
export const splitButtonSkeleton: PartNode<keyof SplitButtonParts, 'showsIcon' | 'showsLabel'> = {
  part: 'root',
  tag: 'div',
  children: [
    {
      part: 'leading',
      tag: 'button',
      children: [
        { part: 'touch', tag: 'span' },
        { part: 'icon', tag: 'span', when: 'showsIcon', content: true },
        { part: 'label', tag: 'span', when: 'showsLabel', content: true },
      ],
    },
    {
      part: 'trailing',
      tag: 'button',
      children: [
        { part: 'touch', tag: 'span' },
        { part: 'menuIcon', tag: 'span', content: true },
      ],
    },
  ],
};

export interface SplitButtonApi {
  parts: SplitButtonParts;
  /** Whether to render the icon part. */
  showsIcon: () => boolean;
  /** Whether to render the label part. */
  showsLabel: () => boolean;
  /** Attach to the leading button's `click`. */
  handleLeadingClick: (event: MouseEvent) => void;
  /** Attach to the trailing button's `click`. */
  handleTrailingClick: (event: MouseEvent) => void;
}

export function createSplitButton(options: SplitButtonOptions): SplitButtonApi {
  const props = () => ({ ...splitButtonDefaults, ...omitUndefined(options.props()) });
  const content = () => options.content?.() ?? { icon: false, label: true };

  // Both halves behave like buttons: the same sizes, colors, disabled handling, and click guard.
  const shared = () => {
    const p = props();
    return {
      variant: p.variant,
      size: p.size,
      disabled: p.disabled,
      softDisabled: p.softDisabled,
    };
  };
  const leading = createButton({
    props: () => ({ ...shared(), type: props().type }),
    onClick: options.onClick,
    onChange: () => {},
  });
  const trailing = createButton({
    props: () => ({ ...shared(), type: 'button' }),
    onClick: () => options.onChange(!props().open),
    onChange: () => {},
  });

  return {
    parts: {
      root: () => ({ class: 'rio-split-button' }),
      leading() {
        const root = leading.parts.root();
        return {
          ...root,
          class: `${root.class} rio-split-button__leading`,
          'aria-label': content().label ? undefined : props().label,
        };
      },
      trailing() {
        const p = props();
        const root = trailing.parts.root();
        return {
          ...root,
          class: `${root.class} rio-split-button__trailing`,
          'aria-label': p.menuLabel,
          'aria-haspopup': p.popup,
          'aria-expanded': String(p.open),
          'data-open': p.open ? '' : undefined,
        };
      },
      touch: leading.parts.touch,
      icon: leading.parts.icon,
      label: leading.parts.label,
      menuIcon: () => ({ class: 'rio-split-button__menu-icon', 'aria-hidden': 'true' }),
    },
    showsIcon: () => content().icon,
    showsLabel: () => content().label,
    handleLeadingClick: leading.handleClick,
    handleTrailingClick: trailing.handleClick,
  };
}
