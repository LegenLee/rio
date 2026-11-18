import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { createApp, defineComponent, h, reactive, ref } from 'vue';
import LocaleProvider from '../locale/LocaleProvider.vue';
import { createRio } from '../rio/rio';
import DatePicker from './DatePicker.vue';
import DatePickerDialog from './DatePickerDialog.vue';
import { eventsLeaving } from '../test/events';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

interface Setup {
  value?: string;
  props?: Record<string, unknown>;
}

/** A date picker in a form, with a button after it, as an app would write them. */
const setup = async ({ value, props = {} }: Setup = {}) => {
  const state = reactive({ value, open: false });
  const submitted: unknown[] = [];
  const screen = await render(
    defineComponent(
      () => () =>
        h(
          'form',
          {
            style: { ...theme, padding: '40px', display: 'grid', gap: '16px' },
            onSubmit: (event: SubmitEvent) => {
              event.preventDefault();
              submitted.push(new FormData(event.target as HTMLFormElement).get('departure'));
            },
          },
          [
            h(DatePicker, {
              label: 'Departure',
              locale: 'en-US',
              name: 'departure',
              ...props,
              modelValue: state.value,
              'onUpdate:modelValue': (next: string | undefined) => (state.value = next),
              open: state.open,
              'onUpdate:open': (next: boolean) => (state.open = next),
              style: { justifySelf: 'start' },
            }),
            h('button', { type: 'button' }, 'After'),
          ],
        ),
    ),
  );
  const container = screen.container as HTMLElement;
  const input = container.querySelector<HTMLInputElement>('.rio-text-field__input')!;
  const menu = () => container.querySelector<HTMLElement>('.rio-date-picker__menu');
  const isOpen = () => !!menu()?.matches(':popover-open');
  const grid = () => container.querySelector<HTMLElement>('[role="grid"]');
  const day = (date: string) =>
    container.querySelector<HTMLElement>(`[data-date="${date}"]:not([data-outside])`)!;
  const form = container.querySelector('form')!;
  return { screen, state, container, input, menu, isOpen, grid, day, form, submitted };
};

const focusedDate = () => (document.activeElement as HTMLElement | null)?.dataset.date;

