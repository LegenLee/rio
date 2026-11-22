import { describe, expect, test, vi } from 'vitest';
import { nextSelection } from '../utils/selection';
import {
  createList,
  createListItem,
  type ListItemContent,
  type ListItemProps,
  type ListProps,
} from './list';

const listSetup = (props: ListProps = {}, tabStop?: string) => {
  const onChange = vi.fn();
  const list = createList({ props: () => props, tabStop: () => tabStop, onChange });
  return { list, onChange };
};

const none: ListItemContent = {
  leading: false,
  overline: false,
  supporting: false,
  trailing: false,
};

const itemSetup = (
  props: ListItemProps = {},
  listProps: ListProps = {},
  content: Partial<ListItemContent> = {},
  multiline = false,
) => {
  const { list, onChange } = listSetup(listProps, 'k1');
  const item = createListItem({
    props: () => props,
    list: () => list,
    key: 'k1',
    content: () => ({ ...none, ...content }),
    multiline: () => multiline,
  });
  return { item, onChange };
};

describe('nextSelection', () => {
  test('one at a time, any number, and none', () => {
    const p = (selection: 'none' | 'single' | 'multiple', selected?: string | string[]) => ({
      selection,
      required: false,
      selected,
    });
    expect(nextSelection(p('single', 'a'), 'b', true)).toEqual({ selected: 'b' });
    expect(nextSelection(p('single', 'a'), 'a', false)).toEqual({ selected: undefined });
    expect(nextSelection(p('single', 'a'), 'a', true)).toBeUndefined();
    expect(nextSelection(p('multiple', ['a']), 'b', true)).toEqual({ selected: ['a', 'b'] });
    expect(nextSelection(p('multiple', ['a', 'b']), 'a', false)).toEqual({ selected: ['b'] });
    expect(nextSelection(p('none'), 'a', true)).toBeUndefined();
  });

  test('required keeps the last one', () => {
    expect(
      nextSelection({ selection: 'single', required: true, selected: 'a' }, 'a', false),
    ).toBeUndefined();
    expect(
      nextSelection({ selection: 'multiple', required: true, selected: ['a'] }, 'a', false),
    ).toBeUndefined();
    expect(
      nextSelection({ selection: 'multiple', required: true, selected: ['a', 'b'] }, 'a', false),
    ).toEqual({ selected: ['b'] });
  });
});

describe('createList', () => {
  test('a list, or with a selection, a list box named by its label', () => {
    expect(listSetup().list.parts.root()).toEqual({
      class: 'rio-list',
      role: undefined,
      'aria-multiselectable': undefined,
      'aria-label': undefined,
      'data-variant': 'standard',
    });
    expect(
      listSetup({
        selection: 'multiple',
        label: 'Toppings',
        variant: 'segmented',
      }).list.parts.root(),
    ).toEqual({
      class: 'rio-list',
      role: 'listbox',
      'aria-multiselectable': 'true',
      'aria-label': 'Toppings',
      'data-variant': 'segmented',
    });
    expect(
      listSetup({ selection: 'single' }).list.parts.root()['aria-multiselectable'],
    ).toBeUndefined();
  });

  test('toggle turns an item on and off by the selection’s rules', () => {
    const single = listSetup({ selection: 'single', selected: 'a' });
    single.list.toggle('b');
    expect(single.onChange).toHaveBeenLastCalledWith('b');
    single.list.toggle('a');
    expect(single.onChange).toHaveBeenLastCalledWith(undefined);
    const required = listSetup({ selection: 'single', selected: 'a', required: true });
    required.list.toggle('a');
    expect(required.onChange).not.toHaveBeenCalled();
    const multiple = listSetup({ selection: 'multiple', selected: ['a'] });
    multiple.list.toggle('b');
    expect(multiple.onChange).toHaveBeenLastCalledWith(['a', 'b']);
    expect(multiple.list.isSelected('a')).toBe(true);
    const nothing = listSetup({ selected: 'a' });
    nothing.list.toggle('a');
    expect(nothing.onChange).not.toHaveBeenCalled();
    expect(nothing.list.isSelected('a')).toBe(false);
  });

  test('the selection control: a radio button for one, a checkbox or a switch for several', () => {
    const control = (props: ListProps) => listSetup(props).list.control();
    expect(control({})).toBe('none');
    expect(control({ control: 'checkbox' })).toBe('none');
    expect(control({ selection: 'single' })).toBe('radio');
    expect(control({ selection: 'single', control: 'none' })).toBe('none');
    expect(control({ selection: 'single', control: 'checkbox' })).toBe('radio');
    expect(control({ selection: 'single', control: 'switch' })).toBe('radio');
    expect(control({ selection: 'multiple' })).toBe('checkbox');
    expect(control({ selection: 'multiple', control: 'switch' })).toBe('switch');
    expect(control({ selection: 'multiple', control: 'none' })).toBe('none');
    expect(control({ selection: 'multiple', control: 'radio' })).toBe('checkbox');
    expect(listSetup().list.controlPosition()).toBe('trailing');
    expect(listSetup({ controlPosition: 'leading' }).list.controlPosition()).toBe('leading');
  });

  test('the tab stop is the item the adapter keeps, or none yet', () => {
    const { list } = listSetup({}, 'k2');
    expect([list.isTabStop('k2'), list.isTabStop('k1')]).toEqual([true, false]);
    expect(listSetup().list.isTabStop('k1')).toBeUndefined();
  });
});

