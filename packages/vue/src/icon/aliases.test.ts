import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, onMounted, ref, type Component, type VNode } from 'vue';
import { icons as symbols } from '../../../../docs/guide/icons/material-symbols';
import { icons as mdi } from '../../../../docs/guide/icons/mdi';
import FilterChip from '../chip/FilterChip.vue';
import InputChip from '../chip/InputChip.vue';
import DatePicker from '../date-picker/DatePicker.vue';
import DatePickerDialog from '../date-picker/DatePickerDialog.vue';
import DateRangePickerDialog from '../date-picker/DateRangePickerDialog.vue';
import Dialog from '../dialog/Dialog.vue';
import Menu from '../menu/Menu.vue';
import MenuItem from '../menu/MenuItem.vue';
import SubMenu from '../menu/SubMenu.vue';
import { createRio } from '../rio/rio';
import Select from '../select/Select.vue';
import SelectOption from '../select/SelectOption.vue';
import SplitButton from '../split-button/SplitButton.vue';
import TimePickerDialog from '../time-picker/TimePickerDialog.vue';
import TimeScroll from '../time-picker/TimeScroll.vue';
import type { RioIcons } from './icons';

// The icons the docs give for Material Design Icons and Material Symbols, in the components they
// are for: each component draws the alias's icon where its slot gives none.

const theme = createThemeVariables({ sourceColor: '#6750a4' });

const mount = async (icons: RioIcons, content: () => VNode) => {
  const screen = await render(
    defineComponent(() => () => h('div', { style: theme }, [content()])),
    { global: { plugins: [createRio({ icons })] } },
  );
  return screen.container as HTMLElement;
};

/** The aliases of the icons drawn in an element, told by their paths or their ligatures */
const drawn = (icons: RioIcons, in_: Element) =>
  [...in_.querySelectorAll('.rio-icon')].map((icon) => {
    const d = icon.querySelector('path')?.getAttribute('d');
    const ligature = icon.firstElementChild?.getAttribute('data-ligature');
    return Object.entries(icons.aliases!).find(([, value]) =>
      typeof value === 'string' ? value === ligature : (value as { path: string }).path === d,
    )?.[0];
  });

/** What the icons drawn in an element are: their paths, or their ligatures */
const drawnValues = (in_: Element) =>
  [...in_.querySelectorAll('.rio-icon')].map(
    (icon) =>
      icon.querySelector('path')?.getAttribute('d') ??
      icon.firstElementChild?.getAttribute('data-ligature'),
  );

/** The path or the ligature registered for an alias */
const valueOf = (icons: RioIcons, alias: string) => {
  const value = icons.aliases![alias as keyof typeof icons.aliases];
  return typeof value === 'string' ? value : (value as { path: string }).path;
};

/** A dialog that opens once it is in the page, as a dialog the app opens does */
const opened = (dialog: Component, props: Record<string, unknown>) =>
  defineComponent(() => {
    const open = ref(false);
    onMounted(() => (open.value = true));
    return () =>
      h(dialog, {
        ...props,
        open: open.value,
        'onUpdate:open': (next: boolean) => (open.value = next),
      });
  });

const DateDialog = opened(DatePickerDialog, { locale: 'en-US', modelValue: '2026-11-27' });
const RangeDialog = opened(DateRangePickerDialog, { locale: 'en-US' });
const TimeDialog = opened(TimePickerDialog, { locale: 'en-US', modelValue: '07:30' });
const FullScreenDialog = opened(Dialog, { variant: 'full-screen', headline: 'New event' });

/** A menu, open, with a submenu */
const WithSubmenu = defineComponent(() => {
  const anchor = ref<HTMLElement>();
  return () =>
    h('div', [
      h('span', { ref: anchor }),
      h(Menu, { instant: true, open: true, anchor: anchor.value, label: 'View' }, () => [
        h(SubMenu, { label: 'Share' }, () => [h(MenuItem, null, () => 'Email')]),
      ]),
    ]);
});

const cases: [string, () => VNode, string, string[]][] = [
  [
    'a select’s arrow',
    () => h(Select, { label: 'Size' }, () => [h(SelectOption, { value: 'a' }, () => 'A')]),
    '.rio-select__arrow',
    ['dropdown'],
  ],
  [
    'a menu chip’s arrow',
    () => h(FilterChip, { menu: true }, () => 'Sort'),
    '.rio-chip__trailing',
    ['dropdown'],
  ],
  [
    'a selected filter chip’s checkmark',
    () => h(FilterChip, { selected: true }, () => 'Shoes'),
    '.rio-chip__icon',
    ['check'],
  ],
  [
    'an input chip’s remove button',
    () => h(InputChip, null, () => 'Ann'),
    '.rio-chip__remove-icon',
    ['remove'],
  ],
  [
    'a date picker’s calendar button',
    () => h(DatePicker, { label: 'Date', locale: 'en-US' }),
    '.rio-text-field__trailing-icon',
    ['calendar'],
  ],
  [
    'a split button’s menu button',
    () => h(SplitButton, { menuLabel: 'More' }, () => 'Save'),
    '.rio-split-button__menu-icon',
    ['menu'],
  ],
  [
    'the time picker’s switch to the text input',
    () => h(TimeScroll, { locale: 'en-US', modelValue: '07:00' }),
    '.rio-time-picker__toggle',
    ['keyboard'],
  ],
];

