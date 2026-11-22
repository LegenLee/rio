import { mdiCalendar, mdiPencil } from '@mdi/js';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { icon, renderGallery, SCHEMES, type Scheme } from '../test/vrt';
import DateRangePickerDialog from './DateRangePickerDialog.vue';

/** Waits out the motion. */
const settled = () => vi.waitFor(() => expect(document.getAnimations()).toHaveLength(0));

const icons = {
  'edit-icon': () => icon(mdiPencil),
  'calendar-icon': () => icon(mdiCalendar),
};

/** Opens the dialog on a range far from today, and returns it. */
const openDialog = async (scheme: Scheme, props: Record<string, unknown>) => {
  const state = reactive({ open: false });
  const Dialog = defineComponent(
    () => () =>
      h(
        DateRangePickerDialog,
        {
          locale: 'en-US',
          start: '2025-08-17',
          end: '2025-08-23',
          ...props,
          open: state.open,
          'onUpdate:open': (next: boolean) => (state.open = next),
        },
        icons,
      ),
  );
  await renderGallery(scheme, () => [[h(Dialog)]]);
  state.open = true;
  const dialog = () => document.querySelector<HTMLDialogElement>('dialog')!;
  await vi.waitFor(() => expect(dialog().open).toBe(true));
  (document.activeElement as HTMLElement | null)?.blur();
  await settled();
  return dialog();
};

describe('RioDateRangePickerDialog', () => {
  test.each(SCHEMES)('the calendar, %s', async (scheme) => {
    const dialog = await openDialog(scheme, {});
    await expect.element(dialog).toMatchScreenshot(`range-${scheme}`);
  });

  test('text input', async () => {
    const dialog = await openDialog('light', { initialMode: 'input' });
    await expect.element(dialog).toMatchScreenshot('range-input');
  });
});
