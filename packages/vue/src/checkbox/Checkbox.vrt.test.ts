import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { h } from 'vue';
import { keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import Checkbox from './Checkbox.vue';

/** Waits out the checkmarks' motion. */
const settled = () => vi.waitFor(() => expect(document.getAnimations()).toHaveLength(0));

describe('RioCheckbox', () => {
  test.each(SCHEMES)('states, %s', async (scheme) => {
    const row = (props: Record<string, boolean>) => [
      h(Checkbox, props),
      h(Checkbox, { ...props, selected: true }),
      h(Checkbox, { ...props, indeterminate: true }),
    ];
    const gallery = await renderGallery(scheme, () => [
      row({}),
      row({ error: true }),
      row({ disabled: true }),
    ]);
    await settled();
    await expect.element(gallery).toMatchScreenshot(`states-${scheme}`);
  });

  test('keyboard focus and hover', async () => {
    const gallery = await renderGallery('light', () => [
      [h(Checkbox, { selected: true }), h(Checkbox)],
    ]);
    const [focused, hovered] = gallery.getByRole('checkbox').elements() as HTMLElement[];
    await keyboardFocus(focused!);
    expect(focused!.matches(':focus-visible')).toBe(true);
    await userEvent.hover(hovered!);
    await settled();
    await expect.element(gallery).toMatchScreenshot('interaction');
  });
});
