import { describe, expect, test, vi } from 'vitest';
import { createIconButton, type IconButtonContent, type IconButtonProps } from './icon-button';

const setup = (props: Partial<IconButtonProps> = {}, content?: IconButtonContent) => {
  const onClick = vi.fn();
  const onChange = vi.fn();
  const button = createIconButton({
    props: () => ({ label: 'Add to favorites', ...props }),
    content: content && (() => content),
    onClick,
    onChange,
  });
  return { button, onClick, onChange };
};

const click = () => ({ preventDefault: vi.fn() }) as unknown as MouseEvent;

describe('createIconButton', () => {
  test('defaults to a small, round, default-width filled button named by its label', () => {
    expect(setup().button.parts.root()).toMatchObject({
      class: 'rio-button rio-state-layer rio-focus-ring rio-icon-button',
      type: 'button',
      'aria-label': 'Add to favorites',
      'data-variant': 'filled',
      'data-size': 'small',
      'data-shape': 'round',
      'data-width': 'default',
    });
  });

  test('shares the touch and icon parts with the button', () => {
    const { parts } = setup().button;
    expect(parts.touch()).toEqual({
      class: 'rio-button__touch rio-touch-target',
      'aria-hidden': 'true',
    });
    expect(parts.icon()).toEqual({ class: 'rio-button__icon', 'aria-hidden': 'true' });
  });

  test('a color sets the accent variables on the root, as on the button', () => {
    expect(setup({ color: 'error' }).button.parts.root().style).toContain(
      '--rio-on-accent: var(--rio-color-on-error)',
    );
  });

  test('every variant can toggle, the standard one included', () => {
    const { button, onChange } = setup({ variant: 'standard', toggle: true });
    expect(button.parts.root()['aria-pressed']).toBe('false');
    button.handleClick(click());
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('shows the selected icon only on a selected toggle that has one', () => {
    const has = { selectedIcon: true };
    expect(setup({ toggle: true, selected: true }, has).button.showsSelectedIcon()).toBe(true);
    expect(setup({ toggle: true, selected: false }, has).button.showsSelectedIcon()).toBe(false);
    expect(setup({ selected: true }, has).button.showsSelectedIcon()).toBe(false);
    expect(setup({ toggle: true, selected: true }).button.showsSelectedIcon()).toBe(false);
  });

  test('blocks clicks when soft-disabled, like the button', () => {
    const { button, onClick } = setup({ softDisabled: true });
    const event = click();
    button.handleClick(event);
    expect(onClick).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(button.parts.root()['aria-disabled']).toBe('true');
  });

  test('as a link: an <a> named by its label, which never shows the selected icon', () => {
    const { button, onChange } = setup(
      { href: '/favorites', toggle: true, selected: true },
      { selectedIcon: true },
    );
    expect(button.isLink()).toBe(true);
    expect(button.parts.root()).toMatchObject({
      href: '/favorites',
      'aria-label': 'Add to favorites',
    });
    expect(button.parts.root()).not.toHaveProperty('type');
    expect(button.parts.root()).not.toHaveProperty('aria-pressed');
    expect(button.showsSelectedIcon()).toBe(false);
    button.handleClick(click());
    expect(onChange).not.toHaveBeenCalled();
  });
});

test('props an adapter passes as undefined take the defaults', () => {
  const { button } = setup({
    variant: undefined,
    width: undefined,
    size: undefined,
    type: undefined,
  });
  expect(button.parts.root()).toMatchObject({
    'data-variant': 'filled',
    'data-width': 'default',
    'data-size': 'small',
    type: 'button',
  });
});
