import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-vue';
import Switch from './Switch.vue';

describe('RioSwitch', () => {
  test('renders as an unchecked switch by default', async () => {
    const screen = await render(Switch);
    await expect.element(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  test('clicking emits update:checked without changing the prop itself', async () => {
    const screen = await render(Switch, { props: { checked: false } });
    await screen.getByRole('switch').click();
    expect(screen.emitted('update:checked')).toEqual([[true]]);
    // The parent owns the state, so nothing changes until it passes the new value back.
    await expect.element(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    await screen.rerender({ checked: true });
    await expect.element(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  test('clicking a disabled switch emits nothing', async () => {
    const screen = await render(Switch, { props: { disabled: true } });
    // Playwright refuses to click aria-disabled elements, but real pointers can still click them.
    // Force the click so the guard in core is what gets tested.
    await screen.getByRole('switch').click({ force: true });
    expect(screen.emitted('update:checked')).toBeUndefined();
  });
});
