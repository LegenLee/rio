import {
  mdiCheck,
  mdiContentCopy,
  mdiContentCut,
  mdiContentPaste,
  mdiMenuRight,
  mdiShareVariant,
} from '@mdi/js';
import type { MenuProps, MenuSelected } from '@rio-m3e/core';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, reactive, ref, type VNode } from 'vue';
import { icon, keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import Menu from './Menu.vue';
import MenuDivider from './MenuDivider.vue';
import MenuGroup from './MenuGroup.vue';
import MenuItem from './MenuItem.vue';
import SubMenu from './SubMenu.vue';

const check = ({ selected }: { selected: boolean }) => (selected ? icon(mdiCheck) : null);

const editItems = () => [
  h(MenuItem, null, {
    icon: () => icon(mdiContentCut),
    default: () => 'Cut',
    'trailing-text': () => 'Ctrl+X',
  }),
  h(MenuItem, null, {
    icon: () => icon(mdiContentCopy),
    default: () => 'Copy',
    'trailing-text': () => 'Ctrl+C',
  }),
  h(
    MenuItem,
    { disabled: true },
    { icon: () => icon(mdiContentPaste), default: () => 'Paste', 'trailing-text': () => 'Ctrl+V' },
  ),
  h(MenuDivider),
  h(MenuGroup, { label: 'Share' }, () => [
    h(MenuItem, null, () => 'Email'),
    h(MenuItem, null, {
      default: () => 'Copy link',
      'supporting-text': () => 'Anyone with the link',
    }),
  ]),
];
const choices = (values: string[]) => () =>
  values.map((value) => h(MenuItem, { value }, { icon: check, default: () => value }));

interface Shown {
  props: Omit<MenuProps, 'open' | 'selected'>;
  selected?: MenuSelected;
  items: () => VNode[];
}

/**
 * A menu under a point at the top of an area that holds it, since the top layer draws it outside
 * the gallery's layout. It opens after the render: the test renderer moves what it renders into
 * place, which would close it. Unrelated menus close each other, so there is one at a time.
 */
const showcase = (menu: Shown, open: { value: boolean }) =>
  defineComponent(() => {
    const anchor = ref<HTMLElement>();
    return () =>
      h('div', { style: { position: 'relative', width: '240px', height: '330px' } }, [
        h('span', { ref: anchor, style: { position: 'absolute', top: '0', left: '0' } }),
        h(
          Menu,
          {
            ...menu.props,
            instant: true,
            open: open.value,
            anchor: anchor.value,
            modelValue: menu.selected,
          },
          menu.items,
        ),
      ]);
  });

const MENUS: [string, Shown][] = [
  ['edit', { props: { label: 'Edit' }, items: editItems }],
  [
    'vibrant-single',
    {
      props: { label: 'Sort', variant: 'vibrant', selection: 'single' },
      selected: 'date',
      items: choices(['name', 'date', 'size']),
    },
  ],
  [
    'multiple',
    {
      props: { label: 'Filters', selection: 'multiple' },
      selected: ['photos', 'documents'],
      items: choices(['photos', 'videos', 'documents']),
    },
  ],
];

/** A menu with its "Share" submenu open, which takes the active shape from the menu around it */
const withSubmenu = (open: { value: boolean }) =>
  defineComponent(() => {
    const anchor = ref<HTMLElement>();
    return () =>
      h('div', { style: { position: 'relative', width: '420px', height: '250px' } }, [
        h('span', { ref: anchor, style: { position: 'absolute', top: '0', left: '0' } }),
        h(Menu, { instant: true, open: open.value, anchor: anchor.value, label: 'View' }, () => [
          h(MenuItem, null, () => 'Refresh'),
          h(
            SubMenu,
            { label: 'Share' },
            {
              icon: () => icon(mdiShareVariant),
              'trailing-icon': () => icon(mdiMenuRight),
              default: () => [
                h(MenuItem, null, () => 'Email'),
                h(MenuItem, null, () => 'Copy link'),
              ],
            },
          ),
          h(
            SubMenu,
            { label: 'Export', disabled: true },
            {
              'trailing-icon': () => icon(mdiMenuRight),
              default: () => [h(MenuItem, null, () => 'PDF')],
            },
          ),
          h(MenuItem, null, () => 'Settings'),
        ]),
      ]);
  });

describe('RioMenu', () => {
  describe.each(SCHEMES)('%s', (scheme) => {
    test('submenu', async () => {
      const open = reactive({ value: false });
      const gallery = await renderGallery(scheme, () => [[h(withSubmenu(open))]]);
      open.value = true;
      const menu = (label: string) =>
        document.querySelector<HTMLElement>(`.rio-menu[aria-label="${label}"]`)!;
      await vi.waitFor(() => expect(menu('View').matches(':popover-open')).toBe(true));
      // A click without a pointer opens it with the focus in, which makes it the active menu.
      [...menu('View').querySelectorAll<HTMLElement>('[aria-haspopup]')][0]!.click();
      await vi.waitFor(() => {
        expect(menu('Share').dataset.side).toBe('end');
        expect(menu('View').hasAttribute('data-inactive')).toBe(true);
      });
      (document.activeElement as HTMLElement | null)?.blur();
      await expect.element(gallery).toMatchScreenshot(`submenu-${scheme}`);
    });

    test.each(MENUS)('%s', async (name, menu) => {
      const open = reactive({ value: false });
      const gallery = await renderGallery(scheme, () => [[h(showcase(menu, open))]]);
      open.value = true;
      const shown = () => document.querySelector<HTMLElement>('[role="menu"]')!;
      await vi.waitFor(() =>
        expect(shown().matches(':popover-open') && shown().dataset.side).toBeTruthy(),
      );
      // Whether the item the menu focused shows a ring depends on the input before it, so the edit
      // menu shows keyboard focus on purpose and the others none.
      if (name === 'edit') {
        await keyboardFocus(shown().querySelectorAll<HTMLElement>('[role="menuitem"]')[1]!);
      } else {
        (document.activeElement as HTMLElement | null)?.blur();
      }
      await expect.element(gallery).toMatchScreenshot(`${name}-${scheme}`);
    });
  });
});
