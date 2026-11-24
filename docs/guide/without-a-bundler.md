# Without a bundler

Rio's packages are built for a bundler, such as Vite: each component imports its own styles, which only a bundler can follow. For a page that loads Rio as plain files, as from a CDN, `@rio-m3e/vue` also ships a browser build in `dist/browser/`:

| File                | What it is                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `rio-vue.js`        | The whole library as one ES module, for an import map. `@rio-m3e/core` and `@rio-m3e/tokens` are in it. |
| `rio-vue.global.js` | The same, as a script that sets the `RioVue` global                                                     |
| `rio-vue.css`       | Every component's styles, in the order a bundler gives them                                             |

Vue isn't in them: the page loads its own, and Rio uses it. Rio needs Vue 3.5 or later.

Before 1.0, any minor version may break the API, so pin Rio's version in the URLs: replace `x.y.z` below with the version you use. The examples load from [jsDelivr](https://www.jsdelivr.com); unpkg serves the same files.

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

## Fonts and icons

Rio doesn't load any font. Load Roboto in the weights the type scale uses, as from Google Fonts:

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
/>
```

Rio ships no icons either; [Icons](./icons.md) has the ways to bring them, such as an icon font from a CDN.

## What it costs

The browser build loads every component, where a bundler keeps only the ones an app uses. Gzipped, the script is about 90 kB and the stylesheet about 35 kB, with Vue's own on top.
