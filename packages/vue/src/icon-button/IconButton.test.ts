import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import IconButton from './IconButton.vue';

const icon = { slots: { default: () => '♡' } };

// [size, width, expected width × height in px], from Material Web's icon button tokens:
// icon size + 2 × the leading/trailing space for that width.
const SIZES = [
  ['xsmall', 'narrow', 28, 32],
  ['xsmall', 'default', 32, 32],
  ['xsmall', 'wide', 40, 32],
  ['small', 'narrow', 32, 40],
  ['small', 'default', 40, 40],
  ['small', 'wide', 52, 40],
  ['medium', 'narrow', 48, 56],
  ['medium', 'default', 56, 56],
  ['medium', 'wide', 72, 56],
  ['large', 'narrow', 64, 96],
  ['large', 'default', 96, 96],
  ['large', 'wide', 128, 96],
  ['xlarge', 'narrow', 104, 136],
  ['xlarge', 'default', 136, 136],
  ['xlarge', 'wide', 184, 136],
] as const;

describe('RioIconButton', () => {
  test('is named by its label, not its icon', async () => {
    const screen = await render(IconButton, { ...icon, props: { label: 'Add to favorites' } });
    const button = screen.getByRole('button', { name: 'Add to favorites' });
    await expect.element(button).toBeVisible();
    await expect.element(button).toHaveAttribute('data-variant', 'filled');
  });

  test.each(SIZES)('%s %s is %ipx × %ipx', async (size, width, w, h) => {
    const screen = await render(IconButton, { ...icon, props: { label: 'Go', size, width } });
    const rect = screen.getByRole('button').element().getBoundingClientRect();
    expect([rect.width, rect.height]).toEqual([w, h]);
  });

  test('has no elevation, even when filled', async () => {
    const screen = await render(IconButton, { ...icon, props: { label: 'Go' } });
    expect(getComputedStyle(screen.getByRole('button').element()).boxShadow).toBe('none');
  });

  test('a toggle swaps to the selected icon and reports its state', async () => {
    const screen = await render(IconButton, {
      props: { label: 'Favorite', toggle: true, variant: 'standard' },
      slots: { default: () => '♡', 'selected-icon': () => '♥' },
    });
    const button = screen.getByRole('button');
    await expect.element(button).toHaveAttribute('aria-pressed', 'false');
    await expect.element(button).toHaveTextContent('♡');
    await button.click();
    expect(screen.emitted('update:selected')).toEqual([[true]]);
    await screen.rerender({ selected: true });
    await expect.element(button).toHaveTextContent('♥');
  });

  // Focusability is checked with focus() rather than Tab: Tab order depends on where the previous
  // test left the focus, which can be outside the page.
  test('disabled is not focusable', async () => {
    const screen = await render(IconButton, { ...icon, props: { label: 'A', disabled: true } });
    const el = screen.getByRole('button').element() as HTMLElement;
    el.focus();
    expect(document.activeElement).not.toBe(el);
  });

  test('softDisabled stays focusable but emits nothing', async () => {
    const screen = await render(IconButton, { ...icon, props: { label: 'B', softDisabled: true } });
    const el = screen.getByRole('button').element() as HTMLElement;
    el.focus();
    expect(document.activeElement).toBe(el);
    await userEvent.keyboard('{Enter}');
    await screen.getByRole('button').click({ force: true });
    expect(screen.emitted('click')).toBeUndefined();
  });

  test('extra small icon buttons still have a 48px touch target', async () => {
    const screen = await render(IconButton, {
      ...icon,
      props: { label: 'Go', size: 'xsmall', width: 'narrow' },
    });
    const touch = screen.container.querySelector('.rio-button__touch')!;
    expect([getComputedStyle(touch).width, getComputedStyle(touch).height]).toEqual([
      '48px',
      '48px',
    ]);
  });
});
