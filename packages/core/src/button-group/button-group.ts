import { accentStyle, type AccentColor } from '../accent/accent';
import type { ButtonShape, ButtonSize } from '../button/button';
import type { PartAttrs, PartNode } from '../parts';
import { resolveProps } from '../utils/object';
import { nextSelection, selectedValues } from '../utils/selection';

/**
 * M3E button group variants. A standard group spaces its buttons and lets a pressed button push
 * its neighbors; a connected group joins them with 2px gaps and shared corners, and fills the
 * width it is given.
 */
export const BUTTON_GROUP_VARIANTS = ['standard', 'connected'] as const;
export type ButtonGroupVariant = (typeof BUTTON_GROUP_VARIANTS)[number];

/** Whether the group's buttons can be selected: none, one at a time, or any number. */
export const BUTTON_GROUP_SELECTIONS = ['none', 'single', 'multiple'] as const;
export type ButtonGroupSelection = (typeof BUTTON_GROUP_SELECTIONS)[number];

/** Identifies a button inside a selecting group, through its `value` prop. */
export type ButtonGroupValue = string | number;

/** The selected value for `single` (or `undefined`), or the selected values for `multiple`. */
export type ButtonGroupSelected = ButtonGroupValue | ButtonGroupValue[] | undefined;

export interface ButtonGroupProps {
  /** Defaults to `'standard'`. */
  variant?: ButtonGroupVariant;
  /** The size of every button in the group that doesn't set its own. Defaults to `'small'`. */
  size?: ButtonSize;
  /** The shape of every button in the group that doesn't set its own. Defaults to `'round'`. */
  shape?: ButtonShape;
  /** The theme color of every button in the group that doesn't set its own, as on the button. */
  color?: AccentColor;
  /**
   * Turns buttons that have a `value` into toggle buttons whose selection the group keeps.
   * Defaults to `'none'`, where every button acts on its own.
   */
  selection?: ButtonGroupSelection;
  /** With a selection, keeps at least one button selected: the last one can't be turned off. */
  required?: boolean;
  /** The selected value (`single`) or values (`multiple`). */
  selected?: ButtonGroupSelected;
}

export const buttonGroupDefaults = {
  variant: 'standard',
  size: 'small',
  shape: 'round',
  selection: 'none',
  required: false,
} satisfies Omit<Required<ButtonGroupProps>, 'color' | 'selected'>;

export interface ButtonGroupOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => ButtonGroupProps;
  /** Called with the requested selection. Adapters wire it to v-model, a callback prop, and so on. */
  onChange: (selected: ButtonGroupSelected) => void;
}

/**
 * The button group's markup. `buttonGroupSkeleton` says how the adapter renders it.
 */
export interface ButtonGroupParts {
  root: () => PartAttrs;
}

/** How the adapter renders the button group: one root, with the buttons as its direct children. */
export const buttonGroupSkeleton: PartNode<keyof ButtonGroupParts> = {
  part: 'root',
  tag: 'div',
  content: true,
};

export interface ButtonGroupApi {
  parts: ButtonGroupParts;
  /** The size for buttons that don't set their own, with the default filled in. */
  size: () => ButtonSize;
  /** The shape for buttons that don't set their own, with the default filled in. */
  shape: () => ButtonShape;
  /** The selection mode, with the default filled in. */
  selection: () => ButtonGroupSelection;
  /** Whether the button with this value is selected. */
  isSelected: (value: ButtonGroupValue) => boolean;
  /**
   * Requests turning the button with this value on or off. The group applies its selection rules:
   * a single selection turns the previous button off, and `required` keeps the last one on.
   */
  select: (value: ButtonGroupValue, selected: boolean) => void;
}

export function createButtonGroup(options: ButtonGroupOptions): ButtonGroupApi {
  const props = () => resolveProps(buttonGroupDefaults, options.props());

  const isSelected = (value: ButtonGroupValue) => {
    const p = props();
    return p.selection !== 'none' && selectedValues(p.selected).includes(value);
  };

  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-button-group',
          role: 'group',
          'data-variant': p.variant,
          'data-size': p.size,
          'data-shape': p.shape,
          // The buttons inherit it, unless they set their own.
          style: accentStyle(p.color),
        };
      },
    },
    size: () => props().size,
    shape: () => props().shape,
    selection: () => props().selection,
    isSelected,
    select(value, selected) {
      const next = nextSelection(props(), value, selected);
      if (next) options.onChange(next.selected);
    },
  };
}
