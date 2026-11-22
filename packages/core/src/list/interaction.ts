// The list's behavior in the DOM.
//
// The list (`attachList`), when its items act or are chosen:
// - The list is one stop in the tab order. Tab enters at the selected item, or else the first,
//   and leaving the list brings the stop back there. The arrow keys move the focus through the
//   items, an action item's secondary actions included, and wrap around at the ends: Down and
//   Right to the next, Up and Left to the one before (Right and Left swap right to left); Home
//   and End go to the first and the last.
// - The tab stop is the key of the item the focus is on, which it reports (`onTabStopChange`) for
//   the adapter to keep and the items' parts to render as `tabindex`. The secondary actions, the
//   app's own elements, are kept out of the tab order here, and so is what takes the focus in an
//   option's leading and trailing elements, such as a checkbox that shows its state. Each gets its
//   `tabindex` back when it no longer is one, and on detaching.
// - Space or Enter on an option chooses it, and Space on a link follows it, as a click does.
// - When the item with the focus goes away, the focus goes to the item that takes its place, or
//   the one before it if it was the last.
//
// An item (`attachListItem`) reports whether its supporting text wraps onto more lines.
//
// The elements the keys move to carry `data-list-focus` with their item's key, which core's item
// parts write.

import { isRtl } from '../primitives/direction/direction';
import { FOCUSABLE_SELECTOR } from '../utils/focus';
import { hasModifier } from '../utils/keyboard';

export interface ListDomOptions {
  /** The key of the item the tab stop is on, as the adapter has it. */
  tabStop: () => string | undefined;
  /** The tab stop moved to another item, or to none when the list has no item that acts. */
  onTabStopChange: (key: string | undefined) => void;
}

export interface ListDomHandle {
  /** Checks the tab stop and the secondary actions against the items. Call it after each render. */
  sync(): void;
  detach(): void;
}

const keyOf = (el: Element) => (el as HTMLElement).dataset.listFocus;

