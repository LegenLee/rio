import { describe, expect, test, vi } from 'vitest';
import { createIconButton, type IconButtonProps } from './icon-button';

const setup = (props: Partial<IconButtonProps> = {}) => {
  const onClick = vi.fn();
  const onSelectedChange = vi.fn();
  const button = createIconButton({
    props: () => ({ label: 'Add to favorites', ...props }),
    onClick,
    onSelectedChange,
  });
  return { button, onClick, onSelectedChange };
};

const click = () => ({ preventDefault: vi.fn() }) as unknown as MouseEvent;

describe('createIconButton', () => {
  test('defaults to a small, round, default-width filled button named by its label', () => {
    expect(setup().button.rootAttrs()).toMatchObject({
      type: 'button',
      'aria-label': 'Add to favorites',
      'data-variant': 'filled',
      'data-size': 'small',
      'data-shape': 'round',
      'data-width': 'default',
    });
  });

  test('every variant can toggle, the standard one included', () => {
    const { button, onSelectedChange } = setup({ variant: 'standard', toggle: true });
    expect(button.rootAttrs()['aria-pressed']).toBe('false');
    button.handleClick(click());
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  test('blocks clicks when soft-disabled, like the button', () => {
    const { button, onClick } = setup({ softDisabled: true });
    const event = click();
    button.handleClick(event);
    expect(onClick).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(button.rootAttrs()['aria-disabled']).toBe('true');
  });
});
