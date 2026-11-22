import { attachSubMenu, type MenuSelected } from '@rio-m3e/core';
import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, ref } from 'vue';
import Menu from './Menu.vue';
import MenuItem from './MenuItem.vue';
import SubMenu from './SubMenu.vue';
import { eventsLeaving } from '../test/events';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

interface Setup {
  dir?: 'ltr' | 'rtl';
  /** Puts the menu at the end of the window, where a submenu has no room beside it. */
  atEnd?: boolean;
  /** Makes the menu as wide as the window, so a submenu has room on neither side and goes below. */
  wide?: boolean;
  /** Adds "Long", a submenu too tall for the window, which scrolls. */
  long?: boolean;
}

/**
 * A menu with submenus, open, as an app would write it: "Share" holds "More", "Sort by" keeps a
 * selection of its own, and "Export" is disabled.
 */
const setup = async ({ dir = 'ltr', atEnd = false, wide = false, long = false }: Setup = {}) => {
  const open = ref(false);
  const sort = ref<MenuSelected>('date');
  const actions: string[] = [];
  const anchor = ref<HTMLElement>();
  await render(
    defineComponent(
      () => () =>
        h(
          'div',
          {
            dir,
            style: {
              ...theme,
              padding: '40px',
              ...(atEnd && { display: 'flex', justifyContent: 'flex-end' }),
            },
          },
          [
            h('button', { ref: anchor }, 'Anchor'),
            h(
              Menu,
              {
                open: open.value,
                'onUpdate:open': (next: boolean) => (open.value = next),
                anchor: anchor.value,
                align: atEnd ? 'end' : 'start',
                label: 'File',
                ...(wide && { style: { inlineSize: 'calc(100vw - 48px)', maxInlineSize: 'none' } }),
              },
              () => [
                h(MenuItem, { onClick: () => actions.push('new') }, () => 'New'),
                h(
                  SubMenu,
                  { label: 'Share', class: 'share' },
                  {
                    'trailing-icon': () => '>',
                    default: () => [
                      h(MenuItem, { onClick: () => actions.push('email') }, () => 'Email'),
                      h(SubMenu, { label: 'More' }, () => [
                        h(MenuItem, { onClick: () => actions.push('chat') }, () => 'Chat'),
                      ]),
                    ],
                  },
                ),
                h(
                  SubMenu,
                  {
                    label: 'Sort by',
                    selection: 'single',
                    modelValue: sort.value,
                    'onUpdate:modelValue': (next: MenuSelected) => (sort.value = next),
                  },
                  () => ['name', 'date'].map((value) => h(MenuItem, { value }, () => value)),
                ),
                h(SubMenu, { label: 'Export', disabled: true }, () => [h(MenuItem, () => 'PDF')]),
                ...(long
                  ? [
                      h(SubMenu, { label: 'Long' }, () =>
                        Array.from({ length: 40 }, (_, n) => h(MenuItem, () => `Line ${n + 1}`)),
                      ),
                    ]
                  : []),
                h(MenuItem, () => 'Quit'),
              ],
            ),
          ],
        ),
    ),
  );
  open.value = true;
  const menu = (label: string) =>
    document.querySelector<HTMLElement>(`.rio-menu[aria-label="${label}"]`)!;
  const item = (label: string) =>
    [...document.querySelectorAll<HTMLElement>('[role^="menuitem"]')].find(
      (each) => each.querySelector('.rio-menu-item__label')?.textContent?.trim() === label,
    )!;
  const isOpen = (label: string) => menu(label).matches(':popover-open');
  await vi.waitFor(() => expect(isOpen('File')).toBe(true));
  return { open, sort, actions, menu, item, isOpen };
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const rect = (element: Element) => element.getBoundingClientRect();
/** A mouse event from the pointer at a point, aimed at an element, as the browser sends it */
const pointer = (type: string, target: Element, x: number, y: number) =>
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: type !== 'pointerleave',
      clientX: x,
      clientY: y,
      pointerType: 'mouse',
    }),
  );
const pointAt = (element: Element) => {
  const { left, top } = rect(element);
  pointer('pointermove', element, left + 20, top + 20);
};

