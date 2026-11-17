import { mdiClockOutline, mdiKeyboardOutline } from '@mdi/js';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { icon, renderGallery, SCHEMES } from '../test/vrt';
import TimeInput from './TimeInput.vue';
import TimePickerDialog from './TimePickerDialog.vue';

/** Waits out the motion. */
const settled = () => vi.waitFor(() => expect(document.getAnimations()).toHaveLength(0));

const icons = {
  'keyboard-icon': () => icon(mdiKeyboardOutline),
  'clock-icon': () => icon(mdiClockOutline),
};

/** Opens the dialog in place, and returns it. */
const openDialog = async (scheme: (typeof SCHEMES)[number], props: Record<string, unknown>) => {
  const state = reactive({ open: false });
  const Dialog = defineComponent(
    () => () =>
      h(
        TimePickerDialog,
        {
          locale: 'en-US',
          modelValue: '07:30',
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

describe('RioTimeInput', () => {
  test.each(SCHEMES)('12 and 24 hours, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      [
        h(TimeInput, { locale: 'en-US', modelValue: '19:05' }),
        h(TimeInput, { locale: 'de-DE', modelValue: '19:05' }),
      ],
    ]);
    await expect.element(gallery).toMatchScreenshot(`input-${scheme}`);
  });
});

describe('RioTimePickerDialog', () => {
  test.each(SCHEMES)('dial, vertical, %s', async (scheme) => {
    const dialog = await openDialog(scheme, { layout: 'vertical' });
    await expect.element(dialog).toMatchScreenshot(`dial-vertical-${scheme}`);
  });

  test('dial, horizontal, 24 hours', async () => {
    const dialog = await openDialog('light', { layout: 'horizontal', hourCycle: 24 });
    await expect.element(dialog).toMatchScreenshot('dial-horizontal');
  });

  test('text input', async () => {
    const dialog = await openDialog('light', { initialMode: 'input' });
    await expect.element(dialog).toMatchScreenshot('input-mode');
  });
});
