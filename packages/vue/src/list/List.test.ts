import type { ListSelected } from '@rio-m3e/core';
import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, reactive, type VNode } from 'vue';
import Checkbox from '../checkbox/Checkbox.vue';
import IconButton from '../icon-button/IconButton.vue';
import List from './List.vue';
import ListItem from './ListItem.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

/** A list between two buttons, as an app would put it in a page */
const setup = async (listProps: Record<string, unknown>, items: () => VNode[]) => {
  const state = reactive({ selected: listProps.modelValue as ListSelected });
  const screen = await render(
    defineComponent(
      () => () =>
        h('div', { style: { ...theme, inlineSize: '360px' } }, [
          h('button', { type: 'button' }, 'Before'),
          h(
            List,
            {
              ...listProps,
              modelValue: state.selected,
              'onUpdate:modelValue': (next: ListSelected) => (state.selected = next),
            },
            items,
          ),
          h('button', { type: 'button' }, 'After'),
        ]),
    ),
  );
  const container = screen.container as HTMLElement;
  const list = container.querySelector<HTMLElement>('.rio-list')!;
  return { screen, state, container, list };
};

const focused = () => document.activeElement as HTMLElement | null;
const focusedText = () => focused()?.textContent?.trim();

describe('RioList, static', () => {
  test('a list of list items, none of which takes the focus', async () => {
    const { screen, list } = await setup({}, () => [
      h(ListItem, null, () => 'One'),
      h(ListItem, null, () => 'Two'),
    ]);
    await expect.element(screen.getByRole('list')).toBeVisible();
    expect(screen.getByRole('listitem').all()).toHaveLength(2);
    expect(list.querySelectorAll('[tabindex]')).toHaveLength(0);
    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    expect(focusedText()).toBe('After');
  });
});

