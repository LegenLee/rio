import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { attachOverlay, type OverlayHandle, type OverlayOptions } from './overlay';

const handles: OverlayHandle[] = [];
const cleanup: Element[] = [];

afterEach(() => {
  for (const handle of handles.splice(0)) handle.detach();
  for (const element of cleanup.splice(0)) element.remove();
});

const element = <K extends 'div' | 'dialog' | 'button'>(
  tag: K,
  parent: Element = document.body,
) => {
  const created = document.createElement(tag);
  created.style.cssText = 'position: fixed; inset: auto; margin: 0; top: 10px; left: 10px;';
  parent.append(created);
  if (parent === document.body) cleanup.push(created);
  return created;
};

/** An overlay whose adapter closes it whenever `onClose` asks, as a controlled component does. */
const overlay = (target: HTMLElement, options: Omit<OverlayOptions, 'onClose'>) => {
  const onClose = vi.fn(() => handle.hide());
  const handle = attachOverlay(target, { ...options, onClose });
  handles.push(handle);
  return { element: target, handle, onClose };
};

const isOpen = (target: Element) =>
  target instanceof HTMLDialogElement ? target.open : target.matches(':popover-open');
/** Toggle and close events arrive a task later. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

/** A button away from everything, to click outside. */
const outside = () => {
  const button = element('button');
  button.textContent = 'outside';
  Object.assign(button.style, { top: '500px', left: '600px' });
  return button;
};

