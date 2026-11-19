// The select's behavior in the DOM. The list is a popover in the top layer, placed below the
// field, as a menu is (see "Overlays" in docs/conventions.md).
//
// - A press anywhere on the field's container opens the list, and a press while it is open closes
//   it. A press on something inside that takes the focus itself, such as an icon button, is left
//   to it.
// - The list opens below the field, or above it without room there, at least as wide as the field
//   (`select.css`). The focus moves into it, to the selected option, or else the first.
// - On the field: Down, Up, Enter, Space, and Alt+Down open the list. Home and End open it on the
//   first and the last option, and letters on the next option whose label starts with them.
// - In the list: Up and Down move between the options, stopping at the ends. Home and End go to
//   the ends, and Page Up and Page Down ten options at a time. Letters move as on the field. Enter
//   and Space choose the option; a space while letters are being typed is part of the search.
//   Disabled options take the focus too.
// - Escape and Alt+Up close the list without changing the selection. Tab closes it too, and the
//   focus moves on from the field. Closing with the focus in the list gives it back to the field.
// - The hidden native `<select>` holds the same selection. A change it makes on its own, as the
//   browser's autofill does, is reported. When the browser focuses it, as a failed `required`
//   check does, the focus goes on to the field. A form's reset puts it back in line with the
//   adapter's selection; resetting the selection is the app's.

import { attachAnchoredPosition } from '../primitives/anchored-position/anchored-position';
import { attachFormReset } from '../primitives/form-reset/form-reset';
import { attachOverlay } from '../primitives/overlay/overlay';
import { createTypeahead } from '../utils/typeahead';

export interface SelectDomElements {
  /** The field's box, which a press opens the list from, and which the list is placed against */
  container: HTMLElement;
  /** The `combobox` */
  field: HTMLElement;
  /** The `listbox`, holding the options */
  listbox: HTMLElement;
  /** The hidden native `<select>` */
  native: HTMLSelectElement;
}

export interface SelectDomOptions {
  disabled: () => boolean;
  /** The selected values, as the native `<select>` spells them (`nativeValue()`) */
  selected: () => readonly string[];
  /**
   * Asks for the list to open or close: a press, a key, or the list closing on its own (Escape, a
   * click outside, Tab, or another overlay opening). The adapter sets `open` to match.
   */
  onOpenChange: (open: boolean) => void;
  /** The native `<select>` changed on its own, as autofill changes it: the values it holds now */
  onNativeChange: (values: string[]) => void;
}

export interface SelectDomHandle {
  /** Brings the list in line with `open`. Call it once attached, and whenever `open` changes. */
  sync(open: boolean): void;
  /** Puts the native `<select>` in line with the selection. Call it after each render. */
  update(): void;
  detach(): void;
}

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]';
/** How many options Page Up and Page Down move */
const PAGE = 10;

/** Which option takes the focus as the list opens */
type Target = 'selected' | 'first' | 'last' | number;

