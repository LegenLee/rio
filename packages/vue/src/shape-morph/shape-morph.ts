import { attachShapeMorph, type ShapeMorphHandle } from '@rio-m3e/core';
import '@rio-m3e/styles/base/shape-morph.css';
import type { ObjectDirective } from 'vue';

const handles = new WeakMap<HTMLElement, ShapeMorphHandle>();

/**
 * Springs an element's corner radius toward `--rio-shape-morph-target` whenever its state
 * attributes change. Used inside Rio's components; not exported yet.
 */
export const vShapeMorph: ObjectDirective<HTMLElement> = {
  mounted(el) {
    handles.set(el, attachShapeMorph(el));
  },
  beforeUnmount(el) {
    handles.get(el)?.detach();
    handles.delete(el);
  },
};
