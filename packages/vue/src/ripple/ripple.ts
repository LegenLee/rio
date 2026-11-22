import { attachRipple, type RippleHandle } from '@rio-m3e/core';
import '@rio-m3e/styles/base/ripple.css';
import { watch, type ObjectDirective, type Ref } from 'vue';

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

/**
 * For a component whose presses ripple on one of its parts: presses on `element` ripple on
 * `surface`, as on a checkbox's input and its state part. Attaches again when either element is
 * replaced, as when a chip turns into a link, and detaches as the component unmounts.
 */
export function useRipple(
  element: Readonly<Ref<HTMLElement | null>>,
  surface: Readonly<Ref<HTMLElement | null>>,
) {
  watch(
    [element, surface],
    ([el, state], _, onCleanup) => {
      if (!el || !state) return;
      const ripple = attachRipple(el, { surface: state });
      onCleanup(() => ripple.detach());
    },
    { flush: 'post' },
  );
}
