import { mdiDeleteOutline } from '@mdi/js';
import { attachDialog, type DialogCancelEvent, type DialogRole } from '@rio-m3e/core';
import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, reactive, type VNode } from 'vue';
import Button from '../button/Button.vue';
import Menu from '../menu/Menu.vue';
import MenuItem from '../menu/MenuItem.vue';
import { icon } from '../test/vrt';
import Dialog from './Dialog.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

interface Setup {
  role?: DialogRole;
  headline?: string;
  withIcon?: boolean;
  /** Cancels every request to close. */
  keepOpen?: boolean;
  content?: () => VNode | VNode[] | string;
  actions?: () => VNode[];
}

/**
 * A button that opens a dialog, and the dialog, as an app would write them: Cancel and Discard
 * close it. `state` holds what the app keeps, and what the dialog told it.
 */
const setup = async ({
  role,
  headline = 'Discard draft?',
  withIcon = false,
  keepOpen = false,
  content = () => 'Your draft will be lost.',
  actions,
}: Setup = {}) => {
  const state = reactive({ open: false, cancels: [] as string[], clicks: [] as string[] });
  const close = (name: string) => () => {
    state.clicks.push(name);
    state.open = false;
  };
  const screen = await render(
    defineComponent(
      () => () =>
        h(
          'div',
          { style: { padding: '40px', ...theme }, onClick: () => state.clicks.push('page') },
          [
            h('button', { onClick: () => (state.open = true) }, 'Open'),
            h(
              Dialog,
              {
                headline,
                role,
                open: state.open,
                'onUpdate:open': (next: boolean) => (state.open = next),
                onCancel: (event: DialogCancelEvent) => {
                  state.cancels.push(event.reason);
                  if (keepOpen) event.preventDefault();
                },
              },
              {
                default: content,
                ...(withIcon ? { icon: () => icon(mdiDeleteOutline) } : {}),
                actions:
                  actions ??
                  (() => [
                    h(Button, { variant: 'text', onClick: close('cancel') }, () => 'Cancel'),
                    h(Button, { variant: 'text', onClick: close('discard') }, () => 'Discard'),
                  ]),
              },
            ),
          ],
        ),
    ),
  );
  const dialog = () => screen.container.ownerDocument.querySelector<HTMLDialogElement>('dialog')!;
  const button = (name: string) =>
    [...screen.container.ownerDocument.querySelectorAll<HTMLElement>('button')].find(
      (each) => each.textContent?.trim() === name,
    )!;
  const open = async () => {
    await userEvent.click(button('Open'));
    await expect.poll(() => dialog().matches(':modal')).toBe(true);
    // Wait out the opening, so boxes are where they end up.
    await expect.poll(() => dialog().getAnimations({ subtree: true }).length).toBe(0);
  };
  return { state, dialog, button, open };
};

/** Clicks the scrim, `x` px to the left of the dialog. */
const clickScrim = async (dialog: HTMLElement, x = 20) => {
  const box = dialog.getBoundingClientRect();
  await userEvent.click(page.elementLocator(dialog), { position: { x: -x, y: box.height / 2 } });
};

