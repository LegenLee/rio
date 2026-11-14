// The split button's menu icon: it turns half a circle when the menu opens or closes, and moves
// from slightly off center (closed) to the center (open). The spec drives both with the standard
// motion scheme, whatever the theme's scheme, so the springs come from the
// `--rio-motion-standard-fast-spatial-*` variables.
//
// The stylesheet (`@rio-m3e/styles/split-button.css`) declares the targets on the trailing button:
// `--rio-split-button-menu-turn-target` (an angle) and `--rio-split-button-menu-shift-target` (how
// far the icon sits toward the start). The springs write `--_menu-turn` and `--_menu-shift` on the
// trailing button and remove them at rest. Under reduced motion they jump.

import { attachSpringProperty } from '../primitives/spring-property/spring-property';

export interface SplitButtonMenuIconHandle {
  detach(): void;
}

const inlineVar = (el: HTMLElement, name: string, unit: string) => (value: number | undefined) =>
  value === undefined
    ? el.style.removeProperty(name)
    : el.style.setProperty(name, `${value}${unit}`);

/** Attach to the trailing button. */
export function attachSplitButtonMenuIcon(trailing: HTMLElement): SplitButtonMenuIconHandle {
  const token = 'standard-fast-spatial';
  const turn = attachSpringProperty(trailing, {
    target: '--rio-split-button-menu-turn-target',
    token,
    apply: inlineVar(trailing, '--_menu-turn', 'deg'),
  });
  const shift = attachSpringProperty(trailing, {
    target: '--rio-split-button-menu-shift-target',
    token,
    apply: inlineVar(trailing, '--_menu-shift', 'px'),
  });
  return {
    detach() {
      turn.detach();
      shift.detach();
    },
  };
}
