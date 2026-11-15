import type {
  AnchoredAlign,
  AnchoredSide,
} from '../primitives/anchored-position/anchored-position';
import type { PartAttrs, PartNode } from '../parts';
import { omitUndefined } from '../utils/object';

/** M3E vertical menu color styles: surface-based, or tertiary-based for more emphasis. */
export const MENU_VARIANTS = ['standard', 'vibrant'] as const;
export type MenuVariant = (typeof MENU_VARIANTS)[number];

/** Whether the menu's items can be selected: none, one at a time, or any number. */
export const MENU_SELECTIONS = ['none', 'single', 'multiple'] as const;
export type MenuSelection = (typeof MENU_SELECTIONS)[number];

/** Identifies an item in a selecting menu, through its `value` prop. */
export type MenuValue = string | number;

/** The selected value for `single` (or `undefined`), or the selected values for `multiple`. */
export type MenuSelected = MenuValue | MenuValue[] | undefined;

export interface MenuProps {
  /** Whether the menu is shown. */
  open?: boolean;
  /** Defaults to `'standard'`. */
  variant?: MenuVariant;
  /**
   * Makes items with a `value` selectable, and keeps the selection. Defaults to `'none'`, where
   * choosing an item only runs its action.
   */
  selection?: MenuSelection;
  /** The selected value (`single`) or values (`multiple`). */
  selected?: MenuSelected;
  /** Names the menu for assistive technology, such as the label of the button that opens it. */
  label?: string;
  /** The side of the anchor it opens on, when there is room. Defaults to `'bottom'`. */
  side?: AnchoredSide;
  /** Which edges line up with the anchor's. Defaults to `'start'`. */
  align?: AnchoredAlign;
  /** Space between the anchor and the menu, in px. Defaults to 0; a split button's menu uses 4. */
  offset?: number;
  /** Opens and closes without the expanding motion, as dense desktop products may. */
  instant?: boolean;
}

export const menuDefaults = {
  open: false,
  variant: 'standard',
  selection: 'none',
  side: 'bottom',
  align: 'start',
  offset: 0,
  instant: false,
} satisfies Omit<Required<MenuProps>, 'selected' | 'label'>;

export interface MenuOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => MenuProps;
  /** Called with the requested selection. */
  onChange: (selected: MenuSelected) => void;
  /** Called with the requested `open`, such as `false` once an item is chosen. */
  onOpenChange: (open: boolean) => void;
}

export interface MenuParts {
  /** The surface, shown in the top layer. Its children are items, dividers, and groups. */
  root: () => PartAttrs;
}

export const menuSkeleton: PartNode<keyof MenuParts> = {
  part: 'root',
  tag: 'div',
  content: true,
};

export interface MenuApi {
  parts: MenuParts;
  /** The selection mode, with the default filled in. */
  selection: () => MenuSelection;
  /** Whether the item with this value is selected. */
  isSelected: (value: MenuValue) => boolean;
  /**
   * An item was chosen. With a `value` in a selecting menu, the selection rules apply: `single`
   * selects it, `multiple` toggles it. Then the menu asks to close, except for `multiple`, which
   * stays open until dismissed.
   */
  choose: (value?: MenuValue) => void;
  /** Asks the menu to close. In a submenu, the whole menu closes, as after a choice. */
  close: () => void;
  /** The color style, with the default filled in, which submenus take on. */
  variant: () => MenuVariant;
  /** Whether the menu opens without its motion, which submenus take on. */
  instant: () => boolean;
}

const valuesOf = (selected: MenuSelected): MenuValue[] =>
  selected === undefined ? [] : Array.isArray(selected) ? selected : [selected];

export function createMenu(options: MenuOptions): MenuApi {
  const props = () => ({ ...menuDefaults, ...omitUndefined(options.props()) });
  const isSelected = (value: MenuValue) => {
    const p = props();
    return p.selection !== 'none' && valuesOf(p.selected).includes(value);
  };

  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-menu',
          role: 'menu',
          'aria-label': p.label,
          'data-variant': p.variant,
          'data-instant': p.instant ? '' : undefined,
        };
      },
    },
    selection: () => props().selection,
    isSelected,
    choose(value) {
      const p = props();
      if (p.selection !== 'none' && value !== undefined) {
        if (p.selection === 'single') {
          if (!isSelected(value)) options.onChange(value);
        } else {
          const current = valuesOf(p.selected);
          options.onChange(
            isSelected(value) ? current.filter((other) => other !== value) : [...current, value],
          );
          return;
        }
      }
      options.onOpenChange(false);
    },
    close: () => options.onOpenChange(false),
    variant: () => props().variant,
    instant: () => props().instant,
  };
}

// Items

export interface MenuItemProps {
  /** Makes the item selectable in a menu that keeps a selection. */
  value?: MenuValue;
  /** Still focusable, but can't be chosen. */
  disabled?: boolean;
}

