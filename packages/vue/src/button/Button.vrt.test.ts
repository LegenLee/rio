import { mdiPlus } from '@mdi/js';
import { BUTTON_SIZES, BUTTON_VARIANTS } from '@rio-m3e/core';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { h } from 'vue';
import { icon, keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import Button from './Button.vue';

// Text buttons can't toggle.
const TOGGLE_VARIANTS = BUTTON_VARIANTS.filter((variant) => variant !== 'text');

describe('RioButton', () => {
  // A row per size keeps the gallery inside the 720px-high test frame; anything past it is cut off.
  test.each(SCHEMES)('variants and sizes, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () =>
      BUTTON_SIZES.map((size) =>
        BUTTON_VARIANTS.map((variant) => h(Button, { variant, size }, () => 'Label')),
      ),
    );
    await expect.element(gallery).toMatchScreenshot(`variants-${scheme}`);
  });

  test.each(SCHEMES)('icons, shapes, toggles, and disabled, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      BUTTON_VARIANTS.map((variant) =>
        h(Button, { variant }, { default: () => 'Add', icon: () => icon(mdiPlus) }),
      ),
      BUTTON_VARIANTS.map((variant) => h(Button, { variant, shape: 'square' }, () => 'Square')),
      TOGGLE_VARIANTS.map((variant) => h(Button, { variant, toggle: true }, () => 'Off')),
      TOGGLE_VARIANTS.map((variant) =>
        h(Button, { variant, toggle: true, selected: true }, () => 'On'),
      ),
      BUTTON_VARIANTS.map((variant) => h(Button, { variant, disabled: true }, () => 'Disabled')),
    ]);
    await expect.element(gallery).toMatchScreenshot(`states-${scheme}`);
  });

  test('keyboard focus and hover', async () => {
    const gallery = await renderGallery('light', () => [
      [h(Button, { variant: 'outlined' }, () => 'Focused'), h(Button, () => 'Hovered')],
    ]);
    const [focused, hovered] = gallery.getByRole('button').elements() as HTMLElement[];
    await keyboardFocus(focused!);
    expect(focused!.matches(':focus-visible')).toBe(true);
    await userEvent.hover(hovered!);
    await expect.element(gallery).toMatchScreenshot('interaction');
  });
});
