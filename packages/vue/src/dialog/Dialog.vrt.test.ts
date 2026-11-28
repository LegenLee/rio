import { mdiClose, mdiRestore } from '@mdi/js';
import { describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { defineComponent, h, reactive, type VNode } from 'vue';
import Button from '../button/Button.vue';
import { icon, renderGallery, SCHEMES } from '../test/vrt';
import Dialog from './Dialog.vue';

const actions = (confirm: string) => () => [
  h(Button, { variant: 'text' }, () => 'Cancel'),
  h(Button, { variant: 'text' }, () => confirm),
];

/** A full-screen dialog with `lines` paragraphs of content */
const fullScreen = (open: boolean, lines: number) =>
  h(
    Dialog,
    { variant: 'full-screen', headline: 'New event', open },
    {
      'close-icon': () => icon(mdiClose),
      default: () =>
        Array.from({ length: lines }, (_, index) =>
          h('p', { style: { margin: 0, lineHeight: '48px' } }, `Guest ${index + 1}`),
        ),
      actions: () => h(Button, { variant: 'text' }, () => 'Save'),
    },
  );

const DIALOGS: [string, (open: boolean) => VNode][] = [
  [
    'basic',
    (open) =>
      h(
        Dialog,
        { headline: 'Discard draft?', open },
        {
          default: () => 'Your draft and its two attachments will be lost.',
          actions: actions('Discard'),
        },
      ),
  ],
  [
    'icon',
    (open) =>
      h(
        Dialog,
        { headline: 'Reset settings?', open },
        {
          icon: () => icon(mdiRestore),
          default: () =>
            'This will reset your app preferences back to their default settings. The following ' +
            'accounts will also be signed out:',
          actions: actions('Reset'),
        },
      ),
  ],
  [
    'scrolling',
    (open) =>
      h(
        Dialog,
        { headline: 'Phone ringtone', role: 'dialog', open },
        {
          default: () =>
            Array.from({ length: 16 }, (_, index) =>
              h('p', { style: { margin: 0, lineHeight: '48px' } }, `Ringtone ${index + 1}`),
            ),
          actions: actions('OK'),
        },
      ),
  ],
  ['full-screen', (open) => fullScreen(open, 3)],
  ['full-screen-scrolling', (open) => fullScreen(open, 16)],
];

/**
 * A page the size of the window, under the dialog and its scrim. The dialog opens after the
 * render: the test renderer moves what it renders into place, which would close it.
 */
const showcase = (dialog: (open: boolean) => VNode, open: { value: boolean }) =>
  defineComponent(
    () => () =>
      h('div', { style: { width: '568px', height: '448px' } }, [
        h('p', { style: { margin: 0 } }, 'The page behind the dialog'),
        dialog(open.value),
      ]),
  );

describe('RioDialog', () => {
  describe.each(SCHEMES)('%s', (scheme) => {
    test.each(DIALOGS)('%s', async (name, dialog) => {
      await page.viewport(600, 480);
      const open = reactive({ value: false });
      const gallery = await renderGallery(scheme, () => [[h(showcase(dialog, open))]]);
      open.value = true;
      const root = await vi.waitFor(() => {
        const shown = document.querySelector<HTMLDialogElement>('dialog:modal');
        expect(shown).not.toBeNull();
        return shown!;
      });
      if (name.endsWith('scrolling')) {
        root.querySelector('.rio-dialog__content')!.scrollTop = 120;
      }
      await vi.waitFor(() => expect(document.getAnimations()).toHaveLength(0));
      (document.activeElement as HTMLElement | null)?.blur();
      await expect.element(gallery).toMatchScreenshot(`${name}-${scheme}`);
    });
  });
});