export const menuItemDefaults = {
  disabled: false,
} satisfies Omit<Required<MenuItemProps>, 'value'>;

/** What the adapter has to put in the item, which only the adapter can see. */
export interface MenuItemContent {
  /** A leading icon */
  icon: boolean;
  /** Supporting text under the label */
  supportingText: boolean;
  /** Trailing text, such as a keyboard shortcut */
  trailingText: boolean;
  /** A trailing icon */
  trailingIcon: boolean;
}

export interface MenuItemOptions {
  props: () => MenuItemProps;
  /** Without it, the item has only a label. */
  content?: () => MenuItemContent;
  /** The menu around the item. Without one, the item acts as in a menu without a selection. */
  menu?: () => Pick<MenuApi, 'selection' | 'isSelected' | 'choose'> | undefined;
  /** Called for a click on the item that isn't blocked, before the menu is told. */
  onClick: (event: MouseEvent) => void;
  /**
   * Makes it the item that opens a submenu (see `createSubMenu`): a click opens the submenu rather
   * than choosing the item.
   */
  submenu?: {
    /** Whether the submenu is open */
    open: () => boolean;
    /** Asks for the submenu to open. */
    onOpen: () => void;
  };
}

export interface MenuItemParts {
  /** A `<button>` with the item's role */
  root: () => PartAttrs;
  /** Extends the 44px item to a 48px target, over the space between items. */
  touch: () => PartAttrs;
  icon: () => PartAttrs;
  /** Holds the label and the supporting text, one above the other */
  text: () => PartAttrs;
  label: () => PartAttrs;
  supportingText: () => PartAttrs;
  trailingText: () => PartAttrs;
  trailingIcon: () => PartAttrs;
}

type MenuItemWhen = 'showsIcon' | 'showsSupportingText' | 'showsTrailingText' | 'showsTrailingIcon';

export const menuItemSkeleton: PartNode<keyof MenuItemParts, MenuItemWhen> = {
  part: 'root',
  tag: 'button',
  children: [
    { part: 'touch', tag: 'span' },
    { part: 'icon', tag: 'span', when: 'showsIcon', content: true },
    {
      part: 'text',
      tag: 'span',
      children: [
        { part: 'label', tag: 'span', content: true },
        { part: 'supportingText', tag: 'span', when: 'showsSupportingText', content: true },
      ],
    },
    { part: 'trailingText', tag: 'span', when: 'showsTrailingText', content: true },
    { part: 'trailingIcon', tag: 'span', when: 'showsTrailingIcon', content: true },
  ],
};

export interface MenuItemApi extends Record<MenuItemWhen, () => boolean> {
  parts: MenuItemParts;
  /** Whether the item is selected, in a menu that keeps a selection. */
  selected: () => boolean;
  /** Attach to the item's `click`. */
  handleClick: (event: MouseEvent) => void;
}

const NO_CONTENT: MenuItemContent = {
  icon: false,
  supportingText: false,
  trailingText: false,
  trailingIcon: false,
};

export function createMenuItem(options: MenuItemOptions): MenuItemApi {
  const props = () => ({ ...menuItemDefaults, ...omitUndefined(options.props()) });
  const content = () => options.content?.() ?? NO_CONTENT;
  // `menuitemradio` or `menuitemcheckbox` when the menu keeps a selection and the item has a value.
  // An item that opens a submenu is never chosen, so it is neither.
  const kind = () => {
    if (options.submenu) return undefined;
    const selection = options.menu?.()?.selection() ?? 'none';
    if (selection === 'none' || props().value === undefined) return undefined;
    return selection === 'single' ? 'radio' : 'checkbox';
  };
  const selected = () => {
    const value = props().value;
    return kind() !== undefined && !!options.menu?.()?.isSelected(value!);
  };

  return {
    parts: {
      root() {
        const p = props();
        const k = kind();
        return {
          class: 'rio-menu-item rio-state-layer rio-focus-ring',
          type: 'button',
          role: k ? `menuitem${k}` : 'menuitem',
          // Focus moves with the arrow keys, so the items are left out of the Tab order.
          tabindex: '-1',
          'aria-checked': k ? String(selected()) : undefined,
          'aria-haspopup': options.submenu ? 'menu' : undefined,
          'aria-expanded': options.submenu ? String(options.submenu.open()) : undefined,
          // Not native `disabled`: disabled items stay focusable.
          'aria-disabled': p.disabled ? 'true' : undefined,
          'data-selected': k ? String(selected()) : undefined,
          'data-focus-ring': 'inner',
        };
      },
      touch: () => ({ class: 'rio-menu-item__touch', 'aria-hidden': 'true' }),
      icon: () => ({ class: 'rio-menu-item__icon', 'aria-hidden': 'true' }),
      text: () => ({ class: 'rio-menu-item__text' }),
      label: () => ({ class: 'rio-menu-item__label' }),
      supportingText: () => ({ class: 'rio-menu-item__supporting-text' }),
      trailingText: () => ({ class: 'rio-menu-item__trailing-text' }),
      trailingIcon: () => ({ class: 'rio-menu-item__trailing-icon', 'aria-hidden': 'true' }),
    },
    showsIcon: () => content().icon,
    showsSupportingText: () => content().supportingText,
    showsTrailingText: () => content().trailingText,
    showsTrailingIcon: () => content().trailingIcon,
    selected,
    handleClick(event) {
      if (props().disabled) {
        event.preventDefault();
        return;
      }
      options.onClick(event);
      if (options.submenu) options.submenu.onOpen();
      else options.menu?.()?.choose(props().value);
    },
  };
}

