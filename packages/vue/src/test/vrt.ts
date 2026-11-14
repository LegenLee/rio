// Shared setup for the visual regression tests (`*.vrt.test.ts`, the `vrt` project in
// vitest.config.ts). Importing it fixes everything a screenshot depends on besides the component:
// the font (Roboto, Rio's default typeface, loaded from @fontsource instead of the system), the
// theme (the default source color), and the page.
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import { applyTheme } from '@rio-m3e/tokens';
import { beforeAll } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, type VNode } from 'vue';

export const SCHEMES = ['light', 'dark'] as const;
export type Scheme = (typeof SCHEMES)[number];

beforeAll(async () => {
  applyTheme(document.documentElement, { sourceColor: '#6750a4' });
  document.body.style.margin = '0';
  await Promise.all([
    document.fonts.load('400 16px Roboto'),
    document.fonts.load('500 16px Roboto'),
  ]);
});

/** A 24px icon from an SVG path, such as one from @mdi/js. */
export const icon = (path: string) =>
  h('svg', { viewBox: '0 0 24 24' }, [h('path', { d: path, fill: 'currentColor' })]);

/**
 * Renders rows of components on the theme's surface in a light or dark scheme, and returns the
 * area to screenshot. The padding leaves room for focus rings, and the pointer is parked in it, so
 * nothing is hovered by accident.
 */
export async function renderGallery(scheme: Scheme, rows: () => VNode[][]) {
  document.documentElement.style.colorScheme = scheme;
  const Gallery = defineComponent(
    () => () =>
      h(
        'div',
        {
          'data-testid': 'gallery',
          style: {
            display: 'inline-grid',
            gap: '16px',
            padding: '16px',
            background: 'var(--rio-color-surface)',
            color: 'var(--rio-color-on-surface)',
          },
        },
        rows().map((row) =>
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, row),
        ),
      ),
  );
  await render(Gallery);
  const gallery = page.getByTestId('gallery');
  await userEvent.hover(gallery, { position: { x: 2, y: 2 } });
  return gallery;
}

/**
 * Focuses an element the way the keyboard does, so it matches `:focus-visible` and shows its
 * focus ring. A key press first makes the browser treat the focus as keyboard focus.
 */
export async function keyboardFocus(element: HTMLElement) {
  await userEvent.keyboard('{Shift}');
  element.focus();
}