describe.each([
  ['Material Design Icons', mdi],
  ['Material Symbols', symbols],
])('%s, from the docs', (_, icons) => {
  test.each(cases)('%s', async (_name, content, place, aliases) => {
    const container = await mount(icons, content);
    await vi.waitFor(() => expect(container.querySelector(place)).not.toBeNull());
    expect(drawn(icons, container.querySelector(place)!)).toEqual(aliases);
  });

  test('a date picker dialog’s months, lists, and switch to the text input', async () => {
    const container = await mount(icons, () => h(DateDialog));
    const dialog = () => container.querySelector('dialog')!;
    await vi.waitFor(() => expect(dialog().open).toBe(true));
    expect(new Set(drawn(icons, dialog()))).toEqual(
      new Set(['previous', 'next', 'dropdown', 'edit']),
    );
  });

  test('a date range picker’s switch to the text input', async () => {
    const container = await mount(icons, () => h(RangeDialog));
    const dialog = () => container.querySelector('dialog')!;
    await vi.waitFor(() => expect(dialog().open).toBe(true));
    expect(drawn(icons, dialog())).toEqual(['edit']);
  });

  test('a time picker dialog’s switch to the text input', async () => {
    const container = await mount(icons, () => h(TimeDialog));
    const dialog = () => container.querySelector('dialog')!;
    await vi.waitFor(() => expect(dialog().open).toBe(true));
    expect(drawn(icons, dialog())).toEqual(['keyboard']);
  });

  test('a full-screen dialog’s close button', async () => {
    const container = await mount(icons, () => h(FullScreenDialog));
    const dismiss = () => container.querySelector('.rio-dialog__dismiss');
    await vi.waitFor(() => expect(dismiss()).not.toBeNull());
    // `close` is the same icon as `remove`, so it is told by its value.
    expect(drawnValues(dismiss()!)).toEqual([valueOf(icons, 'close')]);
  });

  test('an item’s arrow to its submenu', async () => {
    const container = await mount(icons, () => h(WithSubmenu));
    await vi.waitFor(() =>
      expect(container.querySelector('.rio-menu-item__trailing-icon')).not.toBeNull(),
    );
    expect(drawn(icons, container.querySelector('.rio-menu-item__trailing-icon')!)).toEqual([
      'submenu',
    ]);
  });
});

describe('right to left', () => {
  test('the date picker’s month arrows are mirrored, its switch to the text input isn’t', async () => {
    const container = await mount(mdi, () => h('div', { dir: 'rtl' }, [h(DateDialog)]));
    const dialog = () => container.querySelector('dialog')!;
    await vi.waitFor(() => expect(dialog().open).toBe(true));
    const scale = (alias: 'previous' | 'next' | 'edit') => {
      const path = (mdi.aliases![alias] as { path: string }).path;
      const icon = [...dialog().querySelectorAll('.rio-icon')].find(
        (el) => el.querySelector('path')?.getAttribute('d') === path,
      )!;
      return getComputedStyle(icon).scale;
    };
    expect([scale('previous'), scale('next'), scale('edit')]).toEqual(['-1 1', '-1 1', 'none']);
  });
});

describe('the app’s slot wins', () => {
  test('over the registered icon', async () => {
    const container = await mount(mdi, () =>
      h(
        Select,
        { label: 'Size' },
        {
          default: () => [h(SelectOption, { value: 'a' }, () => 'A')],
          'dropdown-icon': () => h('i', { class: 'mine' }),
        },
      ),
    );
    const arrow = container.querySelector('.rio-select__arrow')!;
    expect(arrow.querySelector('.mine')).not.toBeNull();
    expect(arrow.querySelector('.rio-icon')).toBeNull();
  });
});

describe('an icon font’s glyph fills the place it sits in', () => {
  test('24px in a select’s arrow, 18px in a date picker’s list button', async () => {
    const select = await mount(symbols, () =>
      h(Select, { label: 'Size' }, () => [h(SelectOption, { value: 'a' }, () => 'A')]),
    );
    const glyph = select.querySelector('.rio-select__arrow .rio-icon > *')!;
    expect(getComputedStyle(glyph).fontSize).toBe('24px');
    const picker = await mount(symbols, () => h(DateDialog));
    await vi.waitFor(() => expect(picker.querySelector('dialog')!.open).toBe(true));
    const list = picker.querySelector('.rio-date-picker__dropdown-icon')!;
    expect(getComputedStyle(list.querySelector('.rio-icon > *')!).fontSize).toBe(
      `${list.getBoundingClientRect().height}px`,
    );
  });
});
