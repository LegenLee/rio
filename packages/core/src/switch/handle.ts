// The switch handle's motion: where it sits and how big it is, both driven by the fast-spatial
// spring, plus dragging it with touch or a pen, as the spec allows.
//
// The stylesheet (`@rio-m3e/styles/switch.css`) declares the targets for each state:
// `--rio-switch-handle-x-target` (the handle's center) and `--rio-switch-handle-size-target`. The
// springs write the animated values to `--_handle-x` and `--_handle-size` on the root, and remove
// them at rest. While dragging, the handle follows the finger, and on release it springs to the
// side the user chose, starting at the finger's speed.

import { attachDrag } from '../primitives/drag/drag';
import { attachSpringProperty } from '../primitives/spring-property/spring-property';

export interface SwitchHandleOptions {
  /** Returns whether the switch is on. */
  selected: () => boolean;
  /** Called when a drag ends on the other side. */
  onSelectedChange: (selected: boolean) => void;
}

export interface SwitchHandleHandle {
  detach(): void;
}

/** A release faster than this (px/s) picks the side it's heading to, wherever the handle is. */
const FLING_VELOCITY = 300;

const inlineVar = (el: HTMLElement, name: string) => (value: number | undefined) =>
  value === undefined ? el.style.removeProperty(name) : el.style.setProperty(name, `${value}px`);

const readPx = (el: Element, name: string) =>
  parseFloat(getComputedStyle(el).getPropertyValue(name));

export function attachSwitchHandle(
  root: HTMLElement,
  options: SwitchHandleOptions,
): SwitchHandleHandle {
  const x = attachSpringProperty(root, {
    target: '--rio-switch-handle-x-target',
    apply: inlineVar(root, '--_handle-x'),
  });
  const size = attachSpringProperty(root, {
    target: '--rio-switch-handle-size-target',
    apply: inlineVar(root, '--_handle-size'),
  });

  let from = 0;
  let off = 0;
  let on = 0;
  // In right-to-left layouts the "on" side is on the left, so screen motion flips.
  let direction = 1;

  const drag = attachDrag(root, {
    onStart() {
      off = readPx(root, '--rio-switch-handle-x-off');
      on = readPx(root, '--rio-switch-handle-x-on');
      direction = getComputedStyle(root).direction === 'rtl' ? -1 : 1;
      from = x.value;
      x.hold(from);
    },
    onMove({ dx }) {
      x.hold(Math.min(on, Math.max(off, from + direction * dx)));
    },
    onEnd({ velocityX }) {
      const velocity = direction * velocityX;
      const next = Math.abs(velocity) > FLING_VELOCITY ? velocity > 0 : x.value > (off + on) / 2;
      if (next !== options.selected()) options.onSelectedChange(next);
      // If the state changes, the target moves a moment later and the spring retargets smoothly.
      x.release(velocity);
    },
    onCancel() {
      x.release();
    },
  });

  return {
    detach() {
      drag.detach();
      x.detach();
      size.detach();
    },
  };
}
