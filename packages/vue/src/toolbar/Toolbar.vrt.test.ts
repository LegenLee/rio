import {
  mdiFormatBold,
  mdiFormatItalic,
  mdiFormatUnderline,
  mdiPlus,
  mdiShareVariantOutline,
  mdiUndo,
} from '@mdi/js';
import type { ToolbarProps } from '@rio-m3e/core';
import { describe, expect, test } from 'vitest';
import { h } from 'vue';
import IconButton from '../icon-button/IconButton.vue';
import { icon, renderGallery, SCHEMES } from '../test/vrt';
import Toolbar from './Toolbar.vue';

/** A standard icon button, two tonal toggles, one selected, and a filled icon button */
const items = () => [
  h(IconButton, { label: 'Undo', variant: 'standard' }, () => icon(mdiUndo)),
  h(IconButton, { label: 'Bold', variant: 'tonal', toggle: true, selected: true }, () =>
    icon(mdiFormatBold),
  ),
  h(IconButton, { label: 'Italic', variant: 'tonal', toggle: true }, () => icon(mdiFormatItalic)),
  h(IconButton, { label: 'Underline', variant: 'standard' }, () => icon(mdiFormatUnderline)),
  h(IconButton, { label: 'Add' }, () => icon(mdiPlus)),
];

const toolbar = (props: ToolbarProps, style?: Record<string, string>) =>
  h(Toolbar, { 'aria-label': 'Formatting', ...props, style }, items);

describe('RioToolbar', () => {
  test.each(SCHEMES)('docked and floating, standard and vibrant, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      [toolbar({}, { inlineSize: '480px' })],
      [toolbar({ variant: 'vibrant' }, { inlineSize: '480px' })],
      [toolbar({ type: 'floating' }), toolbar({ type: 'floating', variant: 'vibrant' })],
      [
        toolbar({ type: 'floating', flat: true }),
        toolbar({ type: 'floating', orientation: 'vertical' }),
        toolbar({ type: 'floating', orientation: 'vertical', variant: 'vibrant' }),
        h(Toolbar, { 'aria-label': 'Share', type: 'floating' }, () => [
          h(IconButton, { label: 'Share', variant: 'standard' }, () =>
            icon(mdiShareVariantOutline),
          ),
        ]),
      ],
    ]);
    await expect.element(gallery).toMatchScreenshot(`variants-${scheme}`);
  });
});
