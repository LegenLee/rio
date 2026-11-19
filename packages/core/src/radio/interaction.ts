// The radio group's behavior in the DOM. The browser moves the arrow keys and the tab stop among
// radio buttons that share a name. Engines differ in two places, and the group makes them behave
// the same:
//
// - With none selected, Shift+Tab into the group lands on the first radio button in Chromium and
//   Firefox, and on the last in WebKit. The group moves the focus on to the last.
// - At either end, the arrow keys wrap around to the other end in Chromium, and stop in WebKit.
//   When the focus stays put, the group moves it to the other end and selects that radio button.

import { hasModifier } from '../utils/keyboard';

export interface RadioGroupDomHandle {
  detach(): void;
}

export function attachRadioGroup(root: HTMLElement): RadioGroupDomHandle {
  const radios = () =>
    [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]')].filter(
      (radio) => !radio.disabled,
    );

  const onFocusIn = (event: FocusEvent) => {
    const all = radios();
    const first = all[0];
    const last = all.at(-1);
    if (!first || !last || first === last || event.target !== first) return;
    if (all.some((radio) => radio.checked)) return;
    // From the keyboard, and from something after the group: Shift+Tab, not Tab or a click.
    const from = event.relatedTarget;
    if (!(from instanceof Node) || root.contains(from)) return;
    if (!(root.compareDocumentPosition(from) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
    if (!first.matches(':focus-visible')) return;
    last.focus();
  };

  let wrapTimer: ReturnType<typeof setTimeout> | undefined;
  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || hasModifier(event)) return;
    const from = event.target;
    if (!(from instanceof HTMLInputElement) || from.type !== 'radio') return;
    // In right-to-left layouts the next radio button is on the left.
    const rtl = getComputedStyle(from).direction === 'rtl';
    const forward = event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const backward = event.key === 'ArrowUp' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
    if (!forward && !backward) return;
    const all = radios();
    if (all.length < 2 || from !== (forward ? all.at(-1) : all[0])) return;
    // The browser moves the focus as the key's default action, right after this event.
    clearTimeout(wrapTimer);
    wrapTimer = setTimeout(() => {
      if (root.ownerDocument.activeElement !== from) return;
      const to = forward ? all[0]! : all.at(-1)!;
      to.focus();
      to.click();
    });
  };

  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('keydown', onKeydown);
  return {
    detach() {
      clearTimeout(wrapTimer);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('keydown', onKeydown);
    },
  };
}
