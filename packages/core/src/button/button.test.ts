import { describe, expect, test, vi } from 'vitest';
import { createButton, type ButtonProps } from './button';

const setup = (props: ButtonProps = {}) => {
  const onClick = vi.fn();
  const onSelectedChange = vi.fn();
  const button = createButton({ props: () => props, onClick, onSelectedChange });
  return { button, onClick, onSelectedChange };
};

const click = () => ({ preventDefault: vi.fn() }) as unknown as MouseEvent;

describe('rootAttrs', () => {
  test('defaults to a small, round, filled push button', () => {
    expect(setup().button.rootAttrs()).toEqual({
      type: 'button',
      disabled: undefined,
      'aria-disabled': undefined,
      'aria-pressed': undefined,
      'data-variant': 'filled',
      'data-size': 'small',
      'data-shape': 'round',
      'data-selected': undefined,
    });
  });

  test('ignores explicitly undefined props', () => {
    expect(setup({ variant: undefined }).button.rootAttrs()['data-variant']).toBe('filled');
  });

  test('a toggle button reports its state', () => {
    const attrs = setup({ toggle: true, selected: true }).button.rootAttrs();
    expect(attrs['aria-pressed']).toBe('true');
    expect(attrs['data-selected']).toBe('true');
  });

  test('text buttons never toggle', () => {
    const attrs = setup({ variant: 'text', toggle: true }).button.rootAttrs();
    expect(attrs['aria-pressed']).toBeUndefined();
    expect(attrs['data-selected']).toBeUndefined();
  });

  test('disabled is native, softDisabled is aria-disabled', () => {
    expect(setup({ disabled: true }).button.rootAttrs()).toMatchObject({
      disabled: '',
      'aria-disabled': undefined,
    });
    expect(setup({ softDisabled: true }).button.rootAttrs()).toMatchObject({
      disabled: undefined,
      'aria-disabled': 'true',
    });
  });
});

describe('handleClick', () => {
  test('passes an enabled click through', () => {
    const { button, onClick, onSelectedChange } = setup();
    const event = click();
    button.handleClick(event);
    expect(onClick).toHaveBeenCalledWith(event);
    expect(onSelectedChange).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  test('flips a toggle button', () => {
    const { button, onSelectedChange } = setup({ toggle: true, selected: false });
    button.handleClick(click());
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  test.each<ButtonProps>([{ disabled: true }, { softDisabled: true }])(
    'blocks the click and its default action when %o',
    (props) => {
      const { button, onClick, onSelectedChange } = setup({ ...props, toggle: true });
      const event = click();
      button.handleClick(event);
      expect(onClick).not.toHaveBeenCalled();
      expect(onSelectedChange).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    },
  );
});
