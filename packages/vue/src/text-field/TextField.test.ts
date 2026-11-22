import { mdiClose, mdiMagnify } from '@mdi/js';
import type { TextFieldProps } from '@rio-m3e/core';
import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, reactive, ref } from 'vue';
import IconButton from '../icon-button/IconButton.vue';
import { icon } from '../test/vrt';
import TextField from './TextField.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

interface Setup extends Omit<TextFieldProps, 'value'> {
  value?: string | number;
  attrs?: Record<string, unknown>;
  leading?: boolean;
  trailing?: boolean;
}

/** A text field in a form, as an app would write it, with a button after it. */
const setup = async ({ value = '', attrs = {}, leading, trailing, ...props }: Setup = {}) => {
  const state = reactive({ value: value as string | number, clicks: 0 });
  const screen = await render(
    defineComponent(
      () => () =>
        h('form', { style: { ...theme, padding: '40px', display: 'grid', gap: '16px' } }, [
          h(
            TextField,
            {
              ...props,
              ...attrs,
              modelValue: state.value,
              'onUpdate:modelValue': (next: string | number) => (state.value = next),
              style: { inlineSize: '320px', ...(attrs.style as object) },
            },
            {
              ...(leading ? { 'leading-icon': () => icon(mdiMagnify) } : {}),
              ...(trailing
                ? {
                    'trailing-icon': () =>
                      h(
                        IconButton,
                        { label: 'Clear', variant: 'standard', onClick: () => state.clicks++ },
                        () => icon(mdiClose),
                      ),
                  }
                : {}),
            },
          ),
          h('button', { type: 'button' }, 'After'),
        ]),
    ),
  );
  const container = screen.container as HTMLElement;
  const root = container.querySelector<HTMLElement>('.rio-text-field')!;
  const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    '.rio-text-field__input',
  )!;
  const label = root.querySelector<HTMLElement>('.rio-text-field__label');
  const part = (name: string) => root.querySelector<HTMLElement>(`.rio-text-field__${name}`);
  /** Waits for the label's motion to end. */
  const settled = () =>
    vi.waitFor(() => expect(root.getAnimations({ subtree: true })).toHaveLength(0));
  return { state, root, input, label, part, settled, container };
};

