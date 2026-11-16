import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { h } from 'vue';
import { keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import Radio from './Radio.vue';
import RadioGroup from './RadioGroup.vue';

/** Waits out the dots' motion. */
const settled = () => vi.waitFor(() => expect(document.getAnimations()).toHaveLength(0));

/** Two radio buttons, the first selected, in a group of their own */
const pair = (props: Record<string, boolean> = {}) =>
  h(RadioGroup, { label: 'Pair', modelValue: 'a', style: { flexDirection: 'row' } }, () => [
    h(Radio, { value: 'a', ...props }),
    h(Radio, { value: 'b', ...props }),
  ]);

describe('RioRadio', () => {
  test.each(SCHEMES)('states, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [[pair()], [pair({ disabled: true })]]);
    await settled();
    await expect.element(gallery).toMatchScreenshot(`states-${scheme}`);
  });

  test('keyboard focus and hover', async () => {
    const gallery = await renderGallery('light', () => [[pair()]]);
    const [focused, hovered] = gallery.getByRole('radio').elements() as HTMLElement[];
    await keyboardFocus(focused!);
    expect(focused!.matches(':focus-visible')).toBe(true);
    await userEvent.hover(hovered!);
    await settled();
    await expect.element(gallery).toMatchScreenshot('interaction');
  });
});
