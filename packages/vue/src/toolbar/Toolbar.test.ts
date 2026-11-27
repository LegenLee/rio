import { mdiFormatBold, mdiFormatItalic, mdiFormatUnderline } from '@mdi/js';
import type { ToolbarProps } from '@rio-m3e/core';
import { createColorScheme, createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, type VNode } from 'vue';
import IconButton from '../icon-button/IconButton.vue';
import RioIcon from '../icon/Icon.vue';
import Toolbar from './Toolbar.vue';

const SOURCE = '#6750a4';
const theme = createThemeVariables({ sourceColor: SOURCE });
const scheme = createColorScheme({ sourceColor: SOURCE });
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

const icon = (path: string) => h(RioIcon, { icon: { type: 'svg', path } });
const formatting = () => [
  h(IconButton, { label: 'Bold' }, () => icon(mdiFormatBold)),
  h(IconButton, { label: 'Italic' }, () => icon(mdiFormatItalic)),
  h(IconButton, { label: 'Underline' }, () => icon(mdiFormatUnderline)),
];

const setup = async (
  props: ToolbarProps & Record<string, unknown> = {},
  items: () => VNode[] = formatting,
  dir = 'ltr',
) => {
  const screen = await render(
    defineComponent(
      () => () =>
        h('div', { dir, style: { padding: '24px', ...theme } }, [
          h('button', null, 'Before'),
          h(Toolbar, { 'aria-label': 'Formatting', ...props }, items),
          h('button', null, 'After'),
        ]),
    ),
  );
  const toolbar = screen.getByRole('toolbar', { name: 'Formatting' }).element() as HTMLElement;
  const named = (name: string) => screen.getByRole('button', { name }).element() as HTMLElement;
  return { screen, toolbar, named };
};

const focused = () => (document.activeElement as HTMLElement | null)?.getAttribute('aria-label');

