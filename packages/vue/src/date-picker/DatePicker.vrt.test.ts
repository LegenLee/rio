import { mdiCalendar, mdiChevronLeft, mdiChevronRight, mdiMenuDown, mdiPencil } from '@mdi/js';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { icon, renderGallery, SCHEMES } from '../test/vrt';
import DatePicker from './DatePicker.vue';

/** Waits out the motion. */
const settled = () => vi.waitFor(() => expect(document.getAnimations()).toHaveLength(0));

const icons = {
  'calendar-icon': () => icon(mdiCalendar),
  'previous-icon': () => icon(mdiChevronLeft),
  'next-icon': () => icon(mdiChevronRight),
  'dropdown-icon': () => icon(mdiMenuDown),
  'edit-icon': () => icon(mdiPencil),
};

/** A picker opened in place, with room for its calendar. Today is outside the month shown. */
const opened = (props: Record<string, unknown>, height: string) => {
  const state = reactive({ open: false });
  const Picker = defineComponent(
    () => () =>
      h('div', { style: { blockSize: height, inlineSize: '400px' } }, [
        h(
          DatePicker,
          {
            label: 'Departure',
            locale: 'en-US',
            modelValue: '2026-03-17',
            ...props,
            open: state.open,
            'onUpdate:open': (next: boolean) => (state.open = next),
          },
          icons,
        ),
      ]),
  );
  return { Picker, state };
};

describe('RioDatePicker', () => {
  test.each(SCHEMES)('docked, %s', async (scheme) => {
    const { Picker, state } = opened({ min: '2026-03-05' }, '560px');
    const gallery = await renderGallery(scheme, () => [[h(Picker)]]);
    state.open = true;
    await vi.waitFor(() =>
      expect(document.querySelector('.rio-date-picker__menu')!.matches(':popover-open')).toBe(true),
    );
    (document.activeElement as HTMLElement | null)?.blur();
    await settled();
    await expect.element(gallery).toMatchScreenshot(`docked-${scheme}`);
  });

  test.each(SCHEMES)('modal, %s', async (scheme) => {
    const { Picker, state } = opened({ variant: 'modal' }, '120px');
    await renderGallery(scheme, () => [[h(Picker)]]);
    state.open = true;
    const dialog = () => document.querySelector<HTMLDialogElement>('dialog')!;
    await vi.waitFor(() => expect(dialog().open).toBe(true));
    (document.activeElement as HTMLElement | null)?.blur();
    await settled();
    await expect.element(dialog()).toMatchScreenshot(`modal-${scheme}`);
  });
});
