// The dialog's behavior in the DOM. `root` is a `<dialog>` shown with `showModal()`: it sits in the
// top layer above a scrim, and the rest of the page is inert. Built on `attachOverlay` (see
// "Overlays" in docs/conventions.md).
//
// - Opening moves the focus to the first element Tab reaches in the dialog, or to the one marked
//   `autofocus`. Closing returns it to where it was, which the browser does.
// - Tab and Shift+Tab go round the dialog's elements instead of leaving for the browser's own UI.
//   Content that scrolls, with nothing inside that takes the focus, takes it itself
//   (`tabindex="0"`), so the keyboard can scroll it.
// - Escape, or a click on the scrim, asks to close: `onCancel` gets an event it can cancel, and the
//   dialog closes unless it does. While a menu or another dialog opened from this one is open, a
//   click on the scrim closes only that.
// - The content scrolls when the dialog doesn't fit the window. `data-overflow-top` and
//   `data-overflow-bottom` on the content say where more of it is hidden, for the dividers. Each
//   opening starts it at the top.
// - Clicks and presses in it stay in it, so a card or a row around the dialog doesn't take them.
// - The page behind doesn't scroll while a dialog is open: the document's root gets
//   `overflow: hidden`. A page that had a scrollbar keeps its space (`scrollbar-gutter: stable`),
//   so the page doesn't shift sideways.
// - `onClosed` tells the adapter when the closing motion has ended, so it can stop rendering the
//   content: a closed dialog leaves no headline or ids in the page.

import type { CancelableEvent } from '../parts';
import { attachOverlay } from '../primitives/overlay/overlay';

/** What asks the dialog to close: Escape (or the back gesture), or a click on the scrim */
export type DialogCancelReason = 'escape' | 'scrim';

export interface DialogCancelEvent extends CancelableEvent {
  readonly reason: DialogCancelReason;
  readonly defaultPrevented: boolean;
}

export interface DialogDomOptions {
  /** Escape or a click on the scrim asks to close. Canceling the event keeps the dialog open. */
  onCancel?: (event: DialogCancelEvent) => void;
  /** The dialog closes on its own, or is asked to and isn't kept open. The adapter sets `open`. */
  onOpenChange: (open: boolean) => void;
  /**
   * The dialog finished closing, its motion included, and hasn't opened again since. The adapter
   * renders the content from opening until then.
   */
  onClosed?: () => void;
}

export interface DialogDomHandle {
  /** Brings the dialog in line with `open`. Call it once attached, and whenever `open` changes. */
  sync(open: boolean): void;
  /** Call it after the content changed, to update the dividers. */
  update(): void;
  detach(): void;
}

const TABBABLE = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

const isRadio = (element: Element): element is HTMLInputElement =>
  element.localName === 'input' && (element as HTMLInputElement).type === 'radio';

const visible = (element: HTMLElement) =>
  typeof element.checkVisibility === 'function'
    ? element.checkVisibility({ visibilityProperty: true })
    : element.getClientRects().length > 0;

/** The elements Tab stops at in `root`, in order. Elements inside shadow roots aren't found. */
const tabbablesIn = (root: HTMLElement) => {
  const all = [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !element.closest('[inert]') &&
      visible(element),
  );
  // Tab stops at one radio button of a group: the checked one, or else the first.
  return all.filter((element) => {
    if (!isRadio(element) || !element.name) return true;
    const group = all.filter(
      (other) => isRadio(other) && other.name === element.name && other.form === element.form,
    ) as HTMLInputElement[];
    const checked = group.find((radio) => radio.checked);
    return element === (checked ?? group[0]);
  });
};

/** How far, in px, the content may scroll and still count as at its end */
const SCROLL_SLOP = 1;

// The page's scroll, locked while any dialog in the document is open. The root's own inline values
// come back when the last one closes.
const scrollLocks = new WeakMap<Document, { count: number; restore: () => void }>();

const lockScroll = (document: Document) => {
  const lock = scrollLocks.get(document);
  if (lock) {
    lock.count++;
    return;
  }
  const html = document.documentElement;
  const view = document.defaultView!;
  const { overflow, scrollbarGutter } = html.style;
  const scrollbar = view.innerWidth - html.clientWidth;
  html.style.overflow = 'hidden';
  // The scrollbar's space stays, unless the page reserves it already.
  if (scrollbar > 0 && view.getComputedStyle(html).scrollbarGutter === 'auto') {
    html.style.scrollbarGutter = 'stable';
  }
  scrollLocks.set(document, {
    count: 1,
    restore() {
      html.style.overflow = overflow;
      html.style.scrollbarGutter = scrollbarGutter;
    },
  });
};

const unlockScroll = (document: Document) => {
  const lock = scrollLocks.get(document);
  if (!lock || --lock.count > 0) return;
  lock.restore();
  scrollLocks.delete(document);
};