export function attachSelect(
  elements: SelectDomElements,
  options: SelectDomOptions,
): SelectDomHandle {
  const { container, field, listbox, native } = elements;
  const document = field.ownerDocument;
  const overlay = attachOverlay(listbox, {
    mode: 'auto',
    onClose: () => options.onOpenChange(false),
  });
  // Stays attached while the list is closed, so a closing animation keeps its place.
  const anchored = attachAnchoredPosition(listbox, {
    anchor: () => container,
    side: 'bottom',
    align: 'start',
    fallbacks: ['top'],
  });

  const isOpen = () => listbox.matches(':popover-open');
  const items = () => [...listbox.querySelectorAll<HTMLElement>('[role="option"]')];
  const labels = (all: HTMLElement[]) =>
    all.map(
      (item) => item.querySelector('.rio-menu-item__label')?.textContent ?? item.textContent ?? '',
    );
  const selectedIndex = (all: HTMLElement[]) =>
    all.findIndex((item) => item.getAttribute('aria-selected') === 'true');
  const focusAt = (index: number) => {
    const all = items();
    all[Math.max(0, Math.min(index, all.length - 1))]?.focus();
  };

  let target: Target = 'selected';
  const open = (at: Target = 'selected') => {
    target = at;
    options.onOpenChange(true);
  };
  const focusTarget = () => {
    const all = items();
    const selected = selectedIndex(all);
    const index =
      typeof target === 'number'
        ? target
        : target === 'first'
          ? 0
          : target === 'last'
            ? all.length - 1
            : Math.max(selected, 0);
    target = 'selected';
    all[index]?.focus();
  };

  const search = createTypeahead();
  /** Letters move to the next match, from the focused option, or the selected one on the field */
  const typeahead = (key: string, from: number) => {
    const all = items();
    return search.find(key, labels(all), from);
  };

  // On the field, while the list is closed
  const onFieldKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || isOpen()) return;
    if (options.disabled()) return;
    const handled = () => event.preventDefault();
    if (event.altKey) {
      if (event.key === 'ArrowDown') {
        handled();
        open();
      }
      return;
    }
    if (event.key.length === 1 && !(event.key === ' ' && !search.typing())) {
      handled();
      const index = typeahead(event.key, selectedIndex(items()));
      if (index >= 0) open(index);
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        handled();
        open();
        return;
      case 'Home':
        handled();
        open('first');
        return;
      case 'End':
        handled();
        open('last');
        return;
    }
  };

  // In the list
  const onListKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
    // Not prevented: the browser moves on from the field, which takes the focus first, even from
    // an adapter that closes the list only later.
    if (event.key === 'Tab') {
      options.onOpenChange(false);
      field.focus();
      return;
    }
    const handled = () => event.preventDefault();
    if (event.altKey) {
      if (event.key === 'ArrowUp') {
        handled();
        options.onOpenChange(false);
      }
      return;
    }
    const at = items().indexOf(document.activeElement as HTMLElement);
    switch (event.key) {
      case 'ArrowDown':
        handled();
        focusAt(at + 1);
        return;
      case 'ArrowUp':
        handled();
        focusAt(at < 0 ? 0 : at - 1);
        return;
      case 'Home':
        handled();
        focusAt(0);
        return;
      case 'End':
        handled();
        focusAt(Infinity);
        return;
      case 'PageDown':
        handled();
        focusAt(at + PAGE);
        return;
      case 'PageUp':
        handled();
        focusAt(at - PAGE);
        return;
    }
    // A space chooses the option, unless letters typed a moment ago are still adding up.
    if (event.key.length === 1 && !(event.key === ' ' && !search.typing())) {
      handled();
      items()[typeahead(event.key, at)]?.focus();
    }
  };

  // A press on the container, outside anything in it that takes the focus itself
  const ownPress = (event: Event) => {
    const other = (event.target as Element).closest(FOCUSABLE);
    return !other || other === field || !container.contains(other);
  };
  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || options.disabled() || !ownPress(event)) return;
    // Keeps the focus from landing nowhere; the field takes it.
    event.preventDefault();
    field.focus();
  };
  // Where the browser ignores what the list was shown from, the press is a click outside, which
  // closes the list before the click. The request to open then finds `open` still set, and the
  // browser's word of the closing follows.
  const onClick = (event: MouseEvent) => {
    if (options.disabled() || !ownPress(event)) return;
    if (isOpen()) options.onOpenChange(false);
    else open();
  };

  // The hidden native `<select>`
  const update = () => {
    const values = options.selected();
    for (const option of native.options) option.selected = values.includes(option.value);
  };
  const onNativeChange = () =>
    options.onNativeChange([...native.selectedOptions].map((option) => option.value));
  const onNativeFocus = () => field.focus();
  field.addEventListener('keydown', onFieldKeydown);
  listbox.addEventListener('keydown', onListKeydown);
  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('click', onClick);
  native.addEventListener('change', onNativeChange);
  native.addEventListener('focus', onNativeFocus);
  const reset = attachFormReset([native], update);
  update();

  return {
    sync(next) {
      if (next && !isOpen()) {
        // What it opened from: a press on the container while it is open isn't a click outside.
        overlay.show(container);
        anchored.update();
        focusTarget();
      } else if (!next) {
        const hadFocus = listbox.contains(document.activeElement);
        target = 'selected';
        overlay.hide();
        search.reset();
        if (hadFocus) field.focus();
      }
    },
    update,
    detach() {
      reset.detach();
      field.removeEventListener('keydown', onFieldKeydown);
      listbox.removeEventListener('keydown', onListKeydown);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('click', onClick);
      native.removeEventListener('change', onNativeChange);
      native.removeEventListener('focus', onNativeFocus);
      overlay.detach();
      anchored.detach();
    },
  };
}
