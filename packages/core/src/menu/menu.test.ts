import { describe, expect, test, vi } from 'vitest';
import {
  createMenu,
  createMenuDivider,
  createMenuGroup,
  createMenuItem,
  type MenuItemContent,
  type MenuItemProps,
  type MenuProps,
} from './menu';

const setupMenu = (props: MenuProps = {}) => {
  const onChange = vi.fn();
  const onOpenChange = vi.fn();
  const menu = createMenu({ props: () => props, onChange, onOpenChange });
  return { menu, onChange, onOpenChange };
};

const setupItem = (props: MenuItemProps = {}, menuProps?: MenuProps, content?: MenuItemContent) => {
  const owner = menuProps ? setupMenu(menuProps) : undefined;
  const onClick = vi.fn();
  const item = createMenuItem({
    props: () => props,
    content: content && (() => content),
    menu: () => owner?.menu,
    onClick,
  });
  return { item, onClick, owner };
};

const click = () =>
  ({ preventDefault: vi.fn() }) as unknown as MouseEvent & {
    preventDefault: ReturnType<typeof vi.fn>;
  };

describe('createMenu', () => {
  test('the root is a standard menu, named by label', () => {
    expect(setupMenu({ label: 'Edit' }).menu.parts.root()).toEqual({
      class: 'rio-menu',
      role: 'menu',
      'aria-label': 'Edit',
      'data-variant': 'standard',
      'data-instant': undefined,
    });
    expect(setupMenu({ variant: 'vibrant', instant: true }).menu.parts.root()).toMatchObject({
      'data-variant': 'vibrant',
      'data-instant': '',
    });
  });

  test('choosing in a menu without a selection only closes it', () => {
    const { menu, onChange, onOpenChange } = setupMenu();
    menu.choose('copy');
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('single: choosing selects the value and closes', () => {
    const { menu, onChange, onOpenChange } = setupMenu({ selection: 'single', selected: 'a' });
    menu.choose('b');
    expect(onChange).toHaveBeenCalledWith('b');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('single: choosing the selected value keeps it and closes', () => {
    const { menu, onChange, onOpenChange } = setupMenu({ selection: 'single', selected: 'a' });
    menu.choose('a');
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('multiple: choosing toggles the value and the menu stays open', () => {
    const { menu, onChange, onOpenChange } = setupMenu({ selection: 'multiple', selected: ['a'] });
    menu.choose('b');
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
    menu.choose('a');
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  test('an item without a value in a selecting menu acts and closes', () => {
    const { menu, onChange, onOpenChange } = setupMenu({ selection: 'multiple', selected: [] });
    menu.choose(undefined);
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('createMenuItem', () => {
  test('a plain item is a menuitem button, out of the Tab order', () => {
    expect(setupItem().item.parts.root()).toEqual({
      class: 'rio-menu-item rio-state-layer rio-focus-ring',
      type: 'button',
      role: 'menuitem',
      tabindex: '-1',
      'aria-checked': undefined,
      'aria-disabled': undefined,
      'data-selected': undefined,
      'data-focus-ring': 'inner',
    });
  });

  test.each([
    ['single', 'menuitemradio'],
    ['multiple', 'menuitemcheckbox'],
  ] as const)('with a value in a %s menu, it is a %s', (selection, role) => {
    const selected = setupItem({ value: 'a' }, { selection, selected: ['a'] }).item;
    const unselected = setupItem({ value: 'b' }, { selection, selected: ['a'] }).item;
    expect(selected.parts.root()).toMatchObject({
      role,
      'aria-checked': 'true',
      'data-selected': 'true',
    });
    expect(unselected.parts.root()).toMatchObject({
      role,
      'aria-checked': 'false',
      'data-selected': 'false',
    });
  });

  test('without a value, an item in a selecting menu stays a menuitem', () => {
    const { item } = setupItem({}, { selection: 'single' });
    expect(item.parts.root()).toMatchObject({ role: 'menuitem', 'aria-checked': undefined });
  });

  test('a click runs the action, then tells the menu', () => {
    const { item, onClick, owner } = setupItem({ value: 'b' }, { selection: 'single' });
    item.handleClick(click());
    expect(onClick).toHaveBeenCalledOnce();
    expect(owner!.onChange).toHaveBeenCalledWith('b');
    expect(owner!.onOpenChange).toHaveBeenCalledWith(false);
  });

  test('disabled stays focusable but does nothing', () => {
    const { item, onClick, owner } = setupItem({ disabled: true }, {});
    expect(item.parts.root()).toMatchObject({ 'aria-disabled': 'true', tabindex: '-1' });
    expect(item.parts.root()).not.toHaveProperty('disabled');
    const event = click();
    item.handleClick(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    expect(owner!.onOpenChange).not.toHaveBeenCalled();
  });

  test('shows the parts the adapter has content for', () => {
    const { item } = setupItem({}, undefined, {
      icon: true,
      supportingText: false,
      trailingText: true,
      trailingIcon: false,
    });
    expect([
      item.showsIcon(),
      item.showsSupportingText(),
      item.showsTrailingText(),
      item.showsTrailingIcon(),
    ]).toEqual([true, false, true, false]);
  });
});

describe('groups and dividers', () => {
  test('a group is named by its label, which is hidden from assistive technology', () => {
    const group = createMenuGroup({ props: () => ({ label: 'Share' }) });
    expect(group.parts.root()).toEqual({
      class: 'rio-menu-group',
      role: 'group',
      'aria-label': 'Share',
    });
    expect(group.parts.label()).toMatchObject({ 'aria-hidden': 'true' });
    expect(group.showsLabel()).toBe(true);
    expect(createMenuGroup({ props: () => ({}) }).showsLabel()).toBe(false);
  });

  test('a divider is a separator', () => {
    expect(createMenuDivider().parts.root()).toEqual({
      class: 'rio-menu-divider',
      role: 'separator',
    });
  });
});