describe('attachOverlay', () => {
  test('a click outside closes an auto popover, which reports it', async () => {
    const menu = overlay(element('div'), { mode: 'auto' });
    const away = outside();
    menu.handle.show();
    expect(isOpen(menu.element)).toBe(true);
    await userEvent.click(away);
    await vi.waitFor(() => expect(menu.onClose).toHaveBeenCalledExactlyOnceWith('dismiss'));
    expect(isOpen(menu.element)).toBe(false);
  });

  test('hide() closes it without reporting', async () => {
    const menu = overlay(element('div'), { mode: 'auto' });
    menu.handle.show();
    menu.handle.hide();
    await settle();
    expect(isOpen(menu.element)).toBe(false);
    expect(menu.onClose).not.toHaveBeenCalled();
  });

  // Firefox would close both at once, since the submenu opened without a user activation.
  test('Escape asks only the topmost overlay to close', async () => {
    const menu = overlay(element('div'), { mode: 'auto' });
    const submenu = overlay(element('div', menu.element), { mode: 'auto' });
    menu.handle.show();
    submenu.handle.show();

    await userEvent.keyboard('{Escape}');
    await settle();
    expect(submenu.onClose).toHaveBeenCalledExactlyOnceWith('escape');
    expect(menu.onClose).not.toHaveBeenCalled();
    expect([isOpen(menu.element), isOpen(submenu.element)]).toEqual([true, false]);

    await userEvent.keyboard('{Escape}');
    await settle();
    expect(menu.onClose).toHaveBeenCalledExactlyOnceWith('escape');
    expect(isOpen(menu.element)).toBe(false);
  });

  test('Escape that something inside already handled is left alone', async () => {
    const menu = overlay(element('div'), { mode: 'auto' });
    const field = element('button', menu.element);
    field.addEventListener('keydown', (event) => event.preventDefault());
    menu.handle.show();
    field.focus();
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(menu.onClose).not.toHaveBeenCalled();
    expect(isOpen(menu.element)).toBe(true);
  });

  test('a modal dialog covers the menu open before it, and closes it', async () => {
    const menu = overlay(element('div'), { mode: 'auto' });
    const dialog = overlay(element('dialog'), { mode: 'modal' });
    menu.handle.show();
    dialog.handle.show();
    await settle();
    expect(isOpen(menu.element)).toBe(false);
    expect(menu.onClose).toHaveBeenCalledExactlyOnceWith('dismiss');
    expect(isOpen(dialog.element)).toBe(true);
  });

  test('closing a dialog closes the popovers opened from it', async () => {
    const dialog = overlay(element('dialog'), { mode: 'modal' });
    const inner = overlay(element('div', dialog.element), { mode: 'auto' });
    // Elsewhere in the DOM, but opened from a button in the dialog
    const source = element('button', dialog.element);
    const fromSource = overlay(element('div'), { mode: 'manual' });
    dialog.handle.show();
    inner.handle.show();
    fromSource.handle.show(source);

    dialog.handle.hide();
    await settle();
    expect([isOpen(inner.element), isOpen(fromSource.element)]).toEqual([false, false]);
    expect(inner.onClose).toHaveBeenCalledExactlyOnceWith('parent');
    expect(fromSource.onClose).toHaveBeenCalledExactlyOnceWith('parent');
    expect(dialog.onClose).not.toHaveBeenCalled();
  });

  test('Escape closes a menu over a dialog first, then the dialog', async () => {
    const dialog = overlay(element('dialog'), { mode: 'modal' });
    const menu = overlay(element('div', dialog.element), { mode: 'auto' });
    dialog.handle.show();
    menu.handle.show();

    await userEvent.keyboard('{Escape}');
    await settle();
    expect([isOpen(dialog.element), isOpen(menu.element)]).toEqual([true, false]);
    expect(dialog.onClose).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');
    await settle();
    expect(dialog.onClose).toHaveBeenCalledExactlyOnceWith('escape');
    expect(isOpen(dialog.element)).toBe(false);
  });

  test('a transient overlay closes when another overlay opens', async () => {
    const first = overlay(element('div'), { mode: 'manual', transient: true });
    const second = overlay(element('div'), { mode: 'manual', transient: true });
    const menu = overlay(element('div'), { mode: 'auto' });
    first.handle.show();
    second.handle.show();
    await settle();
    expect([isOpen(first.element), isOpen(second.element)]).toEqual([false, true]);
    expect(first.onClose).toHaveBeenCalledExactlyOnceWith('replaced');

    menu.handle.show();
    await settle();
    expect(isOpen(second.element)).toBe(false);
    expect(second.onClose).toHaveBeenCalledExactlyOnceWith('replaced');
    expect(isOpen(menu.element)).toBe(true);
  });

  test('a modal overlay has to be a dialog', () => {
    expect(() => attachOverlay(element('div'), { mode: 'modal', onClose: () => {} })).toThrow(
      TypeError,
    );
  });

  test('detach closes it quietly and stops listening', async () => {
    const menu = overlay(element('div'), { mode: 'auto' });
    menu.handle.show();
    handles.splice(handles.indexOf(menu.handle), 1);
    menu.handle.detach();
    await settle();
    expect(isOpen(menu.element)).toBe(false);
    expect(menu.element.hasAttribute('popover')).toBe(false);
    await userEvent.keyboard('{Escape}');
    expect(menu.onClose).not.toHaveBeenCalled();
  });

  test('detaching twice leaves the other overlays listening', async () => {
    const gone = overlay(element('div'), { mode: 'manual' });
    // Manual, so only Rio closes it on Escape
    const kept = overlay(element('div'), { mode: 'manual' });
    gone.handle.detach();
    gone.handle.detach();
    kept.handle.show();
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(kept.onClose).toHaveBeenCalledExactlyOnceWith('escape');
  });

  // The events of the first close arrive after the second opening.
  test('a submenu learns that its menu closed', async () => {
    const menu = overlay(element('div'), { mode: 'auto' });
    const submenu = overlay(element('div', menu.element), { mode: 'auto' });
    menu.handle.show();
    submenu.handle.show();
    menu.handle.hide();
    await settle();
    expect(submenu.onClose).toHaveBeenCalledExactlyOnceWith('parent');
    expect(menu.onClose).not.toHaveBeenCalled();
  });

  test("a dialog's cancel, such as the back gesture, is a request the adapter decides", () => {
    const onClose = vi.fn();
    const dialog = element('dialog');
    const handle = attachOverlay(dialog, { mode: 'modal', onClose });
    handles.push(handle);
    handle.show();
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledExactlyOnceWith('escape');
    expect(dialog.open).toBe(true);
  });

  describe('hide() and show() in one task', () => {
    test('a popover closed by a click outside still reports it', async () => {
      const menu = overlay(element('div'), { mode: 'auto' });
      const away = outside();
      menu.handle.show();
      menu.handle.hide();
      menu.handle.show();
      await settle();
      await userEvent.click(away);
      await vi.waitFor(() => expect(menu.onClose).toHaveBeenCalledExactlyOnceWith('dismiss'));
    });

    test('a dialog still closes what it opened', async () => {
      const dialog = overlay(element('dialog'), { mode: 'modal' });
      const inner = overlay(element('div', dialog.element), { mode: 'manual' });
      dialog.handle.show();
      dialog.handle.hide();
      dialog.handle.show();
      await settle();
      inner.handle.show();
      dialog.handle.hide();
      await settle();
      expect(isOpen(inner.element)).toBe(false);
      expect(inner.onClose).toHaveBeenCalledExactlyOnceWith('parent');
    });
  });

  describe('shown again in the task Rio closed it in', () => {
    test('it goes back on top, so Escape closes it first', async () => {
      const tooltip = overlay(element('div'), { mode: 'manual', transient: true });
      const menu = overlay(element('div'), { mode: 'auto' });
      tooltip.handle.show();
      menu.handle.show(); // closes the tooltip ('replaced')
      tooltip.handle.show();
      await settle();
      await userEvent.keyboard('{Escape}');
      await settle();
      expect(tooltip.onClose).toHaveBeenCalledExactlyOnceWith('escape');
      expect(menu.onClose).not.toHaveBeenCalled();
    });

    test('the reason given then is void', async () => {
      const tooltip = overlay(element('div'), { mode: 'auto', transient: true });
      const menu = overlay(element('div', tooltip.element), { mode: 'auto' });
      const away = outside();
      tooltip.handle.show();
      menu.handle.show(); // closes the tooltip ('replaced')
      tooltip.handle.show();
      await settle();
      menu.handle.hide();
      await userEvent.click(away);
      await vi.waitFor(() => expect(tooltip.onClose).toHaveBeenCalledExactlyOnceWith('dismiss'));
    });
  });

  test("Escape in the app's own non-modal dialog still closes Rio's topmost overlay", async () => {
    const tooltip = overlay(element('div'), { mode: 'manual', transient: true });
    tooltip.handle.show();
    const appDialog = element('dialog');
    const button = element('button', appDialog);
    appDialog.show();
    button.focus();
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(tooltip.onClose).toHaveBeenCalledExactlyOnceWith('escape');
    expect(appDialog.open).toBe(true);
  });

  test("Escape aimed at the app's own dialog is left to the browser", async () => {
    const tooltip = overlay(element('div'), { mode: 'manual', transient: true });
    tooltip.handle.show();
    const appDialog = element('dialog');
    const button = element('button', appDialog);
    appDialog.showModal();
    button.focus();
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(appDialog.open).toBe(false);
    expect(isOpen(tooltip.element)).toBe(true);
    expect(tooltip.onClose).not.toHaveBeenCalled();
  });
});
