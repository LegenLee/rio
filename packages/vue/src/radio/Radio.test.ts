import type { RadioValue } from '@rio-m3e/core';
import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, reactive } from 'vue';
import Radio from './Radio.vue';
import RadioGroup from './RadioGroup.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

interface Setup {
  selected?: RadioValue;
  /** Leaves the selection as it is, as an app that turns the change down does. */
  keep?: boolean;
  /** Props for a radio button, by its value */
  radios?: Record<string, Record<string, unknown>>;
  name?: string;
}

const TONES = ['Callisto', 'Ganymede', 'Luna'];

/** A group of radio buttons, each in its label, inside a form, as an app would write it. */
const setup = async ({ selected, keep = false, radios = {}, name }: Setup = {}) => {
  const state = reactive({ selected, changes: [] as (RadioValue | undefined)[] });
  const screen = await render(
    defineComponent(
      () => () =>
        h('form', { style: { ...theme, padding: '40px' } }, [
          h('button', { type: 'button' }, 'Before'),
          h(
            RadioGroup,
            {
              label: 'Ringtone',
              name,
              modelValue: state.selected,
              'onUpdate:modelValue': (next: RadioValue | undefined) => {
                state.changes.push(next);
                if (!keep) state.selected = next;
              },
            },
            () =>
              TONES.map((tone) =>
                h('label', { style: { display: 'inline-flex', alignItems: 'center' } }, [
                  h(Radio, { value: tone, ...radios[tone] }),
                  tone,
                ]),
              ),
          ),
          h('button', { type: 'button' }, 'After'),
        ]),
    ),
  );
  const container = screen.container as HTMLElement;
  const group = container.querySelector<HTMLElement>('[role="radiogroup"]')!;
  const inputs = [...group.querySelectorAll('input')];
  const input = (tone: string) => inputs[TONES.indexOf(tone)]!;
  const checked = () => inputs.filter((each) => each.checked).map((each) => each.value);
  const button = (text: string) =>
    [...container.querySelectorAll('button')].find((each) => each.textContent === text)!;
  const form = container.querySelector('form')!;
  return { state, group, inputs, input, checked, button, form };
};

