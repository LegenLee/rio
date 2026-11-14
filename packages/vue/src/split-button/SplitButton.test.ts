import { BUTTON_SIZES, type SplitButtonProps } from '@rio-m3e/core';
import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, ref } from 'vue';
import SplitButton from './SplitButton.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });
const chevron = () => h('svg', { viewBox: '0 0 24 24' }, [h('path', { d: 'M7 10l5 5 5-5z' })]);

/**
 * Renders a split button labeled "Save" with a menu labeled "More options". `themed` adds the
 * theme's variables, which the corners and the springs need; without them, springs jump straight
 * to their targets.
 */
const renderSplit = (
  props: Partial<SplitButtonProps> = {},
  {
    themed = false,
    dir,
    slots = { default: () => 'Save', 'menu-icon': chevron },
  }: { themed?: boolean; dir?: 'rtl'; slots?: Record<string, () => unknown> } = {},
) => {
  const all: SplitButtonProps = { menuLabel: 'More options', ...props };
  return render(SplitButton, {
    props: all,
    attrs: { style: themed ? theme : undefined, dir },
    slots,
  });
};

const halves = (screen: Awaited<ReturnType<typeof renderSplit>>) => {
  const [leading, trailing] = screen.getByRole('button').elements() as HTMLButtonElement[];
  return { leading: leading!, trailing: trailing! };
};
const menuIcon = (trailing: Element) =>
  trailing.querySelector<HTMLElement>('.rio-split-button__menu-icon')!;
const rect = (el: Element) => el.getBoundingClientRect();
/** start-start, start-end, end-end, end-start, in pixels. */
const corners = (el: Element) => {
  const style = getComputedStyle(el);
  return [
    style.borderStartStartRadius,
    style.borderStartEndRadius,
    style.borderEndEndRadius,
    style.borderEndStartRadius,
  ].map(parseFloat);
};
/** How far the menu icon's center sits from the trailing button's, to the right. */
const iconShift = (trailing: Element) => {
  const icon = rect(menuIcon(trailing));
  const button = rect(trailing);
  return icon.left + icon.width / 2 - (button.left + button.width / 2);
};
/** The springs are done: they've removed what they wrote. */
const atRest = (el: HTMLElement) =>
  [
    '--_menu-turn',
    '--_menu-shift',
    'border-start-start-radius',
    'border-start-end-radius',
    'border-end-end-radius',
    'border-end-start-radius',
  ].every((name) => el.style.getPropertyValue(name) === '');
const press = (el: Element) =>
  el.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, buttons: 1, pointerId: 1 }),
  );
const release = (el: Element) =>
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, isPrimary: true, pointerId: 1 }));