describe('createListItem', () => {
  test('an item is static, a link, a button, or with a selection, an option', () => {
    expect(itemSetup().item.kind()).toBe('static');
    expect(itemSetup({ href: '/inbox' }).item.kind()).toBe('link');
    expect(itemSetup({ action: true }).item.kind()).toBe('button');
    expect(itemSetup({ value: 'a', href: '/x' }, { selection: 'single' }).item.kind()).toBe(
      'option',
    );
    expect(itemSetup({ href: '/x' }).item.acts()).toBe(true);
    expect(itemSetup().item.acts()).toBe(false);
  });

  test('a static item: a plain list item, its content as given', () => {
    const { item } = itemSetup({}, {}, { leading: true, trailing: true });
    expect(item.parts.root()).toEqual({
      class: 'rio-list-item rio-focus-ring-target',
      'data-focus-ring': 'inner',
      'data-kind': 'static',
      'data-lines': '1',
      'data-selected': undefined,
      'data-disabled': undefined,
    });
    expect(item.parts.leading()).toEqual({ class: 'rio-list-item__leading' });
    expect([item.showsLeading(), item.showsTrailing(), item.showsSupporting()]).toEqual([
      true,
      true,
      false,
    ]);
  });

  test('an option: selected or not, the tab stop or not', () => {
    const { item } = itemSetup({ value: 'a' }, { selection: 'single', selected: 'a' });
    expect(item.parts.root()).toMatchObject({
      role: 'option',
      'aria-selected': 'true',
      tabindex: '0',
      'data-list-focus': 'k1',
      'data-kind': 'option',
      'data-selected': '',
    });
    expect(item.selected()).toBe(true);
    const other = itemSetup({ value: 'b' }, { selection: 'single', selected: 'a' });
    expect(other.item.parts.root()).toMatchObject({ 'aria-selected': 'false' });
  });

  test('an option draws the list’s control in its position, unless its content is there', () => {
    const option = (listProps: ListProps, content: Partial<ListItemContent> = {}) =>
      itemSetup({ value: 'a' }, listProps, content).item;
    const single = option({ selection: 'single' });
    expect([single.controlIn('leading'), single.controlIn('trailing')]).toEqual([
      undefined,
      'radio',
    ]);
    expect([single.showsLeading(), single.showsTrailing()]).toEqual([false, true]);
    const leading = option({ selection: 'multiple', controlPosition: 'leading' });
    expect([leading.controlIn('leading'), leading.showsLeading(), leading.showsTrailing()]).toEqual(
      ['checkbox', true, false],
    );
    const filled = option({ selection: 'multiple' }, { trailing: true });
    expect([filled.controlIn('trailing'), filled.showsTrailing()]).toEqual([undefined, true]);
    expect(option({ selection: 'multiple', control: 'none' }).showsTrailing()).toBe(false);
    expect(itemSetup({ value: 'a' }).item.controlIn('trailing')).toBeUndefined();
  });

  test('until the list picks a tab stop, an action keeps its own focus', () => {
    const { list } = listSetup();
    const item = createListItem({
      props: () => ({ action: true }),
      list: () => list,
      key: 'k1',
      content: () => none,
      multiline: () => false,
    });
    expect(item.parts.action().tabindex).toBeUndefined();
  });

  test('an action: a link or a button that takes the keys, the trailing element beside it', () => {
    const link = itemSetup({ href: '/inbox' }).item;
    expect(link.parts.action()).toEqual({
      class: 'rio-list-item__action',
      href: '/inbox',
      role: undefined,
      'aria-disabled': undefined,
      tabindex: '0',
      'data-list-focus': 'k1',
    });
    expect(link.parts.root().role).toBeUndefined();
    const button = itemSetup({ action: true, disabled: true }).item;
    expect(button.parts.action()).toMatchObject({
      type: 'button',
      'aria-disabled': 'true',
      tabindex: '0',
    });
    const disabledLink = itemSetup({ href: '/inbox', disabled: true }).item;
    expect(disabledLink.parts.action()).toMatchObject({
      href: undefined,
      role: 'link',
      'aria-disabled': 'true',
      tabindex: '0',
    });
  });

  test('one, two, or three lines', () => {
    expect(itemSetup().item.lines()).toBe(1);
    expect(itemSetup({}, {}, { supporting: true }).item.lines()).toBe(2);
    expect(itemSetup({}, {}, { overline: true }).item.lines()).toBe(2);
    expect(itemSetup({}, {}, { overline: true, supporting: true }).item.lines()).toBe(3);
    expect(itemSetup({}, {}, { supporting: true }, true).item.lines()).toBe(3);
    expect(itemSetup({}, {}, { supporting: true }, true).item.parts.root()['data-lines']).toBe('3');
  });

  test('a click chooses an option; on a disabled item, nothing happens', () => {
    const { item, onChange } = itemSetup({ value: 'a' }, { selection: 'multiple' });
    const event = { preventDefault: vi.fn() };
    expect(item.handleClick(event)).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith(['a']);
    const disabled = itemSetup({ value: 'a', disabled: true }, { selection: 'multiple' });
    expect(disabled.item.handleClick(event)).toBe(false);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(disabled.onChange).not.toHaveBeenCalled();
    expect(itemSetup({ action: true }).item.handleClick(event)).toBe(true);
    expect(itemSetup({ action: true, disabled: true }).item.handleClick(event)).toBe(false);
  });
});
