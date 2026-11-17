import type { SelectApi, SelectValue } from '@rio-m3e/core';
import type { InjectionKey } from 'vue';

/** An option, as `RioSelectOption` registers it with its select */
export interface SelectOptionEntry {
  value: () => SelectValue;
  /** The option's label as text */
  label: () => string;
  /** The option's element, which puts the options in the order they appear */
  element: () => HTMLElement | null | undefined;
}

/** What a `RioSelect` gives the options inside it */
export interface SelectContext extends Pick<SelectApi, 'isSelected' | 'choose'> {
  /** Adds an option to the select, until the returned function takes it out. */
  register: (entry: SelectOptionEntry) => () => void;
}

export const selectKey: InjectionKey<SelectContext> = Symbol('RioSelect');
