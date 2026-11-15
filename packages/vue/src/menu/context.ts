import type { MenuApi } from '@rio-m3e/core';
import type { InjectionKey } from 'vue';

/** What `RioMenu` provides to the items inside it. */
export type MenuContext = Pick<MenuApi, 'selection' | 'isSelected' | 'choose'>;

export const menuKey: InjectionKey<MenuContext> = Symbol('RioMenu');
