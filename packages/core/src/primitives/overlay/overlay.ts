// Shows an element in the top layer and keeps Rio's overlays in order, for menus, tooltips, and
// dialogs. The top layer stacks overlays in the order they open, above everything else: a dialog
// covers a menu opened before it, and a menu opened from a dialog covers the dialog.
//
// - `auto`: a popover the browser manages, as a menu is. One inside another, or shown from an
//   element inside it (`source`), keeps that one open; showing an unrelated one closes the rest; a
//   click outside closes them all; and a modal dialog closes them as it opens.
// - `manual`: a popover only Rio closes, as a tooltip is.
// - `modal`: a `<dialog>` shown with `showModal()`, which makes the rest of the page inert.
//
// What the browser leaves to Rio:
// - Escape closes the topmost overlay only. Browsers differ here: Firefox closes at once every
//   popover that opened without a user activation, such as submenus opened on hover. So Rio takes
//   Escape first, cancels the browser's handling, and asks the topmost overlay to close. Escape
//   aimed at a dialog or popover the app opened itself (the focus is inside it) is left to the
//   browser.
// - Closing an overlay closes the overlays opened from it. The browser does this for nested auto
//   popovers, but not for a popover opened from a dialog.
// - A `transient` overlay, such as a tooltip, closes when any other overlay opens.
//
// The adapter owns `open` and calls `show()` and `hide()` to match it. When an overlay closes, or
// asks to close, on its own, `onClose` tells the adapter why, and the adapter sets its state to
// closed. Only Escape is a request the adapter can turn down; the other reasons arrive after the
// overlay closed. A popover that a click outside closed, for one, is closed already: the browser
// can't be stopped from doing that.
//
// Each document keeps its own record, so overlays in an iframe stack among themselves.

export type OverlayMode = 'auto' | 'manual' | 'modal';

/**
 * Why an overlay closed, or asks to close, without the adapter asking:
 * - `'escape'`: Escape, or the back gesture on a dialog. The overlay is still open, and the adapter
 *   can turn the request down, as a dialog with unsaved changes might.
 * - `'dismiss'`: the browser closed it: a click outside, or another popover or a modal dialog
 *   opening.
 * - `'parent'`: the overlay it was opened from closed.
 * - `'replaced'`: another overlay opened, and this transient one gave way.
 *
 * All but `'escape'` arrive after the overlay closed, so the adapter has to follow them.
 */
export type OverlayCloseReason = 'escape' | 'dismiss' | 'parent' | 'replaced';

export interface OverlayOptions {
  mode: OverlayMode;
  /** Closes when any other overlay opens, as a tooltip does. */
  transient?: boolean;
  /** The overlay closed, or asks to close, without the adapter asking. */
  onClose: (reason: OverlayCloseReason) => void;
}

export interface OverlayHandle {
  /**
   * Shows the element. `source` is what opened it, such as a menu item: a popover shown from
   * inside an auto popover keeps that one open, and closes with it.
   */
  show(source?: HTMLElement): void;
  /** Closes the element, without calling `onClose`. */
  hide(): void;
  detach(): void;
}

interface Entry {
  element: HTMLElement;
  options: OverlayOptions;
  source?: HTMLElement;
  /** The open overlays of the element's document, in the order they opened. */
  stack: Entry[];
  /** Why Rio is closing it, until the event that reports the close arrives. */
  reason?: OverlayCloseReason;
}

interface Registry {
  stack: Entry[];
  attached: number;
  onKeydown: (event: KeyboardEvent) => void;
}

const registries = new WeakMap<Document, Registry>();

const isOpen = ({ element, options }: Entry) =>
  options.mode === 'modal' ? (element as HTMLDialogElement).open : element.matches(':popover-open');

const close = (entry: Entry) => {
  if (!isOpen(entry)) return;
  if (entry.options.mode === 'modal') (entry.element as HTMLDialogElement).close();
  else entry.element.hidePopover();
};

// `show()` records the opening at once, and the `toggle` event that follows a task later finds it
// recorded. Popovers the browser opens itself (`popovertarget`) are recorded by that event.
const opened = (entry: Entry) => {
  const { stack } = entry;
  if (stack.includes(entry)) return;
  stack.push(entry);
  for (const other of stack.filter((open) => open !== entry && open.options.transient)) {
    other.reason = 'replaced';
    close(other);
  }
};

