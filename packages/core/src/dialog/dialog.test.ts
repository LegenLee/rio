import { describe, expect, test } from 'vitest';
import {
  createDialog,
  dialogSkeleton,
  fullScreenDialogSkeleton,
  type DialogContent,
  type DialogProps,
} from './dialog';

const ids = { headline: 'd-headline', content: 'd-content' };
const full: DialogContent = { icon: true, headline: true, actions: true };
const setup = (props: DialogProps = {}, content?: DialogContent, compact?: boolean) =>
  createDialog({
    props: () => props,
    content: content && (() => content),
    ids,
    compact: compact === undefined ? undefined : () => compact,
  });

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

  test('a basic dialog draws no button of its own', () => {
    const dialog = setup({}, full);
    expect([dialog.fullScreen(), dialog.showsDismiss()]).toEqual([false, false]);
    expect(dialog.skeleton()).toBe(dialogSkeleton);
    expect(dialog.parts.root()['data-full-screen']).toBeUndefined();
  });

  describe('full-screen', () => {
    test('marks the root, and a header holds the close button, the headline, and the actions', () => {
      const dialog = setup({ variant: 'full-screen' }, full);
      expect([dialog.fullScreen(), dialog.showsDismiss()]).toEqual([true, true]);
      expect(dialog.skeleton()).toBe(fullScreenDialogSkeleton);
      expect(dialog.parts.root()['data-full-screen']).toBe('');
      expect(dialog.parts.header()).toEqual({ class: 'rio-dialog__header' });
      expect(dialog.parts.dismiss()).toEqual({ class: 'rio-dialog__dismiss' });
      expect(fullScreenDialogSkeleton.children?.map((node) => node.part)).toEqual([
        'header',
        'content',
      ]);
    });

    test('a dialog by default, named by its headline; an alert dialog when asked', () => {
      expect(setup({ variant: 'full-screen' }, full).parts.root()).toMatchObject({
        role: undefined,
        'aria-labelledby': 'd-headline',
        'aria-describedby': undefined,
      });
      expect(
        setup({ variant: 'full-screen', role: 'alertdialog' }, full).parts.root(),
      ).toMatchObject({ role: 'alertdialog', 'aria-describedby': 'd-content' });
    });

    test('no icon, and the actions only as given', () => {
      const dialog = setup({ variant: 'full-screen' }, full);
      expect([dialog.showsIcon(), dialog.showsActions()]).toEqual([false, true]);
      expect(dialog.parts.root()['data-icon']).toBeUndefined();
      const bare = setup(
        { variant: 'full-screen' },
        { icon: true, headline: false, actions: false },
      );
      expect([bare.showsIcon(), bare.showsHeadline(), bare.showsActions()]).toEqual([
        false,
        false,
        false,
      ]);
    });
  });

  describe('adaptive', () => {
    const content: DialogContent = { icon: true, headline: true, actions: false };

    test('full-screen in a compact window', () => {
      const dialog = setup({ variant: 'adaptive' }, content, true);
      expect([dialog.fullScreen(), dialog.showsDismiss()]).toEqual([true, true]);
      expect(dialog.skeleton()).toBe(fullScreenDialogSkeleton);
      expect([dialog.showsIcon(), dialog.showsActions()]).toEqual([false, false]);
    });

    test('basic in a wider window, with its Cancel button among the actions', () => {
      const dialog = setup({ variant: 'adaptive' }, content, false);
      expect([dialog.fullScreen(), dialog.showsDismiss()]).toEqual([false, true]);
      expect(dialog.skeleton()).toBe(dialogSkeleton);
      expect([dialog.showsIcon(), dialog.showsActions()]).toEqual([true, true]);
      expect(dialog.parts.root()).toMatchObject({ role: undefined, 'data-full-screen': undefined });
    });

    test('basic without a report of the window', () => {
      expect(setup({ variant: 'adaptive' }, content).fullScreen()).toBe(false);
    });
  });
});