describe('RioSplitButton', () => {
  describe('markup', () => {
    test('is two native buttons: the action and a menu button that says what it opens', async () => {
      const screen = await renderSplit();
      const { leading, trailing } = halves(screen);
      await expect.element(screen.getByRole('button', { name: 'Save' })).toBe(leading);
      await expect.element(screen.getByRole('button', { name: 'More options' })).toBe(trailing);
      expect(leading.type).toBe('button');
      expect(trailing.type).toBe('button');
      expect(trailing.getAttribute('aria-haspopup')).toBe('menu');
      expect(trailing.getAttribute('aria-expanded')).toBe('false');
      expect(menuIcon(trailing).getAttribute('aria-hidden')).toBe('true');
    });

    test('an icon-only leading button takes its name from label', async () => {
      const screen = await renderSplit(
        { label: 'Watch later' },
        { slots: { icon: () => '★', 'menu-icon': chevron } },
      );
      const { leading } = halves(screen);
      await expect.element(screen.getByRole('button', { name: 'Watch later' })).toBe(leading);
      expect(leading.querySelector('.rio-button__icon')).not.toBeNull();
      expect(leading.querySelector('.rio-button__label')).toBeNull();
    });

    test('with label text, label is ignored and the text stays the name', async () => {
      const screen = await renderSplit({ label: 'Something else' });
      const { leading } = halves(screen);
      expect(leading.hasAttribute('aria-label')).toBe(false);
      await expect.element(screen.getByRole('button', { name: 'Save' })).toBe(leading);
    });

    test('popup sets what the menu button opens', async () => {
      const screen = await renderSplit({ popup: 'dialog' });
      expect(halves(screen).trailing.getAttribute('aria-haspopup')).toBe('dialog');
    });

    test('type applies to the leading button only', async () => {
      const onSubmit = vi.fn((e: Event) => e.preventDefault());
      const Form = defineComponent(
        () => () =>
          h('form', { onSubmit }, [
            h(SplitButton, { type: 'submit', menuLabel: 'More' }, () => 'Send'),
          ]),
      );
      const screen = await render(Form);
      const [leading, trailing] = screen.getByRole('button').elements() as HTMLButtonElement[];
      expect([leading!.type, trailing!.type]).toEqual(['submit', 'button']);
      await userEvent.click(trailing!);
      expect(onSubmit).not.toHaveBeenCalled();
      await userEvent.click(leading!);
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    test('exposes both buttons, to place the menu and return the focus', async () => {
      const split = ref<InstanceType<typeof SplitButton>>();
      const screen = await render(
        defineComponent(
          () => () => h(SplitButton, { ref: split, menuLabel: 'More options' }, () => 'Save'),
        ),
      );
      const [leading, trailing] = screen.getByRole('button').elements();
      expect(split.value!.leading).toBe(leading);
      expect(split.value!.trailing).toBe(trailing);
    });

    test('Tab goes from the leading button to the menu button', async () => {
      const screen = await renderSplit();
      const { leading, trailing } = halves(screen);
      leading.focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(trailing);
    });
  });

  describe('events', () => {
    test('the leading button emits click and leaves the menu alone', async () => {
      const screen = await renderSplit();
      await userEvent.click(halves(screen).leading);
      expect(screen.emitted('click')).toHaveLength(1);
      expect(screen.emitted('update:open')).toBeUndefined();
    });

    test('the menu button asks to open and close; the parent owns open', async () => {
      const screen = await renderSplit();
      const { trailing } = halves(screen);
      await userEvent.click(trailing);
      expect(screen.emitted('update:open')).toEqual([[true]]);
      expect(screen.emitted('click')).toBeUndefined();
      // Nothing changes until the parent passes it back.
      expect(trailing.getAttribute('aria-expanded')).toBe('false');

      await screen.rerender({ open: true });
      expect(trailing.getAttribute('aria-expanded')).toBe('true');
      expect(trailing.hasAttribute('data-open')).toBe(true);
      await userEvent.click(trailing);
      expect(screen.emitted('update:open')).toEqual([[true], [false]]);
    });

    test('disabled disables both buttons', async () => {
      const screen = await renderSplit({ disabled: true });
      for (const button of Object.values(halves(screen))) {
        expect(button.disabled).toBe(true);
        button.focus();
        expect(document.activeElement).not.toBe(button);
        await userEvent.click(button, { force: true });
      }
      expect(screen.emitted('click')).toBeUndefined();
      expect(screen.emitted('update:open')).toBeUndefined();
    });

    test('softDisabled keeps both buttons focusable but emits nothing', async () => {
      const screen = await renderSplit({ softDisabled: true });
      for (const button of Object.values(halves(screen))) {
        expect(button.getAttribute('aria-disabled')).toBe('true');
        button.focus();
        expect(document.activeElement).toBe(button);
        await userEvent.keyboard('{Enter}');
        await userEvent.click(button, { force: true });
      }
      expect(screen.emitted('click')).toBeUndefined();
      expect(screen.emitted('update:open')).toBeUndefined();
    });
  });

  describe('layout', () => {
    // From Material Web's split button tokens: the height, the menu button's width (its icon plus
    // padding, or the 48px minimum), the icon, and how far the closed icon sits toward the start.
    const SIZES = {
      xsmall: { height: 32, trailing: 48, icon: 22, shift: 1 },
      small: { height: 40, trailing: 48, icon: 22, shift: 1 },
      medium: { height: 56, trailing: 56, icon: 26, shift: 2 },
      large: { height: 96, trailing: 96, icon: 38, shift: 3 },
      xlarge: { height: 136, trailing: 136, icon: 50, shift: 6 },
    } as const;

    test('has the spec sizes, 2px apart', async () => {
      expect(Object.keys(SIZES)).toEqual([...BUTTON_SIZES]);
      for (const size of BUTTON_SIZES) {
        const expected = SIZES[size];
        const screen = await renderSplit({ size });
        const { leading, trailing } = halves(screen);
        expect([rect(leading).height, rect(trailing).height], size).toEqual([
          expected.height,
          expected.height,
        ]);
        expect(rect(trailing).width, size).toBe(expected.trailing);
        expect(rect(menuIcon(trailing)).width, size).toBe(expected.icon);
        expect(rect(trailing).left - rect(leading).right, size).toBe(2);
        // Toward the start, which is left here.
        expect(iconShift(trailing), size).toBe(-expected.shift);
        screen.unmount();
      }
    });

    test('in right-to-left layouts, the menu button comes first and its icon sits right', async () => {
      const screen = await renderSplit({ size: 'xlarge' }, { dir: 'rtl' });
      const { leading, trailing } = halves(screen);
      expect(rect(trailing).right).toBeLessThan(rect(leading).left);
      expect(iconShift(trailing)).toBe(6);
    });

    test('extra small buttons still have a 48px touch target', async () => {
      const screen = await renderSplit({ size: 'xsmall' });
      for (const button of Object.values(halves(screen))) {
        const touch = button.querySelector('.rio-button__touch')!;
        expect(rect(touch).height).toBe(48);
      }
    });
  });

  describe('shape', () => {
    test('rounds the outer ends and keeps the facing corners small', async () => {
      // [round, facing]: round is half the height; facing is the size's inner corner token.
      const SHAPES = {
        xsmall: [16, 4],
        small: [20, 4],
        medium: [28, 4],
        large: [48, 8],
        xlarge: [68, 12],
      } as const;
      for (const size of BUTTON_SIZES) {
        const [round, facing] = SHAPES[size];
        const screen = await renderSplit({ size }, { themed: true });
        const { leading, trailing } = halves(screen);
        expect(corners(leading), size).toEqual([round, facing, facing, round]);
        expect(corners(trailing), size).toEqual([facing, round, round, facing]);
        screen.unmount();
      }
    });

    test('hovering rounds the facing corners of that button only', async () => {
      const screen = await renderSplit({}, { themed: true });
      const { leading, trailing } = halves(screen);
      await userEvent.hover(leading);
      // corner-medium (12px) for small. The pointer may start over the trailing button, which
      // then settles back.
      await vi.waitFor(() => expect(corners(leading)).toEqual([20, 12, 12, 20]));
      await vi.waitFor(() => expect(corners(trailing)).toEqual([4, 20, 20, 4]));
      await userEvent.unhover(leading);
      await vi.waitFor(() => expect(corners(leading)).toEqual([20, 4, 4, 20]));
    });

    test('keyboard focus and pressing round the facing corners too', async () => {
      const screen = await renderSplit({ size: 'large' }, { themed: true });
      const { leading, trailing } = halves(screen);
      await userEvent.keyboard('{Shift}');
      leading.focus();
      // corner-large-increased (20px) for large.
      await vi.waitFor(() => expect(corners(leading)).toEqual([48, 20, 20, 48]));

      press(trailing);
      await vi.waitFor(() => expect(corners(trailing)).toEqual([20, 48, 48, 20]));
      release(trailing);
      await vi.waitFor(() => expect(corners(trailing)).toEqual([8, 48, 48, 8]));
    });

    test('disabled buttons keep their corners', async () => {
      const screen = await renderSplit({ softDisabled: true }, { themed: true });
      const { leading } = halves(screen);
      await userEvent.keyboard('{Shift}');
      leading.focus();
      await userEvent.hover(leading);
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(corners(leading)).toEqual([20, 4, 4, 20]);
    });
  });

  describe('open', () => {
    test('the menu button turns fully round and its icon turns over, centered', async () => {
      const screen = await renderSplit({ size: 'xlarge' }, { themed: true });
      const { trailing } = halves(screen);
      await screen.rerender({ open: true });
      // The icon moves on springs, so it passes through the angles in between.
      await vi.waitFor(() => {
        const turn = parseFloat(trailing.style.getPropertyValue('--_menu-turn'));
        expect(turn).toBeGreaterThan(0);
        expect(turn).toBeLessThan(180);
      });
      await vi.waitFor(() => expect(atRest(trailing)).toBe(true), { timeout: 2000 });
      expect(corners(trailing)).toEqual([68, 68, 68, 68]);
      expect(getComputedStyle(menuIcon(trailing)).rotate).toBe('180deg');
      expect(iconShift(trailing)).toBe(0);

      await screen.rerender({ open: false });
      // At rest again, after turning back.
      await vi.waitFor(
        () => {
          expect(atRest(trailing)).toBe(true);
          expect(getComputedStyle(menuIcon(trailing)).rotate).toBe('0deg');
        },
        { timeout: 2000 },
      );
      expect(corners(trailing)).toEqual([12, 68, 68, 12]);
      expect(iconShift(trailing)).toBe(-6);
    });

    test('in right-to-left layouts, the icon turns the other way', async () => {
      const screen = await renderSplit({ open: true }, { dir: 'rtl' });
      expect(getComputedStyle(menuIcon(halves(screen).trailing)).rotate).toBe('-180deg');
    });

    test('a disabled menu button stays round when open, without the state layer', async () => {
      const screen = await renderSplit({ open: true, softDisabled: true }, { themed: true });
      const { trailing } = halves(screen);
      expect(corners(trailing)).toEqual([20, 20, 20, 20]);
      expect(getComputedStyle(trailing, '::before').opacity).toBe('0');
    });

    test('shows a state layer at the pressed opacity', async () => {
      const screen = await renderSplit({ open: true }, { themed: true });
      const { trailing } = halves(screen);
      await vi.waitFor(() =>
        expect(getComputedStyle(trailing, '::before').opacity).toBe(
          theme['--rio-state-pressed-state-layer-opacity'],
        ),
      );
    });
  });
});
