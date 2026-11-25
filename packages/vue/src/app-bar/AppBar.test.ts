import { mdiArrowLeft, mdiCalendar, mdiDotsVertical } from '@mdi/js';
import { createColorScheme, createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, ref, type VNode } from 'vue';
import Checkbox from '../checkbox/Checkbox.vue';
import IconButton from '../icon-button/IconButton.vue';
import RioIcon from '../icon/Icon.vue';
import Radio from '../radio/Radio.vue';
import Switch from '../switch/Switch.vue';
import TextField from '../text-field/TextField.vue';
import Tooltip from '../tooltip/Tooltip.vue';
import AppBar from './AppBar.vue';

const SOURCE = '#6750a4';
const theme = createThemeVariables({ sourceColor: SOURCE });
const scheme = createColorScheme({ sourceColor: SOURCE });
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

const icon = (path: string) => h(RioIcon, { icon: { type: 'svg', path } });
const back = () => h(IconButton, { label: 'Back', variant: 'standard' }, () => icon(mdiArrowLeft));
const actions = () => [
  h(IconButton, { label: 'Today', variant: 'standard' }, () => icon(mdiCalendar)),
  h(IconButton, { label: 'More', variant: 'standard' }, () => icon(mdiDotsVertical)),
];

const show = async (
  props: Record<string, unknown>,
  slots: Record<string, () => VNode | VNode[]> = {},
) => {
  const screen = await render(
    defineComponent(
      () => () => h('div', { style: { inlineSize: '600px', ...theme } }, [h(AppBar, props, slots)]),
    ),
  );
  const bar = (screen.container as HTMLElement).querySelector<HTMLElement>('.rio-app-bar')!;
  const part = (name: string) => bar.querySelector<HTMLElement>(`.rio-app-bar__${name}`);
  return { screen, bar, part };
};

const box = (el: Element) => el.getBoundingClientRect();

