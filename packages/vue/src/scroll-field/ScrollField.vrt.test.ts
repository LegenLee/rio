import { describe, expect, test } from 'vitest';
import { h } from 'vue';
import { keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import ScrollField from './ScrollField.vue';

const field = (props: Record<string, unknown>) => h(ScrollField, { label: 'Value', ...props });

describe('RioScrollField', () => {
  test.each(SCHEMES)('sizes, options, editing, and states, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      [
        field({ modelValue: 7, min: 0, max: 59 }),
        field({ modelValue: 107, min: 100, max: 130 }),
        field({ modelValue: 1007, min: 1000, max: 1030 }),
        field({ modelValue: 'kg', options: ['g', 'kg', 'lb'] }),
        field({ modelValue: 7, min: 0, max: 59, style: 'block-size: 200px' }),
      ],
      [
        field({ modelValue: 7, min: 0, max: 59, editing: true }),
        field({ modelValue: 7, min: 0, max: 59, invalid: true }),
        field({ modelValue: 7, min: 0, max: 59, editing: true, invalid: true }),
        field({ modelValue: 7, min: 0, max: 59, disabled: true }),
        field({ modelValue: 7, min: 0, max: 59, disabled: true, editing: true }),
      ],
    ]);
    // The editing fields keep editing without the focus, and so without a blinking caret.
    (document.activeElement as HTMLElement | null)?.blur();
    await expect.element(gallery).toMatchScreenshot(`fields-${scheme}`);
  });

  test('keyboard focus', async () => {
    const gallery = await renderGallery('light', () => [
      [field({ modelValue: 7, min: 0, max: 59 })],
    ]);
    const focused = gallery.getByRole('listbox').element() as HTMLElement;
    await keyboardFocus(focused);
    expect(focused.matches(':focus-visible')).toBe(true);
    await expect.element(gallery).toMatchScreenshot('keyboard-focus');
  });
});
