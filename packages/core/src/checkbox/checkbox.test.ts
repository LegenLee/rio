import { describe, expect, test } from 'vitest';
import { createCheckbox, type CheckboxProps } from './checkbox';

const setup = (props: CheckboxProps = {}) => createCheckbox({ props: () => props });

describe('createCheckbox', () => {
  test('an unchecked native checkbox by default', () => {
    const checkbox = setup();
    expect(checkbox.parts.root()).toEqual({
      class: 'rio-checkbox',
      'data-selected': 'false',
      'data-indeterminate': undefined,
      'data-error': undefined,
      'data-disabled': undefined,
    });
    expect(checkbox.parts.input()).toEqual({
      class: 'rio-checkbox__input',
      type: 'checkbox',
      disabled: undefined,
      'aria-disabled': undefined,
      'aria-invalid': undefined,
    });
    expect(checkbox.parts.state()).toEqual({ class: 'rio-checkbox__state', 'aria-hidden': 'true' });
    expect(checkbox.parts.container()).toEqual({
      class: 'rio-checkbox__container',
      'aria-hidden': 'true',
    });
    expect(checkbox.blocked()).toBe(false);
  });

  test('indeterminate wins over selected in the look, and a change makes it checked', () => {
    const checkbox = setup({ selected: true, indeterminate: true });
    expect(checkbox.parts.root()).toMatchObject({
      'data-selected': 'false',
      'data-indeterminate': '',
    });
    expect([checkbox.next(false), checkbox.next(true)]).toEqual([true, true]);
    expect(setup({ selected: true }).next(false)).toBe(false);
  });

  test('error marks the input invalid', () => {
    const checkbox = setup({ error: true });
    expect(checkbox.parts.root()['data-error']).toBe('');
    expect(checkbox.parts.input()['aria-invalid']).toBe('true');
  });

  test('disabled is native; soft-disabled is aria-disabled; both block', () => {
    const disabled = setup({ disabled: true });
    expect(disabled.parts.input()).toMatchObject({ disabled: '', 'aria-disabled': undefined });
    expect(disabled.blocked()).toBe(true);
    const soft = setup({ softDisabled: true });
    expect(soft.parts.input()).toMatchObject({ disabled: undefined, 'aria-disabled': 'true' });
    expect(soft.parts.root()['data-disabled']).toBe('');
    expect(soft.blocked()).toBe(true);
  });
});
