import { attachCornerMorph, type CornerMorphHandle } from '@rio-m3e/core';
import '@rio-m3e/styles/base/corner-morph.css';
import type { ObjectDirective } from 'vue';

const handles = new WeakMap<HTMLElement, CornerMorphHandle>();

/**
 * Springs an element's corner radius toward `--rio-corner-morph-target` whenever its state
 * attributes change. Used inside Rio's components; not exported yet.
 */
export const vCornerMorph: ObjectDirective<HTMLElement> = {
  mounted(el) {
    handles.set(el, attachCornerMorph(el));
  },
  beforeUnmount(el) {
    handles.get(el)?.detach();
    handles.delete(el);
  },
};
