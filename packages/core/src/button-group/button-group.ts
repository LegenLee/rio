import type { ButtonShape, ButtonSize } from '../button/button';
import { omitUndefined } from '../utils/object';

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
  /**
   * Turns buttons that have a `value` into toggle buttons whose selection the group keeps.
   * Defaults to `'none'`, where every button acts on its own.
   */
  selection?: ButtonGroupSelection;
  /** With a selection, keeps at least one button selected: the last one can't be turned off. */
  required?: boolean;
  /** The selected value (`single`) or values (`multiple`). */
  value?: ButtonGroupSelected;
}

export const buttonGroupDefaults = {
  variant: 'standard',
  size: 'small',
  shape: 'round',
  selection: 'none',
  required: false,
} satisfies Omit<Required<ButtonGroupProps>, 'value'>;

export interface ButtonGroupOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => ButtonGroupProps;
  /** Called with the requested selection. Adapters wire it to v-model, onChange, and so on. */
  onChange: (selected: ButtonGroupSelected) => void;
}

export interface ButtonGroupApi {
  rootAttrs: () => Record<string, string | undefined>;
  /** Whether the button with this value is selected. */
  isSelected: (value: ButtonGroupValue) => boolean;
  /**
   * Requests turning the button with this value on or off. The group applies its selection rules:
   * a single selection turns the previous button off, and `required` keeps the last one on.
   */
  select: (value: ButtonGroupValue, selected: boolean) => void;
}

const valuesOf = (selected: ButtonGroupSelected): ButtonGroupValue[] =>
  selected === undefined ? [] : Array.isArray(selected) ? selected : [selected];

export function createButtonGroup(options: ButtonGroupOptions): ButtonGroupApi {
  const props = () => ({ ...buttonGroupDefaults, ...omitUndefined(options.props()) });

  const isSelected = (value: ButtonGroupValue) => {
    const p = props();
    return p.selection !== 'none' && valuesOf(p.value).includes(value);
  };

  return {
    rootAttrs() {
      const p = props();
      return {
        role: 'group',
        'data-variant': p.variant,
        'data-size': p.size,
        'data-shape': p.shape,
      };
    },
    isSelected,
    select(value, selected) {
      const p = props();
      if (p.selection === 'none' || isSelected(value) === selected) return;
      const current = valuesOf(p.value);
      if (!selected && p.required && current.length === 1) return;
      if (p.selection === 'single') {
        options.onChange(selected ? value : undefined);
      } else {
        options.onChange(
          selected ? [...current, value] : current.filter((other) => other !== value),
        );
      }
    },
  };
}
