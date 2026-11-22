import { mdiVolumeHigh } from '@mdi/js';
import { describe, expect, test } from 'vitest';
import { h } from 'vue';
import { icon, keyboardFocus, renderGallery, SCHEMES } from '../test/vrt';
import RangeSlider from './RangeSlider.vue';
import Slider from './Slider.vue';

const wide = (props: Record<string, unknown>) => ({ style: 'width: 240px', ...props });
const volume = { icon: () => icon(mdiVolumeHigh) };

describe('RioSlider and RioRangeSlider', () => {
  test.each(SCHEMES)('variants, sizes, and states, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      [
        h(Slider, wide({ modelValue: 40 })),
        h(Slider, wide({ modelValue: 40, stops: true, step: 10 })),
        h(Slider, wide({ modelValue: -20, centered: true, min: -50, max: 50 })),
        h(RangeSlider, wide({ modelValue: [20, 70], 'aria-label': 'Range' })),
      ],
      [
        h(Slider, wide({ modelValue: 0 })),
        h(Slider, wide({ modelValue: 100 })),
        h(Slider, wide({ modelValue: 60, size: 'small' })),
        h(Slider, wide({ modelValue: 5, size: 'medium' }), volume),
      ],
      [
        h(Slider, wide({ modelValue: 60, size: 'medium' }), volume),
        h(Slider, wide({ modelValue: 60, size: 'large' }), volume),
        h(Slider, wide({ modelValue: 60, size: 'xlarge' }), volume),
      ],
      [
        h(Slider, wide({ modelValue: 40, disabled: true, stops: true, step: 20 })),
        h(RangeSlider, wide({ modelValue: [30, 60], disabled: true, 'aria-label': 'Range' })),
        h(Slider, { modelValue: 30, vertical: true, size: 'medium' }, volume),
        h(Slider, { modelValue: 70, vertical: true, stops: true, step: 10 }),
        h(RangeSlider, { modelValue: [20, 80], vertical: true, 'aria-label': 'Range' }),
      ],
    ]);
    await expect.element(gallery).toMatchScreenshot(`variants-${scheme}`);
  });

  test('keyboard focus and a press, with the value indicators', async () => {
    const gallery = await renderGallery('light', () => [
      // Room for the value indicators above the first row
      [h('div', { style: 'height: 40px' })],
      [
        h(Slider, wide({ modelValue: 40, valueIndicator: true })),
        h(RangeSlider, wide({ modelValue: [20, 70], valueIndicator: true, 'aria-label': 'Range' })),
      ],
    ]);
    const [focused] = gallery.getByRole('slider').elements() as HTMLElement[];
    await keyboardFocus(focused!);
    expect(focused!.matches(':focus-visible')).toBe(true);
    // A touch on the range's end handle presses it, without taking the focus.
    const range = gallery.getByRole('group').element() as HTMLElement;
    const rect = range.getBoundingClientRect();
    const press = { bubbles: true, isPrimary: true, pointerId: 9, pointerType: 'touch' };
    const x = rect.left + 6 + 0.7 * (rect.width - 12);
    const y = rect.top + rect.height / 2;
    range.dispatchEvent(new PointerEvent('pointerdown', { ...press, clientX: x, clientY: y }));
    await expect.element(gallery).toMatchScreenshot('interaction');
    range.dispatchEvent(new PointerEvent('pointercancel', press));
  });
});
