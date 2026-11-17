import type { AnchorPoint, MenuAnchorPoint, MenuProps, MenuSelected } from '@rio-m3e/core';
import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  reactive,
  ref,
  type Component,
  type VNode,
} from 'vue';
import Button from '../button/Button.vue';
import Menu from './Menu.vue';
import MenuDivider from './MenuDivider.vue';
import MenuGroup from './MenuGroup.vue';
import MenuItem from './MenuItem.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

interface Setup {
  props?: Omit<MenuProps, 'open' | 'selected'> & { anchor?: AnchorPoint };
  selected?: MenuSelected;
  items?: () => VNode[];
}

/**
 * A trigger button, a button after it, and a menu the trigger opens, as an app would write them.
 * `state` holds what the app keeps: whether the menu is open, and the selection.
 */
const setup = async ({ props = {}, selected, items = () => plainItems() }: Setup = {}) => {
  const state = reactive({ open: false, selected });
  const trigger = ref<HTMLElement>();
  const screen = await render(
    defineComponent(
      () => () =>
        h('div', { style: { padding: '40px', ...theme } }, [
          h(
            'button',
            {
              ref: trigger,
              'aria-haspopup': 'menu',
              'aria-expanded': String(state.open),
              onClick: () => (state.open = !state.open),
            },
            'Open',
          ),
          h('button', null, 'After'),
          h(
            Menu,
            {
              label: 'Actions',
              anchor: trigger.value,
              ...props,
              open: state.open,
              'onUpdate:open': (next: boolean) => (state.open = next),
              modelValue: state.selected,
              'onUpdate:modelValue': (next: MenuSelected) => (state.selected = next),
            },
            items,
          ),
        ]),
    ),
  );
  const menu = () => screen.container.ownerDocument.querySelector<HTMLElement>('[role="menu"]')!;
  const isOpen = () => menu().matches(':popover-open');
  const opened = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await vi.waitFor(() => expect(isOpen()).toBe(true));
  };
  return { screen, state, menu, isOpen, opened, trigger: () => trigger.value! };
};

const clicks: string[] = [];
const plainItems = () => [
  h(MenuItem, { onClick: () => clicks.push('cut') }, () => 'Cut'),
  h(MenuItem, { onClick: () => clicks.push('copy') }, () => 'Copy'),
  h(MenuItem, { disabled: true, onClick: () => clicks.push('paste') }, () => 'Paste'),
  h(MenuItem, { onClick: () => clicks.push('delete') }, () => 'Delete'),
];
const focusedText = () => document.activeElement?.textContent?.trim();
const rect = (element: Element) => element.getBoundingClientRect();
/**
 * Where the opacity of a menu's running fade starts: 0 for the opening motion from the start, more
 * for a closing turned back, and undefined with no fade running.
 */
const fadeFrom = (menu: HTMLElement) => {
  const fade = menu
    .getAnimations()
    .find(
      (animation): animation is CSSTransition =>
        animation instanceof CSSTransition && animation.transitionProperty === 'opacity',
    );
  const from = (fade?.effect as KeyframeEffect | undefined)?.getKeyframes()[0];
  return from && Number(from.opacity);
};

