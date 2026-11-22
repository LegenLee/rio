import type { PartAttrs, PartNode } from '../parts';
import { disabledAttrs, isBlocked } from '../utils/disabled';
import { resolveProps } from '../utils/object';

/** A radio button's value, and the group's selection. */
export type RadioValue = string | number;

export interface RadioGroupProps {
  /** Names the group for assistive technology, typically its title. */
  label?: string;
}

export interface RadioGroupOptions {
  props: () => RadioGroupProps;
}

export interface RadioGroupParts {
  /** Holds the radio buttons, stacked, each in its label. */
  root: () => PartAttrs;
}

export const radioGroupSkeleton: PartNode<keyof RadioGroupParts> = {
  part: 'root',
  tag: 'div',
  content: true,
};

export interface RadioGroupApi {
  parts: RadioGroupParts;
}

export function createRadioGroup(options: RadioGroupOptions): RadioGroupApi {
  return {
    parts: {
      root: () => ({
        class: 'rio-radio-group',
        role: 'radiogroup',
        'aria-label': options.props().label,
      }),
    },
  };
}

export interface RadioProps {
  /** Whether this radio button is the group's selection. The group's adapter works it out. */
  selected?: boolean;
  /** Native disabled: not focusable and not selectable. This is the spec's behavior. */
  disabled?: boolean;
  /**
   * Disabled but still focusable, so it stays discoverable. Selecting it is blocked in JavaScript
   * instead. This deviates from the spec, which says disabled components can't be focused.
   */
  softDisabled?: boolean;
}

export const radioDefaults = {
  selected: false,
  disabled: false,
  softDisabled: false,
} satisfies Required<RadioProps>;

export interface RadioOptions {
  props: () => RadioProps;
  /**
   * The group's `name`, the same for every radio button in it, unique in the document. The
   * browser moves the arrow keys and the tab stop within it.
   */
  name: () => string;
  /** The value a form submits. */
  value: () => string;
}

/** The radio button's markup, part by part. `radioSkeleton` says how the adapter nests them. */
export interface RadioParts {
  /** Lays out at the 48px target, with the radio button drawn in the middle. */
  root: () => PartAttrs;
  /**
   * The native `<input type="radio">`, invisible over the whole target. `attachCheckable` keeps
   * its `checked` in line with the group's selection.
   */
  input: () => PartAttrs;
  /** The circle where the state layer and the ripple draw. */
  state: () => PartAttrs;
  /** The 20px ring, and the dot inside when selected. */
  icon: () => PartAttrs;
}

export const radioSkeleton: PartNode<keyof RadioParts> = {
  part: 'root',
  tag: 'span',
  children: [
    { part: 'input', tag: 'input' },
    { part: 'state', tag: 'span' },
    { part: 'icon', tag: 'span' },
  ],
};

export interface RadioApi {
  parts: RadioParts;
  /** Whether it can't be selected now: disabled or soft-disabled. For `attachCheckable`. */
  blocked: () => boolean;
}

export function createRadio(options: RadioOptions): RadioApi {
  const props = () => resolveProps(radioDefaults, options.props());
  const unavailable = () => isBlocked(props());

  return {
    parts: {
      root: () => ({
        class: 'rio-radio',
        'data-selected': String(!!props().selected),
        'data-disabled': unavailable() ? '' : undefined,
      }),
      input() {
        const p = props();
        return {
          class: 'rio-radio__input',
          type: 'radio',
          name: options.name(),
          value: options.value(),
          ...disabledAttrs(p),
        };
      },
      state: () => ({ class: 'rio-radio__state rio-focus-ring-target', 'aria-hidden': 'true' }),
      icon: () => ({ class: 'rio-radio__icon', 'aria-hidden': 'true' }),
    },
    blocked: unavailable,
  };
}
