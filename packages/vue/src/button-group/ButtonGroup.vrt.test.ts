import { mdiFormatBold, mdiFormatItalic, mdiFormatUnderline } from '@mdi/js';
import { BUTTON_SIZES } from '@rio-m3e/core';
import { describe, expect, test } from 'vitest';
import { h } from 'vue';
import Button from '../button/Button.vue';
import IconButton from '../icon-button/IconButton.vue';
import { icon, renderGallery, SCHEMES } from '../test/vrt';
import ButtonGroup from './ButtonGroup.vue';

const labels = (names: string[]) => names.map((name) => h(Button, { value: name }, () => name));
const formatting = () =>
  (
    [
      ['Bold', mdiFormatBold],
      ['Italic', mdiFormatItalic],
      ['Underline', mdiFormatUnderline],
    ] as const
  ).map(([label, path]) =>
    h(IconButton, { label, value: label, variant: 'tonal' }, () => icon(path)),
  );

describe('RioButtonGroup', () => {
  test.each(SCHEMES)('standard and connected, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      [h(ButtonGroup, null, () => labels(['One', 'Two', 'Three']))],
      [
        h(ButtonGroup, { selection: 'multiple', modelValue: ['Bold'] }, formatting),
        h(
          ButtonGroup,
          { selection: 'multiple', modelValue: ['Bold'], shape: 'square' },
          formatting,
        ),
      ],
      [
        h(ButtonGroup, { variant: 'connected', selection: 'single', modelValue: 'Week' }, () =>
          labels(['Day', 'Week', 'Month']),
        ),
      ],
      [
        h(
          ButtonGroup,
          { variant: 'connected', selection: 'single', modelValue: 'Week', shape: 'square' },
          () => labels(['Day', 'Week', 'Month']),
        ),
      ],
      [h(ButtonGroup, { variant: 'connected' }, formatting)],
    ]);
    await expect.element(gallery).toMatchScreenshot(`variants-${scheme}`);
  });

  test('connected sizes', async () => {
    const gallery = await renderGallery('light', () =>
      BUTTON_SIZES.map((size) => [
        h(ButtonGroup, { variant: 'connected', size, selection: 'single', modelValue: 'B' }, () =>
          labels(['A', 'B', 'C']),
        ),
      ]),
    );
    await expect.element(gallery).toMatchScreenshot('connected-sizes');
  });
});
