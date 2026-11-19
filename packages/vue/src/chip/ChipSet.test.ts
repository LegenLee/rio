import type { ChipSetSelected } from '@rio-m3e/core';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, reactive, ref, type VNode } from 'vue';
import AssistChip from './AssistChip.vue';
import ChipSet from './ChipSet.vue';
import FilterChip from './FilterChip.vue';
import InputChip from './InputChip.vue';

const svg = () => h('svg', { viewBox: '0 0 24 24' });

/** A chip set the app names, with chips the app renders, and the selection it keeps */
const setup = async (
  chips: () => VNode[],
  props: Record<string, unknown> = {},
  wrap?: (set: VNode) => VNode,
) => {
  const state = reactive({
    selected: props.modelValue as ChipSetSelected,
    changes: [] as ChipSetSelected[],
  });
  const screen = await render(
    defineComponent(() => () => {
      const set = h(
        ChipSet,
        {
          'aria-label': 'Filters',
          ...props,
          modelValue: state.selected,
          'onUpdate:modelValue': (next: ChipSetSelected) => {
            state.changes.push(next);
            state.selected = next;
          },
        },
        chips,
      );
      return h('div', [h('button', 'Before'), wrap ? wrap(set) : set, h('button', 'After')]);
    }),
  );
  const button = (name: string) =>
    screen.getByRole('button', { name, exact: true }).element() as HTMLElement;
  const tabStops = () =>
    [...screen.container.querySelectorAll<HTMLElement>('.rio-chip-set [tabindex="0"]')].map(
      (el) => el.textContent,
    );
  return { screen, state, button, tabStops };
};

const three = () => [
  h(AssistChip, null, () => 'One'),
  h(AssistChip, null, () => 'Two'),
  h(AssistChip, null, () => 'Three'),
];

