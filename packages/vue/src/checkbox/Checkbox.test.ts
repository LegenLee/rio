import type { CheckboxProps } from '@rio-m3e/core';
import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, reactive } from 'vue';
import Checkbox from './Checkbox.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

interface Setup extends Omit<CheckboxProps, 'selected'> {
  selected?: boolean;
  /** Leaves `selected` as it is, as an app that turns the change down does. */
  keep?: boolean;
  attrs?: Record<string, unknown>;
}

/** A checkbox in its label, inside a form, as an app would write it. */
const setup = async ({ keep = false, attrs = {}, ...props }: Setup = {}) => {
  const state = reactive({ selected: props.selected ?? false, changes: [] as boolean[] });
  const screen = await render(
    defineComponent(
      () => () =>
        h('form', { style: { ...theme, padding: '40px' } }, [
          h('label', { style: { display: 'inline-flex', alignItems: 'center' } }, [
            h(Checkbox, {
              ...props,
              ...attrs,
              selected: state.selected,
              'onUpdate:selected': (next: boolean) => {
                state.changes.push(next);
                if (!keep) state.selected = next;
              },
            }),
            'Notifications',
          ]),
          h('button', { type: 'button' }, 'After'),
        ]),
    ),
  );
  const container = screen.container as HTMLElement;
  const root = container.querySelector<HTMLElement>('.rio-checkbox')!;
  const input = root.querySelector('input')!;
  const label = container.querySelector('label')!;
  const form = container.querySelector('form')!;
  return { state, root, input, label, form };
};

describe('RioCheckbox', () => {
  test('a native checkbox that a click checks and unchecks', async () => {
    const { state, root, input } = await setup();
    expect(input.type).toBe('checkbox');
    expect(input.checked).toBe(false);
    await userEvent.click(input);
    expect(state.changes).toEqual([true]);
    expect(input.checked).toBe(true);
    expect(root.dataset.selected).toBe('true');
    await userEvent.click(input);
    expect(state.changes).toEqual([true, false]);
    expect(input.checked).toBe(false);
  });

  test('a press on the input ripples on the state part', async () => {
    const { root } = await setup();
    expect(root.querySelector('.rio-checkbox__state')!.hasAttribute('data-ripple')).toBe(true);
  });

  test('a click on the label checks it too', async () => {
    const { state, label, input } = await setup();
    const box = label.getBoundingClientRect();
    await userEvent.click(label, { position: { x: box.width - 10, y: box.height / 2 } });
    expect(state.changes).toEqual([true]);
    expect(input.checked).toBe(true);
  });

  test('Space checks it; Enter leaves it', async () => {
    const { state, input } = await setup();
    input.focus();
    await userEvent.keyboard('{Enter}');
    expect(state.changes).toEqual([]);
    await userEvent.keyboard(' ');
    expect(state.changes).toEqual([true]);
  });

  test('a change the app turns down doesn’t stick', async () => {
    const { state, input } = await setup({ keep: true });
    await userEvent.click(input);
    expect(state.changes).toEqual([true]);
    await expect.poll(() => input.checked).toBe(false);
  });

  test('the app sets it from outside', async () => {
    const { state, input, root } = await setup();
    state.selected = true;
    await expect.poll(() => input.checked).toBe(true);
    expect(root.dataset.selected).toBe('true');
  });

  test('indeterminate: a press makes it checked, even when it was checked', async () => {
    const { state, input, root } = await setup({ selected: true, indeterminate: true, keep: true });
    expect(input.indeterminate).toBe(true);
    expect(root.hasAttribute('data-indeterminate')).toBe(true);
    expect(root.dataset.selected).toBe('false');
    await userEvent.click(input);
    expect(state.changes).toEqual([true]);
    // The prop still says indeterminate, so it stays so.
    await expect.poll(() => input.indeterminate).toBe(true);
  });

  test('disabled: not focusable, and a click does nothing', async () => {
    const { state, input, root } = await setup({ disabled: true });
    expect(input.disabled).toBe(true);
    expect(root.hasAttribute('data-disabled')).toBe(true);
    input.click();
    expect(state.changes).toEqual([]);
  });

  test('soft-disabled: focusable, but a click or Space does nothing', async () => {
    const { state, input } = await setup({ softDisabled: true });
    expect(input.getAttribute('aria-disabled')).toBe('true');
    // Playwright won't click an element marked aria-disabled.
    input.click();
    input.focus();
    await userEvent.keyboard(' ');
    expect(document.activeElement).toBe(input);
    expect(state.changes).toEqual([]);
    expect(input.checked).toBe(false);
  });

  test('error marks it invalid', async () => {
    const { input, root } = await setup({ error: true });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(root.hasAttribute('data-error')).toBe(true);
  });

  test('class and style go to the root, the rest to the input, which submits its value', async () => {
    const { root, input, form } = await setup({
      selected: true,
      attrs: {
        class: 'mine',
        style: { margin: '4px' },
        id: 'notify',
        name: 'notify',
        value: 'yes',
      },
    });
    expect(root.classList.contains('mine')).toBe(true);
    expect(root.style.margin).toBe('4px');
    expect(input.classList.contains('mine')).toBe(false);
    expect(input.id).toBe('notify');
    expect([...new FormData(form)]).toEqual([['notify', 'yes']]);
  });

  test('lays out at the 48px target, the 18px box and the 40px circle in its middle', async () => {
    const { root } = await setup();
    const box = root.getBoundingClientRect();
    const container = root.querySelector('.rio-checkbox__container')!.getBoundingClientRect();
    const state = root.querySelector('.rio-checkbox__state')!.getBoundingClientRect();
    const input = root.querySelector('input')!.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([48, 48]);
    expect([input.width, input.height]).toEqual([48, 48]);
    expect([container.width, container.height]).toEqual([18, 18]);
    expect([state.width, state.height]).toEqual([40, 40]);
    expect(container.left - box.left).toBe(15);
    expect(state.left - box.left).toBe(4);
  });

  test('checking draws the checkmark out, and unchecking takes it back', async () => {
    const { state, root } = await setup();
    const icon = root.querySelector('.rio-checkbox__icon')!;
    const long = () => getComputedStyle(icon, '::after');
    expect(long().width).toBe('0px');
    state.selected = true;
    // Lengths come back rounded to the browser's layout unit.
    await expect.poll(() => parseFloat(long().width)).toBeCloseTo(11.314, 1);
    expect(parseFloat(getComputedStyle(icon, '::before').height)).toBeCloseTo(5.657, 1);
    state.selected = false;
    await expect.poll(() => long().width).toBe('0px');
  });

  test('indeterminate lays both marks flat, the long one 10px across', async () => {
    const { root } = await setup({ indeterminate: true });
    const icon = root.querySelector('.rio-checkbox__icon')!;
    await expect.poll(() => getComputedStyle(icon, '::after').width).toBe('10px');
    expect(getComputedStyle(icon, '::after').transform).toBe(
      getComputedStyle(icon, '::before').transform,
    );
  });

  test('keyboard focus shows the ring around the state circle', async () => {
    const { input, root } = await setup();
    await userEvent.keyboard('{Shift}');
    input.focus();
    const state = getComputedStyle(root.querySelector('.rio-checkbox__state')!);
    expect(state.outlineStyle).toBe('solid');
    expect(state.outlineWidth).toBe('3px');
  });
});
