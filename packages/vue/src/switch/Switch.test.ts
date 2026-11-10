import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h } from 'vue';
import Switch from './Switch.vue';

const touch = (el: Element, type: string, clientX: number, pointerType = 'touch') =>
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      isPrimary: true,
      pointerId: 3,
      pointerType,
      clientX,
      buttons: type === 'pointerdown' ? 1 : 0,
    }),
  );

const handleLeft = (root: Element) =>
  getComputedStyle(root.querySelector('.rio-switch__handle')!).insetInlineStart;

describe('RioSwitch', () => {
  test('is an off switch button with the spec dimensions', async () => {
    const screen = await render(Switch);
    const sw = screen.getByRole('switch');
    await expect.element(sw).toHaveAttribute('aria-checked', 'false');
    await expect.element(sw).toHaveAttribute('type', 'button');
    const style = getComputedStyle(sw.element());
    expect([style.width, style.height]).toEqual(['52px', '32px']);
  });

  test('clicking requests the opposite value; the parent owns the state', async () => {
    const screen = await render(Switch);
    const sw = screen.getByRole('switch');
    await sw.click();
    expect(screen.emitted('update:selected')).toEqual([[true]]);
    await expect.element(sw).toHaveAttribute('aria-checked', 'false');
    await screen.rerender({ selected: true });
    await expect.element(sw).toHaveAttribute('aria-checked', 'true');
  });

  test('Space and Enter both toggle, as the spec says', async () => {
    const screen = await render(Switch);
    (screen.getByRole('switch').element() as HTMLElement).focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Enter}');
    expect(screen.emitted('update:selected')).toHaveLength(2);
  });

  test('disabled is not focusable and emits nothing', async () => {
    const screen = await render(Switch, { props: { disabled: true } });
    (screen.getByRole('switch').element() as HTMLElement).focus();
    expect(document.activeElement).not.toBe(screen.getByRole('switch').element());
    await screen.getByRole('switch').click({ force: true });
    expect(screen.emitted('update:selected')).toBeUndefined();
  });

  test('softDisabled stays focusable but emits nothing, even when dragged', async () => {
    const screen = await render(Switch, { props: { softDisabled: true } });
    const sw = screen.getByRole('switch');
    (sw.element() as HTMLElement).focus();
    expect(document.activeElement).toBe(sw.element());
    await userEvent.keyboard('{Enter}');
    touch(sw.element(), 'pointerdown', 10);
    touch(sw.element(), 'pointermove', 60);
    touch(sw.element(), 'pointerup', 60);
    expect(screen.emitted('update:selected')).toBeUndefined();
  });

  test('does not submit its form', async () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    const Form = defineComponent(() => () => h('form', { onSubmit }, [h(Switch)]));
    const screen = await render(Form);
    await screen.getByRole('switch').click();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('shows the icon for the current state and grows the handle for it', async () => {
    const screen = await render(Switch, {
      props: { selected: true },
      slots: { 'selected-icon': () => '✓' },
    });
    const sw = screen.getByRole('switch').element() as HTMLElement;
    expect(sw.hasAttribute('data-icon')).toBe(true);
    expect(sw.querySelector('.rio-switch__icon')?.textContent).toBe('✓');
    await screen.rerender({ selected: false });
    expect(sw.hasAttribute('data-icon')).toBe(false);
    expect(sw.querySelector('.rio-switch__icon')).toBeNull();
  });

  test('puts the handle at the start when off and at the end when on', async () => {
    const screen = await render(Switch);
    const sw = screen.getByRole('switch').element() as HTMLElement;
    // Off: center 16px, size 16px, inside a 2px outline → 16 - 8 - 2
    expect(handleLeft(sw)).toBe('6px');
    await screen.rerender({ selected: true });
    // On: center 36px, size 24px → 36 - 12 - 2
    await vi.waitFor(() => expect(handleLeft(sw)).toBe('22px'));
  });

  test('ripples in the circle around the handle, not on the track', async () => {
    const screen = await render(Switch);
    const sw = screen.getByRole('switch').element() as HTMLElement;
    expect(sw.hasAttribute('data-ripple')).toBe(false);
    expect(sw.querySelector('.rio-switch__state')!.hasAttribute('data-ripple')).toBe(true);
  });

  test('dragging the handle across with touch turns it on, once', async () => {
    const screen = await render(Switch);
    const sw = screen.getByRole('switch').element() as HTMLElement;
    touch(sw, 'pointerdown', 10);
    touch(sw, 'pointermove', 40);
    touch(sw, 'pointerup', 45);
    sw.click(); // the browser's click after the gesture is swallowed
    expect(screen.emitted('update:selected')).toEqual([[true]]);
  });

  test('a short touch is a tap', async () => {
    const screen = await render(Switch);
    const sw = screen.getByRole('switch').element() as HTMLElement;
    touch(sw, 'pointerdown', 10);
    touch(sw, 'pointermove', 12);
    touch(sw, 'pointerup', 12);
    sw.click();
    expect(screen.emitted('update:selected')).toEqual([[true]]);
  });

  test('the mouse clicks instead of dragging, as the spec says', async () => {
    const screen = await render(Switch);
    const sw = screen.getByRole('switch').element() as HTMLElement;
    touch(sw, 'pointerdown', 10, 'mouse');
    touch(sw, 'pointermove', 40, 'mouse');
    touch(sw, 'pointerup', 40, 'mouse');
    sw.click();
    expect(screen.emitted('update:selected')).toEqual([[true]]);
  });
});
