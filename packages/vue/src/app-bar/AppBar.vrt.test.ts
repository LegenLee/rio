import { mdiAccountCircle, mdiArrowLeft, mdiCalendar, mdiMagnify, mdiMenu } from '@mdi/js';
import type { AppBarProps } from '@rio-m3e/core';
import { describe, expect, test } from 'vitest';
import { h } from 'vue';
import IconButton from '../icon-button/IconButton.vue';
import { icon, renderGallery, SCHEMES } from '../test/vrt';
import AppBar from './AppBar.vue';

const leading = (path: string, label: string) => () =>
  h(IconButton, { label, variant: 'standard' }, () => icon(path));
const trailing = () => [
  h(IconButton, { label: 'Search', variant: 'standard' }, () => icon(mdiMagnify)),
  h(IconButton, { label: 'Today', variant: 'standard' }, () => icon(mdiCalendar)),
];

const bar = (props: AppBarProps & { headline?: string; subtitle?: string }, back = true) =>
  h(
    AppBar,
    { ...props, style: { inlineSize: '480px' } },
    {
      leading: leading(back ? mdiArrowLeft : mdiMenu, back ? 'Back' : 'Menu'),
      trailing,
    },
  );

describe('RioAppBar', () => {
  test.each(SCHEMES)('small, flexible, centered, and scrolled, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      [bar({ headline: 'Inbox' }, false)],
      [bar({ headline: 'Inbox', subtitle: '12 unread', align: 'center' })],
      [bar({ headline: 'Inbox', scrolled: true })],
      [bar({ variant: 'medium-flexible', headline: 'Photos', subtitle: 'Last week' })],
      [
        h(
          AppBar,
          {
            variant: 'large-flexible',
            headline: 'Settings',
            align: 'center',
            style: { inlineSize: '480px' },
          },
          {
            leading: leading(mdiArrowLeft, 'Back'),
            trailing: () =>
              h(IconButton, { label: 'Account', variant: 'standard' }, () =>
                icon(mdiAccountCircle),
              ),
          },
        ),
      ],
    ]);
    await expect.element(gallery).toMatchScreenshot(`variants-${scheme}`);
  });
});
