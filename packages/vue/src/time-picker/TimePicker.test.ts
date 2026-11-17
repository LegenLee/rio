import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, reactive } from 'vue';
import LocaleProvider from '../locale/LocaleProvider.vue';
import TimeInput from './TimeInput.vue';
import TimePickerDialog from './TimePickerDialog.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

/** An input time picker with a button after it, as an app would write them. */
const setupInput = async (props: Record<string, unknown> = {}, value?: string) => {
  const state = reactive({ value });
  const screen = await render(
    defineComponent(
      () => () =>
        h('div', { style: { ...theme, padding: '40px' } }, [
          h(TimeInput, {
            locale: 'en-US',
            ...props,
            modelValue: state.value,
            'onUpdate:modelValue': (next: string | undefined) => (state.value = next),
          }),
          h('button', { type: 'button' }, 'After'),
        ]),
    ),
  );
  const container = screen.container as HTMLElement;
  const hour = container.querySelector<HTMLInputElement>('input[aria-label="Hour"]')!;
  const minute = container.querySelector<HTMLInputElement>('input[aria-label="Minute"]')!;
  return { screen, state, container, hour, minute };
};

/** A dialog time picker opened from the app's own button */
const setupDialog = async (props: Record<string, unknown> = {}, value?: string) => {
  const state = reactive({ value, open: false });
  const screen = await render(
    defineComponent(
      () => () =>
        h('div', { style: theme }, [
          h('button', { type: 'button', onClick: () => (state.open = true) }, 'Pick'),
          h(
            TimePickerDialog,
            {
              locale: 'en-US',
              ...props,
              modelValue: state.value,
              'onUpdate:modelValue': (next: string | undefined) => (state.value = next),
              open: state.open,
              'onUpdate:open': (next: boolean) => (state.open = next),
            },
            { 'keyboard-icon': () => 'K', 'clock-icon': () => 'C' },
          ),
        ]),
    ),
  );
  const container = screen.container as HTMLElement;
  const dialog = container.querySelector('dialog')!;
  const open = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Pick' }));
    await vi.waitFor(() => expect(dialog.open).toBe(true));
  };
  const dial = () => dialog.querySelector<HTMLElement>('.rio-time-picker__dial')!;
  /** The number the dial selects */
  const selected = () =>
    dialog.querySelector<HTMLElement>('.rio-time-picker__number[aria-pressed="true"]')?.dataset
      .value;
  /** A point on the dial: clockwise from the top, on the outer ring or the inner one */
  const point = (angle: number, ring: 'outer' | 'inner' = 'outer') => {
    const size = dial().getBoundingClientRect().width;
    const radius = (ring === 'outer' ? 102 / 256 : 74 / 256) * size;
    const radians = (angle * Math.PI) / 180;
    return { x: size / 2 + radius * Math.sin(radians), y: size / 2 - radius * Math.cos(radians) };
  };
  const press = (angle: number, ring?: 'outer' | 'inner') =>
    userEvent.click(page.elementLocator(dial()), { position: point(angle, ring) });
  const field = (name: 'Hour' | 'Minute') =>
    dialog.querySelector<HTMLElement>(
      `.rio-time-picker__field[data-field="${name.toLowerCase()}"]`,
    )!;
  return { screen, state, container, dialog, open, dial, selected, point, press, field };
};

const focused = () => document.activeElement as HTMLElement | null;

