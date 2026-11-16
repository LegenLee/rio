import type { CheckableHandle, RadioValue } from '@rio-m3e/core';
import type { InjectionKey } from 'vue';

/** What a `RioRadioGroup` gives the radio buttons inside it. */
export interface RadioGroupContext {
  /** The `name` every radio button in the group shares */
  name: () => string;
  isSelected: (value: RadioValue) => boolean;
  /** The person selected this radio button. */
  select: (value: RadioValue) => void;
  /** Adds a radio button's input, which the group brings back in line after every change. */
  register: (handle: CheckableHandle) => () => void;
}

export const radioGroupKey: InjectionKey<RadioGroupContext> = Symbol('rio-radio-group');
