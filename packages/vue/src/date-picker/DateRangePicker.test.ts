import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, reactive } from 'vue';
import DateRangePickerDialog from './DateRangePickerDialog.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

/** A range dialog the app's own button opens, with the range shown in the page */
const setup = async (props: Record<string, unknown> = {}, start?: string, end?: string) => {
  const state = reactive({ start, end, open: false });
  const screen = await render(
    defineComponent(
      () => () =>
        h('div', { style: theme }, [
          h('button', { type: 'button', onClick: () => (state.open = true) }, 'Pick'),
          h(
            DateRangePickerDialog,
            {
              locale: 'en-US',
              ...props,
              start: state.start,
              'onUpdate:start': (next: string | undefined) => (state.start = next),
              end: state.end,
              'onUpdate:end': (next: string | undefined) => (state.end = next),
              open: state.open,
              'onUpdate:open': (next: boolean) => (state.open = next),
            },
            { 'edit-icon': () => 'E', 'calendar-icon': () => 'C' },
          ),
        ]),
    ),
  );
  const dialog = (screen.container as HTMLElement).querySelector('dialog')!;
  const open = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Pick' }));
    await vi.waitFor(() => expect(dialog.open).toBe(true));
  };
  const months = () => dialog.querySelector<HTMLElement>('.rio-date-picker__months')!;
  const day = (date: string) => dialog.querySelector<HTMLElement>(`[data-date="${date}"]`)!;
  const headline = () => dialog.querySelector('.rio-date-picker-dialog__headline')!.textContent;
  return { screen, state, dialog, open, months, day, headline };
};

const focusedDate = () => (document.activeElement as HTMLElement | null)?.dataset.date;