describe('RioTimeInput', () => {
  test('shows the time on the language’s clock: 12 hours with AM and PM, or 24', async () => {
    const english = await setupInput({}, '19:05');
    expect([english.hour.value, english.minute.value]).toEqual(['07', '05']);
    await expect
      .element(english.screen.getByRole('radio', { name: 'PM' }))
      .toHaveAttribute('aria-checked', 'true');
    english.screen.unmount();

    const german = await setupInput({ locale: 'de-DE' }, '19:05');
    expect([german.hour.value, german.minute.value]).toEqual(['19', '05']);
    expect(german.container.querySelector('[role="radiogroup"]')).toBeNull();
  });

  test('hourCycle overrides the language’s clock', async () => {
    const { hour, container } = await setupInput({ hourCycle: 24 }, '19:05');
    expect(hour.value).toBe('19');
    expect(container.querySelector('[role="radiogroup"]')).toBeNull();
  });

  test('the fields are named, and each has its supporting text', async () => {
    const { screen } = await setupInput({}, '07:05');
    await expect.element(screen.getByRole('textbox', { name: 'Hour' })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Minute' })).toBeVisible();
    await expect.element(screen.getByRole('radiogroup', { name: 'Select AM or PM' })).toBeVisible();
  });

  test('a typed time is read when the field changes, and written back', async () => {
    const { state, hour, minute } = await setupInput();
    await userEvent.click(hour);
    await userEvent.keyboard('8');
    // Tab selects the minute's text, so typing replaces it.
    await userEvent.keyboard('{Tab}');
    expect(state.value).toBe('08:00');
    await userEvent.keyboard('3{Enter}');
    expect(state.value).toBe('08:03');
    await vi.waitFor(() => expect([hour.value, minute.value]).toEqual(['08', '03']));
  });

  test('a field focused from a script has its text selected, so typing replaces it', async () => {
    const { state, hour } = await setupInput({}, '08:03');
    hour.focus();
    await userEvent.keyboard('11{Enter}');
    expect(state.value).toBe('11:03');
  });

  test('a press keeps the caret where it put it', async () => {
    const { hour } = await setupInput({}, '08:03');
    await userEvent.click(hour);
    expect(hour.selectionEnd! - hour.selectionStart!).toBe(0);
  });

  test('a minute left empty counts as 00', async () => {
    const { state, hour } = await setupInput({ hourCycle: 24 });
    await userEvent.click(hour);
    await userEvent.keyboard('21{Enter}');
    expect(state.value).toBe('21:00');
  });

  test('AM and PM move the hour by 12; the arrow keys choose the other one', async () => {
    const { screen, state } = await setupInput({}, '08:03');
    await userEvent.click(screen.getByRole('radio', { name: 'PM' }));
    expect(state.value).toBe('20:03');
    await userEvent.keyboard('{ArrowLeft}');
    expect(state.value).toBe('08:03');
    expect(focused()?.textContent?.trim()).toBe('AM');
    await expect
      .element(screen.getByRole('radio', { name: 'AM' }))
      .toHaveAttribute('aria-checked', 'true');
  });

  test('AM and PM are 40px round buttons; a choice morphs the corners to 12px', async () => {
    const { screen } = await setupInput({}, '08:03');
    const am = screen.getByRole('radio', { name: 'AM' }).element() as HTMLElement;
    const pm = screen.getByRole('radio', { name: 'PM' }).element() as HTMLElement;
    expect([pm.offsetWidth, pm.offsetHeight]).toEqual([40, 40]);
    await vi.waitFor(() => expect(getComputedStyle(am).borderTopLeftRadius).toBe('12px'));
    expect(getComputedStyle(pm).borderTopLeftRadius).toBe('20px');
    await userEvent.click(pm);
    await vi.waitFor(() => expect(getComputedStyle(pm).borderTopLeftRadius).toBe('12px'));
    await vi.waitFor(() => expect(getComputedStyle(am).borderTopLeftRadius).toBe('20px'));
  });

  test('AM and PM take presses 4px past their edges, reaching 48px', async () => {
    const { screen } = await setupInput({}, '08:03');
    const am = screen.getByRole('radio', { name: 'AM' }).element() as HTMLElement;
    const pm = screen.getByRole('radio', { name: 'PM' }).element() as HTMLElement;
    const box = am.getBoundingClientRect();
    const at = (x: number, y: number) => document.elementFromPoint(x, y)?.closest('button');
    expect(at(box.left - 3, box.top + 20)).toBe(am);
    expect(at(box.left + 20, box.top - 3)).toBe(am);
    // Between them, each takes the half of the 8px gap on its side.
    expect(at(box.left + 20, box.bottom + 3)).toBe(am);
    expect(at(box.left + 20, box.bottom + 5)).toBe(pm);
  });

  test('only the checked period is in the tab order', async () => {
    const { screen, minute } = await setupInput({}, '08:03');
    minute.focus();
    await userEvent.keyboard('{Tab}');
    expect(focused()?.textContent?.trim()).toBe('AM');
    await userEvent.keyboard('{Tab}');
    expect(focused()).toBe(screen.getByRole('button', { name: 'After' }).element());
  });

  test('a time that isn’t one shows the error and leaves the value', async () => {
    const { screen, state, hour } = await setupInput({}, '08:03');
    await userEvent.fill(hour, '13');
    await userEvent.keyboard('{Enter}');
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Hour must be 1–12');
    expect(hour.getAttribute('aria-invalid')).toBe('true');
    expect(hour.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').element().id);
    expect(state.value).toBe('08:03');

    await userEvent.fill(hour, '12');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(screen.container.querySelector('[role="alert"]')).toBeNull());
    expect(state.value).toBe('00:03');
  });

  test('a minute past 59 is turned down', async () => {
    const { screen, state, hour, minute } = await setupInput({}, '08:03');
    await userEvent.fill(minute, '60');
    await userEvent.keyboard('{Enter}');
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Minute must be 0–59');
    // Only the field that isn't right shows the error.
    expect(minute.getAttribute('aria-invalid')).toBe('true');
    expect(hour.hasAttribute('aria-invalid')).toBe(false);
    expect(state.value).toBe('08:03');
  });

  test('emptying both fields clears the time', async () => {
    const { state, hour, minute } = await setupInput({}, '08:03');
    await userEvent.fill(hour, '');
    await userEvent.fill(minute, '');
    await userEvent.keyboard('{Enter}');
    expect(state.value).toBeUndefined();
  });

  test('a time from the app shows in the fields', async () => {
    const { state, hour, minute } = await setupInput({}, '08:03');
    state.value = '23:59';
    await vi.waitFor(() => expect([hour.value, minute.value]).toEqual(['11', '59']));
  });
});

describe('RioTimePickerDialog', () => {
  test('opens on the dial, named, with the focus on the hour', async () => {
    const { screen, open, field, selected } = await setupDialog({}, '07:30');
    await open();
    await expect.element(screen.getByRole('dialog', { name: 'Select time' })).toBeVisible();
    expect(focused()).toBe(field('Hour'));
    expect(field('Hour').getAttribute('aria-pressed')).toBe('true');
    // The toggles' names say the time they hold.
    await expect.element(screen.getByRole('button', { name: 'Hour 7' })).toHaveFocus();
    await expect.element(screen.getByRole('button', { name: 'Minute 30' })).toBeVisible();
    expect([field('Hour').textContent?.trim(), field('Minute').textContent?.trim()]).toEqual([
      '07',
      '30',
    ]);
    expect(selected()).toBe('7');
    await expect.element(screen.getByRole('group', { name: 'Hour' })).toBeVisible();
  });

  test('a press on the dial picks the hour, and its release goes on to the minutes', async () => {
    const { screen, state, open, press, field, selected } = await setupDialog({}, '07:30');
    await open();
    await press(90);
    await vi.waitFor(() => expect(field('Hour').textContent?.trim()).toBe('03'));
    await expect.element(screen.getByRole('group', { name: 'Minute' })).toBeVisible();
    expect(field('Minute').getAttribute('aria-pressed')).toBe('true');
    expect(selected()).toBe('30');
    await press(270);
    await vi.waitFor(() => expect(field('Minute').textContent?.trim()).toBe('45'));
    // The value waits for OK.
    expect(state.value).toBe('07:30');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect(state.value).toBe('03:45');
  });

  test('the selector follows a drag, and the release picks where it ends', async () => {
    const { state, open, dial, point, field, screen } = await setupDialog({}, '07:30');
    await open();
    await userEvent.dragAndDrop(page.elementLocator(dial()), page.elementLocator(dial()), {
      sourcePosition: point(30),
      targetPosition: point(180),
    });
    await vi.waitFor(() => expect(field('Hour').textContent?.trim()).toBe('06'));
    await expect.element(screen.getByRole('group', { name: 'Minute' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(state.value).toBe('06:30');
  });

  test('the minute nearest the pointer shows hover, not the one drawn on top', async () => {
    const { screen, open, dial, point, field } = await setupDialog({}, '07:30');
    await open();
    await userEvent.click(field('Minute'));
    const hovered = () =>
      [...dial().querySelectorAll<HTMLElement>('[data-hovered]')].map((item) => item.dataset.value);
    await userEvent.hover(page.elementLocator(dial()), { position: point(180) });
    await vi.waitFor(() => expect(hovered()).toEqual(['30']));
    // Only that one's state layer shows; the numbers on top of it under the pointer don't.
    const lit = () =>
      [...dial().querySelectorAll<HTMLElement>('.rio-time-picker__number')]
        .filter((item) => getComputedStyle(item, '::before').opacity !== '0')
        .map((item) => item.dataset.value);
    await vi.waitFor(() => expect(lit()).toEqual(['30']));
    await userEvent.hover(page.elementLocator(dial()), { position: point(186) });
    await vi.waitFor(() => expect(hovered()).toEqual(['31']));
    await userEvent.hover(screen.getByRole('button', { name: 'OK' }));
    await vi.waitFor(() => expect(hovered()).toEqual([]));
  });

  test('a press doesn’t take the focus from where it is', async () => {
    const { open, press, field } = await setupDialog({}, '07:30');
    await open();
    await press(60);
    expect(focused()).toBe(field('Hour'));
  });

  test('a 24-hour dial holds 0 to 11 outside and 12 to 23 inside', async () => {
    const { open, press, field, dialog } = await setupDialog({ hourCycle: 24 }, '07:30');
    await open();
    expect(dialog.querySelector('[role="radiogroup"]')).toBeNull();
    expect(dialog.querySelectorAll('.rio-time-picker__number')).toHaveLength(24);
    await press(90, 'inner');
    await vi.waitFor(() => expect(field('Hour').textContent?.trim()).toBe('15'));
    await userEvent.click(field('Hour'));
    await press(90);
    await vi.waitFor(() => expect(field('Hour').textContent?.trim()).toBe('03'));
  });

  test('Tab goes through the toggles and AM and PM, past the dial', async () => {
    const { screen, open, field } = await setupDialog({}, '07:30');
    await open();
    expect(focused()).toBe(field('Hour'));
    await userEvent.keyboard('{Tab}');
    expect(focused()).toBe(field('Minute'));
    await userEvent.keyboard('{Tab}');
    expect(focused()?.textContent?.trim()).toBe('AM');
    await userEvent.keyboard('{Tab}');
    expect(focused()).toBe(screen.getByRole('button', { name: 'Toggle input picker' }).element());
  });

  test('Enter on the hour moves onto the dial, at 12; the arrows go around it', async () => {
    const { open, field, selected, dialog } = await setupDialog({}, '07:30');
    await open();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(focused()?.getAttribute('aria-label')).toBe('Hour 12 of 12'));
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()?.textContent?.trim()).toBe('11');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}');
    expect(focused()?.dataset.value).toBe('2');
    // Enter picks the hour, and the dial stays on the hours.
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(field('Hour').textContent?.trim()).toBe('02'));
    expect(selected()).toBe('2');
    expect(dialog.querySelector('.rio-time-picker__dial')!.getAttribute('aria-label')).toBe('Hour');
    expect(focused()?.dataset.value).toBe('2');
  });

  test('Space on the minute shows the minutes and moves onto them, at 0', async () => {
    const { open, field, dialog } = await setupDialog({}, '07:30');
    await open();
    await userEvent.keyboard('{Tab} ');
    await vi.waitFor(() => expect(focused()?.getAttribute('aria-label')).toBe('Minute 0 of 60'));
    expect(field('Minute').getAttribute('aria-pressed')).toBe('true');
    const numbers = dialog.querySelectorAll<HTMLElement>('.rio-time-picker__number');
    expect(numbers).toHaveLength(60);
    expect([...numbers].filter((item) => item.textContent?.trim()).length).toBe(12);
    // Every minute can be picked from the keyboard, though the dial labels only the fives.
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()?.getAttribute('aria-label')).toBe('Minute 59 of 60');
    await userEvent.keyboard(' ');
    await vi.waitFor(() => expect(field('Minute').textContent?.trim()).toBe('59'));
  });

  test('a pointer click on a toggle leaves the focus on it', async () => {
    const { open, field } = await setupDialog({}, '07:30');
    await open();
    await userEvent.click(field('Minute'));
    expect(focused()).toBe(field('Minute'));
  });

  test('a 24-hour dial starts at 12, inside, and the arrows go through every hour', async () => {
    const { open, field } = await setupDialog({ hourCycle: 24 }, '15:30');
    await open();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(focused()?.getAttribute('aria-label')).toBe('Hour 12'));
    expect(focused()?.hasAttribute('data-inner')).toBe(true);
    // Back across the rings to 11, outside, and on round to 23
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()?.dataset.value).toBe('11');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}');
    expect(focused()?.dataset.value).toBe('14');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(field('Hour').textContent?.trim()).toBe('14'));
    await userEvent.keyboard('{ArrowRight}'.repeat(9));
    expect(focused()?.dataset.value).toBe('23');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()?.dataset.value).toBe('0');
  });

  test('right to left, hours stay before minutes, and the dial stays a clock', async () => {
    const state = reactive({ open: false });
    const screen = await render(
      defineComponent(
        () => () =>
          h('div', { dir: 'rtl', style: theme }, [
            h('button', { type: 'button', onClick: () => (state.open = true) }, 'Pick'),
            h(TimePickerDialog, {
              locale: 'en-US',
              modelValue: '07:30',
              open: state.open,
              'onUpdate:open': (next: boolean) => (state.open = next),
            }),
          ]),
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Pick' }));
    const dialog = (screen.container as HTMLElement).querySelector('dialog')!;
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    const face = dialog.querySelector('.rio-time-picker__dial')!.getBoundingClientRect();
    const center = (selector: string) => {
      const box = dialog.querySelector(selector)!.getBoundingClientRect();
      return [box.left + box.width / 2, box.top + box.height / 2];
    };
    const middle = face.left + face.width / 2;
    // The fields keep hours, then minutes, left to right.
    const hour = dialog.querySelector('[data-field="hour"]')!.getBoundingClientRect();
    const minute = dialog.querySelector('[data-field="minute"]')!.getBoundingClientRect();
    expect(hour.right).toBeLessThan(minute.left);
    expect(center('.rio-time-picker__number[data-value="0"]')[0]).toBeCloseTo(middle, 0);
    expect(center('.rio-time-picker__number[data-value="3"]')[0]).toBeCloseTo(
      middle + (102 / 256) * face.width,
      0,
    );
    expect(center('.rio-time-picker__center')[0]).toBeCloseTo(middle, 0);
    expect(center('.rio-time-picker__handle')).toEqual(
      center('.rio-time-picker__number[data-value="7"]'),
    );
    await userEvent.click(page.elementLocator(dialog.querySelector('.rio-time-picker__dial')!), {
      position: { x: face.width / 2 + (102 / 256) * face.width, y: face.height / 2 },
    });
    await vi.waitFor(() =>
      expect(
        dialog.querySelector('.rio-time-picker__field[data-field="hour"]')!.textContent?.trim(),
      ).toBe('03'),
    );
  });

  test('after an hour, the focus on the dial moves to minute 0', async () => {
    const { open, press } = await setupDialog({}, '07:30');
    await open();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(focused()?.dataset.value).toBe('0'));
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()?.dataset.value).toBe('11');
    await press(90);
    await vi.waitFor(() => expect(focused()?.getAttribute('aria-label')).toBe('Minute 0 of 60'));
  });

  test('AM and PM change the hour by 12', async () => {
    const { screen, open, field } = await setupDialog({}, '07:30');
    await open();
    await userEvent.click(screen.getByRole('radio', { name: 'PM' }));
    await vi.waitFor(() => expect(field('Hour').textContent?.trim()).toBe('07'));
    await expect
      .element(screen.getByRole('radio', { name: 'PM' }))
      .toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
  });

  test('Cancel and Escape leave the value, and each opening starts from it', async () => {
    const { screen, state, open, press, field, dialog } = await setupDialog({}, '07:30');
    await open();
    await press(90);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect(state.value).toBe('07:30');
    // Closed, it leaves nothing in the page, not even an empty box.
    await vi.waitFor(() => expect(getComputedStyle(dialog).display).toBe('none'));
    await vi.waitFor(() => expect(dialog.childElementCount).toBe(0));

    await open();
    expect(field('Hour').textContent?.trim()).toBe('07');
    expect(field('Hour').getAttribute('aria-pressed')).toBe('true');
    await press(90);
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect(state.value).toBe('07:30');
  });

  test('without a value, it starts at 12:00 AM, and OK sets that', async () => {
    const { screen, state, open, field } = await setupDialog();
    await open();
    expect([field('Hour').textContent?.trim(), field('Minute').textContent?.trim()]).toEqual([
      '12',
      '00',
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(state.value).toBe('00:00');
  });

  test('the mode button switches to the text input and back, with the time', async () => {
    const { screen, open, dialog, field } = await setupDialog({}, '07:30');
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Toggle input picker' }));
    await expect.element(screen.getByRole('dialog', { name: 'Enter time' })).toBeVisible();
    const hour = dialog.querySelector<HTMLInputElement>('input[aria-label="Hour"]')!;
    expect(hour.value).toBe('07');
    expect(dialog.querySelector('.rio-time-picker__dial')).toBeNull();
    await userEvent.fill(hour, '9');
    await userEvent.click(screen.getByRole('button', { name: 'Toggle dial picker' }));
    await vi.waitFor(() => expect(field('Hour').textContent?.trim()).toBe('09'));
    expect(dialog.querySelector('.rio-time-picker__dial')).not.toBeNull();
  });

  test('in the text input, Enter confirms, and an error keeps the dialog open', async () => {
    const { screen, state, open, dialog } = await setupDialog({ initialMode: 'input' }, '07:30');
    await open();
    const hour = dialog.querySelector<HTMLInputElement>('input[aria-label="Hour"]')!;
    const minute = dialog.querySelector<HTMLInputElement>('input[aria-label="Minute"]')!;
    expect(focused()).toBe(hour);
    // The hour's text is selected as the dialog opens, so typing replaces it.
    expect([hour.selectionStart, hour.selectionEnd]).toEqual([0, 2]);
    await userEvent.fill(minute, '75');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Minute must be 0–59');
    expect(state.open).toBe(true);

    await userEvent.fill(minute, '45');
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect(state.value).toBe('07:45');
  });

  test('layout fixes the dial beside or below the fields; it defaults to auto', async () => {
    const { dialog } = await setupDialog();
    expect(dialog.dataset.layout).toBe('auto');
    const beside = await setupDialog({ layout: 'horizontal' });
    expect(beside.dialog.dataset.layout).toBe('horizontal');
  });

  test('horizontal: the dial is beside the fields, and AM and PM below them', async () => {
    const { open, dialog, dial } = await setupDialog({ layout: 'horizontal' }, '07:30');
    await open();
    const fields = dialog.querySelector('.rio-time-picker__fields')!.getBoundingClientRect();
    const period = dialog.querySelector('.rio-time-picker__period')!.getBoundingClientRect();
    const face = dial().getBoundingClientRect();
    expect(face.left - fields.right).toBe(52);
    expect(period.top - fields.bottom).toBe(16);
    expect(period.width).toBe(fields.width);
  });

  test('horizontal: the fields and AM and PM center on the dial; the buttons sit in a 48px row', async () => {
    const { screen, open, dialog, dial } = await setupDialog({ layout: 'horizontal' }, '07:30');
    await open();
    const box = dialog.getBoundingClientRect();
    const fields = dialog.querySelector('.rio-time-picker__fields')!.getBoundingClientRect();
    const face = dial().getBoundingClientRect();
    expect(fields.top - face.top).toBe(40);
    expect([box.width, box.height]).toEqual([572, 376]);
    const mode = screen
      .getByRole('button', { name: 'Toggle input picker' })
      .element()
      .getBoundingClientRect();
    const ok = screen.getByRole('button', { name: 'OK' }).element().getBoundingClientRect();
    // The mode icon (8px inside its button) lines up with the fields; OK ends at the padding.
    expect(mode.left + 8).toBe(fields.left);
    expect(box.right - ok.right).toBe(24);
    expect(box.bottom - ok.bottom).toBe(28);
  });

  test('horizontal, 24 hours: the fields center on the dial', async () => {
    const { open, dialog, dial } = await setupDialog(
      { layout: 'horizontal', hourCycle: 24 },
      '07:30',
    );
    await open();
    const fields = dialog.querySelector('.rio-time-picker__fields')!.getBoundingClientRect();
    expect(fields.top - dial().getBoundingClientRect().top).toBe(68);
  });

  test('vertical: AM and PM are beside the fields, and the dial below them', async () => {
    const { open, dialog, dial } = await setupDialog({ layout: 'vertical' }, '07:30');
    await open();
    const fields = dialog.querySelector('.rio-time-picker__fields')!.getBoundingClientRect();
    const period = dialog.querySelector('.rio-time-picker__period')!.getBoundingClientRect();
    const face = dial().getBoundingClientRect();
    expect(period.left - fields.right).toBe(8);
    expect(period.height).toBe(fields.height);
    expect(face.top - fields.bottom).toBe(12);
  });

  test('AM and PM are 56px round buttons; the selected one has 16px corners', async () => {
    const { open, dialog } = await setupDialog({ layout: 'vertical' }, '07:30');
    await open();
    const [am, pm] = dialog.querySelectorAll<HTMLElement>('.rio-time-picker__period-button');
    expect([am!.offsetWidth, am!.offsetHeight]).toEqual([56, 56]);
    await vi.waitFor(() => expect(getComputedStyle(am!).borderTopLeftRadius).toBe('16px'));
    expect(getComputedStyle(pm!).borderTopLeftRadius).toBe('28px');
  });

  test('the buttons sit 16px from the dialog’s sides and bottom', async () => {
    const { screen, open, dialog } = await setupDialog({ layout: 'vertical' }, '07:30');
    await open();
    const box = dialog.getBoundingClientRect();
    const mode = screen
      .getByRole('button', { name: 'Toggle input picker' })
      .element()
      .getBoundingClientRect();
    const ok = screen.getByRole('button', { name: 'OK' }).element().getBoundingClientRect();
    expect(mode.left - box.left).toBe(16);
    expect(box.right - ok.right).toBe(16);
    expect(box.bottom - ok.bottom).toBe(16);
  });

  test('the mode button shows the app’s icon for the other mode', async () => {
    const { screen, open } = await setupDialog({}, '07:30');
    await open();
    await expect
      .element(screen.getByRole('button', { name: 'Toggle input picker' }))
      .toHaveTextContent('K');
    await userEvent.click(screen.getByRole('button', { name: 'Toggle input picker' }));
    await expect
      .element(screen.getByRole('button', { name: 'Toggle dial picker' }))
      .toHaveTextContent('C');
  });
});

