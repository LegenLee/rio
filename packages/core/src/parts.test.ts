import { describe, expect, test } from 'vitest';
import { mergePartAttrs } from './parts';

describe('mergePartAttrs', () => {
  test('what the part leaves out keeps the app’s value', () => {
    expect(
      mergePartAttrs(
        { 'aria-invalid': 'true', 'aria-describedby': 'hint' },
        { 'aria-invalid': undefined, 'aria-describedby': undefined, disabled: undefined },
      ),
    ).toEqual({ 'aria-invalid': 'true', 'aria-describedby': 'hint', disabled: undefined });
  });

  test('what the part sets wins', () => {
    expect(
      mergePartAttrs({ type: 'button', 'aria-invalid': 'false' }, { 'aria-invalid': 'true' }),
    ).toEqual({ type: 'button', 'aria-invalid': 'true' });
  });

  test('id lists add up, the app’s ids first, each once', () => {
    expect(
      mergePartAttrs(
        { 'aria-describedby': ' rules  hint ', 'aria-labelledby': 'heading' },
        { 'aria-describedby': 'hint supporting', 'aria-labelledby': 'heading' },
      ),
    ).toEqual({ 'aria-describedby': 'rules hint supporting', 'aria-labelledby': 'heading' });
    expect(mergePartAttrs({}, { 'aria-controls': 'list' })).toEqual({ 'aria-controls': 'list' });
    expect(
      mergePartAttrs({ 'aria-errormessage': 'own' }, { 'aria-errormessage': 'error' }),
    ).toEqual({ 'aria-errormessage': 'own error' });
  });

  test('the app’s other attributes and listeners pass through', () => {
    const onClick = () => {};
    expect(mergePartAttrs({ onClick, name: 'size' }, { class: 'rio-x' })).toEqual({
      onClick,
      name: 'size',
      class: 'rio-x',
    });
  });
});
