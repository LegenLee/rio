import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test, vi } from 'vitest';
import { userEvent, type Locator } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h } from 'vue';
import Button from './Button.vue';

const label = { slots: { default: () => 'Save' } };

/**
 * Clicks and reports whether anything canceled the click's default action, which on a link is
 * following it. A listener on the window cancels it afterwards either way, so the page stays put.
 */
const canceled = async (target: Locator) => {
  let prevented: boolean | undefined;
  const look = (event: Event) => {
    prevented = event.defaultPrevented;
    event.preventDefault();
  };
  window.addEventListener('click', look);
  try {
    await target.click();
  } finally {
    window.removeEventListener('click', look);
  }
  return prevented;
};

describe('RioButton', () => {
  test('renders a native button with its label', async () => {
    const screen = await render(Button, label);
    const button = screen.getByRole('button', { name: 'Save' });
    await expect.element(button).toHaveAttribute('type', 'button');
    await expect.element(button).toHaveAttribute('data-variant', 'filled');
  });

  test("keeps core's classes next to the ones the app adds", async () => {
    const screen = await render(Button, { ...label, attrs: { class: 'app-class' } });
    const classes = screen.getByRole('button').element().classList;
    for (const name of ['rio-button', 'rio-state-layer', 'rio-focus-ring', 'app-class']) {
      expect(classes.contains(name)).toBe(true);
    }
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

  describe('as a link', () => {
    test('renders an <a> with the href, and passes target and rel on', async () => {
      const screen = await render(Button, {
        ...label,
        props: { href: '/settings' },
        attrs: { target: '_blank', rel: 'noopener' },
      });
      const link = screen.getByRole('link', { name: 'Save' });
      await expect.element(link).toHaveAttribute('href', '/settings');
      await expect.element(link).toHaveAttribute('target', '_blank');
      await expect.element(link).toHaveAttribute('rel', 'noopener');
      await expect.element(link).not.toHaveAttribute('type');
      expect(getComputedStyle(link.element()).textDecorationLine).toBe('none');
    });

    test('emits click and leaves the navigation alone', async () => {
      const screen = await render(Button, { ...label, props: { href: '#saved' } });
      expect(await canceled(screen.getByRole('link'))).toBe(false);
      expect(screen.emitted('click')).toHaveLength(1);
    });

    test("the app's click listener can take the navigation over", async () => {
      // A router's `navigate`: it lets clicks that open elsewhere through and cancels the rest.
      const seen: (EventTarget | null)[] = [];
      const navigate = vi.fn((event: MouseEvent) => {
        seen.push(event.currentTarget);
        const anchor = event.currentTarget as HTMLAnchorElement;
        if (event.defaultPrevented || event.ctrlKey || anchor.target === '_blank') return;
        event.preventDefault();
      });
      const screen = await render(Button, {
        ...label,
        props: { href: '#routed', onClick: navigate },
      });
      const link = screen.getByRole('link');
      expect(await canceled(link)).toBe(true);
      // The listener runs while the click is still at the <a>, which is where it reads `target`.
      expect(seen).toEqual([link.element()]);
    });

    test('disabled has no href, is not focusable, and emits nothing', async () => {
      const screen = await render(Button, { ...label, props: { href: '/s', disabled: true } });
      const link = screen.getByRole('link', { name: 'Save' });
      await expect.element(link).not.toHaveAttribute('href');
      await expect.element(link).toHaveAttribute('aria-disabled', 'true');
      (link.element() as HTMLElement).focus();
      expect(document.activeElement).not.toBe(link.element());
      await link.click({ force: true });
      expect(screen.emitted('click')).toBeUndefined();
    });

    test('softDisabled has no href but stays focusable, and emits nothing', async () => {
      const screen = await render(Button, { ...label, props: { href: '/s', softDisabled: true } });
      const link = screen.getByRole('link', { name: 'Save' });
      await expect.element(link).not.toHaveAttribute('href');
      await expect.element(link).toHaveAttribute('aria-disabled', 'true');
      (link.element() as HTMLElement).focus();
      expect(document.activeElement).toBe(link.element());
      await userEvent.keyboard('{Enter}');
      await link.click({ force: true });
      expect(screen.emitted('click')).toBeUndefined();
    });

    test('ignores toggle', async () => {
      const screen = await render(Button, {
        ...label,
        props: { href: '#on', toggle: true, selected: true },
      });
      const link = screen.getByRole('link');
      await expect.element(link).not.toHaveAttribute('aria-pressed');
      await canceled(link);
      expect(screen.emitted('update:selected')).toBeUndefined();
    });
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

  test.each(['ltr', 'rtl'])('the touch target is centered on the button, %s', async (dir) => {
    const screen = await render(Button, { ...label, props: { size: 'xsmall' }, attrs: { dir } });
    const button = screen.getByRole('button').element().getBoundingClientRect();
    const touch = screen.container.querySelector('.rio-button__touch')!.getBoundingClientRect();
    // Within half a pixel: engines round layout differently (WebKit to 1/64px).
    expect(touch.left + touch.width / 2).toBeCloseTo(button.left + button.width / 2, 0);
    expect(touch.top + touch.height / 2).toBeCloseTo(button.top + button.height / 2, 0);
  });

  // `--rio-spring-targets` is public: an app's own `transition` keeps the corner springs by
  // including it, and stops them by leaving it out (the corners then change at once).
  test.each([
    ['keeps', 'opacity 200ms, var(--rio-spring-targets)', true],
    ['leaves out', 'opacity 200ms', false],
  ])('an app transition that %s --rio-spring-targets', async (_, transition, springs) => {
    const theme = createThemeVariables({ sourceColor: '#6750a4' });
    const screen = await render(Button, { ...label, attrs: { style: { ...theme, transition } } });
    const button = screen.getByRole('button').element() as HTMLElement;
    button.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, buttons: 1, pointerId: 1 }),
    );
    if (springs) {
      await vi.waitFor(() => expect(button.style.borderStartStartRadius).not.toBe(''));
    } else {
      // Small's pressed corner is corner-small, 8px.
      await vi.waitFor(() => expect(getComputedStyle(button).borderStartStartRadius).toBe('8px'));
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(button.style.borderStartStartRadius).toBe('');
    }
  });
});
