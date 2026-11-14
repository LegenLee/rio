import { describe, expect, test, vi } from 'vitest';
import { createSwitch, type SwitchContent, type SwitchProps } from './switch';

const setup = (props: SwitchProps = {}, content?: SwitchContent) => {
  const onSelectedChange = vi.fn();
  return {
    sw: createSwitch({ props: () => props, content: content && (() => content), onSelectedChange }),
    onSelectedChange,
  };
};

const click = () => ({ preventDefault: vi.fn() }) as unknown as MouseEvent;

describe('parts', () => {
  test('the root is an off switch button that never submits a form', () => {
    expect(setup().sw.parts.root()).toEqual({
      class: 'rio-switch rio-focus-ring',
      type: 'button',
      role: 'switch',
      'aria-checked': 'false',
      disabled: undefined,
      'aria-disabled': undefined,
      'data-selected': 'false',
      'data-icon': undefined,
    });
  });

  test('reflects the selected state', () => {
    expect(setup({ selected: true }).sw.parts.root()).toMatchObject({
      'aria-checked': 'true',
      'data-selected': 'true',
    });
  });

  test('disabled is native, softDisabled is aria-disabled', () => {
    expect(setup({ disabled: true }).sw.parts.root()).toMatchObject({
      disabled: '',
      'aria-disabled': undefined,
    });
    expect(setup({ softDisabled: true }).sw.parts.root()).toMatchObject({
      disabled: undefined,
      'aria-disabled': 'true',
    });
  });

  test('the inner parts carry their classes and stay out of the accessibility tree', () => {
    const { parts } = setup().sw;
    expect(parts.touch()).toEqual({ class: 'rio-switch__touch', 'aria-hidden': 'true' });
    expect(parts.state()).toEqual({ class: 'rio-switch__state', 'aria-hidden': 'true' });
    expect(parts.handle()).toEqual({ class: 'rio-switch__handle', 'aria-hidden': 'true' });
    expect(parts.icon()).toEqual({ class: 'rio-switch__icon' });
  });
});

describe('showsIcon', () => {
  const onlySelected = { selectedIcon: true, unselectedIcon: false };

  test('shows the icon for the current state, and marks the root for the bigger handle', () => {
    const on = setup({ selected: true }, onlySelected).sw;
    expect(on.showsIcon()).toBe(true);
    expect(on.parts.root()['data-icon']).toBe('');
    const off = setup({ selected: false }, onlySelected).sw;
    expect(off.showsIcon()).toBe(false);
    expect(off.parts.root()['data-icon']).toBeUndefined();
  });

  test('is off without any content', () => {
    expect(setup({ selected: true }).sw.showsIcon()).toBe(false);
  });

  test('picks the selected icon while on and the unselected one while off', () => {
    const both = { selectedIcon: true, unselectedIcon: true };
    expect(setup({ selected: true }, both).sw.showsSelectedIcon()).toBe(true);
    expect(setup({ selected: false }, both).sw.showsSelectedIcon()).toBe(false);
  });

  test('is false while on with only an unselected icon', () => {
    const onlyUnselected = { selectedIcon: false, unselectedIcon: true };
    expect(setup({ selected: true }, onlyUnselected).sw.showsSelectedIcon()).toBe(false);
  });
});

describe('handleClick', () => {
  test('requests the opposite value', () => {
    const { sw, onSelectedChange } = setup({ selected: true });
    sw.handleClick(click());
    expect(onSelectedChange).toHaveBeenCalledWith(false);
  });

  test.each<SwitchProps>([{ disabled: true }, { softDisabled: true }])(
    'blocks the click when %o',
    (props) => {
      const { sw, onSelectedChange } = setup(props);
      const event = click();
      sw.handleClick(event);
      expect(onSelectedChange).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    },
  );
});
