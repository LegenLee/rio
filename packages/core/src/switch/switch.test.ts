import { describe, expect, test, vi } from 'vitest';
import { createSwitch, type SwitchProps } from './switch';

const setup = (props: SwitchProps) => {
  const onCheckedChange = vi.fn();
  return { sw: createSwitch({ props: () => props, onCheckedChange }), onCheckedChange };
};

describe('createSwitch', () => {
  test('toggle reports the opposite value', () => {
    const { sw, onCheckedChange } = setup({ checked: false });
    sw.toggle();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  test('toggle does nothing while disabled', () => {
    const { sw, onCheckedChange } = setup({ checked: false, disabled: true });
    sw.toggle();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  test('rootAttrs reflects the current props', () => {
    expect(setup({ checked: true }).sw.rootAttrs()).toEqual({
      role: 'switch',
      'aria-checked': 'true',
      'aria-disabled': undefined,
      'data-state': 'on',
    });
    expect(setup({ disabled: true }).sw.rootAttrs()).toMatchObject({
      'aria-checked': 'false',
      'aria-disabled': 'true',
      'data-state': 'off',
    });
  });
});
