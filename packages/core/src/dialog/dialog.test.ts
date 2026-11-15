import { describe, expect, test } from 'vitest';
import { createDialog, type DialogContent, type DialogProps } from './dialog';

const ids = { headline: 'd-headline', content: 'd-content' };
const full: DialogContent = { icon: true, headline: true, actions: true };
const setup = (props: DialogProps = {}, content?: DialogContent) =>
  createDialog({ props: () => props, content: content && (() => content), ids });

describe('createDialog', () => {
  test('an alert dialog by default, named by its headline and described by its content', () => {
    const dialog = setup({}, { icon: false, headline: true, actions: true });
    expect(dialog.parts.root()).toEqual({
      class: 'rio-dialog',
      role: 'alertdialog',
      'aria-labelledby': 'd-headline',
      'aria-describedby': 'd-content',
      'data-icon': undefined,
    });
    expect(dialog.parts.headline()).toEqual({ class: 'rio-dialog__headline', id: 'd-headline' });
    expect(dialog.parts.content()).toEqual({
      class: 'rio-dialog__content rio-focus-ring',
      id: 'd-content',
      'data-focus-ring': 'inner',
    });
    expect(dialog.parts.actions()).toEqual({ class: 'rio-dialog__actions' });
  });

  test("role 'dialog' leaves the element's own role, and describes nothing", () => {
    expect(setup({ role: 'dialog' }, full).parts.root()).toMatchObject({
      role: undefined,
      'aria-describedby': undefined,
      'aria-labelledby': 'd-headline',
    });
  });

  test('without a headline it has no name of its own', () => {
    const dialog = setup({}, { icon: false, headline: false, actions: false });
    expect(dialog.parts.root()['aria-labelledby']).toBeUndefined();
  });

  test('an icon hides from assistive technology, and marks the root for centering', () => {
    const dialog = setup({}, full);
    expect(dialog.parts.icon()).toEqual({ class: 'rio-dialog__icon', 'aria-hidden': 'true' });
    expect(dialog.parts.root()['data-icon']).toBe('');
  });

  test('the parts show as the content asks; without content, only the content part', () => {
    const none = setup();
    expect([none.showsIcon(), none.showsHeadline(), none.showsActions()]).toEqual([
      false,
      false,
      false,
    ]);
    const all = setup({}, full);
    expect([all.showsIcon(), all.showsHeadline(), all.showsActions()]).toEqual([true, true, true]);
  });
});
