# Getting started

Rio is in early development. Before 1.0, any minor version may break the API.

## Install

```sh
pnpm add @rio-m3e/vue @rio-m3e/tokens
```

`@rio-m3e/vue` needs Vue 3.5 or later, and it installs `@rio-m3e/core` and `@rio-m3e/styles` for you.

## Apply a theme

`@rio-m3e/tokens` writes the theme as `--rio-*` CSS variables. Apply it once, **before** mounting the app:

```ts
// main.ts
import { applyTheme } from '@rio-m3e/tokens';
import { createApp } from 'vue';
import App from './App.vue';

const root = document.documentElement;
applyTheme(root, { sourceColor: '#6750a4' });
root.style.colorScheme = 'light dark'; // follow the system's light or dark mode

createApp(App).mount('#app');
```

Components spring their shapes toward targets that the theme sets. A theme applied after they mount moves those targets, so every shape springs into place once at load.

Each color variable holds a light and a dark value in `light-dark()`, so the `color-scheme` of the element that uses it picks one. Set `'light'` or `'dark'` instead of `'light dark'` to pick one yourself.

| Option        | Type                                                     | Default          |
| ------------- | -------------------------------------------------------- | ---------------- |
| `sourceColor` | `string`, as `#rgb` or `#rrggbb`. Required.              | —                |
| `variant`     | `'tonal-spot' \| 'neutral' \| 'vibrant' \| 'expressive'` | `'tonal-spot'`   |
| `contrast`    | `number`, from -1 (reduced) through 0 to 1 (high)        | `0`              |
| `motion`      | `'expressive' \| 'standard'`                             | `'expressive'`   |
| `shapes`      | Corner radius steps to resize, in px: `{ medium: 16 }`   | The spec's scale |
| `typefaces`   | Font families: `{ brand: '"Roboto Flex", sans-serif' }`  | Roboto           |

What each token means, and where Rio's values come from, is in [Foundations](../foundations.md).

### Server rendering

`createThemeCss` returns the same variables as a stylesheet, for server rendering or a static file. It sets `color-scheme: light dark` on the selector, which defaults to `:root`:

```ts
import { createThemeCss } from '@rio-m3e/tokens';

const css = createThemeCss({ sourceColor: '#6750a4' });
```

## Load Roboto

Rio's typefaces default to `Roboto, system-ui, sans-serif`, but Rio doesn't load any font. Load Roboto in the app, or the system font is used. The type scale uses the weights 400, 500, and 700. With [Fontsource](https://fontsource.org/fonts/roboto):

```ts
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
```

## Use the components

Each component imports its own styles. Rio ships no icons, so bring your own. This example uses [Material Design Icons](https://pictogrammers.com/library/mdi/) from `@mdi/js`:

```vue
<script setup lang="ts">
import { mdiHeart, mdiHeartOutline } from '@mdi/js';
import { RioButton, RioIconButton, RioSwitch } from '@rio-m3e/vue';
import { ref } from 'vue';

const favorite = ref(false);
const wifi = ref(true);
</script>

<template>
  <RioButton variant="tonal">Save</RioButton>

  <RioIconButton v-model:selected="favorite" label="Add to favorites" toggle variant="standard">
    <svg viewBox="0 0 24 24"><path :d="mdiHeartOutline" fill="currentColor" /></svg>
    <template #selected-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiHeart" fill="currentColor" /></svg>
    </template>
  </RioIconButton>

  <label><RioSwitch v-model:selected="wifi" /> Wi-Fi</label>
</template>
```

Each component has a page with live examples, its API, and how it follows the spec: [Button](../components/button.md), [Button group](../components/button-group.md), [Icon button](../components/icon-button.md), [Split button](../components/split-button.md), and [Switch](../components/switch.md).

## Adding transitions

The button, the icon button, the switch, and the split button's two buttons find out that their spring targets changed through a `transition` that their stylesheets set. If your CSS sets `transition` on one of them, end the list with `var(--rio-spring-targets)`, or the springs stop moving:

```css
.my-button {
  transition:
    opacity 200ms,
    var(--rio-spring-targets);
}
```

Use it only on those elements. Elsewhere, such as on a button group, the variable isn't defined, and the browser drops the whole declaration. [Foundations](../foundations.md#_3-build-motion-with-springs), section 3, explains how the springs work.
