import { describe, expect, test, vi } from 'vitest';
import { createSwitch, type SwitchProps } from './switch';

const setup = (props: SwitchProps = {}) => {
  const onSelectedChange = vi.fn();
  return { sw: createSwitch({ props: () => props, onSelectedChange }), onSelectedChange };
};

const click = () => ({ preventDefault: vi.fn() }) as unknown as MouseEvent;

describe('rootAttrs', () => {
  test('is an off switch button that never submits a form', () => {
    expect(setup().sw.rootAttrs()).toEqual({
      type: 'button',
      role: 'switch',
      'aria-checked': 'false',
      disabled: undefined,
      'aria-disabled': undefined,
      'data-selected': 'false',
    });
  });

  test('reflects the selected state', () => {
    expect(setup({ selected: true }).sw.rootAttrs()).toMatchObject({
      'aria-checked': 'true',
      'data-selected': 'true',
    });
  });

  test('disabled is native, softDisabled is aria-disabled', () => {
    expect(setup({ disabled: true }).sw.rootAttrs()).toMatchObject({
      disabled: '',
      'aria-disabled': undefined,
    });
    expect(setup({ softDisabled: true }).sw.rootAttrs()).toMatchObject({
      disabled: undefined,
      'aria-disabled': 'true',
    });
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