// `hide()` takes the overlay off the record at once too (`asked`), so a `show()` in the same task
// starts afresh; the event that follows finds nothing to do.
const closed = (entry: Entry, asked: boolean) => {
  const { stack } = entry;
  const index = stack.indexOf(entry);
  if (index < 0) return;
  stack.splice(index, 1);
  const reason = entry.reason ?? 'dismiss';
  entry.reason = undefined;
  if (!asked) entry.options.onClose(reason);
  // What it opened goes with it. Nested auto popovers are closed by the browser already, and
  // still get the reason when their event arrives.
  const inside = (node: Node | undefined) => !!node && entry.element.contains(node);
  for (const other of stack.filter((open) => inside(open.element) || inside(open.source))) {
    other.reason = 'parent';
    close(other);
  }
};

const registryOf = (document: Document) => {
  let registry = registries.get(document);
  if (!registry) {
    const stack: Entry[] = [];
    // Bubbling, so an element that handles Escape itself (and cancels it) keeps it.
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
      const top = stack.at(-1);
      if (!top) return;
      // Aimed at a dialog or popover the app opened itself, of a kind the browser closes on Escape
      // (a modal dialog, or a popover that isn't manual): the browser closes that one.
      const target = event.target as Element | null;
      const host =
        typeof target?.closest === 'function'
          ? target.closest('dialog:modal, :popover-open:not([popover="manual"])')
          : null;
      if (host && !stack.some((open) => open.element === host)) return;
      event.preventDefault();
      top.options.onClose('escape');
    };
    registry = { stack, attached: 0, onKeydown };
    registries.set(document, registry);
  }
  return registry;
};

export function attachOverlay(element: HTMLElement, options: OverlayOptions): OverlayHandle {
  const modal = options.mode === 'modal';
  if (modal && element.localName !== 'dialog') {
    throw new TypeError('A modal overlay must be a <dialog> element.');
  }
  const document = element.ownerDocument;
  const registry = registryOf(document);
  const entry: Entry = { element, options, stack: registry.stack };

  // Popovers report opening and closing, whoever caused it, and dialogs report closing. Events
  // arrive a task later, so they are checked against the element's state now.
  const onToggle = () => (isOpen(entry) ? opened(entry) : closed(entry, false));
  const onDialogClose = () => {
    if (!isOpen(entry)) closed(entry, false);
  };
  // Escape reaches a dialog as `cancel` when the keydown above didn't take it, for example with
  // the Android back gesture. The adapter decides.
  const onCancel = (event: Event) => {
    event.preventDefault();
    options.onClose('escape');
  };

  if (modal) {
    element.addEventListener('close', onDialogClose);
    element.addEventListener('cancel', onCancel);
  } else {
    element.popover = options.mode;
    element.addEventListener('toggle', onToggle);
  }
  if (registry.attached++ === 0) document.addEventListener('keydown', registry.onKeydown);

  let detached = false;
  return {
    show(source) {
      if (detached || isOpen(entry)) return;
      // Rio may have closed it in this same task (for another overlay, or with its parent), with
      // the event yet to come: it starts afresh, on top, and the reason given then is void.
      const index = entry.stack.indexOf(entry);
      if (index >= 0) entry.stack.splice(index, 1);
      entry.reason = undefined;
      entry.source = source;
      if (modal) (element as HTMLDialogElement).showModal();
      // Browsers without `source` ignore the argument; nesting in the DOM still works there.
      else (element.showPopover as (options?: { source?: HTMLElement }) => void)({ source });
      opened(entry);
    },
    hide() {
      if (!isOpen(entry)) return;
      close(entry);
      closed(entry, true);
    },
    detach() {
      if (detached) return;
      detached = true;
      element.removeEventListener('close', onDialogClose);
      element.removeEventListener('cancel', onCancel);
      element.removeEventListener('toggle', onToggle);
      const index = entry.stack.indexOf(entry);
      if (index >= 0) entry.stack.splice(index, 1);
      close(entry);
      if (!modal) element.removeAttribute('popover');
      if (--registry.attached === 0) document.removeEventListener('keydown', registry.onKeydown);
    },
  };
}
