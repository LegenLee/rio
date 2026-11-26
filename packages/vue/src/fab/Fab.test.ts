import { mdiPencilOutline } from '@mdi/js';
import type { FabProps } from '@rio-m3e/core';
import { attachTheme } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, reactive } from 'vue';
import RioIcon from '../icon/Icon.vue';
import Fab from './Fab.vue';

const withTheme = () => {
  const theme = attachTheme(document.documentElement, {
    sourceColor: '#6750a4',
    colorScheme: false,
  });
  onTestFinished(() => theme.detach());
};

/** What a custom property computes to as a color or a shadow, from an element of its own */
const computed = (property: 'color' | 'boxShadow', value: string) => {
  const probe = document.body.appendChild(document.createElement('span'));
  probe.style[property] = value;
  const result = getComputedStyle(probe)[property];
  probe.remove();
  return result;
};

/** A FAB whose props the app keeps, with a pencil icon unless `icon` is false */
const setup = async (props: Record<string, unknown> = {}, { icon = true, dir = 'ltr' } = {}) => {
  const state = reactive<Record<string, unknown>>({ label: 'Compose', ...props });
  const clicks: MouseEvent[] = [];
  const screen = await render(
    defineComponent(
      () => () =>
        h('div', { dir }, [
          h(
            Fab,
            {
              ...(state as unknown as FabProps),
              onClick: (event: MouseEvent) => void clicks.push(event),
            },
            icon ? () => h(RioIcon, { icon: { type: 'svg', path: mdiPencilOutline } }) : undefined,
          ),
        ]),
    ),
  );
  const root = screen.container.querySelector<HTMLElement>('.rio-fab')!;
  const part = (name: string) => root.querySelector<HTMLElement>(`.rio-fab__${name}`);
  /** A part's start and end, in px from the FAB's left */
  const span = (name: string) => {
    const box = part(name)!.getBoundingClientRect();
    const rect = root.getBoundingClientRect();
    return [box.left - rect.left, box.right - rect.left];
  };
  return { screen, state, root, part, span, clicks };
};

describe('RioFab', () => {
  test('a button named by its label, reporting clicks; the icon and the label are hidden from assistive technology', async () => {
    const { screen, root, part, clicks } = await setup({ extended: true });
    const button = screen.getByRole('button', { name: 'Compose' });
    await expect.element(button).toBeVisible();
    expect(root.getAttribute('type')).toBe('button');
    expect(part('icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(part('label')!.getAttribute('aria-hidden')).toBe('true');
    await button.click();
    expect(clicks).toHaveLength(1);
  });

  test.each([
    ['small', 56, 24, '16px'],
    ['medium', 80, 28, '20px'],
    ['large', 96, 36, '28px'],
  ])(
    '%s: a %ipx square with a %ipx icon in the middle, its corners %s',
    async (size, side, icon, corner) => {
      withTheme();
      const { root, span } = await setup({ size });
      const box = root.getBoundingClientRect();
      expect([box.width, box.height]).toEqual([side, side]);
      expect(span('icon')).toEqual([(side - icon) / 2, (side + icon) / 2]);
      expect(getComputedStyle(root).borderTopLeftRadius).toBe(corner);
      // The label's room takes no width.
      expect(span('label')[1]! - span('label')[0]!).toBe(0);
    },
  );

  test.each([
    // Size, the space at either end, the icon, the space after it, and the label's type style
    ['small', 16, 24, 8, '16px', '500'],
    ['medium', 26, 28, 12, '22px', '400'],
    ['large', 28, 36, 16, '24px', '400'],
  ])(
    '%s, extended: %ipx at either end, a %ipx icon, %ipx to the label',
    async (size, end, icon, gap, font, weight) => {
      withTheme();
      const { root, span } = await setup({ size, extended: true });
      await vi.waitFor(() => expect(span('label')[0]).toBe(end + icon + gap));
      expect(span('icon')[0]).toBe(end);
      expect(root.getBoundingClientRect().width).toBeCloseTo(span('label')[1]! + end, 1);
      const style = getComputedStyle(root);
      expect([style.fontSize, style.fontWeight]).toEqual([font, weight]);
    },
  );

  test('without an icon, the label shows, whatever `extended` says', async () => {
    const { root, span, part } = await setup({}, { icon: false });
    expect(part('icon')).toBeNull();
    expect(root.hasAttribute('data-extended')).toBe(true);
    expect(span('label')[0]).toBe(16);
  });

  test('turned off, it shrinks back to its icon; turned on, it grows to the label again', async () => {
    // The motion comes from the theme.
    withTheme();
    const { root, state, part } = await setup({ extended: true });
    await vi.waitFor(() => expect(root.getBoundingClientRect().width).toBeGreaterThan(100));
    const wide = root.getBoundingClientRect().width;
    state.extended = false;
    await nextTick();
    // It moves there rather than jumping: the label's room narrows and the label fades.
    const moving = root
      .getAnimations({ subtree: true })
      .map((animation) => (animation as CSSTransition).transitionProperty);
    expect(moving).toEqual(expect.arrayContaining(['grid-template-columns', 'opacity']));
    await vi.waitFor(() => expect(root.getBoundingClientRect().width).toBe(56));
    await vi.waitFor(() => expect(getComputedStyle(part('label')!).opacity).toBe('0'));
    state.extended = true;
    await vi.waitFor(() => expect(root.getBoundingClientRect().width).toBeCloseTo(wide, 0));
  });

  test('right to left, the icon leads from the right', async () => {
    const { span } = await setup({ extended: true }, { dir: 'rtl' });
    await vi.waitFor(() => expect(span('label')[1]! < span('icon')[0]!).toBe(true));
  });

  test.each([
    ['primary-container', 'primary-container', 'on-primary-container'],
    ['secondary-container', 'secondary-container', 'on-secondary-container'],
    ['tertiary-container', 'tertiary-container', 'on-tertiary-container'],
    ['primary', 'primary', 'on-primary'],
    ['secondary', 'secondary', 'on-secondary'],
    ['tertiary', 'tertiary', 'on-tertiary'],
  ])('%s: on %s, in %s', async (color, container, content) => {
    withTheme();
    const { root } = await setup({ color });
    const style = getComputedStyle(root);
    expect(style.backgroundColor).toBe(computed('color', `var(--rio-color-${container})`));
    expect(style.color).toBe(computed('color', `var(--rio-color-${content})`));
  });

  test('rests at level 3, and rises to level 4 on hover', async () => {
    withTheme();
    const { root } = await setup();
    expect(getComputedStyle(root).boxShadow).toBe(
      computed('boxShadow', 'var(--rio-elevation-level3)'),
    );
    await userEvent.hover(root);
    await vi.waitFor(() =>
      expect(getComputedStyle(root).boxShadow).toBe(
        computed('boxShadow', 'var(--rio-elevation-level4)'),
      ),
    );
  });

  test('with `href`, a link named by its label, without `type`', async () => {
    const { screen, root } = await setup({ href: '/compose', type: 'submit' });
    await expect.element(screen.getByRole('link', { name: 'Compose' })).toBeVisible();
    expect(root.getAttribute('href')).toBe('/compose');
    expect(root.hasAttribute('type')).toBe(false);
  });
});
