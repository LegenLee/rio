// Rio doesn't load fonts itself; apps load Roboto. The docs are such an app.
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import type { Theme } from 'vitepress';
// The site uses Rio's typeface instead of VitePress's Inter (see custom.css).
import DefaultTheme from 'vitepress/theme-without-fonts';
import { h } from 'vue';
import Demo from './components/Demo.vue';
import './custom.css';
import { RioTheme } from './rio-theme';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'layout-top': () => h(RioTheme) }),
  enhanceApp({ app }) {
    app.component('Demo', Demo);
  },
} satisfies Theme;
