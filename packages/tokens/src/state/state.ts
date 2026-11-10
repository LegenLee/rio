import { TOKEN_PREFIX } from '../prefix';

export const STATE_LAYER_STATES = ['hover', 'focus', 'pressed', 'dragged', 'disabled'] as const;

/**
 * States with a state-layer opacity token. `disabled` is named like the others, but components
 * apply it to disabled labels and icons rather than to an overlay.
 */
export type StateLayerState = (typeof STATE_LAYER_STATES)[number];

export const FOCUS_INDICATOR_PARTS = ['thickness', 'outer-offset', 'inner-offset'] as const;

export type FocusIndicatorPart = (typeof FOCUS_INDICATOR_PARTS)[number];

export type StateVar =
  | `${typeof TOKEN_PREFIX}-state-${StateLayerState}-state-layer-opacity`
  | `${typeof TOKEN_PREFIX}-state-focus-indicator-${FocusIndicatorPart}`;

/** `md.sys.state.*` from Material Web (v34.0.21), matching the state layer table on m3.material.io. */
const OPACITY: Record<StateLayerState, number> = {
  hover: 0.08,
  focus: 0.1,
  pressed: 0.1,
  dragged: 0.16,
  disabled: 0.38,
};

/** `md.sys.state.focus-indicator.*` from the same source, in px. */
const FOCUS_INDICATOR: Record<FocusIndicatorPart, number> = {
  thickness: 3,
  'outer-offset': 2,
  'inner-offset': -3,
};

/** CSS variable name for a state-layer opacity. `hover` → `--rio-state-hover-state-layer-opacity` */
export function stateLayerOpacityVar(state: StateLayerState): StateVar {
  return `${TOKEN_PREFIX}-state-${state}-state-layer-opacity`;
}

/** CSS variable name for the focus indicator. `thickness` → `--rio-state-focus-indicator-thickness` */
export function focusIndicatorVar(part: FocusIndicatorPart): StateVar {
  return `${TOKEN_PREFIX}-state-focus-indicator-${part}`;
}

/** State-layer opacities and focus indicator dimensions. Fixed values. */
export function createStateVariables(): Record<StateVar, string> {
  const vars = {} as Record<StateVar, string>;
  for (const state of STATE_LAYER_STATES) {
    vars[stateLayerOpacityVar(state)] = String(OPACITY[state]);
  }
  for (const part of FOCUS_INDICATOR_PARTS) {
    vars[focusIndicatorVar(part)] = `${FOCUS_INDICATOR[part]}px`;
  }
  return vars;
}
