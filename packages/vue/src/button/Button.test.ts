import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h } from 'vue';
import Button from './Button.vue';

const label = { slots: { default: () => 'Save' } };

describe('RioButton', () => {
  test('renders a native button with its label', async () => {
    const screen = await render(Button, label);
    const button = screen.getByRole('button', { name: 'Save' });
    await expect.element(button).toHaveAttribute('type', 'button');
    await expect.element(button).toHaveAttribute('data-variant', 'filled');
  });

  test('emits click', async () => {
    const screen = await render(Button, label);
    await screen.getByRole('button').click();
    expect(screen.emitted('click')).toHaveLength(1);
  });

  test('disabled is not focusable and emits nothing', async () => {
    const screen = await render(Button, { ...label, props: { disabled: true } });
    const button = screen.getByRole('button');
    await expect.element(button).toBeDisabled();
    (button.element() as HTMLElement).focus();
    expect(document.activeElement).not.toBe(button.element());
    await button.click({ force: true });
    expect(screen.emitted('click')).toBeUndefined();
  });

  test('softDisabled stays focusable but emits nothing', async () => {
    const screen = await render(Button, { ...label, props: { softDisabled: true } });
    const button = screen.getByRole('button');
    await expect.element(button).toHaveAttribute('aria-disabled', 'true');
    (button.element() as HTMLElement).focus();
    expect(document.activeElement).toBe(button.element());
    await userEvent.keyboard('{Enter}');
    await button.click({ force: true });
    expect(screen.emitted('click')).toBeUndefined();
  });

  test('softDisabled submit buttons do not submit their form', async () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    const Form = defineComponent(
      () => () =>
        h('form', { onSubmit }, [h(Button, { type: 'submit', softDisabled: true }, () => 'Send')]),
    );
    const screen = await render(Form);
    await screen.getByRole('button').click({ force: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('a toggle button reports and requests its state', async () => {
    const screen = await render(Button, { ...label, props: { toggle: true, selected: false } });
    const button = screen.getByRole('button');
    await expect.element(button).toHaveAttribute('aria-pressed', 'false');
    await button.click();
    expect(screen.emitted('update:selected')).toEqual([[true]]);
    // The parent owns the state.
    await expect.element(button).toHaveAttribute('aria-pressed', 'false');
    await screen.rerender({ selected: true });
    await expect.element(button).toHaveAttribute('aria-pressed', 'true');
  });

  test('hides the icon from assistive technology', async () => {
    const screen = await render(Button, {
      slots: { default: () => 'Add', icon: () => '+' },
    });
    await expect.element(screen.getByRole('button', { name: 'Add' })).toBeVisible();
  });

  test.each([
    ['xsmall', '32px'],
    ['small', '40px'],
    ['medium', '56px'],
    ['large', '96px'],
    ['xlarge', '136px'],
  ] as const)('%s is %s tall, with a round shape of half that', async (size, height) => {
    const screen = await render(Button, { ...label, props: { size } });
    const style = getComputedStyle(screen.getByRole('button').element());
    expect(style.height).toBe(height);
    expect(style.borderTopLeftRadius).toBe(`${parseInt(height) / 2}px`);
  });

  test.each(['small', 'xlarge'] as const)(
    'the state layer and ripple cover the whole %s button, border included',
    async (size) => {
      const screen = await render(Button, { ...label, props: { size } });
      const el = screen.getByRole('button').element();
      const width = `${el.getBoundingClientRect().width}px`;
      for (const pseudo of ['::before', '::after']) {
        expect(parseFloat(getComputedStyle(el, pseudo).width)).toBeCloseTo(parseFloat(width), 1);
      }
    },
  );

  test('extra small buttons still have a 48px touch target', async () => {
    const screen = await render(Button, { ...label, props: { size: 'xsmall' } });
    const touch = screen.container.querySelector('.rio-button__touch')!;
    expect(getComputedStyle(touch).height).toBe('48px');
  });
});
