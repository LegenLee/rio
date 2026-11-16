import { mdiAlertCircle, mdiMagnify } from '@mdi/js';
import { describe, expect, test, vi } from 'vitest';
import { h } from 'vue';
import { icon, renderGallery, SCHEMES } from '../test/vrt';
import TextField from './TextField.vue';

/** Waits out the labels' motion. */
const settled = () => vi.waitFor(() => expect(document.getAnimations()).toHaveLength(0));

const width = { style: { inlineSize: '240px' } };

const row = (variant: 'filled' | 'outlined') => [
  h(TextField, { ...width, variant, label: 'Empty' }),
  h(TextField, { ...width, variant, label: 'Populated', modelValue: 'Ada Lovelace' }),
  h(
    TextField,
    { ...width, variant, label: 'Search', modelValue: 'blue', supportingText: 'Songs and albums' },
    { 'leading-icon': () => icon(mdiMagnify) },
  ),
  h(
    TextField,
    {
      ...width,
      variant,
      label: 'Code',
      modelValue: 'ab',
      maxlength: 6,
      error: true,
      errorText: 'Six characters',
      required: true,
    },
    { 'trailing-icon': () => icon(mdiAlertCircle) },
  ),
  h(TextField, {
    ...width,
    variant,
    label: 'Amount',
    modelValue: '25',
    prefix: '$',
    suffix: 'USD',
  }),
  h(TextField, { ...width, variant, label: 'Disabled', modelValue: 'Fixed', disabled: true }),
];

describe('RioTextField', () => {
  test.each(SCHEMES)('variants and states, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () =>
      (['filled', 'outlined'] as const).flatMap((variant) => {
        const fields = row(variant);
        return [fields.slice(0, 3), fields.slice(3)];
      }),
    );
    await settled();
    await expect.element(gallery).toMatchScreenshot(`states-${scheme}`);
  });

  test.each(['filled', 'outlined'] as const)('focused, and a text area, %s', async (variant) => {
    const gallery = await renderGallery('light', () => [
      [
        h(TextField, { ...width, variant, label: 'Focused' }),
        h(TextField, {
          ...width,
          variant,
          label: 'Notes',
          multiline: true,
          modelValue: 'One\nTwo',
        }),
      ],
    ]);
    gallery.element().querySelector('input')!.focus();
    await settled();
    await expect.element(gallery).toMatchScreenshot(`focused-${variant}`);
  });
});