describe('RioRadioGroup and RioRadio', () => {
  test('a radio group named by its label, of native radio buttons sharing a name', async () => {
    const { group, inputs } = await setup();
    expect(group.getAttribute('aria-label')).toBe('Ringtone');
    expect(inputs.map((each) => each.type)).toEqual(['radio', 'radio', 'radio']);
    expect(new Set(inputs.map((each) => each.name)).size).toBe(1);
    expect(inputs[0]!.name).not.toBe('');
  });

  test('a click selects one, and only one', async () => {
    const { state, input, checked } = await setup({ selected: 'Callisto' });
    expect(checked()).toEqual(['Callisto']);
    await userEvent.click(input('Luna'));
    expect(state.changes).toEqual(['Luna']);
    expect(checked()).toEqual(['Luna']);
    const root = input('Luna').closest('.rio-radio') as HTMLElement;
    expect(root.dataset.selected).toBe('true');
  });

  test('a press on the input ripples on the state part', async () => {
    const { input } = await setup();
    const state = input('Luna').parentElement!.querySelector('.rio-radio__state')!;
    expect(state.hasAttribute('data-ripple')).toBe(true);
  });

  test('a click on the label selects it too', async () => {
    const { state, input } = await setup();
    const label = input('Ganymede').closest('label')!;
    const box = label.getBoundingClientRect();
    await userEvent.click(label, { position: { x: box.width - 10, y: box.height / 2 } });
    expect(state.changes).toEqual(['Ganymede']);
  });

  test('Tab enters at the selected one; the arrows select the next, wrapping around', async () => {
    const { state, input, button, checked } = await setup({ selected: 'Ganymede' });
    button('Before').focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(input('Ganymede'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(input('Luna'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(input('Callisto'));
    expect(state.changes).toEqual(['Luna', 'Callisto']);
    expect(checked()).toEqual(['Callisto']);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(button('After'));
  });

  test('without a selection, Tab enters at the first and Shift+Tab at the last', async () => {
    const { input, button } = await setup();
    button('Before').focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(input('Callisto'));
    button('After').focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(input('Luna'));
  });

  test('at an end, the arrows go round even where the browser stops', async () => {
    // A synthetic key press has no default action, as WebKit's arrow keys have none at the ends.
    const { state, input, checked } = await setup({ selected: 'Luna' });
    const press = (target: HTMLElement, key: string) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    input('Luna').focus();
    press(input('Luna'), 'ArrowDown');
    await expect.poll(() => document.activeElement).toBe(input('Callisto'));
    expect(state.changes).toEqual(['Callisto']);
    expect(checked()).toEqual(['Callisto']);
    press(input('Callisto'), 'ArrowUp');
    await expect.poll(() => document.activeElement).toBe(input('Luna'));
    // Not at an end: left to the browser
    press(input('Luna'), 'ArrowUp');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(document.activeElement).toBe(input('Luna'));
  });

  test('right to left, Left goes forward: at the end, round to the first', async () => {
    const { state, group, input } = await setup({ selected: 'Luna' });
    group.dir = 'rtl';
    input('Luna').focus();
    input('Luna').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await expect.poll(() => document.activeElement).toBe(input('Callisto'));
    expect(state.changes).toEqual(['Callisto']);
  });

  test('at an end, the arrows with Alt, Ctrl, or Meta are left to the browser', async () => {
    const { state, input } = await setup({ selected: 'Luna' });
    input('Luna').focus();
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
      input('Luna').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, [modifier]: true }),
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(document.activeElement).toBe(input('Luna'));
    expect(state.changes).toEqual([]);
  });

  test('Space selects the focused one', async () => {
    const { state, input } = await setup();
    input('Luna').focus();
    await userEvent.keyboard(' ');
    expect(state.changes).toEqual(['Luna']);
  });

  test('a change the app turns down doesn’t stick', async () => {
    const { state, input, checked } = await setup({ selected: 'Callisto', keep: true });
    await userEvent.click(input('Luna'));
    expect(state.changes).toEqual(['Luna']);
    await expect.poll(checked).toEqual(['Callisto']);
  });

  test('the app sets the selection from outside', async () => {
    const { state, checked } = await setup({ selected: 'Callisto' });
    state.selected = 'Luna';
    await expect.poll(checked).toEqual(['Luna']);
  });

  test('a disabled one is skipped by the arrows', async () => {
    const { input } = await setup({
      selected: 'Callisto',
      radios: { Ganymede: { disabled: true } },
    });
    expect(input('Ganymede').disabled).toBe(true);
    input('Callisto').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(input('Luna'));
  });

  test('a soft-disabled one takes the focus but not the selection', async () => {
    const { state, input, checked } = await setup({
      selected: 'Callisto',
      radios: { Ganymede: { softDisabled: true } },
    });
    expect(input('Ganymede').getAttribute('aria-disabled')).toBe('true');
    // Playwright won't click an element marked aria-disabled.
    input('Ganymede').click();
    expect(checked()).toEqual(['Callisto']);
    input('Callisto').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(input('Ganymede'));
    await expect.poll(checked).toEqual(['Callisto']);
    expect(state.changes).toEqual([]);
  });

  test('the selected value goes with a form, under the group’s name', async () => {
    const { form } = await setup({ selected: 'Luna', name: 'tone' });
    expect([...new FormData(form)]).toEqual([['tone', 'Luna']]);
  });

  test('lays out at the 48px target, stacked, with the input over all of it', async () => {
    const { input } = await setup();
    const first = input('Callisto').closest('.rio-radio')!.getBoundingClientRect();
    const second = input('Ganymede').closest('.rio-radio')!.getBoundingClientRect();
    const target = input('Callisto').getBoundingClientRect();
    const icon = input('Callisto').parentElement!.querySelector('.rio-radio__icon')!;
    expect([first.width, first.height]).toEqual([48, 48]);
    expect([target.left, target.top, target.width, target.height]).toEqual([
      first.left,
      first.top,
      48,
      48,
    ]);
    expect(second.top - first.top).toBe(48);
    expect(icon.getBoundingClientRect().width).toBe(20);
  });

  test('a radio button outside a group is an error', async () => {
    const errors: unknown[] = [];
    const host = document.body.appendChild(document.createElement('div'));
    const { createApp } = await import('vue');
    const app = createApp(() => h(Radio, { value: 'a' }));
    app.config.errorHandler = (error) => errors.push(error);
    app.config.warnHandler = () => {};
    app.mount(host);
    app.unmount();
    host.remove();
    expect(String(errors[0])).toContain('RioRadioGroup');
  });
});