describe('RioTextField', () => {
  test('a native input named by its label, that v-model follows', async () => {
    const { state, input, label } = await setup({ label: 'Name' });
    expect(input.tagName).toBe('INPUT');
    expect(label!.tagName).toBe('LABEL');
    expect(page.getByLabelText('Name').element()).toBe(input);
    await userEvent.type(input, 'Ada');
    expect(state.value).toBe('Ada');
    state.value = 'Grace';
    await vi.waitFor(() => expect(input.value).toBe('Grace'));
  });

  test('the label rests in the field, and moves up when focused or populated', async () => {
    const { state, root, input, label, settled } = await setup({ label: 'Name' });
    const at = () => [getComputedStyle(label!).insetBlockStart, getComputedStyle(label!).fontSize];
    await settled();
    expect(at()).toEqual(['16px', '16px']);
    input.focus();
    await settled();
    expect(at()).toEqual(['8px', '12px']);
    input.blur();
    await settled();
    expect(at()).toEqual(['16px', '16px']);
    state.value = 'Ada';
    await vi.waitFor(() => expect(root.hasAttribute('data-populated')).toBe(true));
    await settled();
    expect(at()).toEqual(['8px', '12px']);
  });

  test('outlined: the label moves into a gap in the outline', async () => {
    const { input, label, part, settled } = await setup({ variant: 'outlined', label: 'Email' });
    const notch = part('outline-notch')!;
    expect(notch.textContent).toBe('Email');
    expect(getComputedStyle(notch).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    input.focus();
    await settled();
    expect(getComputedStyle(label!).insetBlockStart).toBe('-8px');
    expect(getComputedStyle(notch).borderTopColor).toBe('rgba(0, 0, 0, 0)');
    // The gap is as wide as the label at its top size, plus 4px at each side.
    expect(notch.getBoundingClientRect().width).toBeCloseTo(
      label!.getBoundingClientRect().width + 8,
      0,
    );
    expect(getComputedStyle(part('outline-start')!).borderTopWidth).toBe('3px');
  });

  test('required: an asterisk ends the label, and the input is required', async () => {
    const { input, label } = await setup({ label: 'Email', required: true });
    expect(label!.textContent).toBe('Email*');
    expect(input.required).toBe(true);
    expect(page.getByLabelText('Email*').element()).toBe(input);
  });

  test('supporting text describes the input; error text takes its place and is announced', async () => {
    const { input, part } = await setup({
      label: 'Code',
      supportingText: 'From your email',
      errorText: 'Six characters',
    });
    const text = part('supporting-text')!;
    expect(text.textContent).toBe('From your email');
    expect(input.getAttribute('aria-describedby')).toBe(text.id);
    expect(text.hasAttribute('role')).toBe(false);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  test('in error, the error text shows instead, with role="alert"', async () => {
    const { input, part, root } = await setup({
      label: 'Code',
      supportingText: 'From your email',
      error: true,
      errorText: 'Six characters',
    });
    const text = part('supporting-text')!;
    expect(text.textContent).toBe('Six characters');
    expect(text.getAttribute('role')).toBe('alert');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(root.hasAttribute('data-error')).toBe(true);
  });

  test('error without error text keeps the supporting text', async () => {
    const { part } = await setup({ label: 'Code', supportingText: 'From your email', error: true });
    expect(part('supporting-text')!.textContent).toBe('From your email');
    expect(part('supporting-text')!.hasAttribute('role')).toBe(false);
  });

  test('maxlength limits the input and counts the characters', async () => {
    const { input, part } = await setup({ label: 'Code', maxlength: 6 });
    const counter = part('counter')!;
    expect(counter.textContent).toBe('0 / 6');
    expect(input.maxLength).toBe(6);
    await userEvent.type(input, 'abcdefgh');
    expect(input.value).toBe('abcdef');
    expect(counter.textContent).toBe('6 / 6');
    expect(input.getAttribute('aria-describedby')).toBe(counter.id);
  });

  test('prefix and suffix show once the label moves up, and describe the input', async () => {
    const { input, part, settled } = await setup({ label: 'Amount', prefix: '$', suffix: 'USD' });
    const prefix = part('prefix')!;
    expect(prefix.textContent).toBe('$');
    expect(input.getAttribute('aria-describedby')).toBe(`${prefix.id} ${part('suffix')!.id}`);
    await settled();
    expect(getComputedStyle(prefix).opacity).toBe('0');
    input.focus();
    await settled();
    expect(getComputedStyle(prefix).opacity).toBe('1');
  });

  test('the placeholder shows only once the label is out of its way', async () => {
    const { input } = await setup({ label: 'Search', attrs: { placeholder: 'Songs' } });
    const color = () => getComputedStyle(input, '::placeholder').color;
    expect(color()).toBe('rgba(0, 0, 0, 0)');
    input.focus();
    await vi.waitFor(() => expect(color()).not.toBe('rgba(0, 0, 0, 0)'));
  });

  test('an input that always shows something keeps the label at the top', async () => {
    const { label, settled } = await setup({ label: 'Date', attrs: { type: 'date' } });
    await settled();
    expect(getComputedStyle(label!).fontSize).toBe('12px');
  });

  test('multiline: a text area, three rows by default', async () => {
    const { input } = await setup({ label: 'Notes', multiline: true });
    expect(input.tagName).toBe('TEXTAREA');
    expect((input as HTMLTextAreaElement).rows).toBe(3);
    const five = await setup({ label: 'Notes', multiline: true, rows: 5 });
    expect((five.input as HTMLTextAreaElement).rows).toBe(5);
  });

  test('a text area is made taller from the field’s corner, never shorter than its rows', async () => {
    const { input, part } = await setup({ label: 'Notes', multiline: true });
    const container = part('container')!;
    expect(getComputedStyle(input).resize).toBe('none');
    expect(getComputedStyle(container).resize).toBe('vertical');
    const start = container.getBoundingClientRect().height;
    container.style.blockSize = '20px';
    expect(container.getBoundingClientRect().height).toBe(start);
    container.style.blockSize = `${start + 48}px`;
    expect(input.getBoundingClientRect().height).toBeGreaterThan(72);
  });

  test('its least height follows its rows, as they change', async () => {
    const rows = ref(3);
    const screen = await render(
      defineComponent(
        () => () =>
          h(TextField, { label: 'Notes', multiline: true, rows: rows.value, style: theme }),
      ),
    );
    const container = (screen.container as HTMLElement).querySelector<HTMLElement>(
      '.rio-text-field__container',
    )!;
    const least = () => parseFloat(getComputedStyle(container).minBlockSize);
    const three = least();
    rows.value = 5;
    await vi.waitFor(() => expect(least()).toBeGreaterThan(three));
    const line = (least() - three) / 2;
    expect(least()).toBeCloseTo(5 * line + 32, 0);
  });

  test('a drag from the corner resizes it, rather than focusing the input', async () => {
    const { part, container: screen } = await setup({ label: 'Notes', multiline: true });
    const container = part('container')!;
    const { width, height } = container.getBoundingClientRect();
    // Down to the button below the field
    const below = screen.querySelector<HTMLElement>('button')!;
    await userEvent.dragAndDrop(page.elementLocator(container), page.elementLocator(below), {
      sourcePosition: { x: width - 3, y: height - 3 },
      targetPosition: { x: 4, y: below.getBoundingClientRect().height / 2 },
    });
    expect(container.getBoundingClientRect().height).toBeGreaterThan(height + 20);
  });

  test('a single line can’t be resized', async () => {
    const { part } = await setup({ label: 'Name' });
    expect(getComputedStyle(part('container')!).resize).toBe('none');
  });

  test('while an IME composes, the value waits for the composition to end', async () => {
    const { state, input } = await setup({ label: 'Name' });
    input.focus();
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '하';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    input.value = '한';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    expect(state.value).toBe('');
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(state.value).toBe('한');
  });

  test('with type="number", v-model gives a number, and the counter still counts', async () => {
    const { state, input, part } = await setup({
      label: 'Age',
      maxlength: 3,
      attrs: { type: 'number' },
    });
    await userEvent.type(input, '42');
    expect(state.value).toBe(42);
    expect(part('counter')!.textContent).toBe('2 / 3');
  });

  test('the app’s own id stays the input’s, and the label points at it', async () => {
    const { input, label } = await setup({
      label: 'Email',
      supportingText: 'Hint',
      attrs: { id: 'email' },
    });
    expect(input.id).toBe('email');
    expect(label!.getAttribute('for')).toBe('email');
    expect(page.getByLabelText('Email').element()).toBe(input);
  });

  test('the error text comes as a new element, with its alert role', async () => {
    const props = reactive({ error: false });
    const screen = await render(
      defineComponent(
        () => () =>
          h(TextField, {
            label: 'Code',
            supportingText: 'Hint',
            errorText: 'Wrong',
            error: props.error,
          }),
      ),
    );
    const text = () => screen.container.querySelector('.rio-text-field__supporting-text')!;
    const before = text();
    props.error = true;
    await vi.waitFor(() => expect(text().textContent).toBe('Wrong'));
    expect(text()).not.toBe(before);
    expect(text().getAttribute('role')).toBe('alert');
  });

  test('class and style dress the root; other attributes and listeners go to the input', async () => {
    const blurs: string[] = [];
    const { root, input } = await setup({
      label: 'Email',
      attrs: { class: 'mine', type: 'email', name: 'email', onBlur: () => blurs.push('blur') },
    });
    expect(root.classList.contains('mine')).toBe(true);
    expect(root.style.inlineSize).toBe('320px');
    expect(input.classList.contains('mine')).toBe(false);
    expect([input.type, input.name]).toEqual(['email', 'email']);
    input.focus();
    input.blur();
    expect(blurs).toEqual(['blur']);
  });

  test('a press on the field outside the input focuses it; an icon button keeps its own', async () => {
    const { state, input, root, container } = await setup({
      label: 'Search',
      value: 'blue',
      leading: true,
      trailing: true,
    });
    const box = root.querySelector('.rio-text-field__container')!;
    await userEvent.click(page.elementLocator(box), { position: { x: 4, y: 28 } });
    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).selectionStart).toBe(4);
    const clear = container.querySelector<HTMLElement>('[aria-label="Clear"]')!;
    await userEvent.click(clear);
    expect(state.clicks).toBe(1);
    expect(document.activeElement).toBe(clear);
  });

  test('a press on anything in the field that takes the focus itself is left to it', async () => {
    const screen = await render(
      defineComponent(
        () => () =>
          h(
            TextField,
            { label: 'Search', modelValue: '' },
            {
              'trailing-icon': () => [
                h('a', { href: '#', 'data-kind': '' }, 'a'),
                h('button', { type: 'button', 'data-kind': '' }, 'b'),
                h('input', { 'data-kind': '' }),
                h('select', { 'data-kind': '' }),
                h('textarea', { 'data-kind': '' }),
                h('span', { tabindex: '-1', 'data-kind': '' }, 't'),
                h('span', { contenteditable: '', 'data-kind': '' }, 'c'),
                h('span', { class: 'plain' }, 'p'),
              ],
            },
          ),
      ),
    );
    const root = screen.container.querySelector<HTMLElement>('.rio-text-field')!;
    /** Whether the field let the press through, as the browser takes it */
    const leftAlone = (el: Element) =>
      el.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }),
      );
    // The field's own input too, where a press places the caret.
    const own = root.querySelector('.rio-text-field__input')!;
    for (const el of [own, ...root.querySelectorAll('[data-kind]')]) {
      expect(leftAlone(el), el.outerHTML).toBe(true);
    }
    expect(leftAlone(root.querySelector('.plain')!)).toBe(false);
  });

  test('disabled: the input is disabled, and a press doesn’t focus it', async () => {
    const { input, root } = await setup({ label: 'Name', disabled: true });
    expect(input.disabled).toBe(true);
    expect(root.hasAttribute('data-disabled')).toBe(true);
    await userEvent.click(page.elementLocator(root.querySelector('.rio-text-field__container')!), {
      position: { x: 4, y: 28 },
      force: true,
    });
    expect(document.activeElement).not.toBe(input);
  });

  test('readonly: the text can’t change', async () => {
    const { input, state } = await setup({ label: 'Name', value: 'Ada', readonly: true });
    expect(input.readOnly).toBe(true);
    await userEvent.type(input, 'x');
    expect(state.value).toBe('Ada');
  });

  test('measures as the spec does', async () => {
    const { root, part } = await setup({ label: 'Search', leading: true, supportingText: 'Hint' });
    const container = part('container')!.getBoundingClientRect();
    const icon = part('leading-icon')!.getBoundingClientRect();
    const content = part('content')!.getBoundingClientRect();
    const supporting = part('supporting-text')!.getBoundingClientRect();
    expect(container.height).toBe(56);
    expect(icon.left - container.left).toBe(12);
    expect(icon.width).toBe(24);
    expect(content.left - icon.right).toBe(16);
    expect(supporting.top - container.bottom).toBe(4);
    expect(getComputedStyle(part('container')!).borderTopLeftRadius).toBe('4px');
    expect(getComputedStyle(part('container')!).borderBottomLeftRadius).toBe('0px');
    expect(getComputedStyle(root.querySelector('.rio-text-field__input')!).fontSize).toBe('16px');
  });
});
