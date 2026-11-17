import { createThemeCss } from '@rio-m3e/tokens';
import { defineComponent, h } from 'vue';

/** The source color of the docs' theme, the same as in the README's example. */
export const SOURCE_COLOR = '#6750a4';

// No `color-scheme`: it would override VitePress's light and dark switch. VitePress sets
// `color-scheme` on the root, and every color variable is a light-dark() pair, so the switch picks
// the side.
const css = createThemeCss({ sourceColor: SOURCE_COLOR, colorScheme: false });

/**
 * Writes the theme as a <style> element. It renders during SSR, so the first paint already has
 * Rio's colors, before any JavaScript runs.
 */
export const RioTheme = defineComponent({
  name: 'RioTheme',
  // innerHTML, not a text child: SSR would escape quotes in a text child, such as those around a
  // font family name, and CSS inside <style> doesn't decode entities.
  setup: () => () => h('style', { innerHTML: css }),
});
