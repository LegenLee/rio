// The chip set's behavior in the DOM.
//
// - The set is one stop in the tab order. Tab enters at one chip, and the arrow keys move the focus
//   through the chips and their remove buttons, wrapping around at the ends; Home and End go to
//   the first and the last. Right to left, the arrows go the other way.
// - The chip Tab enters at is the set's tab stop: the chip the focus was last on, which it reports
//   (`onTabStopChange`) for the adapter to keep and the chips' parts to render as `tabindex`. Until
//   the focus comes in, and after the tab stop's chip leaves or can no longer take the focus, it is
//   the first chip that can.
// - When the chip with the focus is removed, the focus goes to the chip that takes its place, or
//   to the one before it if it was the last. A chip removed after the focus has left the set
//   leaves the focus where it is.
//
// The elements the arrow keys go through carry `data-chip-focus` with their chip's key, which
// core's chip parts write.

export interface ChipSetDomOptions {
  /** The key of the chip the tab stop is on, as the adapter has it. */
  tabStop: () => string | undefined;
  /** The tab stop moved to another chip, or to none when the set has no chip that takes focus. */
  onTabStopChange: (key: string | undefined) => void;
}

export interface ChipSetDomHandle {
  /** Checks the tab stop against the chips. Call it after each render. */
  sync(): void;
  detach(): void;
}

const keyOf = (el: Element) => (el as HTMLElement).dataset.chipFocus!;

export function attachChipSet(root: HTMLElement, options: ChipSetDomOptions): ChipSetDomHandle {
  const document = root.ownerDocument;
  const items = () => [...root.querySelectorAll<HTMLElement>('[data-chip-focus]')];
  const keysOf = (list: HTMLElement[]) => [...new Set(list.map(keyOf))];
  /** The element the focus was last on, and its chip's place among the chips */
  let last: { element: HTMLElement; chip: number } | undefined;

  const report = (key: string | undefined) => {
    if (key !== options.tabStop()) options.onTabStopChange(key);
  };

  const sync = () => {
    const list = items();
    const keys = keysOf(list);
    if (last && !last.element.isConnected) {
      const { chip } = last;
      last = undefined;
      const active = document.activeElement;
      if ((!active || active === document.body) && keys.length > 0) {
        const key = keys[Math.min(chip, keys.length - 1)];
        // The focus event reports the new tab stop.
        list.find((el) => keyOf(el) === key)?.focus();
        return;
      }
    }
    const stop = options.tabStop();
    if (stop === undefined || !keys.includes(stop)) report(keys[0]);
  };

  const onFocusIn = (event: FocusEvent) => {
    const element = (event.target as Element).closest?.<HTMLElement>('[data-chip-focus]');
    if (!element || !root.contains(element)) return;
    const key = keyOf(element);
    last = { element, chip: keysOf(items()).indexOf(key) };
    report(key);
  };

  // The focus left the set, so a chip removed later didn't have it. The focus also goes as the
  // focused chip is removed, while it is still in the document; the removal reaches `sync` first,
  // so the forgetting waits for the next task.
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;
  const onFocusOut = (event: FocusEvent) => {
    if (root.contains(event.relatedTarget as Node | null)) return;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      if (last?.element.isConnected && !root.contains(document.activeElement)) last = undefined;
    });
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.shiftKey) return;
    const list = items();
    const index = list.findIndex((el) => el.contains(event.target as Node));
    if (index < 0) return;
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = list.length - 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      // In right-to-left layouts the next chip is on the left.
      const forward = (event.key === 'ArrowRight') !== (getComputedStyle(root).direction === 'rtl');
      next = (index + (forward ? 1 : -1) + list.length) % list.length;
    } else return;
    event.preventDefault();
    list[next]!.focus();
  };

  // Chips come and go, and turn disabled, as the app renders them.
  const observer = new MutationObserver(sync);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-chip-focus'],
  });
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  root.addEventListener('keydown', onKeydown);
  sync();

  return {
    sync,
    detach() {
      clearTimeout(leaveTimer);
      observer.disconnect();
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      root.removeEventListener('keydown', onKeydown);
    },
  };
}
