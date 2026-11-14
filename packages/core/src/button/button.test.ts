import { describe, expect, test, vi } from 'vitest';
import { createButton, type ButtonContent, type ButtonProps } from './button';

const setup = (props: ButtonProps = {}, content?: ButtonContent) => {
  const onClick = vi.fn();
  const onChange = vi.fn();
  const button = createButton({
    props: () => props,
    content: content && (() => content),
    onClick,
    onChange,
  });
  return { button, onClick, onChange };
};

const click = () => ({ preventDefault: vi.fn() }) as unknown as MouseEvent;

describe('parts', () => {
  test('the root defaults to a small, round, filled push button', () => {
    expect(setup().button.parts.root()).toEqual({
      class: 'rio-button rio-state-layer rio-focus-ring',
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
    expect(setup({ variant: undefined }).button.parts.root()['data-variant']).toBe('filled');
  });

  test('a toggle button reports its state', () => {
    const attrs = setup({ toggle: true, selected: true }).button.parts.root();
    expect(attrs['aria-pressed']).toBe('true');
    expect(attrs['data-selected']).toBe('true');
  });

  test('text buttons never toggle', () => {
    const attrs = setup({ variant: 'text', toggle: true }).button.parts.root();
    expect(attrs['aria-pressed']).toBeUndefined();
    expect(attrs['data-selected']).toBeUndefined();
  });

  test('disabled is native, softDisabled is aria-disabled', () => {
    expect(setup({ disabled: true }).button.parts.root()).toMatchObject({
      disabled: '',
      'aria-disabled': undefined,
    });
    expect(setup({ softDisabled: true }).button.parts.root()).toMatchObject({
      disabled: undefined,
      'aria-disabled': 'true',
    });
  });

  test('the inner parts carry their classes, and only the label is read out', () => {
    const { parts } = setup().button;
    expect(parts.touch()).toEqual({ class: 'rio-button__touch', 'aria-hidden': 'true' });
    expect(parts.icon()).toEqual({ class: 'rio-button__icon', 'aria-hidden': 'true' });
    expect(parts.label()).toEqual({ class: 'rio-button__label' });
  });
});

describe('showsIcon', () => {
  test('follows the content the adapter reports', () => {
    expect(setup({}, { icon: true }).button.showsIcon()).toBe(true);
    expect(setup({}, { icon: false }).button.showsIcon()).toBe(false);
  });

  test('is off without any content', () => {
    expect(setup().button.showsIcon()).toBe(false);
  });
});

describe('handleClick', () => {
  test('passes an enabled click through', () => {
    const { button, onClick, onChange } = setup();
    const event = click();
    button.handleClick(event);
    expect(onClick).toHaveBeenCalledWith(event);
    expect(onChange).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  test('flips a toggle button', () => {
    const { button, onChange } = setup({ toggle: true, selected: false });
    button.handleClick(click());
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test.each<ButtonProps>([{ disabled: true }, { softDisabled: true }])(
    'blocks the click and its default action when %o',
    (props) => {
      const { button, onClick, onChange } = setup({ ...props, toggle: true });
      const event = click();
      button.handleClick(event);
      expect(onClick).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    },
  );
});
