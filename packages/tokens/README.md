# @rio-m3e/tokens

Design tokens for [Rio](https://github.com/LegenLee/rio), a Material 3 Expressive implementation: color schemes from a source color, elevation, motion, shape, typography, and states, as `--rio-*` CSS variables.

With [`@rio-m3e/vue`](https://www.npmjs.com/package/@rio-m3e/vue), `createRio({ theme })` does this for you. Without it:

```ts
import { attachTheme } from '@rio-m3e/tokens';

const theme = attachTheme(document.documentElement, { sourceColor: '#6750a4' });

theme.update({ sourceColor: '#006a6a' }); // writes another theme over it
theme.detach(); // takes it off
```

- `createThemeCss(theme)` returns the same variables as a stylesheet, for server rendering or a static file, and `createThemeVariables(theme)` as an object of CSS variables.
- A theme takes `sourceColor`, `variant`, `contrast`, `keyColors`, `staticColors`, `colorScheme`, `motion`, `shapes`, `typefaces`, `languageHeight`, and `typescale` ([the theme's options](https://legenlee.github.io/rio/guide/getting-started#the-theme)).
- `languageHeightOf(locale)` gives the line heights for the script of a language, taller for Korean, Chinese, Japanese, Arabic, or Thai than for Latin.

What each token means, and where its value comes from, is in [Foundations](https://legenlee.github.io/rio/foundations).

## License

Licensed under the Apache License 2.0. It bundles [material-color-utilities](https://github.com/material-foundation/material-color-utilities) by Google LLC, also under the Apache License 2.0; see `NOTICE`.
