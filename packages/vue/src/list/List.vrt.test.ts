import { mdiBookmarkOutline, mdiChevronRight, mdiStar, mdiStarOutline } from '@mdi/js';
import { describe, expect, test } from 'vitest';
import { h } from 'vue';
import Checkbox from '../checkbox/Checkbox.vue';
import IconButton from '../icon-button/IconButton.vue';
import Radio from '../radio/Radio.vue';
import Switch from '../switch/Switch.vue';
import { icon, renderGallery, SCHEMES } from '../test/vrt';
import List from './List.vue';
import ListItem from './ListItem.vue';

const column = (children: ReturnType<typeof h>[]) =>
  h(
    'div',
    {
      style: {
        inlineSize: '320px',
        background: 'var(--rio-color-surface-container)',
        padding: '8px',
      },
    },
    children,
  );

describe('RioList', () => {
  test.each(SCHEMES)('standard and segmented, static and selected, %s', async (scheme) => {
    const items = (selection?: 'single') =>
      [
        h(
          ListItem,
          { value: 'a' },
          { default: () => 'One line', leading: () => icon(mdiStarOutline) },
        ),
        h(
          ListItem,
          { value: 'b' },
          {
            default: () => 'Two lines',
            supporting: () => 'Supporting text',
            leading: ({ selected }: { selected: boolean }) =>
              icon(selected ? mdiStar : mdiStarOutline),
            trailing: () => '100+',
          },
        ),
        h(
          ListItem,
          { value: 'c' },
          {
            default: () => 'Three lines',
            overline: () => 'Overline',
            supporting: () => 'Supporting text',
            trailing: () => icon(mdiChevronRight),
          },
        ),
        h(ListItem, { value: 'd', disabled: true }, { default: () => 'Disabled' }),
      ].map((node) => (selection ? node : node));
    const gallery = await renderGallery(scheme, () => [
      [
        column([h(List, {}, () => items())]),
        column([
          h(
            List,
            { variant: 'segmented', selection: 'single', modelValue: 'b', label: 'Pick one' },
            () => items('single'),
          ),
        ]),
      ],
    ]);
    await expect.element(gallery).toMatchScreenshot(`list-${scheme}`);
  });

  test('selection controls in slots, and secondary actions', async () => {
    const control =
      (kind: 'checkbox' | 'radio' | 'switch') =>
      ({ selected }: { selected: boolean }) =>
        kind === 'checkbox'
          ? h(Checkbox, { selected })
          : kind === 'radio'
            ? h(Radio, { selected })
            : h(Switch, { selected });
    const gallery = await renderGallery('light', () => [
      [
        column([
          h(List, { selection: 'single', modelValue: 'small', label: 'Size' }, () => [
            h(ListItem, { value: 'small' }, { default: () => 'Small', leading: control('radio') }),
            h(ListItem, { value: 'large' }, { default: () => 'Large', leading: control('radio') }),
          ]),
          h(
            List,
            {
              selection: 'multiple',
              modelValue: ['cheese'],
              label: 'Toppings',
              variant: 'segmented',
            },
            () => [
              h(
                ListItem,
                { value: 'cheese' },
                { default: () => 'Cheese', leading: control('checkbox') },
              ),
              h(
                ListItem,
                { value: 'olive' },
                { default: () => 'Olive', leading: control('checkbox') },
              ),
              h(
                ListItem,
                { value: 'basil' },
                { default: () => 'Basil', trailing: control('switch') },
              ),
            ],
          ),
        ]),
        column([
          h(List, {}, () => [
            h(
              ListItem,
              { onClick: () => {} },
              {
                default: () => 'Inbox',
                supporting: () => 'Two new messages',
                trailing: () =>
                  h(IconButton, { label: 'Save', variant: 'standard' }, () =>
                    icon(mdiBookmarkOutline),
                  ),
              },
            ),
            h(
              ListItem,
              { href: '#sent' },
              { default: () => 'Sent', trailing: () => icon(mdiChevronRight) },
            ),
          ]),
        ]),
      ],
    ]);
    await expect.element(gallery).toMatchScreenshot('list-controls');
  });
});