describe('RioChipSet', () => {
  test('a toolbar named by the app', async () => {
    const { screen } = await setup(three);
    await expect.element(screen.getByRole('toolbar', { name: 'Filters' })).toBeInTheDocument();
  });

  test('one stop in the tab order, at the first chip until the focus has been in', async () => {
    const { button, tabStops } = await setup(three);
    await vi.waitFor(() => expect(tabStops()).toEqual(['One']));
    expect(button('Two').tabIndex).toBe(-1);
    button('Before').focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(button('One'));
    await userEvent.tab();
    expect(document.activeElement).toBe(button('After'));
  });

  test('the arrow keys move through the chips, wrapping around; Home and End go to the ends', async () => {
    const { button } = await setup(three);
    button('One').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(button('Two'));
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(button('Three'));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(button('One'));
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(button('Three'));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(button('One'));
  });

  test('right to left, the arrows go the other way', async () => {
    const { button } = await setup(three, {}, (set) => h('div', { dir: 'rtl' }, [set]));
    button('One').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(button('Two'));
  });

  test('Tab comes back to the chip the focus was last on', async () => {
    const { button, tabStops } = await setup(three);
    button('One').focus();
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => expect(tabStops()).toEqual(['Two']));
    button('After').focus();
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(button('Two'));
  });

  test('the arrow keys leave Alt, Ctrl, Meta, and Shift to the app', async () => {
    const { button } = await setup(three);
    button('One').focus();
    await userEvent.keyboard('{Control>}{ArrowRight}{/Control}');
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(document.activeElement).toBe(button('One'));
  });

  test('when the tab stop’s chip turns disabled on its own, the first chip takes the tab stop', async () => {
    // The chip re-renders without the set: only the chip's own state changes.
    const off = ref(false);
    const Two = defineComponent(() => () => h(AssistChip, { disabled: off.value }, () => 'Two'));
    const { button, tabStops } = await setup(() => [h(AssistChip, null, () => 'One'), h(Two)]);
    button('Two').focus();
    button('Before').focus();
    await vi.waitFor(() => expect(tabStops()).toEqual(['Two']));
    off.value = true;
    await vi.waitFor(() => expect(tabStops()).toEqual(['One']));
  });

  test('the arrow keys pass a disabled chip and stop at a soft-disabled one', async () => {
    const { button } = await setup(() => [
      h(AssistChip, null, () => 'One'),
      h(AssistChip, { disabled: true }, () => 'Two'),
      h(AssistChip, { softDisabled: true }, () => 'Three'),
    ]);
    button('One').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(button('Three'));
  });

  test('the arrow keys reach an input chip’s remove button', async () => {
    const { button, screen } = await setup(() => [
      h(InputChip, null, { default: () => 'Ada', 'remove-icon': svg }),
      h(AssistChip, null, () => 'Two'),
    ]);
    const remove = screen.getByRole('button', { name: 'Remove Ada' }).element() as HTMLElement;
    expect(remove.tabIndex).toBe(-1);
    button('Ada').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(remove);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(button('Two'));
  });

  describe('removing chips', () => {
    const people = async () => {
      const list = reactive(['Ada', 'Bo', 'Cy']);
      const result = await setup(() =>
        list.map((name) =>
          h(
            InputChip,
            { key: name, onRemove: () => list.splice(list.indexOf(name), 1) },
            { default: () => name, 'remove-icon': svg },
          ),
        ),
      );
      return { ...result, list };
    };

    test('Backspace on a chip removes it, and the focus goes to the chip in its place', async () => {
      const { button, list } = await people();
      button('Bo').focus();
      await userEvent.keyboard('{Backspace}');
      await vi.waitFor(() => expect(list).toEqual(['Ada', 'Cy']));
      await vi.waitFor(() => expect(document.activeElement).toBe(button('Cy')));
    });

    test('removing the last chip moves the focus to the one before', async () => {
      const { button, list, tabStops } = await people();
      button('Cy').focus();
      await userEvent.keyboard('{Delete}');
      await vi.waitFor(() => expect(list).toEqual(['Ada', 'Bo']));
      await vi.waitFor(() => expect(document.activeElement).toBe(button('Bo')));
      await vi.waitFor(() => expect(tabStops()).toEqual(['Bo']));
    });

    test('a chip removed after the focus has left the set leaves the focus where it is', async () => {
      const { button, list } = await people();
      button('Bo').focus();
      // As a click on the page's background, which focuses nothing; the app removes it later.
      (document.activeElement as HTMLElement).blur();
      await new Promise((resolve) => setTimeout(resolve));
      list.splice(1, 1);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(document.activeElement).toBe(document.body);
    });

    test('when the tab stop’s chip leaves without the focus, the first chip takes it', async () => {
      const { button, list, tabStops } = await people();
      button('Bo').focus();
      button('Before').focus();
      await vi.waitFor(() => expect(tabStops()).toEqual(['Bo']));
      list.splice(1, 1);
      await vi.waitFor(() => expect(tabStops()).toEqual(['Ada']));
      expect(document.activeElement).toBe(button('Before'));
    });
  });

  describe('selection', () => {
    const sizes = () => [
      h(FilterChip, { value: 's' }, () => 'Small'),
      h(FilterChip, { value: 'm' }, () => 'Medium'),
      h(FilterChip, null, () => 'On its own'),
    ];

    test('single: the set keeps one value, and selecting another turns the first off', async () => {
      const { button, state } = await setup(sizes, { selection: 'single' });
      await userEvent.click(button('Small'));
      expect(state.selected).toBe('s');
      await vi.waitFor(() => expect(button('Small').getAttribute('aria-pressed')).toBe('true'));
      await userEvent.click(button('Medium'));
      expect(state.selected).toBe('m');
      await vi.waitFor(() => expect(button('Small').getAttribute('aria-pressed')).toBe('false'));
    });

    test('multiple, with required: chips add up, and the last one stays', async () => {
      const { button, state } = await setup(sizes, {
        selection: 'multiple',
        required: true,
        modelValue: ['s'],
      });
      await userEvent.click(button('Medium'));
      expect(state.selected).toEqual(['s', 'm']);
      await userEvent.click(button('Small'));
      await userEvent.click(button('Medium'));
      expect(state.selected).toEqual(['m']);
      expect(state.changes).toHaveLength(2);
    });

    test('without a selection, chips with a value keep their own selection too', async () => {
      const onSelected = vi.fn();
      const { button, state } = await setup(() => [
        h(FilterChip, { value: 's', 'onUpdate:selected': onSelected }, () => 'Small'),
      ]);
      await userEvent.click(button('Small'));
      expect(onSelected).toHaveBeenCalledWith(true);
      expect(state.changes).toEqual([]);
    });

    test('a chip without a value keeps its own selection', async () => {
      const onSelected = vi.fn();
      const { button, state } = await setup(
        () => [h(FilterChip, { 'onUpdate:selected': onSelected }, () => 'On its own')],
        { selection: 'single' },
      );
      await userEvent.click(button('On its own'));
      expect(onSelected).toHaveBeenCalledWith(true);
      expect(state.changes).toEqual([]);
    });
  });

  test('scroll: one row, which scrolls sideways', async () => {
    const { screen } = await setup(three, { scroll: true }, (set) =>
      h('div', { style: 'width: 120px' }, [set]),
    );
    const set = screen.getByRole('toolbar').element() as HTMLElement;
    expect(getComputedStyle(set).flexWrap).toBe('nowrap');
    expect(set.scrollWidth).toBeGreaterThan(set.clientWidth);
  });

  test('chips wrap to new rows, 8px apart', async () => {
    const { screen } = await setup(three, {}, (set) => h('div', { style: 'width: 120px' }, [set]));
    const [one, two] = [...screen.container.querySelectorAll('.rio-chip')].map((el) =>
      el.getBoundingClientRect(),
    );
    expect(two!.top - one!.bottom).toBe(8);
  });
});