export function attachDialog(root: HTMLDialogElement, options: DialogDomOptions): DialogDomHandle {
  const document = root.ownerDocument;

  const cancel = (reason: DialogCancelReason) => {
    let prevented = false;
    options.onCancel?.({
      reason,
      get defaultPrevented() {
        return prevented;
      },
      preventDefault() {
        prevented = true;
      },
    });
    if (!prevented) options.onOpenChange(false);
  };

  const overlay = attachOverlay(root, {
    mode: 'modal',
    contain: true,
    onClose: (reason) => (reason === 'escape' ? cancel('escape') : options.onOpenChange(false)),
  });

  // Tab

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const tabbables = tabbablesIn(root);
    const first = tabbables[0];
    const last = tabbables.at(-1);
    if (!first || !last) {
      // Nothing to move to: the focus stays in the dialog.
      event.preventDefault();
      return;
    }
    const focused = document.activeElement;
    const atEdge = event.shiftKey ? focused === first || focused === root : focused === last;
    if (!atEdge) return;
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  };

  // Scrim. A click on the `::backdrop` targets the dialog, outside its box. A press that starts in
  // the dialog and ends on the scrim, as selecting text may, isn't a click on the scrim.

  const onScrim = (event: MouseEvent) => {
    if (event.target !== root) return false;
    const box = root.getBoundingClientRect();
    return (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    );
  };
  let pressedScrim = false;
  const onPointerDown = (event: PointerEvent) => {
    pressedScrim = onScrim(event) && !overlay.covered();
  };
  const onClick = (event: MouseEvent) => {
    const pressed = pressedScrim;
    pressedScrim = false;
    if (pressed && onScrim(event)) cancel('scrim');
  };

  // Overflow

  const content = () => root.querySelector<HTMLElement>(':scope > .rio-dialog__content');
  const updateDividers = () => {
    const element = content();
    if (!element) return;
    const hidden = element.scrollHeight - element.clientHeight;
    element.toggleAttribute('data-overflow-top', element.scrollTop >= SCROLL_SLOP);
    element.toggleAttribute('data-overflow-bottom', hidden - element.scrollTop >= SCROLL_SLOP);
  };
  /** The content, while it takes the focus so the keyboard can scroll it */
  let reachable: HTMLElement | null = null;
  const setReachable = (element: HTMLElement | null) => {
    if (element === reachable) return;
    reachable?.removeAttribute('tabindex');
    reachable = element;
    reachable?.setAttribute('tabindex', '0');
  };
  const updateOverflow = () => {
    updateDividers();
    const element = content();
    const scrolls = !!element && element.scrollHeight - element.clientHeight >= SCROLL_SLOP;
    setReachable(scrolls && tabbablesIn(element).length === 0 ? element : null);
  };
  // The content's box changes with the window, and its children's with what they hold.
  const resizes = new ResizeObserver(updateOverflow);
  let watched: HTMLElement | null = null;
  const watch = () => {
    resizes.disconnect();
    watched?.removeEventListener('scroll', updateDividers);
    watched = content();
    if (!watched) return;
    watched.addEventListener('scroll', updateDividers, { passive: true });
    resizes.observe(watched);
    for (const child of watched.children) resizes.observe(child);
  };
  const unwatch = () => {
    resizes.disconnect();
    watched?.removeEventListener('scroll', updateDividers);
    watched = null;
    setReachable(null);
  };

  // Focus. Browsers differ on what they focus first: some pick the content when it scrolls, some
  // the first radio button of a group rather than the checked one.

  const focusFirst = () => {
    if (root.querySelector('[autofocus]')) return;
    const tabbables = tabbablesIn(root);
    // Something to act on comes before the content it would scroll.
    (tabbables.find((element) => element !== reachable) ?? tabbables[0])?.focus();
  };

  // Opening and closing. The closing motion is the dialog's and its scrim's transitions, which
  // start as the dialog closes.

  /** Whether this dialog holds a lock on the page's scroll: from opening until it closes */
  let locked = false;
  /** Counts closings, so only the last one reports its end, and only if the dialog stayed closed */
  let closings = 0;
  const closed = () => {
    if (!locked) return;
    locked = false;
    unlockScroll(document);
    const closing = ++closings;
    const motion = root
      .getAnimations({ subtree: true })
      .map((animation) => animation.finished.catch(() => undefined));
    void Promise.all(motion).then(() => {
      if (closing === closings && !root.open) options.onClosed?.();
    });
  };

  root.addEventListener('keydown', onKeydown);
  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('click', onClick);

  return {
    sync(open) {
      if (open && !root.open) {
        overlay.show();
        if (!locked) {
          locked = true;
          lockScroll(document);
        }
        const element = content();
        if (element) element.scrollTop = 0;
        watch();
        updateOverflow();
        focusFirst();
      } else if (!open) {
        // It may have closed on its own already.
        if (root.open) overlay.hide();
        unwatch();
        closed();
      }
    },
    update() {
      if (!root.open) return;
      watch();
      updateOverflow();
    },
    detach() {
      root.removeEventListener('keydown', onKeydown);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('click', onClick);
      unwatch();
      overlay.detach();
      closings++;
      if (locked) {
        locked = false;
        unlockScroll(document);
      }
    },
  };
}
