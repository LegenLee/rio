# @rio-m3e/tokens

Design tokens for [Rio](https://github.com/LegenLee/rio), a Material 3 Expressive implementation: color schemes from a source color, elevation, motion, shape, typography, and states, as `--rio-*` CSS variables.

```ts
import { applyTheme } from '@rio-m3e/tokens';

applyTheme(document.documentElement, { sourceColor: '#6750a4' });
```

`createThemeCss` returns the same variables as a stylesheet, for server rendering or a static file.

Licensed under the Apache License 2.0. It bundles [material-color-utilities](https://github.com/material-foundation/material-color-utilities) by Google LLC, also under the Apache License 2.0; see `NOTICE`.