describe('RioAppBar', () => {
  test('a header with the headline as an h1, the subtitle under it', async () => {
    const { screen, bar, part } = await show({ headline: 'Inbox', subtitle: '12 unread' });
    expect(bar.localName).toBe('header');
    await expect.element(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toBeVisible();
    expect(part('subtitle')!.localName).toBe('p');
    expect(part('subtitle')!.textContent).toBe('12 unread');
  });

  test('another heading level; a slot in place of the headline, as a logo', async () => {
    const { screen } = await show(
      { headline: 'Inbox', headingLevel: 2 },
      { headline: () => h('img', { alt: 'Rio Mail', src: 'data:,' }) },
    );
    const heading = screen.getByRole('heading', { level: 2 }).element();
    expect(heading.querySelector('img')).not.toBeNull();
    expect(heading.textContent).toBe('');
  });

  test('renders only the parts it is given', async () => {
    const { part } = await show({});
    expect([part('leading'), part('text'), part('trailing')]).toEqual([null, null, null]);
    const subtitleOnly = await show({ subtitle: 'Drafts' });
    expect(subtitleOnly.part('headline')).toBeNull();
    expect(subtitleOnly.part('subtitle')).not.toBeNull();
  });

  describe('measurements', () => {
    test('small: 64px high, 4px at the ends, the headline 16px in without a leading button', async () => {
      const { bar, part } = await show({ headline: 'Inbox' });
      expect(box(bar).height).toBe(64);
      expect(getComputedStyle(bar).paddingInlineStart).toBe('4px');
      expect(box(part('headline')!).left - box(bar).left).toBe(16);
      expect(getComputedStyle(part('headline')!).fontSize).toBe('22px');
    });

    test('small: buttons in 48px places 4px from the ends, the headline 4px from them', async () => {
      const { bar, part } = await show({ headline: 'Inbox' }, { leading: back, trailing: actions });
      const edge = box(bar);
      const centers = [...bar.querySelectorAll('.rio-icon-button')].map((el) => {
        const r = box(el);
        return r.left + r.width / 2 - edge.left;
      });
      // The spec's drawing: 4 | 48 | 4 | headline | 4 | 48 | 48 | 4
      expect(centers).toEqual([28, edge.width - 76, edge.width - 28]);
      expect(box(part('headline')!).left - edge.left).toBe(56);
      expect(box(part('trailing')!).left - box(part('headline')!).right).toBe(4);
      expect(edge.height).toBe(64);
    });

    test('an icon button in a tooltip takes its 48px place too', async () => {
      const { bar } = await show(
        { headline: 'Inbox' },
        { leading: () => h(Tooltip, { text: 'Back' }, back) },
      );
      const button = box(bar.querySelector('.rio-icon-button')!);
      expect(button.left + button.width / 2 - box(bar).left).toBe(28);
    });

    test.each([
      ['medium-flexible', 112, 136, '28px'],
      ['large-flexible', 120, 152, '36px'],
    ])(
      '%s: %ipx high, %ipx with a subtitle, the headline 12px above the bottom',
      async (variant, height, withSubtitle, size) => {
        const one = await show({ variant, headline: 'Inbox' }, { leading: back });
        expect(box(one.bar).height).toBe(height);
        expect(box(one.bar).bottom - box(one.part('text')!).bottom).toBe(12);
        expect(box(one.part('headline')!).left - box(one.bar).left).toBe(16);
        expect(getComputedStyle(one.part('headline')!).fontSize).toBe(size);
        one.screen.unmount();
        const two = await show({ variant, headline: 'Inbox', subtitle: '12 unread' });
        expect(box(two.bar).height).toBe(withSubtitle);
      },
    );

    test('a flexible headline wraps, and the bar grows with it', async () => {
      const { bar, part } = await show({
        variant: 'medium-flexible',
        headline: 'A headline long enough to need a second line in six hundred pixels',
      });
      expect(box(part('headline')!).height).toBe(72);
      expect(box(bar).height).toBe(112 + 36);
    });

    test('centered: the headline in the middle of the whole bar', async () => {
      const { bar, part } = await show(
        { headline: 'Inbox', align: 'center' },
        { leading: back, trailing: actions },
      );
      const headline = box(part('headline')!);
      const middle = (r: DOMRect) => r.left + r.width / 2;
      expect(middle(headline)).toBeCloseTo(middle(box(bar)), 0);
      expect(getComputedStyle(part('text')!).textAlign).toBe('center');
    });
  });

  describe('colors', () => {
    test('surface, the headline on surface, the subtitle and trailing buttons on surface variant', async () => {
      const { bar, part } = await show(
        { headline: 'Inbox', subtitle: '12 unread' },
        { leading: back, trailing: actions },
      );
      expect(getComputedStyle(bar).backgroundColor).toBe(rgb(scheme.surface));
      expect(getComputedStyle(part('headline')!).color).toBe(rgb(scheme.onSurface));
      expect(getComputedStyle(part('subtitle')!).color).toBe(rgb(scheme.onSurfaceVariant));
      const button = (scope: string) =>
        getComputedStyle(part(scope)!.querySelector('.rio-button')!).color;
      expect(button('leading')).toBe(rgb(scheme.onSurface));
      expect(button('trailing')).toBe(rgb(scheme.onSurfaceVariant));
    });

    test('scrolled, it fills with surface container', async () => {
      const { bar } = await show({ headline: 'Inbox', scrolled: true });
      expect(bar.hasAttribute('data-scrolled')).toBe(true);
      await vi.waitFor(() =>
        expect(getComputedStyle(bar).backgroundColor).toBe(rgb(scheme.surfaceContainer)),
      );
    });
  });

  describe('scrolling', () => {
    const Page = defineComponent(
      (props: { scrolled?: boolean }) => {
        const target = ref<HTMLElement | null>(null);
        return () =>
          h('div', { style: theme }, [
            h(AppBar, { headline: 'Inbox', scrollTarget: target.value, scrolled: props.scrolled }),
            h(
              'div',
              {
                ref: target,
                'data-testid': 'target',
                style: { blockSize: '100px', overflow: 'auto' },
              },
              [h('div', { style: { blockSize: '400px' } })],
            ),
          ]);
      },
      { props: ['scrolled'] },
    );

    const scrollTo = async (target: HTMLElement, top: number) => {
      target.scrollTop = top;
      target.dispatchEvent(new Event('scroll'));
      await nextTick();
    };

    test('follows its scroll target, scrolled from the top or back at it', async () => {
      const screen = await render(Page);
      const bar = (screen.container as HTMLElement).querySelector<HTMLElement>('.rio-app-bar')!;
      const target = screen.getByTestId('target').element() as HTMLElement;
      expect(bar.hasAttribute('data-scrolled')).toBe(false);
      await scrollTo(target, 40);
      await vi.waitFor(() => expect(bar.hasAttribute('data-scrolled')).toBe(true));
      await scrollTo(target, 0);
      await vi.waitFor(() => expect(bar.hasAttribute('data-scrolled')).toBe(false));
    });

    test('scrolled wins over the scroll target', async () => {
      const screen = await render(Page, { props: { scrolled: false } });
      const bar = (screen.container as HTMLElement).querySelector<HTMLElement>('.rio-app-bar')!;
      await scrollTo(screen.getByTestId('target').element() as HTMLElement, 40);
      await nextTick();
      expect(bar.hasAttribute('data-scrolled')).toBe(false);
    });

    test('without a scroll target, the window', async () => {
      const screen = await render(
        defineComponent(
          () => () =>
            h('div', { style: theme }, [
              h(AppBar, { headline: 'Inbox' }),
              h('div', { style: { blockSize: '3000px' } }),
            ]),
        ),
      );
      const bar = (screen.container as HTMLElement).querySelector<HTMLElement>('.rio-app-bar')!;
      window.scrollTo(0, 200);
      await vi.waitFor(() => expect(bar.hasAttribute('data-scrolled')).toBe(true));
      window.scrollTo(0, 0);
      await vi.waitFor(() => expect(bar.hasAttribute('data-scrolled')).toBe(false));
    });

    test("Rio's controls scrolled under a sticky bar stay under it, their inner layers too", async () => {
      // The app's sticky bar, with a z-index, as the docs say; the controls' parts stack at 1 too.
      const screen = await render(
        defineComponent(
          () => () =>
            h('div', { class: 'page', style: { ...theme, blockSize: '300px', overflow: 'auto' } }, [
              h(AppBar, {
                headline: 'Inbox',
                scrolled: true,
                style: 'position: sticky; top: 0; z-index: 1',
              }),
              h('div', { style: 'display: flex; align-items: center; gap: 16px; padding: 8px' }, [
                h(TextField, { label: 'Name', variant: 'outlined', modelValue: '' }),
                h(Checkbox, { 'aria-label': 'Agree' }),
                h(Radio, { 'aria-label': 'One', value: 'one' }),
                h(Switch, { 'aria-label': 'Wi-Fi' }),
              ]),
              h('div', { style: { blockSize: '1000px' } }),
            ]),
        ),
      );
      const root = screen.container as HTMLElement;
      const bar = root.querySelector<HTMLElement>('.rio-app-bar')!;
      // The label and the outline take no presses; let them, to find where they stack.
      const probe = document.head.appendChild(document.createElement('style'));
      probe.textContent =
        '.rio-text-field__label, .rio-text-field__outline { pointer-events: auto }';
      onTestFinished(() => probe.remove());
      root.querySelector<HTMLElement>('.page')!.scrollTop = 40;
      await nextTick();
      const top = bar.getBoundingClientRect().top;
      for (const part of [
        '.rio-text-field__label',
        '.rio-text-field__outline',
        '.rio-checkbox__input',
        '.rio-radio__input',
        '.rio-switch__input',
      ]) {
        const box = root.querySelector(part)!.getBoundingClientRect();
        // A spot of the part's, under the bar
        const x = box.left + box.width / 2;
        const y = Math.max(box.top, top) + 2;
        expect(y, part).toBeLessThan(bar.getBoundingClientRect().bottom);
        expect(bar.contains(document.elementFromPoint(x, y)), part).toBe(true);
      }
    });
  });
});