// Submenus

export interface SubMenuProps {
  /** The label of the item that opens the submenu, which also names the submenu. */
  label?: string;
  /** The item stays focusable but doesn't open the submenu. */
  disabled?: boolean;
  /** As a menu's: a submenu keeps its own selection, such as a sort order. */
  selection?: MenuSelection;
  /** The selected value (`single`) or values (`multiple`). */
  selected?: MenuSelected;
}

export interface SubMenuOptions {
  props: () => SubMenuProps;
  /** What the adapter put in the item that opens it. Without it, the item has only a label. */
  content?: () => MenuItemContent;
  /** The menu the submenu is in. Its color style and motion carry over, and choosing closes it. */
  menu?: () => Pick<MenuApi, 'variant' | 'instant' | 'close'> | undefined;
  /** Whether the submenu is open: the adapter owns it. */
  open: () => boolean;
  /** Called with the requested selection. */
  onChange: (selected: MenuSelected) => void;
  /** Called with the requested `open`: `true` for a click on its item. */
  onOpenChange: (open: boolean) => void;
}

export interface SubMenuApi {
  /** The item that opens the submenu, with the parts of a menu item (`menuItemSkeleton`) */
  item: MenuItemApi;
  /** The submenu, with the parts of a menu (`menuSkeleton`). Its items take it as their menu. */
  menu: MenuApi;
}

/**
 * A submenu and the item that opens it. The two render side by side in the menu, the item where it
 * sits and the submenu after it; the submenu shows in the top layer next to the item.
 */
export function createSubMenu(options: SubMenuOptions): SubMenuApi {
  const menu = createMenu({
    props: () => {
      const p = options.props();
      const parent = options.menu?.();
      return {
        open: options.open(),
        variant: parent?.variant(),
        instant: parent?.instant(),
        selection: p.selection,
        selected: p.selected,
        label: p.label,
      };
    },
    onChange: options.onChange,
    // A choice in a submenu closes the whole menu, not only the submenu.
    onOpenChange: (open) => {
      const parent = options.menu?.();
      if (open) options.onOpenChange(true);
      else if (parent) parent.close();
      else options.onOpenChange(false);
    },
  });
  const item = createMenuItem({
    props: () => ({ disabled: options.props().disabled }),
    content: options.content,
    onClick: () => {},
    submenu: { open: options.open, onOpen: () => options.onOpenChange(true) },
  });
  return { item, menu };
}

// Groups and dividers

export interface MenuGroupProps {
  /** A label shown above the group's items, which also names the group. */
  label?: string;
}

export interface MenuGroupParts {
  root: () => PartAttrs;
  /** The visible label. Assistive technology reads the name from the root instead. */
  label: () => PartAttrs;
  /** Holds the group's items. */
  items: () => PartAttrs;
}

export const menuGroupSkeleton: PartNode<keyof MenuGroupParts, 'showsLabel'> = {
  part: 'root',
  tag: 'div',
  children: [
    { part: 'label', tag: 'div', when: 'showsLabel', content: true },
    { part: 'items', tag: 'div', content: true },
  ],
};

export interface MenuGroupApi {
  parts: MenuGroupParts;
  showsLabel: () => boolean;
}

export function createMenuGroup(options: { props: () => MenuGroupProps }): MenuGroupApi {
  return {
    parts: {
      root: () => ({ class: 'rio-menu-group', role: 'group', 'aria-label': options.props().label }),
      label: () => ({ class: 'rio-menu-group__label', 'aria-hidden': 'true' }),
      items: () => ({ class: 'rio-menu-group__items' }),
    },
    showsLabel: () => !!options.props().label,
  };
}

export interface MenuDividerParts {
  root: () => PartAttrs;
}

export const menuDividerSkeleton: PartNode<keyof MenuDividerParts> = { part: 'root', tag: 'div' };

export function createMenuDivider(): { parts: MenuDividerParts } {
  return { parts: { root: () => ({ class: 'rio-menu-divider', role: 'separator' }) } };
}
