import { mdiChevronDown, mdiPlus } from '@mdi/js';
import { BUTTON_SIZES, SPLIT_BUTTON_VARIANTS, type SplitButtonProps } from '@rio-m3e/core';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { h } from 'vue';
import { icon, keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import SplitButton from './SplitButton.vue';

const split = (
  props: Partial<SplitButtonProps>,
  { label = 'Label', withIcon = false }: { label?: string | false; withIcon?: boolean } = {},
) =>
  h(
    SplitButton,
    { menuLabel: 'More options', ...props },
    {
      ...(label ? { default: () => label } : {}),
      ...(withIcon ? { icon: () => icon(mdiPlus) } : {}),
      'menu-icon': () => icon(mdiChevronDown),
    },
  );

/** Waits for the corner and menu icon springs to finish. */
const settle = (buttons: HTMLElement[]) =>
  vi.waitFor(
    () => {
      for (const button of buttons) expect(button.getAttribute('style') ?? '').toBe('');
    },
    { timeout: 2000 },
  );

describe('RioSplitButton', () => {
  test.each(SCHEMES)('variants, open, and disabled, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      SPLIT_BUTTON_VARIANTS.map((variant) => split({ variant }, { withIcon: true })),
      SPLIT_BUTTON_VARIANTS.map((variant) => split({ variant, open: true }, { withIcon: true })),
      SPLIT_BUTTON_VARIANTS.map((variant) =>
        split({ variant, label: 'Add' }, { label: false, withIcon: true }),
      ),
      SPLIT_BUTTON_VARIANTS.map((variant) => split({ variant, disabled: true })),
    ]);
    await expect.element(gallery).toMatchScreenshot(`variants-${scheme}`);
  });

  // A row per size keeps the gallery inside the 720px-high test frame.
  test('sizes', async () => {
    const gallery = await renderGallery('light', () =>
      BUTTON_SIZES.map((size) => [
        split({ size, variant: 'tonal' }),
        split({ size, variant: 'tonal', open: true }),
        split({ size }, { withIcon: true }),
      ]),
    );
    await expect.element(gallery).toMatchScreenshot('sizes');
  });

  test('keyboard focus, hover, and right to left', async () => {
    const gallery = await renderGallery('light', () => [
      [
        split({ variant: 'outlined' }),
        split({ variant: 'tonal' }),
        h('div', { dir: 'rtl', style: { display: 'flex', gap: '12px' } }, [
          split({ variant: 'tonal' }, { withIcon: true }),
          split({ variant: 'tonal', open: true }, { withIcon: true }),
        ]),
      ],
    ]);
    const buttons = gallery.getByRole('button').elements() as HTMLElement[];
    const [focused, , , hovered] = buttons;
    await keyboardFocus(focused!);
    expect(focused!.matches(':focus-visible')).toBe(true);
    await userEvent.hover(hovered!);
    await settle(buttons);
    await expect.element(gallery).toMatchScreenshot('interaction');
  });
});
