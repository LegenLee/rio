/// <reference types="@vitest/browser-playwright" />
import { describe, expect, test } from 'vitest';
import { h } from 'vue';
import { renderGallery, SCHEMES } from '../test/vrt';
import LoadingIndicator from './LoadingIndicator.vue';

// A still picture: determinate indicators hold their shape, where the looping one never stops.
const indicator = (props: Record<string, unknown>) => h(LoadingIndicator, props);

describe('RioLoadingIndicator', () => {
  test.each(SCHEMES)('determinate, contained, sized, and given shapes, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      [0, 0.25, 0.5, 0.75, 1].map((value) => indicator({ value })),
      [0, 0.25, 0.5, 0.75, 1].map((value) => indicator({ value, contained: true })),
      [
        indicator({ value: 0.4, size: 24 }),
        indicator({ value: 0.4, size: 96 }),
        indicator({ value: 0.4, size: 96, contained: true }),
        indicator({ value: 0.5, shapes: ['heart', 'flower'] }),
      ],
    ]);
    await expect.element(gallery).toMatchScreenshot(`loading-indicator-${scheme}`);
  });
});