describe('RioDatePicker, docked', () => {
  test("clicks and presses in the calendar stay in it, rather than reaching the app's markup; keys go on", async () => {
    const { input, menu, isOpen, day } = await setup({ value: '2026-11-27' });
    input.focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await vi.waitFor(() => expect(isOpen()).toBe(true));
    const out = eventsLeaving(() => menu()!);
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.click(day('2026-11-10'));
    expect(out).toEqual(['keydown']);
  });

  test('the field writes the date the language’s way, and says the format', async () => {
    const { screen, input } = await setup({ value: '2026-11-27' });
    expect(input.value).toBe('11/27/2026');
    expect(input.placeholder).toBe('MM/DD/YYYY');
    await expect.element(screen.getByText('MM/DD/YYYY', { exact: true })).toBeVisible();
  });

  test('typed dates are read on Enter, with any separators, and written back', async () => {
    const { state, input } = await setup();
    await userEvent.type(input, '1-2-2026{Enter}');
    expect(state.value).toBe('2026-01-02');
    await vi.waitFor(() => expect(input.value).toBe('01/02/2026'));
  });

  test('text that isn’t a date shows the error and leaves the value', async () => {
    const { screen, state, input } = await setup({ value: '2026-11-27' });
    await userEvent.clear(input);
    await userEvent.type(input, '27/11/2026{Enter}');
    expect(state.value).toBe('2026-11-27');
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Enter a date as MM/DD/YYYY');
  });

  test('a date outside min and max is turned down, with the limit', async () => {
    const { screen, state, input } = await setup({ props: { min: '2026-01-01' } });
    await userEvent.type(input, '12/31/2025{Enter}');
    expect(state.value).toBeUndefined();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose 01/01/2026 or later');
  });

  test('a press on the field opens the calendar below it, and the focus stays to type', async () => {
    const { input, isOpen, menu, container } = await setup({ value: '2026-11-27' });
    await userEvent.click(input);
    await vi.waitFor(() => expect(isOpen()).toBe(true));
    expect(document.activeElement).toBe(input);
    const field = container.querySelector('.rio-text-field__frame')!.getBoundingClientRect();
    expect(menu()!.getBoundingClientRect().top).toBeCloseTo(field.bottom, 0);
    // Typing still works, and the calendar stays.
    await userEvent.type(input, 'x');
    expect(isOpen()).toBe(true);
  });

  test('the calendar button opens it with the focus on the selected date', async () => {
    const { screen, isOpen, grid } = await setup({ value: '2026-11-27' });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await vi.waitFor(() => expect(isOpen()).toBe(true));
    await vi.waitFor(() => expect(focusedDate()).toBe('2026-11-27'));
    expect(grid()!.getAttribute('aria-label')).toBe('November 2026');
    expect(document.activeElement!.getAttribute('aria-label')).toBe('Friday, November 27, 2026');
    expect(document.activeElement!.closest('td')!.getAttribute('aria-selected')).toBe('true');
  });

  test('nothing in the calendar reaches past its sides, so it never scrolls sideways', async () => {
    const { screen, menu } = await setup({ value: '2026-11-27' });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await vi.waitFor(() => expect(focusedDate()).toBe('2026-11-27'));
    expect(menu()!.scrollWidth).toBe(menu()!.clientWidth);
  });

  test('Alt+Down in the field opens it with the focus in', async () => {
    const { input, isOpen } = await setup({ value: '2026-11-27' });
    input.focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await vi.waitFor(() => expect(isOpen()).toBe(true));
    await vi.waitFor(() => expect(focusedDate()).toBe('2026-11-27'));
  });

  test('keys move by day, week, month, and year, and Enter chooses and closes', async () => {
    const { screen, state, input, grid, isOpen } = await setup({ value: '2026-11-27' });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await vi.waitFor(() => expect(focusedDate()).toBe('2026-11-27'));
    await userEvent.keyboard('{ArrowRight}');
    expect(focusedDate()).toBe('2026-11-28');
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => expect(focusedDate()).toBe('2026-12-05'));
    expect(grid()!.getAttribute('aria-label')).toBe('December 2026');
    await userEvent.keyboard('{Home}');
    expect(focusedDate()).toBe('2026-12-01');
    await userEvent.keyboard('{End}');
    expect(focusedDate()).toBe('2026-12-31');
    await userEvent.keyboard('{PageUp}');
    await vi.waitFor(() => expect(focusedDate()).toBe('2026-11-30'));
    await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
    await vi.waitFor(() => expect(focusedDate()).toBe('2027-11-30'));
    await userEvent.keyboard('{Enter}');
    expect(state.value).toBe('2027-11-30');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(document.activeElement).toBe(input);
  });

  test('a click chooses a day, and only OK confirms it; Cancel and Escape don’t', async () => {
    const { screen, state, day, isOpen } = await setup({ value: '2026-11-27' });
    const open = async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
      await vi.waitFor(() => expect(isOpen()).toBe(true));
    };
    await open();
    await userEvent.click(day('2026-11-10'));
    expect(state.value).toBe('2026-11-27');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(state.value).toBe('2026-11-27');

    await open();
    await userEvent.click(day('2026-11-10'));
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(state.value).toBe('2026-11-27');

    await open();
    await userEvent.click(day('2026-11-10'));
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(state.value).toBe('2026-11-10');
  });

  test('a press on the page outside, where nothing takes the focus, closes it', async () => {
    const { form, isOpen, input } = await setup();
    await userEvent.click(input);
    await vi.waitFor(() => expect(isOpen()).toBe(true));
    await userEvent.click(form, { position: { x: 5, y: 5 } });
    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  test('a click without a pointer, as assistive technology may send, doesn’t open it', async () => {
    const { input, isOpen } = await setup();
    input.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(isOpen()).toBe(false);
  });

  test('Enter in the field reads the date and closes the calendar', async () => {
    const { state, input, isOpen } = await setup();
    await userEvent.click(input);
    await vi.waitFor(() => expect(isOpen()).toBe(true));
    await userEvent.type(input, '4/5/2026{Enter}');
    expect(state.value).toBe('2026-04-05');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  test('a press outside, or the focus leaving, closes it, with the focus where the press put it', async () => {
    const { screen, isOpen } = await setup();
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await vi.waitFor(() => expect(focusedDate()).toBeTruthy());
    const after = screen.getByRole('button', { name: 'After' });
    await userEvent.click(after);
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(document.activeElement).toBe(after.element());
  });

  test('Tab out of the calendar closes it', async () => {
    const { screen, isOpen } = await setup({ value: '2026-11-27' });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await vi.waitFor(() => expect(isOpen()).toBe(true));
    (screen.getByRole('button', { name: 'OK' }).element() as HTMLElement).focus();
    await userEvent.keyboard('{Tab}');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  test('Shift+M and Shift+Y go to the month and year buttons', async () => {
    const { screen } = await setup({ value: '2026-11-27' });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await vi.waitFor(() => expect(focusedDate()).toBe('2026-11-27'));
    await userEvent.keyboard('{Shift>}M{/Shift}');
    expect(document.activeElement!.getAttribute('aria-label')).toBe('Choose month, November');
    (document.querySelector('[data-date="2026-11-27"]') as HTMLElement).focus();
    await userEvent.keyboard('{Shift>}Y{/Shift}');
    expect(document.activeElement!.getAttribute('aria-label')).toBe('Choose year, 2026');
  });

  test('the month and year lists replace the days', async () => {
    const { screen, grid, container } = await setup({ value: '2026-11-27' });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await userEvent.click(screen.getByRole('button', { name: 'Choose month, November' }));
    expect(grid()).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'March' }));
    await vi.waitFor(() => expect(grid()!.getAttribute('aria-label')).toBe('March 2026'));
    await userEvent.click(screen.getByRole('button', { name: 'Choose year, 2026' }));
    const year = container.querySelector<HTMLElement>('[data-year="2030"]')!;
    await userEvent.click(year);
    await vi.waitFor(() => expect(grid()!.getAttribute('aria-label')).toBe('March 2030'));
  });

  test('the years list opens scrolled to the year shown', async () => {
    const { screen, container } = await setup({ value: '2026-11-27' });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await userEvent.click(screen.getByRole('button', { name: 'Choose year, 2026' }));
    const list = container.querySelector<HTMLElement>('[data-list]')!;
    const year = list.querySelector<HTMLElement>('[data-year="2026"]')!.getBoundingClientRect();
    const box = list.getBoundingClientRect();
    expect(year.top).toBeGreaterThanOrEqual(box.top);
    expect(year.bottom).toBeLessThanOrEqual(box.bottom);
  });

  test('min and max: days outside can’t be chosen, and the arrows stop', async () => {
    const { screen, day, state } = await setup({
      value: '2026-11-15',
      props: { min: '2026-11-10', max: '2026-11-20' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    expect(day('2026-11-09').getAttribute('aria-disabled')).toBe('true');
    await expect.element(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    await userEvent.click(day('2026-11-09'), { force: true });
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(state.value).toBe('2026-11-15');
  });

  test('Enter on an unavailable day does nothing', async () => {
    const { screen, state, isOpen } = await setup({
      value: '2026-11-15',
      props: { isDateDisabled: (date: string) => date === '2026-11-16' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await vi.waitFor(() => expect(focusedDate()).toBe('2026-11-15'));
    await userEvent.keyboard('{ArrowRight}');
    expect(focusedDate()).toBe('2026-11-16');
    await userEvent.keyboard('{Enter}');
    expect(state.value).toBe('2026-11-15');
    expect(isOpen()).toBe(true);
  });

  test('clearable: Clear empties the date', async () => {
    const { screen, state, input } = await setup({
      value: '2026-11-27',
      props: { clearable: true },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(state.value).toBeUndefined();
    await vi.waitFor(() => expect(input.value).toBe(''));
  });

  test('the Enter that reads a typed date also submits it', async () => {
    const { input, submitted } = await setup();
    await userEvent.type(input, '2/3/2026{Enter}');
    expect(submitted).toEqual(['2026-02-03']);
  });

  test('forms get the date as YYYY-MM-DD under its name', async () => {
    const { form } = await setup({ value: '2026-11-27' });
    expect(new FormData(form).get('departure')).toBe('2026-11-27');
  });

  test('the week starts on the language’s first day', async () => {
    const us = await setup({ value: '2026-11-27' });
    await userEvent.click(us.screen.getByRole('button', { name: 'Choose date' }));
    expect(us.container.querySelector('th')!.getAttribute('abbr')).toBe('Sunday');
  });
});

describe('RioDatePicker, modal', () => {
  test('the calendar button opens a dialog; a day and OK confirm it', async () => {
    const { screen, state, container } = await setup({
      value: '2026-11-27',
      props: { variant: 'modal' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    const dialog = container.querySelector('dialog')!;
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    await expect.element(screen.getByRole('dialog', { name: 'Select date' })).toBeVisible();
    await vi.waitFor(() => expect(focusedDate()).toBe('2026-11-27'));
    expect(dialog.querySelector('.rio-date-picker-dialog__headline')!.textContent).toBe(
      'Fri, Nov 27',
    );
    await userEvent.click(dialog.querySelector<HTMLElement>('[data-date="2026-11-03"]')!);
    expect(dialog.querySelector('.rio-date-picker-dialog__headline')!.textContent).toBe(
      'Tue, Nov 3',
    );
    expect(state.value).toBe('2026-11-27');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(state.value).toBe('2026-11-03');
    await vi.waitFor(() => expect(dialog.open).toBe(false));
  });

  test('the text input reads the date on OK, and keeps the dialog on an error', async () => {
    const { screen, state, container } = await setup({ props: { variant: 'modal' } });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    const dialog = container.querySelector('dialog')!;
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    await userEvent.click(screen.getByRole('button', { name: 'Switch to text input' }));
    const field = dialog.querySelector<HTMLInputElement>('input')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(field));
    await userEvent.type(field, 'soon');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(dialog.open).toBe(true);
    await userEvent.clear(field);
    await userEvent.type(field, '3/4/2027{Enter}');
    expect(state.value).toBe('2027-03-04');
    await vi.waitFor(() => expect(dialog.open).toBe(false));
  });

  test('clearable: Clear, at the start of the buttons, empties the date', async () => {
    const { screen, state, container } = await setup({
      value: '2026-11-27',
      props: { variant: 'modal', clearable: true },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    const dialog = container.querySelector('dialog')!;
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    const buttons = [...dialog.querySelectorAll('.rio-date-picker__actions button')];
    expect(buttons.map((button) => button.textContent!.trim())).toEqual(['Clear', 'Cancel', 'OK']);
    await userEvent.click(buttons[0]!);
    expect(state.value).toBeUndefined();
  });

  test('the years grid replaces the days', async () => {
    const { screen, container } = await setup({ value: '2026-11-27', props: { variant: 'modal' } });
    await userEvent.click(screen.getByRole('button', { name: 'Choose date' }));
    await userEvent.click(screen.getByRole('button', { name: 'Choose year, November 2026' }));
    await userEvent.click(container.querySelector<HTMLElement>('[data-year="2028"]')!);
    await vi.waitFor(() =>
      expect(container.querySelector('[role="grid"]')!.getAttribute('aria-label')).toBe(
        'November 2028',
      ),
    );
  });
});

describe('RioDatePickerDialog', () => {
  test('opens from the app’s own button, and Cancel leaves the date', async () => {
    const state = reactive({ value: '2026-11-27' as string | undefined, open: false });
    const screen = await render(
      defineComponent(
        () => () =>
          h('div', { style: theme }, [
            h('button', { onClick: () => (state.open = true) }, 'Pick'),
            h(DatePickerDialog, {
              locale: 'en-US',
              modelValue: state.value,
              'onUpdate:modelValue': (next: string | undefined) => (state.value = next),
              open: state.open,
              'onUpdate:open': (next: boolean) => (state.open = next),
            }),
          ]),
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Pick' }));
    await vi.waitFor(() => expect(focusedDate()).toBe('2026-11-27'));
    await userEvent.keyboard('{ArrowLeft}');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect(state.value).toBe('2026-11-27');
  });
});

describe('languages', () => {
  test('RioLocaleProvider gives its language: text, format, and the week', async () => {
    const screen = await render(
      defineComponent(
        () => () =>
          h(LocaleProvider, { locale: 'ko-KR' }, () =>
            h(DatePicker, { label: '출발', modelValue: '2026-11-27', style: theme }),
          ),
      ),
    );
    const input = (screen.container as HTMLElement).querySelector('input')!;
    expect(input.value).toBe('2026. 11. 27.');
    await userEvent.click(screen.getByRole('button', { name: '날짜 선택' }));
    await expect.element(screen.getByRole('button', { name: '취소' })).toBeVisible();
    expect((screen.container as HTMLElement).querySelector('th')!.getAttribute('abbr')).toBe(
      '일요일',
    );
  });

  test('createRio sets it for the app, and a ref changes it', async () => {
    const locale = ref('de-DE');
    const host = document.body.appendChild(document.createElement('div'));
    const app = createApp(
      defineComponent(() => () => h(DatePicker, { label: 'Datum', modelValue: '2026-11-27' })),
    );
    app.use(createRio({ locale }));
    app.mount(host);
    onTestFinished(() => {
      app.unmount();
      host.remove();
    });
    const input = host.querySelector('input')!;
    expect(input.value).toBe('27.11.2026');
    locale.value = 'en-GB';
    await vi.waitFor(() => expect(input.value).toBe('27/11/2026'));
  });

  test('a component’s messages replace the table’s', async () => {
    const screen = await render(DatePicker, {
      props: { locale: 'en-US', messages: { openCalendar: 'Pick a day' } },
    });
    await expect.element(screen.getByRole('button', { name: 'Pick a day' })).toBeVisible();
  });
});
