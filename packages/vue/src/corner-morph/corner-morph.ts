import { attachCornerMorph, type CornerMorphHandle, type CornerMorphOptions } from '@rio-m3e/core';
import '@rio-m3e/styles/base/corner-morph.css';
import type { ObjectDirective } from 'vue';

const handles = new WeakMap<HTMLElement, CornerMorphHandle>();

/**
 * Springs an element's corner radius toward `--rio-corner-morph-target` whenever its state
 * attributes change. Its value, read once mounted, takes `attachCornerMorph`'s options. Used inside
 * Rio's components; not exported yet.
 */
export const vCornerMorph: ObjectDirective<HTMLElement, CornerMorphOptions | undefined> = {
  mounted(el, binding) {
    handles.set(el, attachCornerMorph(el, binding.value));
  },
  beforeUnmount(el) {
    handles.get(el)?.detach();
    handles.delete(el);
  },
};
