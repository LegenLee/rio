import { mdiPencilOutline } from '@mdi/js';
import { FAB_SIZES } from '@rio-m3e/core';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { h } from 'vue';
import { icon, keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import Fab from './Fab.vue';

const pencil = () => icon(mdiPencilOutline);

describe('RioFab', () => {
  test.each(SCHEMES)('sizes, extended, and color styles, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      FAB_SIZES.map((size) => h(Fab, { label: 'Compose', size }, pencil)),
      FAB_SIZES.map((size) => h(Fab, { label: 'Compose', size, extended: true }, pencil)),
      [h(Fab, { label: 'Compose', extended: true })],
      // The spec's color styles: primary, secondary, and tertiary, on their containers or filled
      ...(['tonal', 'filled'] as const).map((variant) =>
        (['primary', 'secondary', 'tertiary'] as const).map((color) =>
          h(Fab, { label: 'Compose', variant, color }, pencil),
        ),
      ),
    ]);
    await expect.element(gallery).toMatchScreenshot(`variants-${scheme}`);
  });

  test('hovered, lifted a level, and focused from the keyboard', async () => {
    const gallery = await renderGallery('light', () => [
      [h(Fab, { label: 'Hovered' }, pencil), h(Fab, { label: 'Focused', extended: true }, pencil)],
    ]);
    const [hovered, focused] = gallery.element().querySelectorAll<HTMLElement>('.rio-fab');
    await userEvent.hover(hovered!);
    await keyboardFocus(focused!);
    expect(focused!.matches(':focus-visible')).toBe(true);
    await expect.element(gallery).toMatchScreenshot('interaction');
  });
});