export function attachList(root: HTMLElement, options: ListDomOptions): ListDomHandle {
  const document = root.ownerDocument;
  const items = () => [...root.querySelectorAll<HTMLElement>(':scope > .rio-list-item')];
  /** An item's option, or its action */
  const primaryOf = (item: HTMLElement) =>
    item.matches('[data-list-focus]')
      ? item
      : item.querySelector<HTMLElement>(':scope > [data-list-focus]');
  /** What takes the focus in an action item's trailing element */
  const secondariesOf = (item: HTMLElement) =>
    item.matches("[data-kind='link'], [data-kind='button']")
      ? [
          ...item.querySelectorAll<HTMLElement>(
            `:scope > .rio-list-item__trailing :is(${FOCUSABLE_SELECTOR})`,
          ),
        ].filter((el) => !el.matches(':disabled'))
      : [];
  /** What takes the focus in an option's leading and trailing elements, which only draw */
  const drawnOf = (item: HTMLElement) =>
    item.matches("[data-kind='option']")
      ? [
          ...item.querySelectorAll<HTMLElement>(
            `:scope > :is(.rio-list-item__leading, .rio-list-item__trailing) :is(${FOCUSABLE_SELECTOR})`,
          ),
        ]
      : [];
  const primaries = () => items().flatMap((item) => primaryOf(item) ?? []);
  /** What the list keeps out of the tab order */
  const quieted = () => items().flatMap((item) => [...secondariesOf(item), ...drawnOf(item)]);
  /** What the keys move through, in order: each item's option or action, then its secondary actions */
  const stops = () =>
    items().flatMap((item) => [primaryOf(item) ?? [], secondariesOf(item)].flat());
  const itemKey = (el: Element) =>
    keyOf(el) ?? keyOf(primaryOf(el.closest<HTMLElement>('.rio-list-item')!)!);
  /** Where Tab enters: the selected item, or else the first */
  const preferred = () => {
    const list = primaries();
    return keyOf(list.find((el) => el.getAttribute('aria-selected') === 'true') ?? list[0]!);
  };
  const report = (key: string | undefined) => {
    if (key !== options.tabStop()) options.onTabStopChange(key);
  };

  /**
   * The own `tabindex` of what the list keeps out of the tab order, given back when it no longer
   * does, as when an item stops acting, and on detaching
   */
  const saved = new Map<HTMLElement, string | null>();
  const giveBack = (el: HTMLElement) => {
    const tabindex = saved.get(el);
    if (tabindex === null || tabindex === undefined) el.removeAttribute('tabindex');
    else el.setAttribute('tabindex', tabindex);
    saved.delete(el);
  };
  const quiet = () => {
    const current = new Set(quieted());
    // Deleting the entry being visited leaves the iteration going on with the next one.
    for (const el of saved.keys()) {
      if (!current.has(el)) giveBack(el);
    }
    for (const el of current) {
      const tabindex = el.getAttribute('tabindex');
      if (tabindex === '-1' && saved.has(el)) continue;
      // New, or the app has set its own `tabindex` since
      saved.set(el, tabindex);
      if (tabindex !== '-1') el.setAttribute('tabindex', '-1');
    }
  };

  /** The element the focus was last on, and its place among the stops */
  let last: { element: HTMLElement; index: number } | undefined;

  const sync = () => {
    quiet();
    const list = primaries();
    if (last && !last.element.isConnected) {
      const { index } = last;
      last = undefined;
      const active = document.activeElement;
      const all = stops();
      if ((!active || active === document.body) && all.length > 0) {
        // The focus event reports the new tab stop.
        all[Math.min(index, all.length - 1)]!.focus();
        return;
      }
    }
    const keys = list.map(keyOf);
    const stop = options.tabStop();
    if (stop === undefined || !keys.includes(stop)) report(list.length ? preferred() : undefined);
  };

  const onFocusIn = (event: FocusEvent) => {
    const element = event.target as HTMLElement;
    const all = stops();
    const index = all.indexOf(element);
    if (index < 0) return;
    last = { element, index };
    report(itemKey(element));
  };

  // Leaving the list brings the tab stop back to where Tab enters. The focus also goes as the
  // focused item is removed, while it is still in the document; the removal reaches `sync` first,
  // so the forgetting waits for the next task.
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;
  const onFocusOut = (event: FocusEvent) => {
    if (root.contains(event.relatedTarget as Node | null)) return;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      if (root.contains(document.activeElement)) return;
      if (last?.element.isConnected) last = undefined;
      if (primaries().length) report(preferred());
    });
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || hasModifier(event) || event.shiftKey) return;
    const target = event.target as HTMLElement;
    const all = stops();
    const index = all.indexOf(target);
    if (index < 0) return;
    if (event.key === ' ' || event.key === 'Enter') {
      // Options and links: a click chooses or follows. Buttons do it themselves.
      const option = target.getAttribute('role') === 'option';
      const link = target.matches('a.rio-list-item__action');
      if (option || (link && event.key === ' ')) {
        event.preventDefault();
        target.click();
      }
      return;
    }
    const rtl = isRtl(root);
    const step: Record<string, number> = {
      ArrowDown: 1,
      ArrowUp: -1,
      ArrowRight: rtl ? -1 : 1,
      ArrowLeft: rtl ? 1 : -1,
    };
    const by = step[event.key];
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? all.length - 1
          : by === undefined
            ? undefined
            : (index + by + all.length) % all.length;
    if (next === undefined) return;
    event.preventDefault();
    all[next]!.focus();
  };

  // Items come and go, and secondary actions with them, as the app renders them.
  const observer = new MutationObserver(sync);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-list-focus', 'aria-selected', 'data-kind', 'tabindex'],
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
      for (const el of saved.keys()) giveBack(el);
    },
  };
}

export interface ListItemDomOptions {
  /** The supporting text wraps onto more lines, or no longer does. */
  onMultilineChange: (multiline: boolean) => void;
}

export interface ListItemDomHandle {
  /** Measures the supporting text again. Call it after each render. */
  sync(): void;
  detach(): void;
}

export function attachListItem(root: HTMLElement, options: ListItemDomOptions): ListItemDomHandle {
  let multiline = false;
  let observed: Element | null = null;
  const measure = () => {
    const supporting = root.querySelector<HTMLElement>('.rio-list-item__supporting');
    const lineHeight = supporting ? parseFloat(getComputedStyle(supporting).lineHeight) : NaN;
    // More than one line: taller than a line and a half
    const next =
      !!supporting &&
      Number.isFinite(lineHeight) &&
      supporting.getBoundingClientRect().height > lineHeight * 1.5;
    if (next === multiline) return;
    multiline = next;
    options.onMultilineChange(next);
  };
  const resize = new ResizeObserver(measure);
  const sync = () => {
    const supporting = root.querySelector('.rio-list-item__supporting');
    if (supporting !== observed) {
      if (observed) resize.unobserve(observed);
      if (supporting) resize.observe(supporting);
      observed = supporting;
    }
    measure();
  };
  sync();
  return {
    sync,
    detach: () => resize.disconnect(),
  };
}
