import { attachRipple, type RippleHandle } from '@rio-m3e/core';
import '@rio-m3e/styles/base/ripple.css';
import type { ObjectDirective } from 'vue';

const handles = new WeakMap<HTMLElement, RippleHandle>();

const sync = (el: HTMLElement, enabled: boolean) => {
  const handle = handles.get(el);
  if (enabled && !handle) handles.set(el, attachRipple(el));
  if (!enabled && handle) {
    handle.detach();
    handles.delete(el);
  }
};

/**
 * Adds the M3 press ripple to an element: `<button v-ripple>`. `v-ripple="false"` turns it off,
 * and the value can change at any time.
 *
 * It only draws the ripple. It doesn't make an element pressable, so put it on something that
 * already is, such as a `button` or a link, or give the element a role, focusability, and keyboard
 * handling yourself.
 */
export const vRipple: ObjectDirective<HTMLElement, boolean | undefined> = {
  mounted(el, { value }) {
    sync(el, value !== false);
  },
  updated(el, { value }) {
    sync(el, value !== false);
  },
  beforeUnmount(el) {
    sync(el, false);
  },
};
