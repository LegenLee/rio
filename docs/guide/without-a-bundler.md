# Without a bundler

Rio's packages are built for a bundler, such as Vite: each component imports its own styles, which only a bundler can follow. For a page that loads Rio as plain files, as from a CDN, `@rio-m3e/vue` also ships a browser build in `dist/browser/`:

| File                | What it is                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `rio-vue.js`        | The whole library as one ES module, for an import map, with `@rio-m3e/core` and `@rio-m3e/tokens` under their own names (below) |
| `rio-vue.global.js` | The same, as a script that sets the `RioVue` global                                                                             |
| `rio-vue.css`       | Every component's styles, in the order a bundler gives them                                                                     |

Vue isn't in them: the page loads its own, and Rio uses it. Rio needs Vue 3.5 or later.

Before 1.0, any minor version may break the API, so pin Rio's version in the URLs: replace `x.y.z` below with the version you use. The examples load from [jsDelivr](https://www.jsdelivr.com); unpkg serves the same files. To have the browser check the files too, see [Integrity](#integrity).

## With an import map

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@rio-m3e/vue@x.y.z/dist/browser/rio-vue.css"
    />
    <script type="importmap">
      {
        "imports": {
          "vue": "https://cdn.jsdelivr.net/npm/vue@3.5/dist/vue.esm-browser.prod.js",
          "@rio-m3e/vue": "https://cdn.jsdelivr.net/npm/@rio-m3e/vue@x.y.z/dist/browser/rio-vue.js"
        }
      }
    </script>
  </head>
  <body>
    <div id="app">
      <rio-button @click="count++">Pressed {{ count }}</rio-button>
      <label><rio-switch v-model:selected="wifi"></rio-switch> Wi-Fi</label>
    </div>

    <script type="module">
      import { createApp, ref } from 'vue';
      import { createRio, RioComponents } from '@rio-m3e/vue';

      createApp({ setup: () => ({ count: ref(0), wifi: ref(true) }) })
        .use(createRio({ theme: { sourceColor: '#6750a4' } }))
        .use(RioComponents)
        .mount('#app');
    </script>
  </body>
</html>
```

## With script tags

Without modules, Vue sets the `Vue` global and Rio the `RioVue` global:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@rio-m3e/vue@x.y.z/dist/browser/rio-vue.css"
/>
<script src="https://cdn.jsdelivr.net/npm/vue@3.5/dist/vue.global.prod.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@rio-m3e/vue@x.y.z/dist/browser/rio-vue.global.js"></script>

<div id="app">
  <rio-button @click="count++">Pressed {{ count }}</rio-button>
</div>

<script>
  const { createApp, ref } = Vue;
  const { createRio, RioComponents } = RioVue;

  createApp({ setup: () => ({ count: ref(0) }) })
    .use(createRio({ theme: { sourceColor: '#6750a4' } }))
    .use(RioComponents)
    .mount('#app');
</script>
```

## Templates in the page

The Vue builds above compile templates in the browser, so the app's template can be the page's own HTML, as in the examples.

- `RioComponents`, only in the browser build, registers every component under its name, and the `v-ripple` directive. To register only some, use `app.component('RioButton', RioButton)`.
- The browser reads the HTML before Vue does, so write component tags in kebab-case, `<rio-button>`, and close every one, as `<rio-switch></rio-switch>`: HTML has no self-closing custom elements. Props and events are kebab-case too, as `soft-disabled`.
- Everything else is as in [Getting started](./getting-started.md): `createRio` writes the theme as the app installs it, and each component's page has its props, slots, and events.

## Core and tokens

The browser build exports what `@rio-m3e/vue` exports, as with a bundler, and `@rio-m3e/core` and `@rio-m3e/tokens` whole, under the names `core` and `tokens`. The components use them already, so they add little to the file.

```js
// With an import map
import { core, tokens } from '@rio-m3e/vue';
// With script tags
const { core, tokens } = RioVue;

matchMedia(core.breakpointQuery('compact')).matches; // a window narrower than 600px
tokens.createThemeCss({ sourceColor: '#6750a4' }); // the theme as CSS, as for a server-rendered page
```

`core` and `tokens` are only in the browser build. With a bundler, import from the packages themselves.

## Fonts and icons

Rio doesn't load any font. Load Roboto in the weights the type scale uses, as from Google Fonts:

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
/>
```

Rio ships no icons either; [Icons](./icons.md) has the ways to bring them, such as an icon font from a CDN.

## Integrity

To have the browser check that a file is the one published, give its `<link>` or `<script>` the file's hash in `integrity`, with `crossorigin="anonymous"`. The browser refuses a file whose hash doesn't match:

```html
<script
  src="https://cdn.jsdelivr.net/npm/@rio-m3e/vue@x.y.z/dist/browser/rio-vue.global.js"
  integrity="sha384-…"
  crossorigin="anonymous"
></script>
```

- jsDelivr shows each file's hash on the package's page; or compute it from the file: `openssl dgst -sha384 -binary rio-vue.global.js | openssl base64 -A`, after `sha384-`.
- **A hash matches one exact version.** A range, as `vue@3.5` in the examples above, serves a newer file once one is published, and its hash no longer matches: with `integrity`, pin Vue to an exact version too, as `vue@3.5.45`.
- With an import map, give the modules' hashes under `"integrity"`, by URL, beside `"imports"`. Browsers that don't know the key ignore it, and load the modules unchecked.

```html
<script type="importmap">
  {
    "imports": {
      "vue": "https://cdn.jsdelivr.net/npm/vue@3.5.45/dist/vue.esm-browser.prod.js",
      "@rio-m3e/vue": "https://cdn.jsdelivr.net/npm/@rio-m3e/vue@x.y.z/dist/browser/rio-vue.js"
    },
    "integrity": {
      "https://cdn.jsdelivr.net/npm/vue@3.5.45/dist/vue.esm-browser.prod.js": "sha384-…",
      "https://cdn.jsdelivr.net/npm/@rio-m3e/vue@x.y.z/dist/browser/rio-vue.js": "sha384-…"
    }
  }
</script>
```

## What it costs

The browser build loads every component, where a bundler keeps only the ones an app uses. Gzipped, the script is about 95 kB and the stylesheet about 38 kB, with Vue's own on top.

The npm package carries the browser build too, so `@rio-m3e/vue` downloads at about 275 kB, and 1.2 MB unpacked. A bundler leaves those files out of an app.
