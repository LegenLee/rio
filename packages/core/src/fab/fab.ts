// The floating action button (M3 Expressive): the screen's most important action, as an icon, or
// extended with its label beside it. Props, parts, and the click.

import { accentStyle, type AccentColor } from '../accent/accent';
import type { CancelableEvent, PartAttrs, PartNode } from '../parts';
import { linkAttrs } from '../utils/link';
import { resolveProps } from '../utils/object';

/** FAB sizes: 56, 80, and 96px, for the FAB and the extended FAB alike. */
export const FAB_SIZES = ['small', 'medium', 'large'] as const;
export type FabSize = (typeof FAB_SIZES)[number];

/**
 * How the FAB takes its color: `tonal`, on the color's container, or `filled`, on the color
 * itself. With `color`, they make the color styles: primary container is `tonal` and `primary`.
 */
export const FAB_VARIANTS = ['tonal', 'filled'] as const;
export type FabVariant = (typeof FAB_VARIANTS)[number];

export interface FabProps {
  /**
   * The action, such as "Compose": the FAB's accessible name, and the label an extended FAB shows.
   * It names the action, not the icon.
   */
  label: string;
  /** Defaults to `'small'`, 56px. */
  size?: FabSize;
  /** Defaults to `'tonal'`. */
  variant?: FabVariant;
  /**
   * The theme color it takes: `'secondary'`, `'tertiary'`, `'error'`, or a static color of the
   * theme. Without it, primary.
   */
  color?: AccentColor;
  /**
   * Shows the label beside the icon, as an extended FAB. Turned off, the FAB shrinks back to its
   * icon, as when the content scrolls. A FAB without an icon always shows its label.
   */
  extended?: boolean;
  /** Defaults to `'button'`, so a FAB inside a form doesn't submit it by accident. */
  type?: 'button' | 'submit' | 'reset';
  /** Makes it a link to this address, an `<a>` that looks the same; `type` doesn't apply. */
  href?: string;
}

export const fabDefaults = {
  size: 'small',
  variant: 'tonal',
  extended: false,
  type: 'button',
} satisfies Omit<Required<FabProps>, 'label' | 'color' | 'href'>;

/** What the adapter has to put in the FAB, which only the adapter can see. */
export interface FabContent {
  /** Whether there is an icon. */
  icon: boolean;
}

export interface FabOptions<E extends CancelableEvent = MouseEvent> {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => FabProps;
  /** Returns what content the adapter has. Without it, the FAB has no icon. */
  content?: () => FabContent;
  /** Called for each click, with the event `handleClick` got. */
  onClick: (event: E) => void;
}

/** The FAB's markup, part by part. `fabSkeleton` says how the adapter nests them. */
export interface FabParts {
  root: () => PartAttrs;
  icon: () => PartAttrs;
  /** The label's room, which grows and shrinks as the FAB extends and shrinks. */
  label: () => PartAttrs;
  /** The label's text, `label`, cut off by its room while it grows or shrinks. */
  text: () => PartAttrs;
}

/** How the adapter renders the FAB's parts. The icon holds the app's icon; the text, `label`. */
export const fabSkeleton: PartNode<keyof FabParts, 'showsIcon'> = {
  part: 'root',
  tag: 'button',
  children: [
    { part: 'icon', tag: 'span', when: 'showsIcon', content: true },
    { part: 'label', tag: 'span', children: [{ part: 'text', tag: 'span', content: true }] },
  ],
};

/** The same parts in an `<a>`, while `isLink()` */
export const fabLinkSkeleton: PartNode<keyof FabParts, 'showsIcon'> = {
  ...fabSkeleton,
  tag: 'a',
};

export interface FabApi<E extends CancelableEvent = MouseEvent> {
  parts: FabParts;
  /** Whether to render the icon part. */
  showsIcon: () => boolean;
  /** Whether the label shows: while `extended`, or always without an icon. */
  showsLabel: () => boolean;
  /** Whether the root is an `<a>` (`fabLinkSkeleton`) rather than a `<button>`. */
  isLink: () => boolean;
  /** Attach to the root element's `click`. */
  handleClick: (event: E) => void;
}

export function createFab<E extends CancelableEvent = MouseEvent>(
  options: FabOptions<E>,
): FabApi<E> {
  const props = () => resolveProps(fabDefaults, options.props());
  const isLink = () => options.props().href !== undefined;
  const showsIcon = () => !!options.content?.().icon;
  const showsLabel = () => props().extended || !showsIcon();

  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-fab rio-state-layer rio-focus-ring',
          // There's no disabled FAB.
          ...(isLink() ? linkAttrs(p) : { type: p.type }),
          // The label names it while it shows only its icon, and while extended alike.
          'aria-label': p.label,
          'data-size': p.size,
          'data-variant': p.variant,
          'data-extended': showsLabel() ? '' : undefined,
          'data-icon': showsIcon() ? '' : undefined,
          style: accentStyle(p.color),
        };
      },
      // The icon only decorates; the label names the FAB.
      icon: () => ({ class: 'rio-fab__icon', 'aria-hidden': 'true' }),
      // The root's name holds the label already, shown or not.
      label: () => ({ class: 'rio-fab__label', 'aria-hidden': 'true' }),
      text: () => ({ class: 'rio-fab__text' }),
    },
    showsIcon,
    showsLabel,
    isLink,
    handleClick(event) {
      options.onClick(event);
    },
  };
}