describe('RioList, actions', () => {
  const actions =
    (onInbox = vi.fn(), onSave = vi.fn()) =>
    () => [
      h(
        ListItem,
        { onClick: onInbox },
        {
          default: () => 'Inbox',
          trailing: () =>
            h('span', [
              '12',
              h(IconButton, { label: 'Save', variant: 'standard', onClick: onSave }, () => 'S'),
            ]),
        },
      ),
      h(ListItem, { href: '#sent' }, { default: () => 'Sent' }),
      h(ListItem, { onClick: vi.fn(), disabled: true }, { default: () => 'Drafts' }),
    ];

  test('one tab stop: Tab enters at the first item, and the arrows go through every action', async () => {
    const { screen } = await setup({}, actions());
    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    expect(focusedText()).toContain('Inbox');
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()?.getAttribute('aria-label')).toBe('Save');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()?.matches('a')).toBe(true);
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedText()).toBe('Drafts');
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedText()).toContain('Inbox');
    await userEvent.keyboard('{ArrowUp}');
    expect(focusedText()).toBe('Drafts');
    await userEvent.keyboard('{Home}');
    expect(focusedText()).toContain('Inbox');
    await userEvent.keyboard('{End}');
    expect(focusedText()).toBe('Drafts');
    await userEvent.tab();
    expect(focusedText()).toBe('After');
    await userEvent.tab({ shift: true });
    expect(focusedText()).toContain('Inbox');
  });

  test('the secondary actions are out of the tab order, until their item stops acting', async () => {
    const state = reactive({ acts: true });
    const screen = await render(
      defineComponent(
        () => () =>
          h(List, null, () =>
            h(
              ListItem,
              { onClick: state.acts ? vi.fn() : undefined },
              {
                default: () => 'Inbox',
                trailing: () => h(IconButton, { label: 'Save', variant: 'standard' }, () => 'S'),
              },
            ),
          ),
      ),
    );
    const save = screen.getByRole('button', { name: 'Save' }).element();
    await vi.waitFor(() => expect(save.getAttribute('tabindex')).toBe('-1'));
    state.acts = false;
    await vi.waitFor(() => expect(save.hasAttribute('tabindex')).toBe(false));
    // The app's own tabindex, set while the list holds the action, is the one it gets back.
    state.acts = true;
    await vi.waitFor(() => expect(save.getAttribute('tabindex')).toBe('-1'));
    save.setAttribute('tabindex', '0');
    await vi.waitFor(() => expect(save.getAttribute('tabindex')).toBe('-1'));
    state.acts = false;
    await vi.waitFor(() => expect(save.getAttribute('tabindex')).toBe('0'));
  });

  test('a press anywhere on an action item acts, but a secondary action acts on its own', async () => {
    const onInbox = vi.fn();
    const onSave = vi.fn();
    const { screen, container } = await setup({}, actions(onInbox, onSave));
    const trailing = container.querySelector<HTMLElement>('.rio-list-item__trailing')!;
    const box = trailing.getBoundingClientRect();
    // The count, left of the Save button
    // The trailing element passes presses through to the action under it.
    await userEvent.click(trailing, { position: { x: 4, y: box.height / 2 }, force: true });
    expect(onInbox).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onInbox).toHaveBeenCalledTimes(1);
  });

  test('a disabled item takes the focus, and nothing it does happens', async () => {
    const onDrafts = vi.fn();
    const { screen } = await setup({}, () => [
      h(ListItem, { onClick: onDrafts, disabled: true }, { default: () => 'Drafts' }),
    ]);
    const drafts = screen.getByRole('button', { name: 'Drafts' });
    await expect.element(drafts).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(drafts, { force: true });
    expect(onDrafts).not.toHaveBeenCalled();
    expect(focusedText()).toBe('Drafts');
  });

  test('Space follows a link, as Enter does', async () => {
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    const { screen } = await setup({}, () => [
      h(ListItem, { href: '#sent', onClick }, { default: () => 'Sent' }),
    ]);
    screen.getByRole('link', { name: 'Sent' }).element().focus();
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('RioList, selection', () => {
  const toppings = () => [
    h(
      ListItem,
      { value: 'cheese' },
      {
        default: () => 'Cheese',
        leading: ({ selected }: { selected: boolean }) => h(Checkbox, { selected }),
      },
    ),
    h(
      ListItem,
      { value: 'olive' },
      {
        default: () => 'Olive',
        leading: ({ selected }: { selected: boolean }) => h(Checkbox, { selected }),
      },
    ),
    h(ListItem, { value: 'basil' }, { default: () => 'Basil', trailing: () => '2 left' }),
  ];

  test('a list box of options, named, with Tab entering at the selected one', async () => {
    const { screen } = await setup(
      { selection: 'multiple', modelValue: ['olive'], label: 'Toppings' },
      toppings,
    );
    const listbox = screen.getByRole('listbox', { name: 'Toppings' });
    await expect.element(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await expect
      .element(screen.getByRole('option', { name: 'Olive' }))
      .toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    expect(focusedText()).toBe('Olive');
  });

  test('a press, Space, or Enter chooses; the arrows only move', async () => {
    const { screen, state } = await setup({ selection: 'multiple', modelValue: [] }, toppings);
    await userEvent.click(screen.getByRole('option', { name: 'Cheese' }));
    expect(state.selected).toEqual(['cheese']);
    await userEvent.keyboard('{ArrowDown}');
    expect(state.selected).toEqual(['cheese']);
    await userEvent.keyboard(' ');
    expect(state.selected).toEqual(['cheese', 'olive']);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(state.selected).toEqual(['cheese', 'olive', 'basil']);
    await userEvent.keyboard('{Enter}');
    expect(state.selected).toEqual(['cheese', 'olive']);
  });

  test('one at a time: choosing another turns the first off, and required keeps the last', async () => {
    const single = await setup({ selection: 'single', modelValue: 'cheese' }, toppings);
    await userEvent.click(single.screen.getByRole('option', { name: 'Olive' }));
    expect(single.state.selected).toBe('olive');
    await userEvent.click(single.screen.getByRole('option', { name: 'Olive' }));
    expect(single.state.selected).toBeUndefined();
    single.screen.unmount();
    const required = await setup(
      { selection: 'single', modelValue: 'cheese', required: true },
      toppings,
    );
    await userEvent.click(required.screen.getByRole('option', { name: 'Cheese' }));
    expect(required.state.selected).toBe('cheese');
  });

  test('a control in a slot shows the item’s state, and takes neither the focus nor presses', async () => {
    const { screen, state, container } = await setup(
      { selection: 'multiple', modelValue: ['cheese'] },
      toppings,
    );
    const [cheese, olive] = [...container.querySelectorAll<HTMLInputElement>('input')];
    expect([cheese!.checked, olive!.checked]).toEqual([true, false]);
    expect([cheese!.getAttribute('tabindex'), olive!.getAttribute('tabindex')]).toEqual([
      '-1',
      '-1',
    ]);
    // A press on the control goes to the option.
    const box = olive!.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    expect(hit?.closest('[role="option"]')).toBe(hit);
    await userEvent.click(olive!, { force: true });
    expect(state.selected).toEqual(['cheese', 'olive']);
    await vi.waitFor(() => expect(olive!.checked).toBe(true));
    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    expect(focused()?.getAttribute('role')).toBe('option');
  });

  test('the text in an option’s slots is part of its name', async () => {
    const { screen } = await setup({ selection: 'multiple' }, toppings);
    await expect.element(screen.getByRole('option', { name: 'Basil 2 left' })).toBeVisible();
  });
});

describe('RioListItem', () => {
  test('one, two, or three lines: 56, 72, and 88px, three aligned to the top', async () => {
    const { container } = await setup({}, () => [
      h(ListItem, null, () => 'One'),
      h(ListItem, null, { default: () => 'Two', supporting: () => 'Supporting' }),
      h(ListItem, null, {
        default: () => 'Three',
        overline: () => 'Over',
        supporting: () => 'Supporting',
      }),
      h(ListItem, null, {
        default: () => 'Wraps',
        supporting: () => 'Supporting text long enough to wrap onto a second line here',
      }),
    ]);
    const items = [...container.querySelectorAll<HTMLElement>('.rio-list-item')];
    await vi.waitFor(() =>
      expect(items.map((item) => item.dataset.lines)).toEqual(['1', '2', '3', '3']),
    );
    expect(items.slice(0, 3).map((item) => item.offsetHeight)).toEqual([56, 72, 88]);
    // Three lines: the text starts 10px from the top, where two lines center it.
    const top = (i: number) =>
      items[i]!.querySelector('.rio-list-item__text')!.getBoundingClientRect().top -
      items[i]!.getBoundingClientRect().top;
    expect(top(2)).toBe(10);
    expect(top(1)).toBeGreaterThan(10);
  });

  test('16px at the sides, 10px above and below, 12px between the parts', async () => {
    const { container } = await setup({}, () => [
      h(ListItem, null, {
        default: () => 'Label',
        leading: () => h('i', 'L'),
        trailing: () => 'T',
      }),
    ]);
    const item = container.querySelector<HTMLElement>('.rio-list-item')!;
    const style = getComputedStyle(item);
    expect([
      style.paddingInlineStart,
      style.paddingInlineEnd,
      style.paddingTop,
      style.columnGap,
    ]).toEqual(['16px', '16px', '10px', '12px']);
  });

  test('segmented: 2px apart, the ends 16px round and the joins 4px; a selected item 16px', async () => {
    const { container } = await setup(
      { variant: 'segmented', selection: 'single', modelValue: 'b' },
      () => [
        h(ListItem, { value: 'a' }, () => 'A'),
        h(ListItem, { value: 'b' }, () => 'B'),
        h(ListItem, { value: 'c' }, () => 'C'),
      ],
    );
    const [a, b, c] = [...container.querySelectorAll<HTMLElement>('.rio-list-item')];
    expect(b!.getBoundingClientRect().top - a!.getBoundingClientRect().bottom).toBe(2);
    await vi.waitFor(() => {
      expect(getComputedStyle(a!).borderTopLeftRadius).toBe('16px');
      expect(getComputedStyle(a!).borderBottomLeftRadius).toBe('4px');
      expect(getComputedStyle(b!).borderTopLeftRadius).toBe('16px');
      expect(getComputedStyle(c!).borderTopLeftRadius).toBe('4px');
      expect(getComputedStyle(c!).borderBottomRightRadius).toBe('16px');
    });
  });

  test('outside a list, an action item still takes the focus', async () => {
    const screen = await render(ListItem, {
      props: { onClick: vi.fn() },
      slots: { default: () => 'Alone' },
    });
    await expect
      .element(screen.getByRole('button', { name: 'Alone' }))
      .toHaveAttribute('tabindex', '0');
  });
});
