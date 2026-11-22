import { mdiCheck, mdiChevronLeft, mdiClockOutline, mdiHome, mdiMenuRight } from '@mdi/js';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, type VNode } from 'vue';
import { createRio } from '../rio/rio';
import Icon from './Icon.vue';
import type { RioIcons } from './icons';

const show = async (icon: () => VNode, icons?: RioIcons) => {
  const screen = await render(
    defineComponent(() => () => h('div', { style: { color: 'rgb(0, 128, 0)' } }, [icon()])),
    { global: { plugins: [createRio({ icons })] } },
  );
  return (screen.container as HTMLElement).querySelector<HTMLElement>('.rio-icon');
};

const symbols = (name: string) =>
  ({ type: 'ligature', name, className: 'material-symbols-outlined' }) as const;

describe('RioIcon', () => {
  test('SVG paths: 24px in the text’s color, hidden from assistive technology', async () => {
    const svg = (await show(() => h(Icon, { icon: { type: 'svg', path: mdiCheck } })))!;
    expect(svg.localName).toBe('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('path')!.getAttribute('d')).toBe(mdiCheck);
    const box = svg.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([24, 24]);
    expect(getComputedStyle(svg).fill).toBe('rgb(0, 128, 0)');
  });

  test('an icon font’s ligature: its name drawn, not in the page’s text, as tall as the box', async () => {
    const span = (await show(() =>
      h('span', { style: { '--rio-icon-size': '18px' } }, [h(Icon, { icon: symbols('home') })]),
    ))!;
    const glyph = span.firstElementChild as HTMLElement;
    expect([span.localName, span.getAttribute('aria-hidden')]).toEqual(['span', 'true']);
    expect(glyph.className).toBe('material-symbols-outlined');
    expect(glyph.textContent).toBe('');
    expect(getComputedStyle(glyph, '::before').content).toBe('"home"');
    expect(span.getBoundingClientRect().height).toBe(18);
    expect(getComputedStyle(glyph).fontSize).toBe('18px');
  });

  test('an icon font’s class, which its stylesheet draws', async () => {
    const span = (await show(() =>
      h(Icon, { icon: { type: 'class', className: 'mdi mdi-home' } }),
    ))!;
    expect(span.firstElementChild!.className).toBe('mdi mdi-home');
    expect(span.firstElementChild!.hasAttribute('data-ligature')).toBe(false);
  });

  test('a component, as from an icon library', async () => {
    const Home = defineComponent(
      () => () => h('svg', { viewBox: '0 0 24 24' }, [h('path', { d: mdiHome })]),
    );
    const svg = (await show(() => h(Icon, { icon: Home })))!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('path')!.getAttribute('d')).toBe(mdiHome);
    expect(svg.getBoundingClientRect().width).toBe(24);
  });

  test('a name through the app’s resolve, and an alias the app gave', async () => {
    const icons: RioIcons = {
      aliases: { check: { type: 'svg', path: mdiCheck }, dropdown: 'arrow_drop_down' },
      resolve: symbols,
    };
    const named = (await show(() => h(Icon, { icon: 'home' }), icons))!;
    expect(named.firstElementChild!.getAttribute('data-ligature')).toBe('home');
    const check = (await show(() => h(Icon, { alias: 'check' }), icons))!;
    expect(check.querySelector('path')!.getAttribute('d')).toBe(mdiCheck);
    const dropdown = (await show(() => h(Icon, { alias: 'dropdown' }), icons))!;
    expect(dropdown.firstElementChild!.getAttribute('data-ligature')).toBe('arrow_drop_down');
  });

  test('right to left, an alias pointing along the line is mirrored, and nothing else', async () => {
    const svg = (path: string) => ({ type: 'svg', path }) as const;
    const icons: RioIcons = {
      aliases: {
        previous: svg(mdiChevronLeft),
        submenu: svg(mdiMenuRight),
        clock: svg(mdiClockOutline),
      },
    };
    const scales = async (dir: string) => {
      const screen = await render(
        defineComponent(
          () => () =>
            h('div', { dir }, [
              h(Icon, { alias: 'previous' }),
              h(Icon, { alias: 'submenu' }),
              h(Icon, { alias: 'clock' }),
              h(Icon, { icon: svg(mdiChevronLeft) }),
            ]),
        ),
        { global: { plugins: [createRio({ icons })] } },
      );
      const drawn = (screen.container as HTMLElement).querySelectorAll('.rio-icon');
      const out = [...drawn].map((icon) => getComputedStyle(icon).scale);
      screen.unmount();
      return out;
    };
    expect(await scales('rtl')).toEqual(['-1 1', '-1 1', 'none', 'none']);
    expect(await scales('ltr')).toEqual(['none', 'none', 'none', 'none']);
  });

  test('without an icon for it, nothing', async () => {
    expect(await show(() => h(Icon, { alias: 'menu' }), { aliases: {} })).toBeNull();
    expect(await show(() => h(Icon, { alias: 'menu' }))).toBeNull();
    expect(await show(() => h(Icon, { icon: 'home' }))).toBeNull();
  });
});
