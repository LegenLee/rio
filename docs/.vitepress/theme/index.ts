// Rio doesn't load fonts itself; apps load Roboto. The docs are such an app.
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { createRio } from '@rio-m3e/vue';
import type { Theme } from 'vitepress';
// The site uses Rio's typeface instead of VitePress's Inter (see custom.css).
import DefaultTheme from 'vitepress/theme-without-fonts';
import { h } from 'vue';
import { icons } from '../../guide/icons/mdi';
import Demo from './components/Demo.vue';
import HeroActions from './components/HeroActions.vue';
import './custom.css';
import { RioTheme } from './rio-theme';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'layout-top': () => h(RioTheme),
      // The home's hero has no `actions`; its links are Rio buttons instead.
      'home-hero-actions-after': () => h(HeroActions),
    }),
  enhanceApp({ app }) {
    app.component('Demo', Demo);
    // The icons the components draw on their own, from Material Design Icons, as the Icons guide
    // registers them. The theme is RioTheme's, so `createRio` takes none.
    app.use(createRio({ icons }));
  },
} satisfies Theme;
