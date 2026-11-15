import type { MenuApi } from '@rio-m3e/core';
import type { InjectionKey } from 'vue';

/** What `RioMenu` and `RioSubMenu` provide to the items and submenus inside them. */
export type MenuContext = Pick<
  MenuApi,
  'selection' | 'isSelected' | 'choose' | 'close' | 'variant' | 'instant'
>;

/** The parts of a core menu API that its items and submenus read */
export const menuContextOf = (menu: MenuApi): MenuContext => ({
  selection: menu.selection,
  isSelected: menu.isSelected,
  choose: menu.choose,
  close: menu.close,
  variant: menu.variant,
  instant: menu.instant,
});

export const menuKey: InjectionKey<MenuContext> = Symbol('RioMenu');
