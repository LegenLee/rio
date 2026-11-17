import type { SelectProps, SelectSelected } from '@rio-m3e/core';
import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { createApp, defineComponent, h, reactive, type VNode } from 'vue';
import Select from './Select.vue';
import SelectOption from './SelectOption.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

const SIZES = ['Small', 'Medium', 'Large', 'Extra large'];
const sizes = () =>
  SIZES.map((size) =>
    h(SelectOption, { value: size.toLowerCase(), disabled: size === 'Large' }, () => size),
  );

interface Setup extends Omit<SelectProps, 'selected' | 'open'> {
  selected?: SelectSelected;
  options?: () => VNode[];
  slots?: Record<string, (props: never) => unknown>;
  attrs?: Record<string, unknown>;
}

/** A select in a form, as an app would write it, with a button after it. */
const setup = async ({
  selected,
  options = sizes,
  slots = {},
  attrs = {},
  ...props
}: Setup = {}) => {
  const state = reactive({ selected, open: false });
  const screen = await render(
    defineComponent(
      () => () =>
        h('form', { style: { ...theme, padding: '40px', display: 'grid', gap: '16px' } }, [
          h('button', { type: 'button' }, 'Before'),
          h(
            Select,
            {
              label: 'Size',
              ...props,
              ...attrs,
              modelValue: state.selected,
              'onUpdate:modelValue': (next: SelectSelected) => (state.selected = next),
              open: state.open,
              'onUpdate:open': (next: boolean) => (state.open = next),
              style: { justifySelf: 'start' },
            },
            { default: options, ...slots },
          ),
          h('button', { type: 'button' }, 'After'),
        ]),
    ),
  );
  const container = screen.container as HTMLElement;
  const root = container.querySelector<HTMLElement>('.rio-select')!;
  const field = root.querySelector<HTMLElement>('[role="combobox"]')!;
  const listbox = root.querySelector<HTMLElement>('[role="listbox"]')!;
  const native = root.querySelector<HTMLSelectElement>('select')!;
  const form = container.querySelector('form')!;
  const isOpen = () => listbox.matches(':popover-open');
  const opened = async () => {
    await userEvent.click(field);
    await vi.waitFor(() => expect(isOpen()).toBe(true));
  };
  return { screen, state, root, field, listbox, native, form, isOpen, opened };
};

const focusedText = () => document.activeElement?.textContent?.trim();
const rect = (element: Element) => element.getBoundingClientRect();
/** The selection as the field shows it */
const shown = (field: HTMLElement) =>
  field.querySelector('.rio-select__value')!.textContent!.trim();