describe('languages', () => {
  test('RioLocaleProvider gives its language: the text, and AM and PM', async () => {
    const screen = await render(
      defineComponent(
        () => () =>
          h(LocaleProvider, { locale: 'ko-KR' }, () =>
            h(TimeInput, { modelValue: '19:05', style: theme }),
          ),
      ),
    );
    await expect.element(screen.getByRole('textbox', { name: '시' })).toHaveValue('07');
    // The engine's own name for PM, which some builds' locale data give in English
    const pm = new Intl.DateTimeFormat('ko-KR', {
      hour: 'numeric',
      hourCycle: 'h12',
      timeZone: 'UTC',
    })
      .formatToParts(new Date(Date.UTC(2026, 0, 1, 21)))
      .find((part) => part.type === 'dayPeriod')!.value;
    await expect
      .element(screen.getByRole('radio', { name: pm }))
      .toHaveAttribute('aria-checked', 'true');
    await expect
      .element(screen.getByRole('radiogroup', { name: '오전 또는 오후 선택' }))
      .toBeVisible();
  });

  test('a component’s messages replace the table’s', async () => {
    const screen = await render(TimeInput, {
      props: { locale: 'en-US', messages: { hour: 'Hours' } },
    });
    await expect.element(screen.getByRole('textbox', { name: 'Hours' })).toBeVisible();
  });
});