describe('RioMenu', () => {
  test('opens next to its anchor, named, with the focus on the first item', async () => {
    const { screen, opened, menu, trigger } = await setup();
    await opened();
    await expect.element(screen.getByRole('menu', { name: 'Actions' })).toBeVisible();
    expect(focusedText()).toBe('Cut');
    expect(rect(menu()).top).toBeCloseTo(rect(trigger()).bottom, 0);
    expect(rect(menu()).left).toBeCloseTo(rect(trigger()).left, 0);
    expect(menu().dataset.side).toBe('bottom');
  });

  test('Escape closes it and gives the focus back to the anchor', async () => {
    const { state, opened, isOpen } = await setup();
    await opened();
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(isOpen()).toBe(false));
    expect(state.open).toBe(false);
    expect(focusedText()).toBe('Open');
  });

  test('choosing an item runs it, closes the menu, and gives the focus back', async () => {
    clicks.length = 0;
    const { screen, state, opened } = await setup();
    await opened();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(clicks).toEqual(['copy']);
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect(focusedText()).toBe('Open');
  });

  test('a disabled item takes the focus but does nothing', async () => {
    clicks.length = 0;
    const { state, opened } = await setup();
    await opened();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(focusedText()).toBe('Paste');
    expect(document.activeElement!.getAttribute('aria-disabled')).toBe('true');
    await userEvent.keyboard('{Enter}');
    expect(clicks).toEqual([]);
    expect(state.open).toBe(true);
  });

  test('arrow keys wrap around, Home and End go to the ends, and letters jump', async () => {
    const { opened } = await setup();
    await opened();
    await userEvent.keyboard('{ArrowUp}');
    expect(focusedText()).toBe('Delete');
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedText()).toBe('Cut');
    await userEvent.keyboard('{End}');
    expect(focusedText()).toBe('Delete');
    await userEvent.keyboard('{Home}');
    expect(focusedText()).toBe('Cut');
    await userEvent.keyboard('p');
    expect(focusedText()).toBe('Paste');
    // A new search after a pause; repeating a letter cycles through the items starting with it
    await new Promise((resolve) => setTimeout(resolve, 600));
    await userEvent.keyboard('c');
    expect(focusedText()).toBe('Cut');
    await userEvent.keyboard('c');
    expect(focusedText()).toBe('Copy');
  });

  test('after a pause in typing, Space presses the item the letters moved to', async () => {
    clicks.length = 0;
    const { state, opened } = await setup();
    await opened();
    await userEvent.keyboard('d');
    expect(focusedText()).toBe('Delete');
    await new Promise((resolve) => setTimeout(resolve, 600));
    await userEvent.keyboard(' ');
    expect(clicks).toEqual(['delete']);
    await vi.waitFor(() => expect(state.open).toBe(false));
  });

  test('Tab closes it and moves on from the anchor', async () => {
    const { state, opened } = await setup();
    await opened();
    await userEvent.keyboard('{Tab}');
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect(focusedText()).toBe('After');
  });

  test('a click outside closes it', async () => {
    const { screen, state, opened, isOpen } = await setup();
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'After' }));
    await vi.waitFor(() => expect(state.open).toBe(false));
    expect(isOpen()).toBe(false);
  });

  test('clicking the anchor again closes it, without opening it again', async () => {
    const { screen, state, opened, isOpen } = await setup();
    await opened();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(state.open).toBe(false);
    expect(isOpen()).toBe(false);
  });

  describe('selection', () => {
    const options = () =>
      ['name', 'date', 'size'].map((by) => h(MenuItem, { value: by }, () => by));

    test('single: radio items; it opens on the selected one, and choosing closes it', async () => {
      const { screen, state, opened } = await setup({
        props: { selection: 'single' },
        selected: 'date',
        items: options,
      });
      await opened();
      expect(focusedText()).toBe('date');
      await expect
        .element(screen.getByRole('menuitemradio', { name: 'date' }))
        .toHaveAttribute('aria-checked', 'true');
      await userEvent.click(screen.getByRole('menuitemradio', { name: 'size' }));
      expect(state.selected).toBe('size');
      await vi.waitFor(() => expect(state.open).toBe(false));
    });

    test('multiple: checkbox items, toggled while it stays open', async () => {
      const { screen, state, opened } = await setup({
        props: { selection: 'multiple' },
        selected: ['name'],
        items: options,
      });
      await opened();
      await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'size' }));
      await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'name' }));
      expect(state.selected).toEqual(['size']);
      expect(state.open).toBe(true);
    });
  });

  describe('placement', () => {
    test('a point anchor, for a context menu', async () => {
      const { state, menu, isOpen } = await setup({ props: { anchor: { x: 300, y: 200 } } });
      state.open = true;
      await vi.waitFor(() => expect(isOpen()).toBe(true));
      expect([rect(menu()).left, rect(menu()).top]).toEqual([300, 200]);
    });

    // Mounted with `createApp`: vitest-browser-vue moves what it renders into place afterwards,
    // which closes a popover that is open by then.
    const mount = (component: Component) => {
      const host = document.body.appendChild(document.createElement('div'));
      const app = createApp(component);
      app.mount(host);
      onTestFinished(() => {
        app.unmount();
        host.remove();
      });
    };

    test('open from the start, with a template ref that fills in after the first render', async () => {
      const anchor = ref<HTMLElement>();
      mount(
        defineComponent(
          () => () =>
            h('div', { style: { padding: '80px' } }, [
              h('button', { ref: anchor }, 'Anchor'),
              h(Menu, { open: true, anchor: anchor.value, label: 'Early' }, plainItems),
            ]),
        ),
      );
      const menu = document.querySelector<HTMLElement>('[aria-label="Early"]')!;
      await vi.waitFor(() => expect(rect(menu).top).toBeCloseTo(rect(anchor.value!).bottom, 0));
    });

    test('a new point while the menu is open opens it afresh there', async () => {
      const point = ref<AnchorPoint>({ x: 300, y: 200 });
      mount(
        defineComponent(
          () => () =>
            // The theme brings the motion tokens, so the menu has its transitions.
            h('div', { style: theme }, [
              h(Menu, { open: true, anchor: point.value, label: 'Context' }, plainItems),
            ]),
        ),
      );
      const menu = document.querySelector<HTMLElement>('[aria-label="Context"]')!;
      await vi.waitFor(() => expect([rect(menu).left, rect(menu).top]).toEqual([300, 200]));
      await vi.waitFor(() => expect(menu.getAnimations()).toEqual([]), { timeout: 2000 });
      // A right-click elsewhere replaces the point. The menu moves with the update, not a frame
      // or two later, when something else happens to place it again, and opens as it did first.
      point.value = { x: 400, y: 260 };
      await nextTick();
      expect([rect(menu).left, rect(menu).top]).toEqual([400, 260]);
      expect(fadeFrom(menu)).toBe(0);
      expect(menu.matches(':popover-open')).toBe(true);
    });

    test('an anchor that fills in only places the menu; another element opens it afresh', async () => {
      const anchors = [ref<HTMLElement>(), ref<HTMLElement>()];
      const which = ref<number>();
      mount(
        defineComponent(
          () => () =>
            h('div', { style: { ...theme, padding: '80px' } }, [
              h('button', { ref: anchors[0] }, 'First'),
              h('button', { ref: anchors[1], style: { marginLeft: '200px' } }, 'Second'),
              h(
                Menu,
                {
                  open: true,
                  anchor: which.value === undefined ? null : anchors[which.value]!.value,
                  label: 'Moving',
                },
                plainItems,
              ),
            ]),
        ),
      );
      const menu = document.querySelector<HTMLElement>('[aria-label="Moving"]')!;
      await vi.waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
      await vi.waitFor(() => expect(menu.getAnimations()).toEqual([]), { timeout: 2000 });

      which.value = 0;
      await nextTick();
      expect(rect(menu).left).toBeCloseTo(rect(anchors[0]!.value!).left, 0);
      expect(fadeFrom(menu)).toBeUndefined();

      which.value = 1;
      await nextTick();
      expect(rect(menu).left).toBeCloseTo(rect(anchors[1]!.value!).left, 0);
      expect(fadeFrom(menu)).toBe(0);
    });

    test.each([
      ['keeps to that spot on it as it scrolls', true],
      ['without an element, stays where it is on the screen', false],
    ])('a point on an element %s', async (_, withElement) => {
      const open = ref(false);
      const point = ref<MenuAnchorPoint>();
      const renders = ref(0);
      const scroller = ref<HTMLElement>();
      const target = ref<HTMLElement>();
      mount(
        defineComponent(
          () => () =>
            h('div', { ref: scroller, style: { height: '300px', overflow: 'auto' } }, [
              h('div', { style: { height: '1000px', paddingTop: '100px' } }, [
                h('div', { ref: target, 'data-renders': renders.value }, 'Target'),
              ]),
              // A new object on every render, as an inline point is
              h(
                Menu,
                { open: open.value, anchor: point.value && { ...point.value }, label: 'Scrolling' },
                plainItems,
              ),
            ]),
        ),
      );
      await nextTick();
      const at = rect(target.value!);
      point.value = {
        x: at.left + 10,
        y: at.top + 10,
        element: withElement ? target.value : undefined,
      };
      open.value = true;
      const menu = document.querySelector<HTMLElement>('[aria-label="Scrolling"]')!;
      await vi.waitFor(() => expect(rect(menu).top).toBeCloseTo(at.top + 10, 0));

      scroller.value!.scrollTop = 50;
      const top = withElement ? at.top - 40 : at.top + 10;
      await vi.waitFor(() => expect(rect(menu).top).toBeCloseTo(top, 0));
      // A render after the scroll, with a new object for the same point, leaves it there.
      renders.value++;
      await nextTick();
      await new Promise(requestAnimationFrame);
      expect(rect(menu).top).toBeCloseTo(top, 0);
    });

    test('a context menu on something inside an open popover opens within it', async () => {
      const open = ref(false);
      const point = ref<MenuAnchorPoint>();
      const panel = ref<HTMLElement>();
      const target = ref<HTMLElement>();
      mount(
        defineComponent(
          () => () =>
            h('div', [
              h('div', { ref: panel, popover: 'auto' }, [h('div', { ref: target }, 'Inside')]),
              h(Menu, { open: open.value, anchor: point.value, label: 'Inner' }, plainItems),
            ]),
        ),
      );
      await nextTick();
      panel.value!.showPopover();
      const at = rect(target.value!);
      point.value = { x: at.left + 5, y: at.top + 5, element: target.value };
      open.value = true;
      const menu = document.querySelector<HTMLElement>('[aria-label="Inner"]')!;
      await vi.waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
      // Past the `toggle` events
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(panel.value!.matches(':popover-open')).toBe(true);
      expect(menu.matches(':popover-open')).toBe(true);
    });

    // By the spec's light dismiss, releasing the button that opened a context menu counts as a
    // click outside; WebKit closed the menu at once in the playground. Rio opens and moves the menu
    // once the press ends. This frame doesn't reproduce the closing in any engine, so the test
    // guards the flow; Chromium, WebKit, and Firefox were checked in the playground.
    test('a right-click opens a context menu there, and another moves it', async () => {
      const open = ref(false);
      const point = ref<AnchorPoint>();
      const screen = await render(
        defineComponent(
          () => () =>
            h('div', { style: { padding: '40px' } }, [
              h(
                'div',
                {
                  'data-testid': 'area',
                  style: { width: '300px', height: '120px' },
                  onContextmenu: (event: MouseEvent) => {
                    event.preventDefault();
                    point.value = { x: event.clientX, y: event.clientY };
                    open.value = true;
                  },
                },
                'Right-click here',
              ),
              h(
                Menu,
                {
                  open: open.value,
                  'onUpdate:open': (next: boolean) => (open.value = next),
                  anchor: point.value,
                  label: 'Context',
                },
                plainItems,
              ),
            ]),
        ),
      );
      const area = screen.getByTestId('area');
      const menu = () => document.querySelector<HTMLElement>('[aria-label="Context"]')!;
      await userEvent.click(area, { button: 'right', position: { x: 20, y: 20 } });
      await vi.waitFor(() => expect(menu().matches(':popover-open')).toBe(true));
      const first = rect(menu());
      await userEvent.click(area, { button: 'right', position: { x: 200, y: 80 } });
      await vi.waitFor(() => expect(rect(menu()).left).toBeCloseTo(first.left + 180, 0));
      expect(menu().matches(':popover-open')).toBe(true);
      expect(open.value).toBe(true);
    });

    // The waiting itself, with synthetic events, so it holds in any engine
    describe('a context menu asked for during a press', () => {
      const contextArea = async (prevent = true) => {
        const open = ref(false);
        const point = ref<AnchorPoint>();
        const screen = await render(
          defineComponent(
            () => () =>
              h('div', { style: theme }, [
                h(
                  'div',
                  {
                    'data-testid': 'area',
                    style: { width: '200px', height: '80px' },
                    onContextmenu: (event: MouseEvent) => {
                      if (!prevent) return;
                      event.preventDefault();
                      point.value = { x: event.clientX, y: event.clientY };
                      open.value = true;
                    },
                  },
                  'Area',
                ),
                h(
                  Menu,
                  {
                    open: open.value,
                    'onUpdate:open': (next: boolean) => (open.value = next),
                    anchor: point.value ?? { x: 10, y: 10 },
                    label: 'Context',
                  },
                  plainItems,
                ),
              ]),
          ),
        );
        const area = screen.getByTestId('area').element();
        const menu = () => document.querySelector<HTMLElement>('[aria-label="Context"]')!;
        const contextmenu = () =>
          area.dispatchEvent(
            new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              buttons: 2,
              clientX: 20,
              clientY: 20,
            }),
          );
        return { open, menu, contextmenu };
      };
      const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      test('opens when the press ends', async () => {
        const { menu, contextmenu } = await contextArea();
        contextmenu();
        await pause(100);
        expect(menu().matches(':popover-open')).toBe(false);
        document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        await vi.waitFor(() => expect(menu().matches(':popover-open')).toBe(true));
      });

      test('opens after a second at most, when the release never comes', async () => {
        const { menu, contextmenu } = await contextArea();
        contextmenu();
        await pause(400);
        expect(menu().matches(':popover-open')).toBe(false);
        await vi.waitFor(() => expect(menu().matches(':popover-open')).toBe(true), {
          timeout: 1500,
        });
      });

      test("the browser's own context menu, which keeps the release, ends the wait", async () => {
        const { open, menu, contextmenu } = await contextArea(false);
        contextmenu();
        open.value = true;
        await vi.waitFor(() => expect(menu().matches(':popover-open')).toBe(true), {
          timeout: 300,
        });
      });

      test('a handler on window, added after the menu, still holds the menu back', async () => {
        const { open, menu, contextmenu } = await contextArea(false);
        // The app opens the menu from `window`, with a listener added after Rio's.
        const late = (event: Event) => {
          event.preventDefault();
          open.value = true;
        };
        window.addEventListener('contextmenu', late);
        onTestFinished(() => window.removeEventListener('contextmenu', late));
        contextmenu();
        await pause(100);
        expect(menu().matches(':popover-open')).toBe(false);
        document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        await vi.waitFor(() => expect(menu().matches(':popover-open')).toBe(true));
      });

      // The release may close the menu, as the spec's light dismiss does, and in a browser that
      // animates the closing, the menu is still fading out when it opens again. The Chromium in VS
      // Code's integrated browser was seen doing so; this closes it the same way.
      test.each([
        ['', false],
        [', also where the release closes it with the closing motion', true],
      ])(
        'moving an open menu waits for the release, then it opens afresh there%s',
        async (_, closedByRelease) => {
          const { open, menu } = await contextArea();
          open.value = true;
          await vi.waitFor(() => expect(menu().matches(':popover-open')).toBe(true));
          // Settled after its opening motion
          await vi.waitFor(() => expect(menu().getAnimations()).toEqual([]), { timeout: 2000 });
          const before = rect(menu());
          if (closedByRelease) {
            const dismiss = () => menu().hidePopover();
            window.addEventListener('pointerup', dismiss, { capture: true });
            onTestFinished(() =>
              window.removeEventListener('pointerup', dismiss, { capture: true }),
            );
          }

          // A right-click elsewhere, still held
          document.querySelector('[data-testid="area"]')!.dispatchEvent(
            new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              buttons: 2,
              clientX: 150,
              clientY: 60,
            }),
          );
          await pause(100);
          expect([rect(menu()).left, rect(menu()).top]).toEqual([before.left, before.top]);

          document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
          // Opening again at the new point, fading in from nothing: not a closing turned back
          await vi.waitFor(() => {
            expect(menu().style.left).toBe('150px');
            expect(fadeFrom(menu())).toBe(0);
          });
          expect(menu().matches(':popover-open')).toBe(true);
          expect(open.value).toBe(true);
        },
      );

      // On Windows the `contextmenu` comes after the release, which may have closed the menu by
      // then, as a click outside, while it is still fading out. Whether it comes before or after
      // the `toggle` event that tells of the closing is up to the browser.
      test.each([
        ['after', true],
        ['before', false],
      ])(
        'a right-click elsewhere after the release, as on Windows, opens it afresh there (%s the closing is told)',
        async (_, told) => {
          const { open, menu } = await contextArea();
          open.value = true;
          await vi.waitFor(() => expect(menu().matches(':popover-open')).toBe(true));
          await vi.waitFor(() => expect(menu().getAnimations()).toEqual([]), { timeout: 2000 });
          menu().hidePopover();
          if (told) await vi.waitFor(() => expect(open.value).toBe(false), { interval: 5 });
          expect(fadeFrom(menu())).toBeGreaterThan(0);

          document.querySelector('[data-testid="area"]')!.dispatchEvent(
            new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              clientX: 150,
              clientY: 60,
            }),
          );
          await vi.waitFor(() => {
            expect(menu().style.left).toBe('150px');
            expect(fadeFrom(menu())).toBe(0);
          });
          // Past the `toggle` event, however late
          await pause(50);
          expect(menu().matches(':popover-open')).toBe(true);
          expect(open.value).toBe(true);
        },
      );

      test('a contextmenu from the keyboard opens at once', async () => {
        const { menu } = await contextArea();
        document
          .querySelector('[data-testid="area"]')!
          .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(menu().matches(':popover-open')).toBe(true), {
          timeout: 300,
        });
      });

      test('a press without a release holds back nothing else', async () => {
        const { open, menu } = await contextArea();
        document.body.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, button: 2, buttons: 2 }),
        );
        open.value = true;
        await vi.waitFor(() => expect(menu().matches(':popover-open')).toBe(true), {
          timeout: 300,
        });
      });
    });

    test('side, align, and offset', async () => {
      const { opened, menu, trigger } = await setup({
        props: { side: 'end', align: 'start', offset: 4 },
      });
      await opened();
      expect(rect(menu()).left).toBeCloseTo(rect(trigger()).right + 4, 0);
      expect(rect(menu()).top).toBeCloseTo(rect(trigger()).top, 0);
      expect([menu().dataset.side, menu().dataset.align]).toEqual(['end', 'start']);
    });

    test("a component anchor stands for its root element, such as a RioButton's", async () => {
      const open = ref(false);
      const button = ref();
      const screen = await render(
        defineComponent(
          () => () =>
            h('div', { style: { padding: '40px' } }, [
              h(Button, { ref: button, onClick: () => (open.value = true) }, () => 'More'),
              h(Menu, { open: open.value, anchor: button.value, label: 'More' }, plainItems),
            ]),
        ),
      );
      await userEvent.click(screen.getByRole('button', { name: 'More' }));
      const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
      await vi.waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
      const anchor = screen.getByRole('button', { name: 'More' }).element();
      expect(rect(menu).top).toBeCloseTo(rect(anchor).bottom, 0);
    });
  });

  test('groups are named by their label, and dividers are separators', async () => {
    const { screen, opened } = await setup({
      items: () => [
        h(MenuItem, () => 'Cut'),
        h(MenuDivider),
        h(MenuGroup, { label: 'Share' }, () => [h(MenuItem, () => 'Email')]),
      ],
    });
    await opened();
    await expect.element(screen.getByRole('separator')).toBeInTheDocument();
    await expect.element(screen.getByRole('group', { name: 'Share' })).toBeVisible();
    // Items in groups are part of the menu's arrow key order
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedText()).toBe('Email');
  });

  test.each([
    ['opens a menu', { 'aria-haspopup': 'menu' }, theme['--rio-state-pressed-state-layer-opacity']],
    // Such as an accordion's
    ['expands something else', {}, '0'],
  ])(
    'a button that %s shows the pressed state while expanded, or not',
    async (_, attrs, opacity) => {
      const screen = await render(Button, {
        attrs: { style: theme, 'aria-expanded': 'true', ...attrs },
        slots: { default: () => 'More' },
      });
      const button = screen.getByRole('button').element();
      await vi.waitFor(() => expect(getComputedStyle(button, '::before').opacity).toBe(opacity));
    },
  );
});
