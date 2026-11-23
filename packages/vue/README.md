# @rio-m3e/vue

Vue components for [Rio](https://github.com/LegenLee/rio), a Material 3 Expressive implementation.

Rio is in early development. Before 1.0, any minor version may break the API.

## Install

```sh
pnpm add @rio-m3e/vue
```

It needs Vue 3.5 or later, and installs `@rio-m3e/core`, `@rio-m3e/styles`, and `@rio-m3e/tokens` for you. Rio loads no fonts: load Roboto yourself, as with `@fontsource/roboto`.

## Set up

Install `createRio` before mounting the app. It writes the theme as `--rio-*` CSS variables and, with `locale`, sets the language for the whole app; without one, components follow the page's `<html lang>`, then the browser's language:

```ts
// main.ts
import { createRio } from '@rio-m3e/vue';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App)
  .use(createRio({ theme: { sourceColor: '#6750a4' } }))
  .mount('#app');
```

Rio ships no icons. Give them in a component's slot, or once to `createRio`'s `icons` for the icons the components draw on their own, such as a select's arrow ([Icons](https://legenlee.github.io/rio/guide/icons)).

## Use

Each component imports its own styles.

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

## Components

Each page has live examples, the API, and how the component follows the spec.

- [App bar](https://legenlee.github.io/rio/components/app-bar): `RioAppBar`
- [Button](https://legenlee.github.io/rio/components/button): `RioButton`
- [Button group](https://legenlee.github.io/rio/components/button-group): `RioButtonGroup`
- [Checkbox](https://legenlee.github.io/rio/components/checkbox): `RioCheckbox`
- [Chips](https://legenlee.github.io/rio/components/chip): `RioChipSet`, `RioAssistChip`, `RioFilterChip`, `RioInputChip`, `RioSuggestionChip`
- [Date picker](https://legenlee.github.io/rio/components/date-picker): `RioDatePicker`, `RioDatePickerDialog`, `RioDateRangePickerDialog`
- [Dialog](https://legenlee.github.io/rio/components/dialog): `RioDialog`
- [Icon](https://legenlee.github.io/rio/components/icon): `RioIcon`
- [Icon button](https://legenlee.github.io/rio/components/icon-button): `RioIconButton`
- [Lists](https://legenlee.github.io/rio/components/list): `RioList`, `RioListItem`
- [Loading indicator](https://legenlee.github.io/rio/components/loading-indicator): `RioLoadingIndicator`
- [Menu](https://legenlee.github.io/rio/components/menu): `RioMenu`, `RioMenuItem`, `RioMenuGroup`, `RioMenuDivider`, `RioSubMenu`
- [Progress indicators](https://legenlee.github.io/rio/components/progress-indicator): `RioLinearProgress`, `RioCircularProgress`
- [Radio button](https://legenlee.github.io/rio/components/radio-button): `RioRadioGroup`, `RioRadio`
- [Scroll fields](https://legenlee.github.io/rio/components/scroll-field): `RioScrollField`
- [Select](https://legenlee.github.io/rio/components/select): `RioSelect`, `RioSelectOption`
- [Slider](https://legenlee.github.io/rio/components/slider): `RioSlider`, `RioRangeSlider`
- [Split button](https://legenlee.github.io/rio/components/split-button): `RioSplitButton`
- [Switch](https://legenlee.github.io/rio/components/switch): `RioSwitch`
- [Text field](https://legenlee.github.io/rio/components/text-field): `RioTextField`
- [Time picker](https://legenlee.github.io/rio/components/time-picker): `RioTimePickerDialog`, `RioTimeInput`, `RioTimeScroll`
- [Toolbar](https://legenlee.github.io/rio/components/toolbar): `RioToolbar`
- [Tooltip](https://legenlee.github.io/rio/components/tooltip): `RioTooltip`

`RioLocaleProvider` sets the language for part of a page ([Languages](https://legenlee.github.io/rio/guide/languages)), and the `v-ripple` directive draws the press ripple on an element of your own.

The [docs](https://legenlee.github.io/rio/) start with [Getting started](https://legenlee.github.io/rio/guide/getting-started).

## License

Licensed under the Apache License 2.0.