describe('RioSelect', () => {
  test('a combobox named by its label, with a list it controls, empty at first', async () => {
    const { screen, field, listbox, root } = await setup();
    await expect.element(screen.getByRole('combobox', { name: 'Size' })).toBeVisible();
    expect(field.getAttribute('aria-expanded')).toBe('false');
    expect(field.getAttribute('aria-haspopup')).toBe('listbox');
    expect(field.getAttribute('aria-controls')).toBe(listbox.id);
    expect(shown(field)).toBe('');
    expect(root.hasAttribute('data-populated')).toBe(false);
  });

  test('a press opens the list below the field, at least as wide, focused on the first', async () => {
    const { screen, field, listbox, root, opened } = await setup();
    await opened();
    await expect.element(screen.getByRole('listbox', { name: 'Size' })).toBeVisible();
    expect(field.getAttribute('aria-expanded')).toBe('true');
    expect(focusedText()).toBe('Small');
    const box = rect(root.querySelector('.rio-text-field__container')!);
    expect(rect(listbox).top).toBeCloseTo(box.bottom, 0);
    expect(rect(listbox).left).toBeCloseTo(box.left, 0);
    expect(rect(listbox).width).toBeGreaterThanOrEqual(box.width - 0.5);
    // The field still looks focused, and the label is at the top.
    expect(root.hasAttribute('data-focused')).toBe(true);
    const label = root.querySelector('.rio-text-field__label')!;
    await vi.waitFor(() => expect(getComputedStyle(label).top).toBe('8px'));
  });

  test('choosing an option selects it, closes the list, and gives the focus back', async () => {
    const { screen, state, field, root, opened, isOpen } = await setup();
    await opened();
    await userEvent.click(screen.getByRole('option', { name: 'Medium' }));
    expect(state.selected).toBe('medium');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(document.activeElement).toBe(field);
    expect(shown(field)).toBe('Medium');
    expect(root.hasAttribute('data-populated')).toBe(true);
  });

  test('it opens on the selected option, which reports itself selected', async () => {
    const { screen, opened } = await setup({ selected: 'extra large' });
    await opened();
    expect(focusedText()).toBe('Extra large');
    await expect
      .element(screen.getByRole('option', { name: 'Extra large' }))
      .toHaveAttribute('aria-selected', 'true');
    await expect
      .element(screen.getByRole('option', { name: 'Small' }))
      .toHaveAttribute('aria-selected', 'false');
  });

  test('in the list, arrows stop at the ends, Home and End go there, and letters jump', async () => {
    const { opened } = await setup();
    await opened();
    await userEvent.keyboard('{ArrowUp}');
    expect(focusedText()).toBe('Small');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(focusedText()).toBe('Large');
    await userEvent.keyboard('{End}{ArrowDown}');
    expect(focusedText()).toBe('Extra large');
    await userEvent.keyboard('{Home}');
    expect(focusedText()).toBe('Small');
    await userEvent.keyboard('m');
    expect(focusedText()).toBe('Medium');
    await userEvent.keyboard('{PageDown}');
    expect(focusedText()).toBe('Extra large');
  });

  test('Enter and Space choose, and a disabled option takes the focus but not the choice', async () => {
    const { state, field, opened, isOpen } = await setup();
    await opened();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(document.activeElement!.getAttribute('aria-disabled')).toBe('true');
    await userEvent.keyboard('{Enter}');
    expect(state.selected).toBeUndefined();
    expect(isOpen()).toBe(true);
    await userEvent.keyboard('{ArrowDown} ');
    expect(state.selected).toBe('extra large');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(document.activeElement).toBe(field);
  });

  test.each([
    ['{ArrowDown}', 'Medium'],
    ['{Enter}', 'Medium'],
    [' ', 'Medium'],
    ['{Home}', 'Small'],
    ['{End}', 'Extra large'],
    ['e', 'Extra large'],
  ])('on the field, %s opens the list, on %s', async (keys, focused) => {
    const { field, isOpen } = await setup({ selected: 'medium' });
    field.focus();
    await userEvent.keyboard(keys);
    await vi.waitFor(() => expect(isOpen()).toBe(true));
    expect(focusedText()).toBe(focused);
  });

  test('Escape closes the list without a change and gives the focus back', async () => {
    const { state, field, opened, isOpen } = await setup({ selected: 'small' });
    await opened();
    await userEvent.keyboard('{ArrowDown}{Escape}');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(state.selected).toBe('small');
    expect(document.activeElement).toBe(field);
  });

  test('Tab closes the list without a change, and moves on from the field', async () => {
    const { state, opened, isOpen } = await setup({ selected: 'small' });
    await opened();
    await userEvent.keyboard('{ArrowDown}{Tab}');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(state.selected).toBe('small');
    expect(focusedText()).toBe('After');
  });

  test('Shift+Tab closes it too, and moves back from the field', async () => {
    const { opened, isOpen } = await setup();
    await opened();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(focusedText()).toBe('Before');
  });

  test('a press on the field while open closes it, without opening it again', async () => {
    const { state, field, opened, isOpen } = await setup();
    await opened();
    await userEvent.click(field);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(state.open).toBe(false);
    expect(isOpen()).toBe(false);
  });

  // Where `showPopover` ignores `source`, a press on the field is a click outside, which closes the
  // list before the click arrives.
  test('the same where the browser ignores what a popover was shown from', async () => {
    const show = HTMLElement.prototype.showPopover;
    HTMLElement.prototype.showPopover = function () {
      show.call(this);
    };
    onTestFinished(() => {
      HTMLElement.prototype.showPopover = show;
    });
    const { state, field, opened, isOpen } = await setup();
    await opened();
    await userEvent.click(field);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(state.open).toBe(false);
    expect(isOpen()).toBe(false);
    // The list isn't next to the field in the tab order there, so Shift+Tab moves back from the
    // field only because the field takes the focus first.
    await opened();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(focusedText()).toBe('Before');
  });

  test('a click with no pointer, as from assistive technology, opens and closes it', async () => {
    const { field, isOpen } = await setup();
    field.click();
    await vi.waitFor(() => expect(isOpen()).toBe(true));
    expect(focusedText()).toBe('Small');
    field.click();
    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  test('a press on the field gives it the focus at once', async () => {
    const { root, field } = await setup();
    const press = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 });
    root.querySelector('.rio-select__arrow')!.dispatchEvent(press);
    expect(document.activeElement).toBe(field);
    // Nor does the press select the field's text.
    expect(press.defaultPrevented).toBe(true);
  });

  test('the app’s dropdown icon sits at the end, and turns over while the list is open', async () => {
    const { root, opened } = await setup({
      slots: { 'dropdown-icon': () => h('svg', { viewBox: '0 0 24 24' }) },
    });
    const arrow = root.querySelector<HTMLElement>('.rio-select__arrow')!;
    expect(arrow.getAttribute('aria-hidden')).toBe('true');
    expect(arrow.querySelector('svg')!.getBoundingClientRect().width).toBe(24);
    expect(getComputedStyle(arrow).rotate).toBe('none');
    await opened();
    expect(getComputedStyle(arrow).rotate).toBe('180deg');
  });

  test('a press on the label or the arrow opens it too', async () => {
    const { root, isOpen, state } = await setup();
    await userEvent.click(root.querySelector('.rio-select__arrow')!);
    await vi.waitFor(() => expect(isOpen()).toBe(true));
    state.open = false;
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    await userEvent.click(root.querySelector('.rio-text-field__label')!, { force: true });
    await vi.waitFor(() => expect(isOpen()).toBe(true));
  });

  // Mounted with `createApp`: vitest-browser-vue moves what it renders into place afterwards,
  // which closes a popover that is open by then.
  test('open from the start', async () => {
    const host = document.body.appendChild(document.createElement('div'));
    const app = createApp(
      defineComponent(() => () => h(Select, { label: 'Size', open: true }, sizes)),
    );
    app.mount(host);
    onTestFinished(() => {
      app.unmount();
      host.remove();
    });
    const listbox = host.querySelector<HTMLElement>('[role="listbox"]')!;
    await vi.waitFor(() => expect(listbox.matches(':popover-open')).toBe(true));
    expect(focusedText()).toBe('Small');
  });

  // Where the browser ignores what a popover was shown from, the list follows the field in the tab
  // order as it does in the page, so Shift+Tab from it would land on the field.
  test.each([
    ['', false],
    [', where the browser ignores what a popover was shown from', true],
  ])(
    'Shift+Tab moves back from the field while the app keeps the list open%s',
    async (_, plain) => {
      if (plain) {
        const show = HTMLElement.prototype.showPopover;
        HTMLElement.prototype.showPopover = function () {
          show.call(this);
        };
        onTestFinished(() => {
          HTMLElement.prototype.showPopover = show;
        });
      }
      const host = document.body.appendChild(document.createElement('div'));
      const app = createApp(
        defineComponent(() => () => [
          h('button', null, 'Before'),
          // The app turns the closing down, as one that applies it only later does for a while.
          h(Select, { label: 'Size', open: true, 'onUpdate:open': () => {} }, sizes),
        ]),
      );
      app.mount(host);
      onTestFinished(() => {
        app.unmount();
        host.remove();
      });
      await vi.waitFor(() => expect(focusedText()).toBe('Small'));
      await userEvent.keyboard('{ArrowDown}{Shift>}{Tab}{/Shift}');
      expect(focusedText()).toBe('Before');
    },
  );

  test('a click outside closes it', async () => {
    const { screen, state, opened, isOpen } = await setup();
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'After' }));
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect(isOpen()).toBe(false);
  });

  test('the field is as wide as its widest option, whichever is selected', async () => {
    const { state, root } = await setup({ selected: 'small' });
    expect(rect(root.querySelector('.rio-text-field__container')!).height).toBe(56);
    const width = rect(root).width;
    state.selected = 'extra large';
    await vi.waitFor(() => expect(shown(root)).toBe('Extra large'));
    expect(rect(root).width).toBe(width);
    const sizer = root.querySelector('.rio-select__sizer')!;
    expect(sizer.getAttribute('aria-hidden')).toBe('true');
  });

  test('several selected don’t widen it: what doesn’t fit is cut short', async () => {
    const { state, root } = await setup({ multiple: true, selected: ['small'] });
    await vi.waitFor(() => expect(shown(root)).toBe('Small'));
    const width = rect(root).width;
    state.selected = ['small', 'medium', 'extra large'];
    await vi.waitFor(() => expect(shown(root)).toBe('Small, Medium, Extra large'));
    expect(rect(root).width).toBe(width);
    const value = root.querySelector('.rio-select__value')!;
    expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
  });

  test.each([
    ['an aria-label', { 'aria-label': 'Size' }],
    ['an aria-labelledby', { 'aria-labelledby': 'size-heading' }],
  ])('without a label, %s names the field and the list', async (_, attrs) => {
    const heading = document.body.appendChild(document.createElement('h2'));
    heading.id = 'size-heading';
    heading.textContent = 'Size';
    onTestFinished(() => heading.remove());
    const { screen, opened } = await setup({ label: undefined, attrs });
    await expect.element(screen.getByRole('combobox', { name: 'Size' })).toBeVisible();
    await opened();
    await expect.element(screen.getByRole('listbox', { name: 'Size' })).toBeVisible();
  });

  test('disabled: not focusable, and a press opens nothing', async () => {
    const { field, isOpen, root } = await setup({ disabled: true });
    expect(field.hasAttribute('tabindex')).toBe(false);
    expect(field.getAttribute('aria-disabled')).toBe('true');
    field.focus();
    expect(document.activeElement).not.toBe(field);
    await userEvent.click(root.querySelector('.rio-text-field__container')!, { force: true });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(isOpen()).toBe(false);
  });

  test('disabling it closes the list', async () => {
    const props = reactive({ disabled: false, open: false });
    const screen = await render(
      defineComponent(
        () => () =>
          h(
            Select,
            {
              label: 'Size',
              disabled: props.disabled,
              open: props.open,
              'onUpdate:open': (next: boolean) => (props.open = next),
            },
            sizes,
          ),
      ),
    );
    const listbox = (screen.container as HTMLElement).querySelector<HTMLElement>(
      '[role="listbox"]',
    )!;
    await userEvent.click(screen.getByRole('combobox'));
    await vi.waitFor(() => expect(listbox.matches(':popover-open')).toBe(true));
    props.disabled = true;
    await vi.waitFor(() => expect(listbox.matches(':popover-open')).toBe(false));
    expect(props.open).toBe(false);
  });

  test('supporting text describes the field; error text replaces it, as an alert', async () => {
    const { screen, field } = await setup({
      supportingText: 'Pick one',
      error: true,
      errorText: 'Required',
    });
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Required');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe(
      field.ownerDocument.querySelector('[role="alert"]')!.id,
    );
  });

  describe('multiple', () => {
    test('a multi-select list stays open, and toggles each option', async () => {
      const { screen, state, field, listbox, opened, isOpen } = await setup({ multiple: true });
      expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
      await opened();
      await userEvent.click(screen.getByRole('option', { name: 'Extra large' }));
      await userEvent.click(screen.getByRole('option', { name: 'Small' }));
      await userEvent.click(screen.getByRole('option', { name: 'Medium' }));
      expect(state.selected).toEqual(['extra large', 'small', 'medium']);
      expect(isOpen()).toBe(true);
      // In the list's order, not the order chosen
      await vi.waitFor(() => expect(shown(field)).toBe('Small, Medium, Extra large'));
      await userEvent.click(screen.getByRole('option', { name: 'Small' }));
      expect(state.selected).toEqual(['extra large', 'medium']);
      await vi.waitFor(() => expect(shown(field)).toBe('Medium, Extra large'));
    });

    test('the value slot shows the selection the app’s way', async () => {
      const { field } = await setup({
        multiple: true,
        selected: ['small', 'medium'],
        slots: { value: ({ labels }: { labels: string[] }) => labels.join(' + ') },
      });
      await vi.waitFor(() => expect(shown(field)).toBe('Small + Medium'));
    });
  });

  describe('forms', () => {
    test('the hidden native select submits the selection under its name', async () => {
      const { state, form, native } = await setup({ name: 'size', selected: 'medium' });
      expect(native.getAttribute('aria-hidden')).toBe('true');
      expect(native.tabIndex).toBe(-1);
      expect(new FormData(form).get('size')).toBe('medium');
      state.selected = undefined;
      await vi.waitFor(() => expect(new FormData(form).get('size')).toBe(''));
    });

    test('with multiple, every selected value', async () => {
      const { form } = await setup({ name: 'size', multiple: true, selected: ['small', 'large'] });
      expect(new FormData(form).getAll('size')).toEqual(['small', 'large']);
    });

    test('required turns an empty selection down, and the focus goes to the field', async () => {
      const { state, form, native, field } = await setup({ name: 'size', required: true });
      expect(form.checkValidity()).toBe(false);
      expect(native.validity.valueMissing).toBe(true);
      native.focus();
      expect(document.activeElement).toBe(field);
      state.selected = 'small';
      await vi.waitFor(() => expect(form.checkValidity()).toBe(true));
    });

    test('submitting without a required selection stops, with the focus on the field', async () => {
      const { form, field } = await setup({ name: 'size', required: true });
      const submitted = vi.fn((event: Event) => event.preventDefault());
      form.addEventListener('submit', submitted);
      form.requestSubmit();
      expect(submitted).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(field);
    });

    test('a reset puts the native select back in line with the selection', async () => {
      const { form, native } = await setup({ name: 'size', selected: 'medium' });
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(native.value).toBe('medium');
    });

    test('a change the native select makes on its own, as autofill does, is reported', async () => {
      const { state, native } = await setup({ name: 'size' });
      native.value = 'large';
      native.dispatchEvent(new Event('change', { bubbles: true }));
      expect(state.selected).toBe('large');
    });
  });
});
