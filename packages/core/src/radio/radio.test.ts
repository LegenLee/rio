import { describe, expect, test } from 'vitest';
import { createRadio, createRadioGroup, type RadioProps } from './radio';

const setup = (props: RadioProps = {}) =>
  createRadio({ props: () => props, name: () => 'tone', value: () => 'luna' });

describe('createRadioGroup', () => {
  test('a radio group, named by its label', () => {
    expect(createRadioGroup({ props: () => ({ label: 'Ringtone' }) }).parts.root()).toEqual({
      class: 'rio-radio-group',
      role: 'radiogroup',
      'aria-label': 'Ringtone',
    });
  });
});

describe('createRadio', () => {
  test('a native radio button with the group’s name and its value', () => {
    const radio = setup();
    expect(radio.parts.root()).toEqual({
      class: 'rio-radio',
      'data-selected': 'false',
      'data-disabled': undefined,
    });
    expect(radio.parts.input()).toEqual({
      class: 'rio-radio__input',
      type: 'radio',
      name: 'tone',
      value: 'luna',
      disabled: undefined,
      'aria-disabled': undefined,
    });
    expect(radio.parts.icon()).toEqual({ class: 'rio-radio__icon', 'aria-hidden': 'true' });
    expect(radio.blocked()).toBe(false);
  });

  test('selected shows on the root', () => {
    expect(setup({ selected: true }).parts.root()['data-selected']).toBe('true');
  });

  test('disabled is native; soft-disabled is aria-disabled; both block', () => {
    const disabled = setup({ disabled: true });
    expect(disabled.parts.input()).toMatchObject({ disabled: '', 'aria-disabled': undefined });
    expect(disabled.blocked()).toBe(true);
    const soft = setup({ softDisabled: true });
    expect(soft.parts.input()).toMatchObject({ disabled: undefined, 'aria-disabled': 'true' });
    expect(soft.blocked()).toBe(true);
  });
});

test('props an adapter passes as undefined take the defaults', () => {
  const radio = setup({ selected: undefined, disabled: undefined, softDisabled: undefined });
  expect(radio.blocked()).toBe(false);
  expect(radio.parts.input()).toMatchObject({ disabled: undefined, 'aria-disabled': undefined });
});
