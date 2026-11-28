# Getting started

Rio is in early development. Before 1.0, any minor version may break the API.

## Install

```sh
pnpm add @rio-m3e/vue
```

`@rio-m3e/vue` needs Vue 3.5 or later, and it installs `@rio-m3e/core`, `@rio-m3e/styles`, and `@rio-m3e/tokens` for you.

This assumes a bundler, such as Vite. For a page without one, loading Rio from a CDN, see [Without a bundler](./without-a-bundler.md).

## Set up Rio

`createRio` sets the theme and the language for the whole app. Install it **before** mounting the app:

```ts
// main.ts
import { createRio } from '@rio-m3e/vue';
import { createApp } from 'vue';
import App from './App.vue';

const rio = createRio({
  theme: { sourceColor: '#6750a4' }, // follows the system's light or dark mode
  locale: 'en', // only to fix one: otherwise the page's <html lang>, then the browser's
});

createApp(App).use(rio).mount('#app');
```

| Option           | Type                                                                           | Default                     |
| ---------------- | ------------------------------------------------------------------------------ | --------------------------- |
| `theme`          | The theme below, or a ref or getter to one                                     | No theme                    |
| `locale`         | `string`, a language tag, or a ref or getter to one                            | The page's or the browser's |
| `fallbackLocale` | `string`: for a language Rio has no messages for, the one that fills in        | `'en'`                      |
| `messages`       | Message tables by language: `{ ja: { datePicker: { cancel: 'キャンセル' } } }` | —                           |

The language options are in [Languages](./languages.md).

### The theme

The theme is written as `--rio-*` CSS variables on the page's root as the app installs Rio. Components spring their shapes toward targets that the theme sets, so a theme in place before they mount keeps them from springing at load. Given as a ref or a getter, the theme is written again whenever it changes, and the shapes spring once into the new targets. Unmounting the app takes it off.

| Option           | Type                                                                                                                                                     | Default                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `sourceColor`    | `string`, as `#rgb` or `#rrggbb`: the seed every palette is derived from. Required.                                                                      | —                                                   |
| `variant`        | `'tonal-spot' \| 'neutral' \| 'vibrant' \| 'expressive'`                                                                                                 | `'tonal-spot'`                                      |
| `contrast`       | `number`, from -1 (reduced) through 0 to 1 (high)                                                                                                        | `0`                                                 |
| `keyColors`      | The primary, secondary, tertiary, neutral, neutral variant, and error key colors, in place of the ones derived from the source: `{ primary: '#ff5722' }` | Derived from the source color                       |
| `staticColors`   | Colors that stay the same whatever the source, by name: `{ success: '#2e7d32' }`                                                                         | None                                                |
| `colorScheme`    | `'light dark' \| 'light' \| 'dark' \| false`                                                                                                             | `'light dark'`                                      |
| `motion`         | `'expressive' \| 'standard'`                                                                                                                             | `'expressive'`                                      |
| `shapes`         | Corner radius steps to resize, in px: `{ medium: 16 }`                                                                                                   | The spec's scale                                    |
| `typefaces`      | Font families: `{ brand: '"Roboto Flex", sans-serif' }`                                                                                                  | Roboto, or Roboto Flex with `typescale: 'variable'` |
| `languageHeight` | Line heights for the script's height: `'small' \| 'medium' \| 'large' \| 'extra-large'`                                                                  | By the app's language                               |
| `typescale`      | `'static'`, for Roboto, or `'variable'`, the spec's variable type scale, for Roboto Flex                                                                 | `'static'`                                          |

The source color is just a seed and **NOT SAME** as the primary color. To keep a color's own hue and chroma(like a brand's color), give it as `keyColors.primary`; its roles still take the scheme's tones, so the primary role is that very color only where its tone happens to match.

A static color writes the four variables an accent color has, named after it: `--rio-color-success`, `--rio-color-on-success`, `--rio-color-success-container`, and `--rio-color-on-success-container`. Its hue turns a little toward the scheme's primary color, to sit well with it, unless it is given as `{ color: '#ff5722', harmonize: false }`, as for a brand color. See [Foundations](../foundations.md#_7-add-colors-to-the-scheme).

Each color variable holds a light and a dark value in `light-dark()`, so the `color-scheme` of the element that uses it picks one. `colorScheme` sets the root's: `'light dark'` follows the system, `'light'` or `'dark'` picks one, and `false` leaves it to the app, as for an app whose own dark mode sets `color-scheme`. An app that then sets none leaves it at `normal`, where every color takes its light value.

Taller scripts, such as Korean, Japanese, Chinese, Arabic, or Thai, need taller lines than Latin. Without `languageHeight`, the theme takes the line heights for the script of the app's language, as [Languages](./languages.md) finds it; see [Foundations](../foundations.md#_5-3-language-height).

Give a theme to one app per page: the theme is the page's root's, so a second app's would replace it, and unmounting either app takes it off.

What each token means, and where Rio's values come from, is in [Foundations](../foundations.md).

### Server rendering

On the server there is no page to write the theme on. `rio.css` holds it as a stylesheet, `:root` with the theme's `color-scheme`; put it in the page's `<head>`, so the first paint has Rio's colors:

```ts
const rio = createRio({ theme: { sourceColor: '#6750a4' } });

const head = `<style>${rio.css}</style>`;
```

Without Vue, `@rio-m3e/tokens` does the same: `attachTheme(element, theme)` writes the variables and the `color-scheme` on an element, and its handle writes another theme over them (`update`) or takes them off (`detach`); `createThemeCss(theme)` returns the stylesheet.

## Load Roboto

Rio's typefaces default to `Roboto, system-ui, sans-serif`, but Rio doesn't load any font. Load Roboto in the app, or the system font is used. The type scale uses the weights 400, 500, and 700. With [Fontsource](https://fontsource.org/fonts/roboto):

```ts
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
```

For a variable font, give the theme `typescale: 'variable'`, the spec's variable type scale: the typefaces then default to `"Roboto Flex", Roboto, "Noto Sans", system-ui, sans-serif`, and the letter spacing is 0. Load Roboto Flex with its optical size axis, which the browser sets to the font size. Fontsource names it `Roboto Flex Variable`, so pass that name:

```ts
import '@fontsource-variable/roboto-flex/opsz.css';

const stack = '"Roboto Flex Variable", Roboto, "Noto Sans", system-ui, sans-serif';
app.use(
  createRio({
    theme: {
      sourceColor: '#6750a4',
      typescale: 'variable',
      typefaces: { brand: stack, plain: stack },
    },
  }),
);
```

## Use the components

Each component imports its own styles. Rio ships no icons, so bring your own: in a component's slot, as here, or once for the whole app, for the icons the components draw on their own (see [Icons](./icons.md)). This example draws [Material Design Icons](https://pictogrammers.com/library/mdi/) from `@mdi/js` with [`RioIcon`](../components/icon.md):

```vue
<script setup lang="ts">
import { mdiHeart, mdiHeartOutline } from '@mdi/js';
import { RioButton, RioIcon, RioIconButton, RioSwitch } from '@rio-m3e/vue';
import { ref } from 'vue';

const favorite = ref(false);
const wifi = ref(true);
</script>

<template>
  <RioButton variant="tonal">Save</RioButton>

  <RioIconButton v-model:selected="favorite" label="Add to favorites" toggle variant="standard">
    <RioIcon :icon="{ type: 'svg', path: mdiHeartOutline }" />
    <template #selected-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiHeart }" />
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
