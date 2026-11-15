import { mdiContentCopy } from '@mdi/js';
import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import Button from '../button/Button.vue';
import IconButton from '../icon-button/IconButton.vue';
import { icon, keyboardFocus } from '../test/vrt';
import Tooltip from './Tooltip.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

/**
 * A row as an app would write it: icon buttons with plain tooltips, a button with a rich one with
 * actions, and a button with a persistent rich one. `actions` records what the buttons did.
 */
const setup = async () => {
  const actions: string[] = [];
  const persistentOpen = ref(false);
  await render(
    defineComponent(
      () => () =>
        h('div', { style: { ...theme, padding: '120px 40px', display: 'flex', gap: '16px' } }, [
          ...['Cut', 'Copy'].map((label) =>
            h(Tooltip, { text: label }, () =>
              h(IconButton, { label, onClick: () => actions.push(label) }, () =>
                icon(mdiContentCopy),
              ),
            ),
          ),
          h(Tooltip, { text: 'Saves a copy' }, () => h(Button, null, () => 'Save')),
          h(
            Tooltip,
            { variant: 'rich', subhead: 'Backups', text: 'Nightly, while charging.' },
            {
              default: () => h(Button, null, () => 'Backups'),
              actions: () =>
                h(Button, { variant: 'text', onClick: () => actions.push('learn') }, () => 'Learn'),
            },
          ),
          h(
            Tooltip,
            {
              variant: 'rich',
              persistent: true,
              subhead: 'Albums',
              text: 'Invite people.',
              open: persistentOpen.value,
              'onUpdate:open': (next: boolean) => (persistentOpen.value = next),
            },
            () => h(Button, { onClick: () => actions.push('albums') }, () => 'Albums'),
          ),
          h('button', null, 'Elsewhere'),
        ]),
    ),
  );
  const button = (name: string) =>
    [...document.querySelectorAll<HTMLElement>('button')].find(
      (each) => each.getAttribute('aria-label') === name || each.textContent?.trim() === name,
    )!;
  const tooltipOf = (name: string) =>
    button(name).closest('.rio-tooltip-trigger')!.querySelector<HTMLElement>('.rio-tooltip')!;
  const isOpen = (name: string) => tooltipOf(name).matches(':popover-open');
  // The pointer starts on a button without a tooltip: left where a previous test put it, it could
  // rest on an element here and show its tooltip.
  await userEvent.hover(button('Elsewhere'));
  return { actions, persistentOpen, button, tooltipOf, isOpen };
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const rect = (element: Element) => element.getBoundingClientRect();
/** Waits out a tooltip's 1.5s after the pointer leaves, with room to spare */
const HIDDEN_BY = 2200;

describe('RioTooltip', () => {
  describe('the pointer', () => {
    test('resting on the element shows the tooltip after a moment, 4px above it', async () => {
      const { button, tooltipOf, isOpen } = await setup();
      await userEvent.hover(button('Copy'));
      await pause(250);
      expect(isOpen('Copy')).toBe(false);
      await vi.waitFor(() => expect(isOpen('Copy')).toBe(true));
      const tip = rect(tooltipOf('Copy'));
      const target = rect(button('Copy'));
      expect(target.top - tip.bottom).toBeCloseTo(4, 0);
      expect(tip.left + tip.width / 2).toBeCloseTo(target.left + target.width / 2, 0);
    });

    test('once a tooltip shows, the next one shows at once, and the first closes', async () => {
      const { button, isOpen } = await setup();
      await userEvent.hover(button('Cut'));
      await vi.waitFor(() => expect(isOpen('Cut')).toBe(true));
      await userEvent.hover(button('Copy'));
      await pause(100);
      expect(isOpen('Copy')).toBe(true);
      expect(isOpen('Cut')).toBe(false);
    });

    test('it stays while the pointer is on it, and closes 1.5s after the pointer leaves', async () => {
      const { button, tooltipOf, isOpen } = await setup();
      await userEvent.hover(button('Backups'));
      await vi.waitFor(() => expect(isOpen('Backups')).toBe(true));
      await userEvent.hover(tooltipOf('Backups'));
      await pause(HIDDEN_BY);
      expect(isOpen('Backups')).toBe(true);
      await userEvent.hover(button('Elsewhere'));
      await pause(1000);
      expect(isOpen('Backups')).toBe(true);
      await vi.waitFor(() => expect(isOpen('Backups')).toBe(false), { timeout: 1500 });
    });

    test('pressing the element closes its tooltip', async () => {
      const { actions, button, isOpen } = await setup();
      await userEvent.hover(button('Copy'));
      await vi.waitFor(() => expect(isOpen('Copy')).toBe(true));
      await userEvent.click(button('Copy'));
      expect(isOpen('Copy')).toBe(false);
      expect(actions).toEqual(['Copy']);
    });

    test("a click on a rich tooltip's action doesn't keep it open once the pointer leaves", async () => {
      const { actions, button, isOpen } = await setup();
      await userEvent.hover(button('Backups'));
      await vi.waitFor(() => expect(isOpen('Backups')).toBe(true));
      await userEvent.click(button('Learn'));
      expect(actions).toEqual(['learn']);
      await userEvent.hover(button('Elsewhere'));
      await vi.waitFor(() => expect(isOpen('Backups')).toBe(false), { timeout: HIDDEN_BY });
    });
  });

  describe('touch', () => {
    const touch = (type: string, target: Element) =>
      target.dispatchEvent(
        new PointerEvent(type, { bubbles: true, pointerType: 'touch', isPrimary: true }),
      );

    test('a held touch shows the tooltip, and the click it ends with does nothing', async () => {
      const { actions, button, isOpen } = await setup();
      touch('pointerdown', button('Copy'));
      await vi.waitFor(() => expect(isOpen('Copy')).toBe(true));
      touch('pointerup', button('Copy'));
      button('Copy').click();
      expect(actions).toEqual([]);
      // A later tap is a click again.
      await pause(700);
      button('Copy').click();
      expect(actions).toEqual(['Copy']);
    });

    test('a touch that moves away is not held', async () => {
      const { actions, button, isOpen } = await setup();
      const at = (type: string, x: number) =>
        button('Copy').dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            pointerType: 'touch',
            isPrimary: true,
            clientX: x,
          }),
        );
      at('pointerdown', 10);
      at('pointermove', 30);
      await pause(700);
      expect(isOpen('Copy')).toBe(false);
      at('pointerup', 30);
      button('Copy').click();
      expect(actions).toEqual(['Copy']);
    });

    test('a quick tap is only a click', async () => {
      const { actions, button, isOpen } = await setup();
      touch('pointerdown', button('Copy'));
      await pause(100);
      touch('pointerup', button('Copy'));
      button('Copy').click();
      expect(actions).toEqual(['Copy']);
      await pause(600);
      expect(isOpen('Copy')).toBe(false);
    });
  });

  describe('the keyboard', () => {
    test('focus from the keyboard shows it at once, and Escape closes it', async () => {
      const { button, isOpen } = await setup();
      await keyboardFocus(button('Save'));
      await vi.waitFor(() => expect(isOpen('Save')).toBe(true), { timeout: 200 });
      await userEvent.keyboard('{Escape}');
      expect(isOpen('Save')).toBe(false);
    });

    test('it stays while the pointer is on its element, after the focus leaves', async () => {
      const { button, isOpen } = await setup();
      await userEvent.hover(button('Save'));
      await keyboardFocus(button('Save'));
      await vi.waitFor(() => expect(isOpen('Save')).toBe(true));
      await keyboardFocus(button('Elsewhere'));
      await pause(HIDDEN_BY);
      expect(isOpen('Save')).toBe(true);
    });

    test('focus from a click inside an element made of several shows nothing either', async () => {
      await render(
        defineComponent(
          () => () =>
            h('div', { style: { padding: '80px' } }, [
              h(Tooltip, { text: 'Formatting' }, () =>
                h('div', null, [h('button', null, 'Bold'), h('button', null, 'Italic')]),
              ),
            ]),
        ),
      );
      const bold = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Bold')!;
      await userEvent.click(bold);
      expect(document.activeElement).toBe(bold);
      await pause(200);
      expect(document.querySelector('.rio-tooltip')!.matches(':popover-open')).toBe(false);
    });

    // A real click: after a synthetic one, the keyboard used by a previous test would still count
    // as the last input, and the focus would show as from the keyboard.
    test('focus from a click shows nothing', async () => {
      const { button, isOpen } = await setup();
      await userEvent.click(button('Save'));
      expect(document.activeElement).toBe(button('Save'));
      await pause(700);
      expect(isOpen('Save')).toBe(false);
    });

    test("Tab moves on from the element to the rich tooltip's actions, which keep it open", async () => {
      const { button, isOpen } = await setup();
      await keyboardFocus(button('Backups'));
      await vi.waitFor(() => expect(isOpen('Backups')).toBe(true));
      await userEvent.keyboard('{Tab}');
      expect(document.activeElement).toBe(button('Learn'));
      await pause(HIDDEN_BY);
      expect(isOpen('Backups')).toBe(true);
    });
  });

  describe('assistive technology', () => {
    test('the element is described by its tooltip, unless its name says the same', async () => {
      const { button, tooltipOf } = await setup();
      expect(tooltipOf('Save').getAttribute('role')).toBe('tooltip');
      expect(button('Save').getAttribute('aria-describedby')).toBe(tooltipOf('Save').id);
      // An icon button labeled with the tooltip's text
      expect(button('Copy').hasAttribute('aria-describedby')).toBe(false);
    });

    test('a rich tooltip with actions is a dialog, named by its subhead, describing by its text', async () => {
      const { button, tooltipOf } = await setup();
      const tip = tooltipOf('Backups');
      expect(tip.getAttribute('role')).toBe('dialog');
      expect(document.getElementById(tip.getAttribute('aria-labelledby')!)?.textContent).toBe(
        'Backups',
      );
      expect(
        document.getElementById(button('Backups').getAttribute('aria-describedby')!)?.textContent,
      ).toBe('Nightly, while charging.');
    });
  });

  describe('persistent', () => {
    test('the pointer resting on it opens nothing; a click does, and another closes it', async () => {
      const { actions, persistentOpen, button, isOpen } = await setup();
      expect(button('Albums').getAttribute('aria-expanded')).toBe('false');
      await userEvent.hover(button('Albums'));
      await pause(700);
      expect(isOpen('Albums')).toBe(false);

      await userEvent.click(button('Albums'));
      await vi.waitFor(() => expect(isOpen('Albums')).toBe(true));
      expect(persistentOpen.value).toBe(true);
      expect(button('Albums').getAttribute('aria-expanded')).toBe('true');
      expect(actions).toEqual(['albums']);
      await userEvent.hover(button('Elsewhere'));
      await pause(HIDDEN_BY);
      expect(isOpen('Albums')).toBe(true);

      await userEvent.click(button('Albums'));
      await vi.waitFor(() => expect(isOpen('Albums')).toBe(false));
      expect(persistentOpen.value).toBe(false);
    });

    test('a click or the focus elsewhere closes it', async () => {
      const { persistentOpen, button, isOpen } = await setup();
      await userEvent.click(button('Albums'));
      await vi.waitFor(() => expect(isOpen('Albums')).toBe(true));
      await userEvent.click(button('Elsewhere'));
      await vi.waitFor(() => expect(isOpen('Albums')).toBe(false));
      expect(persistentOpen.value).toBe(false);

      await userEvent.click(button('Albums'));
      await vi.waitFor(() => expect(isOpen('Albums')).toBe(true));
      button('Elsewhere').focus();
      await vi.waitFor(() => expect(isOpen('Albums')).toBe(false));
    });

    test("a click in it stays in it, rather than reaching the app's markup around it", async () => {
      const cardClicks: string[] = [];
      await render(
        defineComponent(
          () => () =>
            h(
              'div',
              {
                style: { ...theme, padding: '80px' },
                onClick: (event: MouseEvent) =>
                  cardClicks.push(
                    (event.target as HTMLElement).closest('button')!.textContent!.trim(),
                  ),
              },
              [
                h(
                  Tooltip,
                  { variant: 'rich', persistent: true, text: 'Invite people.' },
                  {
                    default: () => h(Button, null, () => 'Albums'),
                    actions: () => h(Button, { variant: 'text' }, () => 'Got it'),
                  },
                ),
              ],
            ),
        ),
      );
      const button = (name: string) =>
        [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === name)!;
      await userEvent.click(button('Albums'));
      await vi.waitFor(() =>
        expect(document.querySelector('.rio-tooltip')!.matches(':popover-open')).toBe(true),
      );
      await userEvent.click(button('Got it'));
      expect(cardClicks).toEqual(['Albums']);
    });

    test('with no element to show it for, it stays closed and says so', async () => {
      const open = ref(true);
      const host = document.body.appendChild(document.createElement('div'));
      const app = createApp(() =>
        h(Tooltip, {
          text: 'Nothing',
          open: open.value,
          'onUpdate:open': (next: boolean) => (open.value = next),
        }),
      );
      app.mount(host);
      await vi.waitFor(() => expect(open.value).toBe(false));
      expect(host.querySelector('.rio-tooltip')!.matches(':popover-open')).toBe(false);
      app.unmount();
      host.remove();
    });

    test('the app can open it, as a page that explains a new feature does', async () => {
      // Mounted with `createApp`: vitest-browser-vue moves what it renders into place afterwards,
      // which closes a popover that is open by then.
      const host = document.body.appendChild(document.createElement('div'));
      const app = createApp(() =>
        h('div', { style: { ...theme, padding: '80px' } }, [
          h(
            Tooltip,
            { variant: 'rich', persistent: true, open: true, text: 'New: shared albums' },
            () => h(Button, null, () => 'Albums'),
          ),
        ]),
      );
      app.mount(host);
      await nextTick();
      expect(host.querySelector('.rio-tooltip')!.matches(':popover-open')).toBe(true);
      app.unmount();
      host.remove();
    });
  });
});
