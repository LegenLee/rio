// The browser build's entry, for pages that load Rio without a bundler (see tsdown.config.ts): the
// whole library, core and tokens under their own names, and a plugin that registers the components
// by name, for templates written in the page.

import type { App, Component, Plugin } from 'vue';
import * as rio from './index';

export * from './index';

/** `@rio-m3e/core` whole, as `RioVue.core.breakpointQuery` or `import { core } from '@rio-m3e/vue'` */
export * as core from '@rio-m3e/core';

/** `@rio-m3e/tokens` whole, as `RioVue.tokens.createThemeCss` */
export * as tokens from '@rio-m3e/tokens';

/**
 * Registers every Rio component under its name, as `RioButton` (`<rio-button>` in the page's
 * HTML), and the `v-ripple` directive: `app.use(RioComponents)`. Only in the browser build, where
 * the whole library is loaded anyway; with a bundler, register the components an app uses.
 */
export const RioComponents: Plugin = {
  install(app: App) {
    for (const [name, value] of Object.entries(rio)) {
      if (/^Rio[A-Z]/.test(name)) app.component(name, value as Component);
    }
    app.directive('ripple', rio.vRipple);
  },
};