describe('RioSubMenu', () => {
  // The submenu is inside the menu's element, which keeps them in.
  test('clicks and presses in it, and on its item, stay in the menus', async () => {
    const { item, menu, isOpen } = await setup();
    const out = eventsLeaving(() => menu('File'));
    await userEvent.click(item('Share'));
    await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
    await userEvent.click(item('Email'));
    expect(out).toEqual([]);
  });

  test('opens and closes without a warning from Vue', async () => {
    // Opening and closing render it again; a warning from Vue fails the test (`test/setup.ts`).
    const { item, isOpen } = await setup();
    await userEvent.click(item('Share'));
    await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(isOpen('Share')).toBe(false));
  });

  test('its item says it opens a menu, which is named by the label', async () => {
    const { item, menu } = await setup();
    expect(item('Share').getAttribute('aria-haspopup')).toBe('menu');
    expect(item('Share').getAttribute('aria-expanded')).toBe('false');
    expect(item('Share').classList.contains('share')).toBe(true);
    expect(menu('Share').getAttribute('role')).toBe('menu');
    expect(item('Share').querySelector('.rio-menu-item__trailing-icon')?.textContent).toBe('>');
  });

  describe('the pointer', () => {
    test('resting on its item opens it after a moment, leaving the focus where it is', async () => {
      const { item, isOpen } = await setup();
      const focused = document.activeElement;
      pointAt(item('Share'));
      await pause(40);
      expect(isOpen('Share')).toBe(false);
      await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
      expect(item('Share').getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement).toBe(focused);
    });

    test('the focus follows it into another open menu, but not within one', async () => {
      const { item, isOpen } = await setup();
      expect(document.activeElement).toBe(item('New'));
      pointAt(item('Quit'));
      expect(document.activeElement).toBe(item('New'));

      pointAt(item('Share'));
      await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
      expect(document.activeElement).toBe(item('New'));
      pointAt(item('Email'));
      expect(document.activeElement).toBe(item('Email'));
      // The keys carry on there.
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(item('More'));

      // Back in the menu around it, onto another item
      pointAt(item('New'));
      expect(document.activeElement).toBe(item('New'));
      await vi.waitFor(() => expect(isOpen('Share')).toBe(false));
      expect(document.activeElement).toBe(item('New'));
    });

    test('moving the focus along with it scrolls nothing under it', async () => {
      const { item, menu, isOpen } = await setup({ long: true });
      pointAt(item('Long'));
      await vi.waitFor(() => expect(isOpen('Long')).toBe(true));
      await vi.waitFor(() => expect(menu('Long').getAnimations()).toEqual([]), { timeout: 2000 });
      expect(menu('Long').scrollHeight).toBeGreaterThan(menu('Long').clientHeight);
      // The first item cut off at the bottom edge, pointed at where it shows
      const bottom = rect(menu('Long')).bottom;
      const cut = [...menu('Long').querySelectorAll('[role="menuitem"]')].find(
        (each) => rect(each).bottom > bottom,
      )!;
      pointer('pointermove', cut, rect(cut).left + 20, rect(cut).top + 4);
      expect(document.activeElement).toBe(cut);
      expect(menu('Long').scrollTop).toBe(0);
    });

    test('the menu it is in has the active shape, the other open one the inactive', async () => {
      const { item, menu, isOpen } = await setup();
      pointAt(item('Share'));
      await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
      // The adapter renders the shapes it is told of.
      await vi.waitFor(() => expect(menu('Share').hasAttribute('data-inactive')).toBe(true));
      expect(menu('File').hasAttribute('data-inactive')).toBe(false);
      pointAt(item('Email'));
      await vi.waitFor(() => expect(menu('File').hasAttribute('data-inactive')).toBe(true));
      expect(menu('Share').hasAttribute('data-inactive')).toBe(false);
      await vi.waitFor(() =>
        expect(getComputedStyle(menu('File')).borderTopLeftRadius).toBe(
          getComputedStyle(menu('File')).getPropertyValue('--rio-shape-corner-small').trim(),
        ),
      );
    });

    test('pointing at another item closes it, but not on the way to it', async () => {
      const { item, menu, isOpen } = await setup();
      pointAt(item('Share'));
      await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
      const share = rect(item('Share'));
      const next = rect(item('Sort by'));

      // Leaving the item for the submenu, heading right and down across "Sort by"
      pointer('pointermove', item('Share'), share.right - 10, share.bottom - 4);
      pointer('pointerleave', item('Share'), share.right - 4, share.bottom - 2);
      pointer('pointermove', item('Sort by'), share.right - 2, next.top + 4);
      await pause(150);
      expect(isOpen('Share')).toBe(true);
      expect(isOpen('Sort by')).toBe(false);

      // Turning back onto "Sort by"
      pointer('pointermove', item('Sort by'), next.left + 20, next.top + 20);
      await vi.waitFor(() => expect(isOpen('Share')).toBe(false));
      await vi.waitFor(() => expect(isOpen('Sort by')).toBe(true));
      expect(menu('File').matches(':popover-open')).toBe(true);
    });

    test('heading down for a submenu that went below its item, for want of room beside', async () => {
      const { item, menu, isOpen } = await setup({ wide: true });
      pointAt(item('Share'));
      await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
      expect(menu('Share').dataset.side).toBe('bottom');
      const share = rect(item('Share'));
      const next = rect(item('Sort by'));
      const x = share.left + 30;

      // Down out of the item, across the top of "Sort by", before the submenu below
      pointer('pointermove', item('Share'), x, share.bottom - 6);
      pointer('pointerleave', item('Share'), x, share.bottom - 1);
      pointer('pointermove', item('Sort by'), x, next.top + 2);
      await pause(150);
      expect(isOpen('Share')).toBe(true);
      expect(isOpen('Sort by')).toBe(false);

      // Back up onto "Sort by"
      pointer('pointermove', item('Sort by'), x, next.top + 1);
      await vi.waitFor(() => expect(isOpen('Share')).toBe(false));
    });

    test('the way across other items lasts a moment only', async () => {
      const { item, isOpen } = await setup();
      pointAt(item('Share'));
      await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
      const share = rect(item('Share'));
      const next = rect(item('Sort by'));
      pointer('pointermove', item('Share'), share.right - 10, share.bottom - 4);
      pointer('pointerleave', item('Share'), share.right - 4, share.bottom - 2);
      await pause(350);
      pointer('pointermove', item('Sort by'), share.right - 2, next.top + 4);
      await vi.waitFor(() => expect(isOpen('Share')).toBe(false));
    });

    test('detaching leaves the item’s link to the submenu, which its part renders', async () => {
      const { item, menu } = await setup();
      // As an adapter may detach and attach again without a render, as React's StrictMode does
      attachSubMenu(item('Share'), menu('Share'), { onOpenChange: () => {} }).detach();
      expect(item('Share').getAttribute('popovertarget')).toBe(menu('Share').id);
      expect(item('Share').getAttribute('popovertargetaction')).toBe('show');
    });

    test('a click opens it at once, and another click on its item keeps it open', async () => {
      const { item, isOpen } = await setup();
      await userEvent.click(item('Share'));
      await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
      await userEvent.click(item('Share'));
      await pause(150);
      expect(isOpen('Share')).toBe(true);
    });
  });

  describe('the keyboard', () => {
    test.each(['{ArrowRight}', '{Enter}', ' '])(
      '%s on its item opens it, with the focus on its first item',
      async (key) => {
        const { item, menu, isOpen } = await setup();
        item('Share').focus();
        await userEvent.keyboard(key);
        await vi.waitFor(() => expect(document.activeElement).toBe(item('Email')));
        expect(isOpen('File')).toBe(true);
        expect(menu('File').hasAttribute('data-inactive')).toBe(true);
        expect(menu('Share').hasAttribute('data-inactive')).toBe(false);
      },
    );

    test('a selecting submenu opens on its selected item', async () => {
      const { item } = await setup();
      item('Sort by').focus();
      await userEvent.keyboard('{ArrowRight}');
      await vi.waitFor(() => expect(document.activeElement).toBe(item('date')));
    });

    test('a click without a pointer, as from assistive technology, moves the focus in too', async () => {
      const { item } = await setup();
      item('Share').click();
      await vi.waitFor(() => expect(document.activeElement).toBe(item('Email')));
    });

    test.each(['{ArrowLeft}', '{Escape}'])(
      '%s closes it, one level at a time, with the focus back on its item',
      async (key) => {
        const { item, isOpen } = await setup();
        item('Share').focus();
        await userEvent.keyboard('{ArrowRight}');
        await vi.waitFor(() => expect(document.activeElement).toBe(item('Email')));
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        await vi.waitFor(() => expect(document.activeElement).toBe(item('Chat')));

        await userEvent.keyboard(key);
        await vi.waitFor(() => expect(isOpen('More')).toBe(false));
        expect(document.activeElement).toBe(item('More'));
        expect(isOpen('Share')).toBe(true);
        await userEvent.keyboard(key);
        await vi.waitFor(() => expect(isOpen('Share')).toBe(false));
        expect(document.activeElement).toBe(item('Share'));
        expect(isOpen('File')).toBe(true);
      },
    );

    test('Right, Enter, and Space with Alt, Ctrl, or Meta are left to the app', async () => {
      const { item, isOpen } = await setup();
      item('Share').focus();
      for (const key of ['ArrowRight', 'Enter', ' ']) {
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
          const press = new KeyboardEvent('keydown', {
            key,
            bubbles: true,
            cancelable: true,
            [modifier]: true,
          });
          item('Share').dispatchEvent(press);
          expect(press.defaultPrevented, `${modifier} ${key}`).toBe(false);
        }
      }
      await pause(100);
      expect(isOpen('Share')).toBe(false);
    });

    test('in right-to-left layouts, Left opens it and Right closes it', async () => {
      const { item, isOpen } = await setup({ dir: 'rtl' });
      item('Share').focus();
      await userEvent.keyboard('{ArrowRight}');
      await pause(100);
      expect(isOpen('Share')).toBe(false);
      await userEvent.keyboard('{ArrowLeft}');
      await vi.waitFor(() => expect(document.activeElement).toBe(item('Email')));
      await userEvent.keyboard('{ArrowRight}');
      await vi.waitFor(() => expect(isOpen('Share')).toBe(false));
      expect(document.activeElement).toBe(item('Share'));
    });

    test('the arrow keys in a submenu move within it', async () => {
      const { item } = await setup();
      item('Share').focus();
      await userEvent.keyboard('{ArrowRight}');
      await vi.waitFor(() => expect(document.activeElement).toBe(item('Email')));
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(item('More'));
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(item('Email'));
    });

    test('Tab closes the whole menu', async () => {
      const { open, item, isOpen } = await setup();
      item('Share').focus();
      await userEvent.keyboard('{ArrowRight}');
      await vi.waitFor(() => expect(document.activeElement).toBe(item('Email')));
      await userEvent.keyboard('{Tab}');
      await vi.waitFor(() => expect(isOpen('File')).toBe(false));
      expect(isOpen('Share')).toBe(false);
      expect(open.value).toBe(false);
    });

    test('a space while letters are being typed is part of the search', async () => {
      const { item, isOpen } = await setup();
      item('New').focus();
      await userEvent.keyboard('sort b');
      expect(document.activeElement).toBe(item('Sort by'));
      await pause(150);
      expect(isOpen('Sort by')).toBe(false);
    });
  });

  describe('choosing', () => {
    test('an item in a submenu runs its action and closes the whole menu', async () => {
      const { open, actions, item, isOpen } = await setup();
      await userEvent.click(item('Share'));
      await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
      await userEvent.click(item('Email'));
      expect(actions).toEqual(['email']);
      await vi.waitFor(() => expect(isOpen('File')).toBe(false));
      expect(open.value).toBe(false);
    });

    test('a submenu keeps a selection of its own', async () => {
      const { sort, item, isOpen } = await setup();
      await userEvent.click(item('Sort by'));
      await vi.waitFor(() => expect(isOpen('Sort by')).toBe(true));
      expect(item('date').getAttribute('aria-checked')).toBe('true');
      await userEvent.click(item('name'));
      expect(sort.value).toBe('name');
      await vi.waitFor(() => expect(isOpen('File')).toBe(false));
    });

    test('a disabled submenu stays closed', async () => {
      const { item, isOpen } = await setup();
      pointAt(item('Export'));
      await pause(150);
      expect(isOpen('Export')).toBe(false);
      // A DOM click: Playwright won't click an element marked aria-disabled.
      item('Export').click();
      item('Export').focus();
      await userEvent.keyboard('{ArrowRight}{Enter}');
      await pause(100);
      expect(isOpen('Export')).toBe(false);
      expect(isOpen('File')).toBe(true);
    });
  });

  describe('placement', () => {
    test('beside its item, 4px off the menu, with the first items lined up', async () => {
      const { item, menu, isOpen } = await setup();
      await userEvent.click(item('Share'));
      await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
      // Measured once the opening motion, which scales it, has settled
      await vi.waitFor(() => expect(menu('Share').getAnimations()).toEqual([]), { timeout: 2000 });
      expect(rect(menu('Share')).left - rect(menu('File')).right).toBeCloseTo(4, 0);
      expect(rect(item('Email')).top).toBeCloseTo(rect(item('Share')).top, 0);
      expect(menu('Share').dataset.side).toBe('end');
    });

    test('without room on the end side, it opens on the other', async () => {
      const { item, menu, isOpen } = await setup({ atEnd: true });
      await userEvent.click(item('Share'));
      await vi.waitFor(() => expect(isOpen('Share')).toBe(true));
      expect(menu('Share').dataset.side).toBe('start');
      expect(rect(menu('File')).left - rect(menu('Share')).right).toBeCloseTo(4, 0);
    });
  });
});
