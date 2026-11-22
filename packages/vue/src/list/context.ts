import type { ListApi } from '@rio-m3e/core';
import type { InjectionKey } from 'vue';

/** What `RioList` provides to the items inside it */
export type ListContext = Pick<ListApi, 'selection' | 'isSelected' | 'toggle' | 'isTabStop'>;

export const listKey: InjectionKey<ListContext> = Symbol('RioList');

/** An item outside a list acts on its own: no selection, and its own tab stop. */
export const noList: ListContext = {
  selection: () => 'none',
  isSelected: () => false,
  toggle: () => {},
  isTabStop: () => true,
};
