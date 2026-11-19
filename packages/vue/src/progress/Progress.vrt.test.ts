/// <reference types="@vitest/browser-playwright" />
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { cdp } from 'vitest/browser';
import { h } from 'vue';
import { renderGallery, SCHEMES } from '../test/vrt';
import CircularProgress from './CircularProgress.vue';
import LinearProgress from './LinearProgress.vue';

// A still picture: reduced motion holds the waves and the changes of value, and the moving
// indeterminate indicators stop 600ms into their cycle.
let style: HTMLStyleElement;
beforeAll(async () => {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  style = document.head.appendChild(document.createElement('style'));
  style.textContent = `.still, .still * {
    animation-play-state: paused !important;
    animation-delay: -600ms !important;
  }`;
});
afterAll(async () => {
  style.remove();
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

const linear = (props: Record<string, unknown>) =>
  h('div', { style: 'width: 240px' }, [h(LinearProgress, { class: 'still', ...props })]);
const circular = (props: Record<string, unknown>) =>
  h(CircularProgress, { class: 'still', ...props });

describe('RioLinearProgress and RioCircularProgress', () => {
  test.each(SCHEMES)('flat and wavy, determinate and indeterminate, %s', async (scheme) => {
    const gallery = await renderGallery(scheme, () => [
      [linear({ value: 0.4 }), linear({ value: 0.6, thickness: 8 }), linear({ value: 0.01 })],
      [linear({ value: 0 }), linear({ value: 1 }), linear({})],
      [linear({ value: 0.5, wavy: true }), linear({ value: 0.5, wavy: true, thickness: 8 })],
      [linear({ value: 0.05, wavy: true }), linear({ wavy: true })],
      [
        circular({ value: 0.3 }),
        circular({ value: 0.7, thickness: 8 }),
        circular({ value: 0 }),
        circular({ value: 0.01 }),
        circular({}),
        circular({ value: 0.6, wavy: true }),
        circular({ value: 0.6, wavy: true, thickness: 8 }),
        circular({ wavy: true }),
        circular({ value: 0.75, wavy: true, size: 96, thickness: 8 }),
      ],
    ]);
    // The screenshot would otherwise reset the indeterminate indicators' endless animations.
    await expect
      .element(gallery)
      .toMatchScreenshot(`progress-${scheme}`, { screenshotOptions: { animations: 'allow' } });
  });
});
