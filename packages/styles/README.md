# @rio-m3e/styles

Plain CSS for the components of [Rio](https://github.com/LegenLee/rio), a Material 3 Expressive implementation. It styles the markup [`@rio-m3e/core`](https://www.npmjs.com/package/@rio-m3e/core) describes, with the `--rio-*` CSS variables that [`@rio-m3e/tokens`](https://www.npmjs.com/package/@rio-m3e/tokens) sets.

Framework adapters such as [`@rio-m3e/vue`](https://www.npmjs.com/package/@rio-m3e/vue) import these files for you. To use them directly, import a component's stylesheet with the shared ones under `base/` that its markup uses, as for a button:

```ts
import '@rio-m3e/styles/base/corner-morph.css';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/base/touch-target.css';
import '@rio-m3e/styles/button.css';
```

What moves, such as the ripple and the corner morph, is `@rio-m3e/core`'s, as `attachRipple` and `attachCornerMorph`.

`base/` holds the anchored positions of menus and tooltips, corner morphs, the direction of the line (`direction.css`, for the stylesheets that lay out or draw differently right to left), the focus ring, reduced motion, the ripple, the state layer, and the touch target.

## License

Licensed under the Apache License 2.0.
