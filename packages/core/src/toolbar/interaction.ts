// The toolbar's behavior in the DOM.
//
// - Every item stays in the tab order, as the app renders it: Tab goes through them all.
// - The arrow keys also move the focus between the items, wrapping around at the ends: left and
//   right in a horizontal toolbar, up and down in a vertical one. Home and End go to the first and
//   the last. Right to left, left and right go the other way.
// - The items are what Tab reaches inside, one radio button for a group, but not inside a menu,
//   dialog, or other overlay open within the toolbar.
// - A key an item uses itself is left to it: any key in a text field or a select, a radio button's
//   arrows, which move through its group, and a key the item already handled, as a chip set or a
//   slider does with its arrows.

import { isRtl } from '../primitives/direction/direction';
import { isRadio, tabbablesIn } from '../utils/focus';
import { hasModifier } from '../utils/keyboard';

export interface ToolbarHandle {
  detach(): void;
}

/** Fields whose own keys, arrows included, move a caret or a value */
const TEXT_ENTRY =
  'textarea, select, [contenteditable]:not([contenteditable="false"]), input:not([type="button"], [type="checkbox"], [type="radio"], [type="reset"], [type="submit"], [type="image"], [type="color"], [type="file"])';

const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

/** Whether two elements are radio buttons of one group */
const sameGroup = (a: Element, b: Element) =>
  isRadio(a) && isRadio(b) && !!a.name && a.name === b.name && a.form === b.form;

export function attachToolbar(root: HTMLElement): ToolbarHandle {
  /** What Tab reaches, but not inside a menu, dialog, or other overlay open within the toolbar */
  const items = () =>
    tabbablesIn(root).filter((el) => {
      const overlay = el.closest('[popover], dialog');
      return !overlay || !root.contains(overlay) || overlay === root;
    });

  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || hasModifier(event) || event.shiftKey) return;
    const target = event.target as HTMLElement;
    if (target.matches?.(TEXT_ENTRY)) return;
    // A radio button's arrows move through its group, checking each.
    if (isRadio(target) && ARROWS.includes(event.key)) return;
    // The orientation core's root part writes
    const vertical = root.getAttribute('aria-orientation') === 'vertical';
    const back = vertical ? 'ArrowUp' : 'ArrowLeft';
    const forth = vertical ? 'ArrowDown' : 'ArrowRight';
    if (![back, forth, 'Home', 'End'].includes(event.key)) return;
    const list = items();
    // A radio button stands for its group, whichever one has the focus.
    const index = list.findIndex(
      (el) => el === target || el.contains(target) || sameGroup(el, target),
    );
    if (index < 0) return;
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = list.length - 1;
    else {
      // In right-to-left layouts the next item of a horizontal toolbar is on the left.
      const forward = (event.key === forth) !== (!vertical && isRtl(root));
      next = (index + (forward ? 1 : -1) + list.length) % list.length;
    }
    event.preventDefault();
    list[next]!.focus();
  };

  root.addEventListener('keydown', onKeydown);
  return {
    detach() {
      root.removeEventListener('keydown', onKeydown);
    },
  };
}
