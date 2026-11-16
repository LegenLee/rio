import { describe, expect, test } from 'vitest';
import { createTextField, type TextFieldContent, type TextFieldProps } from './text-field';

const ids = { input: 'i', prefix: 'p', suffix: 's', supportingText: 't', counter: 'c' };
const setup = (props: TextFieldProps = {}, content?: TextFieldContent) =>
  createTextField({ props: () => props, content: content && (() => content), ids });

describe('createTextField', () => {
  test('a filled single-line field by default, the label for the input', () => {
    const field = setup({ label: 'Name' });
    expect(field.parts.root()).toEqual({
      class: 'rio-text-field',
      'data-variant': 'filled',
      'data-populated': undefined,
      'data-label': '',
      'data-leading-icon': undefined,
      'data-trailing-icon': undefined,
      'data-multiline': undefined,
      'data-error': undefined,
      'data-disabled': undefined,
    });
    expect(field.parts.label()).toEqual({ class: 'rio-text-field__label', for: 'i' });
    expect(field.parts.input()).toEqual({
      class: 'rio-text-field__input',
      id: 'i',
      disabled: undefined,
      readonly: undefined,
      required: undefined,
      maxlength: undefined,
      'aria-invalid': undefined,
      'aria-describedby': undefined,
    });
    expect([field.singleLine(), field.multiline(), field.showsOutline()]).toEqual([
      true,
      false,
      false,
    ]);
    expect([field.showsSupporting(), field.showsCounter()]).toEqual([false, false]);
  });

  test('populated once it holds text', () => {
    expect(setup({ value: 'Ada' }).parts.root()['data-populated']).toBe('');
  });

  test('outlined has the outline', () => {
    expect(setup({ variant: 'outlined' }).showsOutline()).toBe(true);
  });

  test('required: an asterisk ends the label', () => {
    const field = setup({ label: 'Email', required: true });
    expect(field.labelText()).toBe('Email*');
    expect(field.parts.input().required).toBe('');
  });

  test('the input is described by the prefix, the suffix, the supporting text, and the counter', () => {
    const field = setup({ prefix: '$', suffix: 'USD', supportingText: 'Hint', maxlength: 8 });
    expect(field.parts.input()['aria-describedby']).toBe('p s t c');
    expect(field.parts.input().maxlength).toBe('8');
  });

  test('error text takes the supporting text’s place, with role="alert", only in error', () => {
    const calm = setup({ supportingText: 'Hint', errorText: 'Wrong' });
    expect(calm.supportingTextNow()).toBe('Hint');
    expect(calm.parts.supportingText().role).toBeUndefined();
    const wrong = setup({ supportingText: 'Hint', errorText: 'Wrong', error: true });
    expect(wrong.supportingTextNow()).toBe('Wrong');
    expect(wrong.parts.supportingText().role).toBe('alert');
    expect(wrong.parts.input()['aria-invalid']).toBe('true');
    expect(wrong.parts.root()['data-error']).toBe('');
    // Without error text, the supporting text stays.
    expect(setup({ supportingText: 'Hint', error: true }).supportingTextNow()).toBe('Hint');
  });

  test('the counter counts the value against maxlength', () => {
    const field = setup({ value: 'abc', maxlength: 6 });
    expect(field.counterText()).toBe('3 / 6');
    expect([field.showsSupporting(), field.showsSupportingText()]).toEqual([true, false]);
  });

  test('multiline: a text area of three rows by default', () => {
    expect(setup({ multiline: true }).parts.textarea().rows).toBe('3');
    expect(setup({ multiline: true, rows: 5 }).parts.textarea().rows).toBe('5');
  });

  test('icons come from the content', () => {
    const field = setup({}, { leadingIcon: true, trailingIcon: false });
    expect([field.showsLeadingIcon(), field.showsTrailingIcon()]).toEqual([true, false]);
    expect(field.parts.root()['data-leading-icon']).toBe('');
  });

  test('disabled and readonly reach the input', () => {
    expect(setup({ disabled: true }).parts.input().disabled).toBe('');
    expect(setup({ disabled: true }).parts.root()['data-disabled']).toBe('');
    expect(setup({ readonly: true }).parts.input().readonly).toBe('');
  });
});
