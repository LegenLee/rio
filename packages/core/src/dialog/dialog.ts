import type { PartAttrs, PartNode } from '../parts';
import { resolveProps } from '../utils/object';

/**
 * The dialog's ARIA role: `alertdialog` for a prompt that asks for a response, such as a
 * confirmation, and `dialog` for one that holds a list or a form.
 */
export const DIALOG_ROLES = ['alertdialog', 'dialog'] as const;
export type DialogRole = (typeof DIALOG_ROLES)[number];

/**
 * Basic, a window over the page; full-screen, covering it with a header that holds a close button
 * and the confirming button; or adaptive: full-screen in a compact window, narrower than 600px,
 * and basic in a wider one, with a Cancel button for the close button.
 */
export const DIALOG_VARIANTS = ['basic', 'full-screen', 'adaptive'] as const;
export type DialogVariant = (typeof DIALOG_VARIANTS)[number];

export interface DialogProps {
  /** Whether the dialog is shown. */
  open?: boolean;
  /** Defaults to `'basic'`. */
  variant?: DialogVariant;
  /** Defaults to `'alertdialog'` for a basic dialog, and `'dialog'` for the others. */
  role?: DialogRole;
}

/** `role` is left out: its default depends on the variant (`DialogProps.role`). */
export const dialogDefaults = {
  open: false,
  variant: 'basic',
} satisfies Omit<Required<DialogProps>, 'role'>;

/** What the adapter has to put in the dialog, which only the adapter can see. */
export interface DialogContent {
  /** An icon above the headline */
  icon: boolean;
  headline: boolean;
  /** Buttons below the content */
  actions: boolean;
}

/** How the content overflows, from `attachDialog`'s `onOverflowChange`, which the adapter keeps */
export interface DialogOverflow {
  /** More of the content is hidden above, or below: the dividers show. */
  top: boolean;
  bottom: boolean;
  /** The content scrolls, with nothing inside that takes the focus, so it takes it itself. */
  focusable: boolean;
}

export interface DialogOptions {
  props: () => DialogProps;
  /** Without it, the dialog has only its content. */
  content?: () => DialogContent;
  /** Without it, the content doesn't overflow. */
  overflow?: () => DialogOverflow;
  /** Ids for the parts the dialog refers to, unique in the document. The adapter makes them. */
  ids: { headline: string; content: string };
  /** Whether the window is compact, as `attachDialog` reports it, for an adaptive dialog */
  compact?: () => boolean;
}

export interface DialogParts {
  /** The `<dialog>`, shown in the top layer */
  root: () => PartAttrs;
  /** Holds the icon, which only decorates: the headline says what the dialog is for. */
  icon: () => PartAttrs;
  headline: () => PartAttrs;
  /** Holds the supporting text, or a list or a form. It scrolls when it doesn't fit. */
  content: () => PartAttrs;
  /** Holds the buttons. */
  actions: () => PartAttrs;
  /** A full-screen dialog's header: the close button, the headline, and the confirming button */
  header: () => PartAttrs;
  /** Holds the close button the adapter renders, which asks to close (`attachDialog`'s `dismiss`) */
  dismiss: () => PartAttrs;
}

type DialogPart = keyof DialogParts;
type DialogWhen = 'showsIcon' | 'showsHeadline' | 'showsActions';

/**
 * The markup of an open dialog. The parts inside render from opening until `attachDialog`'s
 * `onClosed`; a closed dialog is the empty `<dialog>`.
 */
export const dialogSkeleton: PartNode<DialogPart, DialogWhen> = {
  part: 'root',
  tag: 'dialog',
  children: [
    { part: 'icon', tag: 'div', when: 'showsIcon', content: true },
    { part: 'headline', tag: 'h2', when: 'showsHeadline', content: true },
    { part: 'content', tag: 'div', content: true },
    { part: 'actions', tag: 'div', when: 'showsActions', content: true },
  ],
};

/**
 * The markup of an open full-screen dialog: the header, with the close button, the headline, and
 * the confirming button, over the content.
 */
export const fullScreenDialogSkeleton: PartNode<DialogPart, DialogWhen> = {
  part: 'root',
  tag: 'dialog',
  children: [
    {
      part: 'header',
      tag: 'div',
      children: [
        { part: 'dismiss', tag: 'div', content: true },
        { part: 'headline', tag: 'h2', when: 'showsHeadline', content: true },
        { part: 'actions', tag: 'div', when: 'showsActions', content: true },
      ],
    },
    { part: 'content', tag: 'div', content: true },
  ],
};

export interface DialogApi extends Record<DialogWhen, () => boolean> {
  parts: DialogParts;
  /** Whether it shows full-screen: a full-screen dialog, or an adaptive one in a compact window */
  fullScreen: () => boolean;
  /**
   * Whether the adapter renders a button that asks to close: a full-screen dialog's close button,
   * or an adaptive dialog's Cancel button, first among the actions, in a wider window.
   */
  showsDismiss: () => boolean;
  /** `fullScreenDialogSkeleton` or `dialogSkeleton`, as it shows */
  skeleton: () => PartNode<DialogPart, DialogWhen>;
}

const NO_CONTENT: DialogContent = { icon: false, headline: false, actions: false };

export function createDialog(options: DialogOptions): DialogApi {
  const props = () => resolveProps(dialogDefaults, options.props());
  const content = () => options.content?.() ?? NO_CONTENT;
  const fullScreen = () => {
    const { variant } = props();
    return variant === 'full-screen' || (variant === 'adaptive' && !!options.compact?.());
  };
  const showsDismiss = () => props().variant !== 'basic';
  const role = (): DialogRole =>
    props().role ?? (props().variant === 'basic' ? 'alertdialog' : 'dialog');
  // A full-screen dialog has no icon; its header holds the headline and the confirming button.
  const showsIcon = () => content().icon && !fullScreen();
  const showsHeadline = () => content().headline;
  const showsActions = () => content().actions || (showsDismiss() && !fullScreen());
  const { ids } = options;

  return {
    parts: {
      root() {
        const alert = role() === 'alertdialog';
        return {
          class: 'rio-dialog',
          // A `<dialog>` is a dialog already.
          role: alert ? 'alertdialog' : undefined,
          'aria-labelledby': showsHeadline() ? ids.headline : undefined,
          // An alert dialog's message is read with its name.
          'aria-describedby': alert ? ids.content : undefined,
          // With an icon, the icon and the headline are centered.
          'data-icon': showsIcon() ? '' : undefined,
          'data-full-screen': fullScreen() ? '' : undefined,
        };
      },
      header: () => ({ class: 'rio-dialog__header' }),
      dismiss: () => ({ class: 'rio-dialog__dismiss' }),
      icon: () => ({ class: 'rio-dialog__icon', 'aria-hidden': 'true' }),
      headline: () => ({ class: 'rio-dialog__headline', id: ids.headline }),
      content: () => {
        const overflow = options.overflow?.();
        return {
          class: 'rio-dialog__content rio-focus-ring',
          id: ids.content,
          // It takes the focus only to scroll, and its edges meet the dialog's.
          tabindex: overflow?.focusable ? '0' : undefined,
          'data-focus-ring': 'inner',
          'data-overflow-top': overflow?.top ? '' : undefined,
          'data-overflow-bottom': overflow?.bottom ? '' : undefined,
        };
      },
      actions: () => ({ class: 'rio-dialog__actions' }),
    },
    showsIcon,
    showsHeadline,
    showsActions,
    fullScreen,
    showsDismiss,
    skeleton: () => (fullScreen() ? fullScreenDialogSkeleton : dialogSkeleton),
  };
}