describe('RioDialog', () => {
  test('opens as a modal alert dialog, named by its headline and described by its text', async () => {
    const { dialog, open } = await setup();
    expect(dialog().open).toBe(false);
    await open();
    const root = dialog();
    expect(root.getAttribute('role')).toBe('alertdialog');
    const headline = document.getElementById(root.getAttribute('aria-labelledby')!);
    expect(headline?.textContent).toBe('Discard draft?');
    expect(headline?.tagName).toBe('H2');
    const text = document.getElementById(root.getAttribute('aria-describedby')!);
    expect(text?.textContent).toBe('Your draft will be lost.');
  });

  test('a closed dialog renders no content; it goes once the closing motion ends', async () => {
    const { dialog, open, state } = await setup();
    expect(dialog().children).toHaveLength(0);
    expect(document.querySelector('h2')).toBeNull();
    await open();
    expect(dialog().children.length).toBeGreaterThan(0);
    state.open = false;
    await nextTick();
    // Still there while it fades out, for `fast-effects` (150ms)
    expect(dialog().getAnimations({ subtree: true }).length).toBeGreaterThan(0);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(dialog().children.length).toBeGreaterThan(0);
    await expect.poll(() => dialog().children.length).toBe(0);
  });

  test('opening again while it closes keeps the content', async () => {
    const { dialog, open, state } = await setup();
    await open();
    const headline = dialog().querySelector('h2');
    state.open = false;
    await nextTick();
    state.open = true;
    await nextTick();
    await expect.poll(() => dialog().getAnimations({ subtree: true }).length).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(dialog().matches(':modal')).toBe(true);
    expect(dialog().querySelector('h2')).toBe(headline);
  });

  test("the page doesn't scroll while a dialog is open", async () => {
    const html = document.documentElement;
    const tall = document.createElement('div');
    tall.style.height = '3000px';
    document.body.append(tall);
    try {
      const { dialog, open, state } = await setup();
      await open();
      expect(html.style.overflow).toBe('hidden');
      const before = window.scrollY;
      // Over the text, which doesn't scroll: the wheel would move on to the page.
      await userEvent.wheel(page.elementLocator(dialog()), { delta: { y: 600 } });
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(window.scrollY).toBe(before);
      state.open = false;
      await nextTick();
      expect(html.style.overflow).toBe('');
      expect(html.style.scrollbarGutter).toBe('');
    } finally {
      tall.remove();
    }
  });

  test('role="dialog" leaves the native role, and describes nothing', async () => {
    const { dialog, open } = await setup({ role: 'dialog' });
    await open();
    expect(dialog().hasAttribute('role')).toBe(false);
    expect(dialog().hasAttribute('aria-describedby')).toBe(false);
  });

  test('the focus goes to the first button, and back to the opener on closing', async () => {
    const { dialog, button, open, state } = await setup();
    await open();
    expect(document.activeElement).toBe(button('Cancel'));
    await userEvent.click(button('Discard'));
    expect(state.clicks).toContain('discard');
    expect(dialog().open).toBe(false);
    expect(document.activeElement).toBe(button('Open'));
  });

  test('the focus goes to an element marked autofocus instead', async () => {
    const { button, open } = await setup({
      actions: () => [
        h(Button, { variant: 'text' }, () => 'Cancel'),
        h(Button, { variant: 'text', autofocus: true }, () => 'Discard'),
      ],
    });
    await open();
    expect(document.activeElement).toBe(button('Discard'));
  });

  test('Tab and Shift+Tab go round the dialog', async () => {
    const { button, open } = await setup({
      content: () => [h('p', null, 'Your draft will be lost.'), h('a', { href: '#' }, 'Details')],
    });
    await open();
    expect(document.activeElement?.textContent).toBe('Details');
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(button('Cancel'));
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(button('Discard'));
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement?.textContent).toBe('Details');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(button('Discard'));
  });

  test('Tab with Alt, Ctrl, or Meta is left to the browser', async () => {
    const { button, open } = await setup({
      content: () => [h('p', null, 'Your draft will be lost.'), h('a', { href: '#' }, 'Details')],
    });
    await open();
    // On the last button, where Tab alone goes round to the first
    const last = button('Discard');
    last.focus();
    const tab = (init: KeyboardEventInit) =>
      last.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true, ...init }),
      );
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
      expect(tab({ [modifier]: true }), modifier).toBe(true);
      expect(document.activeElement).toBe(last);
    }
    expect(tab({})).toBe(false);
  });

  test('in a list of radio buttons, the focus goes to the checked one', async () => {
    const tones = ['None', 'Callisto', 'Ganymede', 'Luna'];
    const { open } = await setup({
      role: 'dialog',
      content: () =>
        tones.map((tone) =>
          h('label', null, [
            h('input', { type: 'radio', name: 'tone', value: tone, checked: tone === 'Luna' }),
            tone,
          ]),
        ),
    });
    await open();
    expect((document.activeElement as HTMLInputElement).value).toBe('Luna');
  });

  test('a press in something inside that keeps it, as a menu does, is never one on the scrim', async () => {
    const { dialog, open, state } = await setup({
      content: () =>
        h(
          'div',
          { class: 'keeps', onPointerdown: (event: Event) => event.stopPropagation() },
          'Menu',
        ),
    });
    await open();
    const root = dialog();
    const box = root.getBoundingClientRect();
    const outside = { clientX: box.left - 10, clientY: box.top + 10, bubbles: true };
    // A press on the scrim that no click follows, as when the pointer is released outside the window
    root.dispatchEvent(new PointerEvent('pointerdown', outside));
    // Then a press inside, released on the scrim: the click goes to the dialog, at the scrim.
    root.querySelector('.keeps')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    root.dispatchEvent(new MouseEvent('click', outside));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.open).toBe(true);
  });

  test('long text with nothing to focus takes the focus itself, after the buttons', async () => {
    const lines = Array.from({ length: 60 }, (_, index) => h('p', null, `Line ${index + 1}`));
    const { dialog, button, open } = await setup({ content: () => lines });
    await open();
    const content = dialog().querySelector<HTMLElement>('.rio-dialog__content')!;
    expect(content.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(button('Cancel'));
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(content);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(button('Discard'));
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(content);
  });

  // Chromium focuses content that scrolls on its own; WebKit needs the dialog to, once the content
  // has rendered its tabindex.
  test('long text with nothing else to focus takes the focus as the dialog opens', async () => {
    const lines = Array.from({ length: 60 }, (_, index) => h('p', null, `Line ${index + 1}`));
    const { dialog, open } = await setup({ content: () => lines, actions: () => [] });
    await open();
    const content = dialog().querySelector<HTMLElement>('.rio-dialog__content')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(content));
  });

  test('Tab skips disabled and hidden elements at the ends', async () => {
    const { button, open } = await setup({
      actions: () => [
        h(Button, { variant: 'text' }, () => 'Cancel'),
        h(Button, { variant: 'text' }, () => 'Discard'),
        h('button', { disabled: true }, 'Disabled'),
        h('button', { style: { display: 'none' } }, 'Hidden'),
      ],
    });
    await open();
    button('Discard').focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(button('Cancel'));
  });

  test('Escape asks to close, and closes it', async () => {
    const { dialog, open, state } = await setup();
    await open();
    await userEvent.keyboard('{Escape}');
    expect(state.cancels).toEqual(['escape']);
    expect(state.open).toBe(false);
    expect(dialog().open).toBe(false);
  });

  test('a click on the scrim asks to close, and closes it', async () => {
    const { dialog, open, state } = await setup();
    await open();
    state.clicks.length = 0;
    await clickScrim(dialog());
    expect(state.cancels).toEqual(['scrim']);
    expect(dialog().open).toBe(false);
    // The click stays in the dialog.
    expect(state.clicks).toEqual([]);
  });

  test('a canceled request keeps it open', async () => {
    const { dialog, open, state } = await setup({ keepOpen: true });
    await open();
    await userEvent.keyboard('{Escape}');
    await clickScrim(dialog());
    expect(state.cancels).toEqual(['escape', 'scrim']);
    expect(state.open).toBe(true);
    expect(dialog().matches(':modal')).toBe(true);
  });

  test('a click on the dialog itself, or a press that ends on the scrim, keeps it open', async () => {
    const { dialog, open, state } = await setup();
    await open();
    const root = dialog();
    // The padding above the headline is the dialog's own box.
    await userEvent.click(page.elementLocator(root), { position: { x: 100, y: 8 } });
    // Selecting the text from inside the dialog out onto the scrim
    const text = root.querySelector<HTMLElement>('.rio-dialog__content')!;
    const box = root.getBoundingClientRect();
    await userEvent.dragAndDrop(page.elementLocator(text), page.elementLocator(root), {
      targetPosition: { x: -20, y: box.height / 2 },
    });
    expect(state.cancels).toEqual([]);
    expect(root.open).toBe(true);
  });

  test('a click on the scrim while a menu from the dialog is open closes only the menu', async () => {
    const menu = reactive({ open: false, anchor: undefined as HTMLElement | undefined });
    const { dialog, button, open, state } = await setup({
      content: () => [
        h(
          'button',
          {
            ref: (element) => (menu.anchor = (element as HTMLElement | null) ?? undefined),
            onClick: () => (menu.open = true),
          },
          'More',
        ),
        h(
          Menu,
          {
            label: 'More',
            anchor: menu.anchor,
            open: menu.open,
            'onUpdate:open': (next: boolean) => (menu.open = next),
          },
          () => h(MenuItem, null, () => 'Rename'),
        ),
      ],
    });
    await open();
    await userEvent.click(button('More'));
    const popup = document.querySelector<HTMLElement>('[role="menu"]')!;
    await expect.poll(() => popup.matches(':popover-open')).toBe(true);
    await clickScrim(dialog());
    await expect.poll(() => popup.matches(':popover-open')).toBe(false);
    expect(state.cancels).toEqual([]);
    expect(dialog().open).toBe(true);
    await clickScrim(dialog());
    expect(state.cancels).toEqual(['scrim']);
    expect(dialog().open).toBe(false);
  });

  test('Escape with a menu from the dialog open closes only the menu', async () => {
    const menu = reactive({ open: false, anchor: undefined as HTMLElement | undefined });
    const { dialog, button, open, state } = await setup({
      content: () => [
        h(
          'button',
          {
            ref: (element) => (menu.anchor = (element as HTMLElement | null) ?? undefined),
            onClick: () => (menu.open = true),
          },
          'More',
        ),
        h(
          Menu,
          {
            label: 'More',
            anchor: menu.anchor,
            open: menu.open,
            'onUpdate:open': (next: boolean) => (menu.open = next),
          },
          () => h(MenuItem, null, () => 'Rename'),
        ),
      ],
    });
    await open();
    await userEvent.click(button('More'));
    await expect.poll(() => menu.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(menu.open).toBe(false);
    expect(state.cancels).toEqual([]);
    expect(dialog().open).toBe(true);
  });

  test('long content scrolls between the headline and the buttons, with dividers', async () => {
    const lines = Array.from({ length: 60 }, (_, index) => h('p', null, `Line ${index + 1}`));
    const { dialog, open, state } = await setup({ content: () => lines });
    await open();
    const root = dialog();
    const content = root.querySelector<HTMLElement>('.rio-dialog__content')!;
    const headline = root.querySelector<HTMLElement>('.rio-dialog__headline')!;
    const actions = root.querySelector<HTMLElement>('.rio-dialog__actions')!;
    // The dialog keeps 24px from the window's edges.
    expect(root.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight - 48);
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    expect(content.hasAttribute('data-overflow-top')).toBe(false);
    expect(content.hasAttribute('data-overflow-bottom')).toBe(true);
    expect(getComputedStyle(content).boxShadow).toMatch(/^rgba\(0, 0, 0, 0\).*rgb\(/);

    content.scrollTop = content.scrollHeight;
    await expect.poll(() => content.hasAttribute('data-overflow-top')).toBe(true);
    expect(content.hasAttribute('data-overflow-bottom')).toBe(false);
    // The headline and the buttons stay inside the dialog.
    const box = root.getBoundingClientRect();
    expect(headline.getBoundingClientRect().top).toBeGreaterThanOrEqual(box.top);
    expect(actions.getBoundingClientRect().bottom).toBeLessThanOrEqual(box.bottom);

    // Opening again starts at the top.
    state.open = false;
    await nextTick();
    state.open = true;
    await expect.poll(() => root.matches(':modal')).toBe(true);
    expect(content.scrollTop).toBe(0);
    expect(content.hasAttribute('data-overflow-top')).toBe(false);
  });

  test('short content shows no dividers', async () => {
    const { dialog, open } = await setup();
    await open();
    const content = dialog().querySelector<HTMLElement>('.rio-dialog__content')!;
    expect(content.hasAttribute('data-overflow-top')).toBe(false);
    expect(content.hasAttribute('data-overflow-bottom')).toBe(false);
    expect(content.hasAttribute('tabindex')).toBe(false);
  });

  test('content that grows while open gets its dividers', async () => {
    const count = reactive({ lines: 1 });
    const { dialog, open } = await setup({
      content: () =>
        Array.from({ length: count.lines }, (_, index) => h('p', null, `Line ${index}`)),
    });
    await open();
    const content = dialog().querySelector<HTMLElement>('.rio-dialog__content')!;
    expect(content.hasAttribute('data-overflow-bottom')).toBe(false);
    count.lines = 60;
    await expect.poll(() => content.hasAttribute('data-overflow-bottom')).toBe(true);
  });

  test('the confirming button sits last, at the end', async () => {
    const { button, open } = await setup();
    await open();
    const cancel = button('Cancel').getBoundingClientRect();
    const discard = button('Discard').getBoundingClientRect();
    expect(discard.left).toBeGreaterThan(cancel.right);
    expect(discard.top).toBe(cancel.top);
  });

  test('buttons too long to sit side by side stack, the confirming one on top', async () => {
    const long = await setup({
      actions: () => [
        h(Button, { variant: 'text' }, () => 'Keep editing the draft for now'),
        h(Button, { variant: 'text' }, () => 'Discard the draft and every attachment'),
      ],
    });
    await long.open();
    // At its narrowest, so they can't fit side by side whatever the font
    long.dialog().style.maxInlineSize = '280px';
    const keep = long.button('Keep editing the draft for now').getBoundingClientRect();
    const drop = long.button('Discard the draft and every attachment').getBoundingClientRect();
    expect(drop.bottom).toBeLessThanOrEqual(keep.top);
  });

  test('an icon centers itself and the headline', async () => {
    const { dialog, open } = await setup({ withIcon: true });
    await open();
    const root = dialog();
    const iconBox = root.querySelector<HTMLElement>('.rio-dialog__icon')!;
    expect(iconBox.getAttribute('aria-hidden')).toBe('true');
    const box = root.getBoundingClientRect();
    const own = iconBox.getBoundingClientRect();
    expect(Math.abs(own.left + own.width / 2 - (box.left + box.width / 2))).toBeLessThan(1);
    expect(getComputedStyle(root.querySelector('.rio-dialog__headline')!).textAlign).toBe('center');
  });

  test('measures as the spec does', async () => {
    const { dialog, button, open } = await setup();
    await open();
    const root = dialog();
    const box = root.getBoundingClientRect();
    const headline = root
      .querySelector<HTMLElement>('.rio-dialog__headline')!
      .getBoundingClientRect();
    const content = root
      .querySelector<HTMLElement>('.rio-dialog__content')!
      .getBoundingClientRect();
    const actions = root
      .querySelector<HTMLElement>('.rio-dialog__actions')!
      .getBoundingClientRect();
    expect(box.width).toBe(280);
    expect(getComputedStyle(root, '::before').borderRadius).toBe('28px');
    expect(headline.top - box.top).toBe(24);
    expect(content.top - headline.bottom).toBe(16);
    expect(actions.top - content.bottom).toBe(24);
    expect(box.bottom - actions.bottom).toBe(24);
    expect(box.right - button('Discard').getBoundingClientRect().right).toBe(24);
    expect(
      button('Discard').getBoundingClientRect().left -
        button('Cancel').getBoundingClientRect().right,
    ).toBe(8);
  });

  test('a form with method="dialog" closes it', async () => {
    const { dialog, button, open, state } = await setup({
      content: () => h('form', { method: 'dialog', id: 'draft' }),
      actions: () => [h('button', { form: 'draft', value: 'discard' }, 'Submit')],
    });
    await open();
    await userEvent.click(button('Submit'));
    await expect.poll(() => state.open).toBe(false);
    expect(dialog().open).toBe(false);
    expect(state.cancels).toEqual([]);
  });

  test('another dialog opened from it closes first on Escape', async () => {
    const inner = reactive({ open: false });
    const { dialog, button, open, state } = await setup({
      content: () => [
        h('button', { onClick: () => (inner.open = true) }, 'Details'),
        h(
          Dialog,
          {
            headline: 'Details',
            open: inner.open,
            'onUpdate:open': (next: boolean) => (inner.open = next),
          },
          () => 'More about it.',
        ),
      ],
    });
    await open();
    await userEvent.click(button('Details'));
    const dialogs = [...document.querySelectorAll('dialog')];
    await expect.poll(() => dialogs[1]!.matches(':modal')).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(inner.open).toBe(false);
    expect(dialog().open).toBe(true);
    expect(state.cancels).toEqual([]);
    expect(document.activeElement).toBe(button('Details'));
  });

  test('unmounting it while open closes it and returns the focus', async () => {
    const shown = reactive({ dialog: true, open: false });
    const screen = await render(
      defineComponent(
        () => () =>
          h('div', { style: theme }, [
            h('button', { onClick: () => (shown.open = true) }, 'Open'),
            shown.dialog
              ? h(
                  Dialog,
                  {
                    headline: 'Gone',
                    open: shown.open,
                    'onUpdate:open': (next: boolean) => (shown.open = next),
                  },
                  { actions: () => h('button', null, 'OK') },
                )
              : null,
          ]),
      ),
    );
    const opener = screen.container.querySelector('button')!;
    await userEvent.click(opener);
    const root = document.querySelector('dialog')!;
    await expect.poll(() => root.matches(':modal')).toBe(true);
    shown.dialog = false;
    await nextTick();
    expect(root.isConnected).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  test('an app that turns a request down by keeping it open still gets the next one', async () => {
    // As a controlled app might: `open` stays as it is the first time.
    const state = reactive({ open: false, requests: 0 });
    const screen = await render(
      defineComponent(
        () => () =>
          h('div', { style: theme }, [
            h(
              Dialog,
              {
                headline: 'Unsaved changes',
                open: state.open,
                'onUpdate:open': (next: boolean) => {
                  if (!next && ++state.requests === 1) return;
                  state.open = next;
                },
              },
              { actions: () => h('button', null, 'OK') },
            ),
          ]),
      ),
    );
    state.open = true;
    const root = screen.container.querySelector('dialog')!;
    await expect.poll(() => root.matches(':modal')).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect([state.requests, root.open]).toEqual([1, true]);
    await userEvent.keyboard('{Escape}');
    expect(state.requests).toBe(2);
    await expect.poll(() => root.open).toBe(false);
  });
});

describe('attachDialog', () => {
  const build = () => {
    const root = document.body.appendChild(document.createElement('dialog'));
    for (const name of ['First', 'Second', 'Third']) {
      root.appendChild(document.createElement('button')).textContent = name;
    }
    root.children[2]!.setAttribute('autofocus', '');
    return { root, buttons: [...root.children] as HTMLElement[] };
  };

  test('initialFocus picks what to focus as it opens, ahead of autofocus', () => {
    const { root, buttons } = build();
    const handle = attachDialog(root, { onOpenChange: () => {}, initialFocus: () => buttons[1] });
    handle.sync(true);
    expect(document.activeElement).toBe(buttons[1]);
    handle.detach();
    root.remove();
  });

  test('without an element from initialFocus, autofocus decides', () => {
    const { root, buttons } = build();
    const handle = attachDialog(root, { onOpenChange: () => {}, initialFocus: () => null });
    handle.sync(true);
    expect(document.activeElement).toBe(buttons[2]);
    handle.detach();
    root.remove();
  });
});