describe('RioDateRangePickerDialog', () => {
  test('opens on the start, at the top of its month, with the focus on it', async () => {
    const { screen, open, months, day } = await setup({}, '2025-08-17', '2025-08-23');
    await open();
    await expect.element(screen.getByRole('dialog', { name: 'Select dates' })).toBeVisible();
    await vi.waitFor(() => expect(focusedDate()).toBe('2025-08-17'));
    const august = day('2025-08-17').closest<HTMLElement>('[data-month]')!;
    await vi.waitFor(() => expect(months().scrollTop).toBe(august.offsetTop));
    await expect
      .element(screen.getByRole('grid', { name: 'August 2025' }))
      .toHaveAttribute('aria-multiselectable', 'true');
  });

  test('two presses choose a range, the headline follows, and OK sets both ends', async () => {
    const { screen, state, open, day, headline } = await setup({}, '2025-08-01', '2025-08-02');
    await open();
    expect(headline()).toBe('Aug 1 – Aug 2');
    await userEvent.click(day('2025-08-17'));
    expect(headline()).toBe('Aug 17 – End date');
    await userEvent.click(day('2025-08-23'));
    expect(headline()).toBe('Aug 17 – Aug 23');
    expect(day('2025-08-20').closest('td')!.getAttribute('aria-selected')).toBe('true');
    expect([state.start, state.end]).toEqual(['2025-08-01', '2025-08-02']);
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect([state.start, state.end]).toEqual(['2025-08-17', '2025-08-23']);
    await vi.waitFor(() => expect(state.open).toBe(false));
  });

  test('Cancel and Escape leave the range', async () => {
    const { screen, state, open, day } = await setup({}, '2025-08-17', '2025-08-23');
    await open();
    await userEvent.click(day('2025-08-25'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(state.open).toBe(false));
    await open();
    await userEvent.click(day('2025-08-25'));
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect([state.start, state.end]).toEqual(['2025-08-17', '2025-08-23']);
  });

  test('the arrows go from month to month; Enter on the end confirms the range', async () => {
    const { state, open } = await setup({}, '2025-08-17', '2025-08-18');
    await open();
    await vi.waitFor(() => expect(focusedDate()).toBe('2025-08-17'));
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await vi.waitFor(() => expect(focusedDate()).toBe('2025-09-07'));
    expect(state.open).toBe(true);
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect([state.start, state.end]).toEqual(['2025-08-17', '2025-09-07']);
  });

  test('Page Up past the months rendered renders more and moves onto them', async () => {
    const { open, dialog } = await setup({}, '2025-08-17');
    await open();
    await vi.waitFor(() => expect(focusedDate()).toBe('2025-08-17'));
    await userEvent.keyboard('{Shift>}{PageUp}{/Shift}');
    await vi.waitFor(() => expect(focusedDate()).toBe('2024-08-17'));
    expect(dialog.querySelector('[data-month="2024-08"]')).not.toBeNull();
  });

  test('scrolling near the end renders more months after the last', async () => {
    const { open, months } = await setup({}, '2025-08-17');
    await open();
    const last = () =>
      [...months().querySelectorAll<HTMLElement>('[data-month]')].at(-1)!.dataset.month;
    await vi.waitFor(() => expect(last()).toBe('2026-08'));
    months().scrollTop = months().scrollHeight;
    await vi.waitFor(() => expect(last()).toBe('2027-08'));
  });

  test('months added above leave the months in view where they were', async () => {
    const { open, months, dialog } = await setup({}, '2025-08-17');
    await open();
    const first = () => months().querySelector<HTMLElement>('[data-month]')!.dataset.month;
    await vi.waitFor(() => expect(first()).toBe('2025-05'));
    // Opening on August puts May to July above the view, out of reach of the top.
    const june = () => dialog.querySelector<HTMLElement>('[data-month="2025-06"]')!;
    months().scrollTop = june().offsetTop;
    const top = june().getBoundingClientRect().top;
    await vi.waitFor(() => expect(first()).toBe('2024-05'));
    expect(june().getBoundingClientRect().top).toBe(top);
  });

  test('min and max keep the months within them', async () => {
    const { open, months } = await setup({ min: '2025-07-10', max: '2025-09-05' }, '2025-08-17');
    await open();
    const all = () => [...months().querySelectorAll<HTMLElement>('[data-month]')];
    await vi.waitFor(() =>
      expect(all().map((month) => month.dataset.month)).toEqual(['2025-07', '2025-08', '2025-09']),
    );
    months().scrollTop = 0;
    months().scrollTop = months().scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(all()).toHaveLength(3);
  });

  test('a range before 1900 opens on its month', async () => {
    const { screen, open } = await setup({}, '1850-06-01');
    await open();
    await vi.waitFor(() => expect(focusedDate()).toBe('1850-06-01'));
    await expect.element(screen.getByRole('grid', { name: 'June 1850' })).toBeVisible();
  });

  test('the band under the range reaches the container’s edges where a row ends', async () => {
    const { open, day } = await setup({}, '2025-08-14', '2025-08-20');
    await open();
    const band = (date: string) => getComputedStyle(day(date).closest('td')!, '::before');
    // August 14 is a Thursday, the 16th a Saturday, and the 17th a Sunday.
    expect(band('2025-08-14').insetInlineStart).toBe('24px');
    expect(band('2025-08-16').insetInlineEnd).toBe('-12px');
    expect(band('2025-08-17').insetInlineStart).toBe('-12px');
    expect(band('2025-08-20').insetInlineEnd).toBe('24px');
    expect(band('2025-08-21').content).toBe('none');
  });

  test('a basic dialog 360 × 568, in a compact window too', async () => {
    const { open, dialog } = await setup({}, '2025-08-17');
    await open();
    expect([dialog.offsetWidth, dialog.offsetHeight]).toEqual([360, 568]);
    await page.viewport(412, 800);
    onTestFinished(() => page.viewport(1280, 720));
    await vi.waitFor(() => expect(dialog.offsetWidth).toBe(360));
  });

  test('the text input takes both dates; Enter confirms, and a range backwards shows an error', async () => {
    const { screen, state, open } = await setup({ initialMode: 'input' });
    await open();
    const startField = screen.getByRole('textbox', { name: 'Start date' });
    const endField = screen.getByRole('textbox', { name: 'End date' });
    await vi.waitFor(() => expect(document.activeElement).toBe(startField.element()));
    await userEvent.fill(startField, '08/23/2025');
    await userEvent.fill(endField, '08/17/2025');
    await userEvent.keyboard('{Enter}');
    await expect.element(screen.getByText('Choose an end date after the start date')).toBeVisible();
    await userEvent.fill(endField, '08/30/2025');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect([state.start, state.end]).toEqual(['2025-08-23', '2025-08-30']);
  });

  test('the mode button switches to the text input and back, with the range', async () => {
    const { screen, open, dialog } = await setup({}, '2025-08-17', '2025-08-23');
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Switch to text input' }));
    await expect
      .element(screen.getByRole('textbox', { name: 'Start date' }))
      .toHaveValue('08/17/2025');
    await userEvent.fill(screen.getByRole('textbox', { name: 'End date' }), '08/25/2025');
    await userEvent.click(screen.getByRole('button', { name: 'Switch to calendar' }));
    await vi.waitFor(() => expect(focusedDate()).toBe('2025-08-17'));
    expect(
      dialog
        .querySelector('[data-date="2025-08-25"]')!
        .closest('td')!
        .hasAttribute('data-range-end'),
    ).toBe(true);
  });
});
