import { mdiContentCopy } from '@mdi/js';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, reactive, type VNode } from 'vue';
import Button from '../button/Button.vue';
import IconButton from '../icon-button/IconButton.vue';
import { icon, renderGallery, SCHEMES } from '../test/vrt';
import Tooltip from './Tooltip.vue';

const TOOLTIPS: [string, (open: boolean) => VNode][] = [
  [
    'plain',
    (open) =>
      h(Tooltip, { text: 'Copy', open }, () =>
        h(IconButton, { label: 'Copy' }, () => icon(mdiContentCopy)),
      ),
  ],
  [
    'rich',
    (open) =>
      h(
        Tooltip,
        {
          variant: 'rich',
          subhead: 'Backups',
          text: 'Photos back up every night while your phone charges.',
          open,
        },
        {
          default: () => h(Button, { variant: 'outlined' }, () => 'Backups'),
          actions: () => [
            h(Button, { variant: 'text' }, () => 'Learn more'),
            h(Button, { variant: 'text' }, () => 'Settings'),
          ],
        },
      ),
  ],
];

/**
 * A tooltip on its element, in an area that holds it, since the top layer draws it outside the
 * gallery's layout. It opens after the render: the test renderer moves what it renders into place,
 * which would close it. Only one tooltip shows at a time, so there is one per screenshot.
 */
const showcase = (tooltip: (open: boolean) => VNode, open: { value: boolean }) =>
  defineComponent(
    () => () =>
      h('div', { style: { width: '360px', height: '220px', padding: '40px 24px 0' } }, [
        tooltip(open.value),
      ]),
  );

describe('RioTooltip', () => {
  describe.each(SCHEMES)('%s', (scheme) => {
    test.each(TOOLTIPS)('%s', async (name, tooltip) => {
      const open = reactive({ value: false });
      const gallery = await renderGallery(scheme, () => [[h(showcase(tooltip, open))]]);
      open.value = true;
      await vi.waitFor(() =>
        expect(document.querySelector('.rio-tooltip:popover-open')?.hasAttribute('data-side')).toBe(
          true,
        ),
      );
      (document.activeElement as HTMLElement | null)?.blur();
      await expect.element(gallery).toMatchScreenshot(`${name}-${scheme}`);
    });
  });
});
