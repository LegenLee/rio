import { describe, expect, test, vi } from 'vitest';
import { createSwitch, type SwitchContent, type SwitchKeyEvent, type SwitchProps } from './switch';

const setup = (props: SwitchProps = {}, content?: SwitchContent) => {
  const onChange = vi.fn();
  return {
    sw: createSwitch({ props: () => props, content: content && (() => content), onChange }),
    onChange,
  };
};

const key = (name: string, init: Partial<Omit<SwitchKeyEvent, 'key' | 'preventDefault'>> = {}) => ({
  key: name,
  repeat: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  defaultPrevented: false,
  ...init,
  preventDefault: vi.fn(),
});

describe('parts', () => {
  test('the root is the track, off; the input is a native checkbox with the switch role', () => {
    const { parts } = setup().sw;
    expect(parts.root()).toEqual({
      class: 'rio-switch',
      'data-selected': 'false',
      'data-icon': undefined,
      'data-disabled': undefined,
    });
    expect(parts.input()).toEqual({
      class: 'rio-switch__input',
      type: 'checkbox',
      role: 'switch',
      disabled: undefined,
      'aria-disabled': undefined,
    });
  });

  test('reflects the selected state on the root; the input is checked by attachCheckable', () => {
    expect(setup({ selected: true }).sw.parts.root()['data-selected']).toBe('true');
  });

  test('disabled is native, softDisabled is aria-disabled; either dims the root', () => {
    const disabled = setup({ disabled: true }).sw;
    expect(disabled.parts.input()).toMatchObject({ disabled: '', 'aria-disabled': undefined });
    expect(disabled.parts.root()['data-disabled']).toBe('');
    const soft = setup({ softDisabled: true }).sw;
    expect(soft.parts.input()).toMatchObject({ disabled: undefined, 'aria-disabled': 'true' });
    expect(soft.parts.root()['data-disabled']).toBe('');
    expect([disabled.blocked(), soft.blocked(), setup().sw.blocked()]).toEqual([true, true, false]);
  });

  test('the inner parts carry their classes and stay out of the accessibility tree', () => {
    const { parts } = setup().sw;
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

describe('handleKeydown', () => {
  test('Enter requests the opposite value, and keeps the form from submitting', () => {
    const { sw, onChange } = setup({ selected: true });
    const event = key('Enter');
    sw.handleKeydown(event);
    expect(onChange).toHaveBeenCalledWith(false);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  test('other keys are the browser’s: Space toggles the checkbox itself', () => {
    const { sw, onChange } = setup();
    const event = key(' ');
    sw.handleKeydown(event);
    expect(onChange).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  test('held down, Enter toggles once, and still keeps the form from submitting', () => {
    const { sw, onChange } = setup();
    sw.handleKeydown(key('Enter'));
    const repeat = key('Enter', { repeat: true });
    sw.handleKeydown(repeat);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(repeat.preventDefault).toHaveBeenCalled();
  });

  test.each([{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { defaultPrevented: true }])(
    'Enter is left alone with %o',
    (init) => {
      const { sw, onChange } = setup();
      const event = key('Enter', init);
      sw.handleKeydown(event);
      expect(onChange).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    },
  );

  test.each<SwitchProps>([{ disabled: true }, { softDisabled: true }])(
    'Enter changes nothing when %o',
    (props) => {
      const { sw, onChange } = setup(props);
      sw.handleKeydown(key('Enter'));
      expect(onChange).not.toHaveBeenCalled();
    },
  );
});
