import { mdiHeart, mdiHeartOutline, mdiMagnify } from '@mdi/js';
import { BUTTON_SIZES, ICON_BUTTON_VARIANTS, ICON_BUTTON_WIDTHS } from '@rio-m3e/core';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { h } from 'vue';
import { icon, keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import IconButton from './IconButton.vue';

const search = () => icon(mdiMagnify);
const favorite = { default: () => icon(mdiHeartOutline), 'selected-icon': () => icon(mdiHeart) };

describe('RioIconButton', () => {
  // A row per size keeps the gallery inside the 720px-high test frame; anything past it is cut off.
  test.each(SCHEMES)('variants and sizes, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () =>
      BUTTON_SIZES.map((size) =>
        ICON_BUTTON_VARIANTS.map((variant) =>
          h(IconButton, { label: 'Search', variant, size }, search),
        ),
      ),
    );
    await expect.element(gallery).toMatchScreenshot(`variants-${scheme}`);
  });

  test.each(SCHEMES)('widths, shapes, toggles, and disabled, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      ICON_BUTTON_WIDTHS.map((width) =>
        h(IconButton, { label: 'Search', size: 'medium', width }, search),
      ),
      ICON_BUTTON_VARIANTS.map((variant) =>
        h(IconButton, { label: 'Search', variant, shape: 'square' }, search),
      ),
      ICON_BUTTON_VARIANTS.map((variant) =>
        h(IconButton, { label: 'Favorite', variant, toggle: true }, favorite),
      ),
      ICON_BUTTON_VARIANTS.map((variant) =>
        h(IconButton, { label: 'Favorite', variant, toggle: true, selected: true }, favorite),
      ),
      ICON_BUTTON_VARIANTS.map((variant) =>
        h(IconButton, { label: 'Search', variant, disabled: true }, search),
      ),
    ]);
    await expect.element(gallery).toMatchScreenshot(`states-${scheme}`);
  });

  test('keyboard focus and hover', async () => {
    // The standard variant has no container, so hovering shows the state layer on its own.
    const gallery = await renderGallery('light', () => [
      [
        h(IconButton, { label: 'Focused' }, search),
        h(IconButton, { label: 'Hovered', variant: 'standard' }, search),
      ],
    ]);
    const [focused, hovered] = gallery.getByRole('button').elements() as HTMLElement[];
    await keyboardFocus(focused!);
    expect(focused!.matches(':focus-visible')).toBe(true);
    await userEvent.hover(hovered!);
    await expect.element(gallery).toMatchScreenshot('interaction');
  });
});