describe('RioToolbar', () => {
  test('a toolbar, named by the app, with every item in the tab order', async () => {
    const { named } = await setup();
    named('Before').focus();
    await userEvent.tab();
    expect(focused()).toBe('Bold');
    await userEvent.tab();
    expect(focused()).toBe('Italic');
    await userEvent.tab();
    expect(focused()).toBe('Underline');
    await userEvent.tab();
    expect(document.activeElement).toBe(named('After'));
  });

  test('the arrows move along it and wrap around, Home and End go to the ends', async () => {
    const { named } = await setup();
    named('Bold').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Italic');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(focused()).toBe('Bold');
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()).toBe('Underline');
    await userEvent.keyboard('{Home}');
    expect(focused()).toBe('Bold');
    await userEvent.keyboard('{End}');
    expect(focused()).toBe('Underline');
    // Up and down belong to a vertical toolbar
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()).toBe('Underline');
  });

  test('right to left, left goes forward', async () => {
    const { named } = await setup({}, formatting, 'rtl');
    named('Bold').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()).toBe('Italic');
  });

  test('a vertical floating toolbar says so, and takes up and down', async () => {
    const { toolbar, named } = await setup({ type: 'floating', orientation: 'vertical' });
    expect(toolbar.getAttribute('aria-orientation')).toBe('vertical');
    named('Bold').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()).toBe('Italic');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(focused()).toBe('Underline');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Underline');
  });

  test('passes over items that are disabled, hidden, or in an overlay open inside it', async () => {
    const { named } = await setup({}, () => [
      h(IconButton, { label: 'Bold' }, () => icon(mdiFormatBold)),
      h(IconButton, { label: 'Italic', disabled: true }, () => icon(mdiFormatItalic)),
      h('button', { 'aria-label': 'Hidden', hidden: true }),
      h('button', { 'aria-label': 'Invisible', style: { visibility: 'hidden' } }),
      h('div', { popover: 'manual', 'data-testid': 'popover' }, [
        h('button', { 'aria-label': 'Inside' }),
      ]),
      h(IconButton, { label: 'Underline' }, () => icon(mdiFormatUnderline)),
    ]);
    (document.querySelector('[data-testid="popover"]') as HTMLElement).showPopover();
    named('Bold').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Underline');
  });

  test('leaves the keys of a text field, and keys an item already used, to the item', async () => {
    const { named } = await setup({}, () => [
      h(IconButton, { label: 'Bold' }, () => icon(mdiFormatBold)),
      h('input', { 'aria-label': 'Find', value: 'abc' }),
      h('button', {
        'aria-label': 'Own',
        onKeydown: (event: KeyboardEvent) => event.preventDefault(),
      }),
      h(IconButton, { label: 'Underline' }, () => icon(mdiFormatUnderline)),
    ]);
    const find = document.querySelector<HTMLInputElement>('input[aria-label="Find"]')!;
    find.focus();
    await userEvent.keyboard('{ArrowLeft}{Home}');
    expect(document.activeElement).toBe(find);
    named('Own').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Own');
  });

  test('a radio group is one item, and its arrows check the radio buttons', async () => {
    const radio = (value: string, checked = false) =>
      h('input', { type: 'radio', name: 'align', value, 'aria-label': value, checked });
    const { named } = await setup({}, () => [
      h(IconButton, { label: 'Bold' }, () => icon(mdiFormatBold)),
      radio('Left', true),
      radio('Center'),
      h(IconButton, { label: 'Underline' }, () => icon(mdiFormatUnderline)),
    ]);
    const radios = [...document.querySelectorAll<HTMLInputElement>('input[name="align"]')];
    named('Bold').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(radios[0]);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(radios[1]);
    expect(radios[1]!.checked).toBe(true);
    await userEvent.keyboard('{End}');
    expect(focused()).toBe('Underline');
  });

  test('Home and End work from any radio button of a group with none checked', async () => {
    const radio = (value: string) =>
      h('input', { type: 'radio', name: 'size', value, 'aria-label': value });
    await setup({}, () => [
      h(IconButton, { label: 'Bold' }, () => icon(mdiFormatBold)),
      radio('Small'),
      radio('Large'),
      h(IconButton, { label: 'Underline' }, () => icon(mdiFormatUnderline)),
    ]);
    // The group's last radio button, as Shift+Tab can bring the focus to it
    document.querySelector<HTMLInputElement>('input[value="Large"]')!.focus();
    await userEvent.keyboard('{Home}');
    expect(focused()).toBe('Bold');
    document.querySelector<HTMLInputElement>('input[value="Large"]')!.focus();
    await userEvent.keyboard('{End}');
    expect(focused()).toBe('Underline');
  });

  describe('measurements', () => {
    test('docked: 64px high, 16px at the ends, no shadow, its items gathered 32px apart', async () => {
      const { toolbar } = await setup();
      const style = getComputedStyle(toolbar);
      expect(toolbar.getBoundingClientRect().height).toBe(64);
      expect([style.paddingInlineStart, style.paddingInlineEnd]).toEqual(['16px', '16px']);
      expect([style.justifyContent, style.columnGap]).toEqual(['center', '32px']);
      expect([style.borderRadius, style.boxShadow]).toEqual(['0px', 'none']);
      expect(style.backgroundColor).toBe(rgb(scheme.surfaceContainer));
    });

    test('docked, in a compact window: its items spread across it, at least 4px apart', async () => {
      await page.viewport(400, 720);
      try {
        const { toolbar } = await setup();
        const style = getComputedStyle(toolbar);
        expect([style.justifyContent, style.columnGap]).toEqual(['space-between', '4px']);
      } finally {
        await page.viewport(1280, 720);
      }
    });

    test('floating: as large as its items, 8px around them, 4px between, round, a shadow', async () => {
      const { toolbar, named } = await setup({ type: 'floating' });
      const style = getComputedStyle(toolbar);
      const box = toolbar.getBoundingClientRect();
      expect(box.height).toBe(64);
      expect(style.padding).toBe('8px');
      expect(style.columnGap).toBe('4px');
      expect(style.borderRadius).not.toBe('0px');
      expect(style.boxShadow).not.toBe('none');
      const items = ['Bold', 'Underline'].map((name) => named(name).getBoundingClientRect());
      expect(items[0]!.left - box.left).toBe(8);
      expect(box.right - items[1]!.right).toBe(8);
    });

    test('flat takes the shadow off; vertical is 64px wide', async () => {
      const flat = await setup({ type: 'floating', flat: true });
      expect(getComputedStyle(flat.toolbar).boxShadow).toBe('none');
      flat.screen.unmount();
      const vertical = await setup({ type: 'floating', orientation: 'vertical' });
      expect(vertical.toolbar.getBoundingClientRect().width).toBe(64);
      expect(getComputedStyle(vertical.toolbar).flexDirection).toBe('column');
    });
  });

  describe('colors', () => {
    const toggles = () => [
      h(IconButton, { label: 'Bold', variant: 'standard' }, () => icon(mdiFormatBold)),
      h(IconButton, { label: 'Italic', variant: 'tonal', toggle: true }, () =>
        icon(mdiFormatItalic),
      ),
      h(IconButton, { label: 'Underline', variant: 'tonal', toggle: true, selected: true }, () =>
        icon(mdiFormatUnderline),
      ),
    ];
    const colors = (el: HTMLElement) => {
      const style = getComputedStyle(el);
      return [style.backgroundColor, style.color];
    };

    test('standard: a tonal toggle is the toolbar’s color until selected', async () => {
      const { toolbar, named } = await setup({ type: 'floating' }, toggles);
      expect(colors(toolbar)).toEqual([rgb(scheme.surfaceContainer), rgb(scheme.onSurfaceVariant)]);
      expect(getComputedStyle(named('Bold')).color).toBe(rgb(scheme.onSurfaceVariant));
      expect(colors(named('Italic'))).toEqual([
        rgb(scheme.surfaceContainer),
        rgb(scheme.onSurfaceVariant),
      ]);
      expect(colors(named('Underline'))).toEqual([
        rgb(scheme.secondaryContainer),
        rgb(scheme.onSecondaryContainer),
      ]);
    });

    test('vibrant: primary container, and the buttons follow it', async () => {
      const { toolbar, named } = await setup({ type: 'floating', variant: 'vibrant' }, toggles);
      expect(colors(toolbar)).toEqual([
        rgb(scheme.primaryContainer),
        rgb(scheme.onPrimaryContainer),
      ]);
      expect(getComputedStyle(named('Bold')).color).toBe(rgb(scheme.onPrimaryContainer));
      expect(colors(named('Italic'))).toEqual([
        rgb(scheme.primaryContainer),
        rgb(scheme.onPrimaryContainer),
      ]);
      expect(colors(named('Underline'))).toEqual([
        rgb(scheme.surfaceContainer),
        rgb(scheme.onSurface),
      ]);
    });

    test('buttons in an overlay open inside it keep their own colors', async () => {
      const { named } = await setup({ variant: 'vibrant' }, () => [
        h('div', { popover: 'manual', 'data-testid': 'popover' }, [
          h(IconButton, { label: 'Inside', variant: 'standard' }, () => icon(mdiFormatBold)),
        ]),
      ]);
      (document.querySelector('[data-testid="popover"]') as HTMLElement).showPopover();
      expect(getComputedStyle(named('Inside')).color).toBe(rgb(scheme.onSurfaceVariant));
    });
  });
});
