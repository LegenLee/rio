# Rio

Rio is a Vue implementation of Material 3 Expressive.  
It's the UI library that will replace Vuetify in the [Nozomi](https://github.com/LegenLee/nozomi) project.

## Disclaimer

Material Design and Material 3 are trademarks of Google LLC. This project is not affiliated with,
endorsed by, or connected to Google in any way.

## Roadmap

Development status: early. Before 1.0, any minor version may break the API.

### v0.1

- [x] Foundations: color (with material-color-utilities), elevation, motion, shape, typography, and states
- [x] Button
- [x] Icon button
- [x] Switch

### Later

- [ ] Tooltip
- [ ] Link buttons
- [ ] Form value for the switch
- [ ] Language-specific line heights and variable font axes

## Usage

```sh
pnpm add @rio-m3e/vue @rio-m3e/tokens
```

`@rio-m3e/tokens` sets the theme as CSS variables. Apply it once before mounting the app.

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

Each component brings its own styles. Rio ships no icons, so bring your own.

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

Each component has a page in [docs/components](/docs/components).

## Development

### Development setup

- [Node.js](https://nodejs.org) v24 or later (runtime)
- [pnpm](https://pnpm.io) v11 (package manager)
- [Visual Studio Code](https://code.visualstudio.com/) (editor)

### Required Visual Studio Code extensions

- [Vue](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Oxc](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) (formatter and linter)

### Commands

```sh
pnpm install
pnpm exec playwright install chromium   # first time only
pnpm dev                                # playground
pnpm test --run
```

The working branch is `dev`, and pull requests go to `dev`. The rules are in
[docs/conventions.md](/docs/conventions.md), and how M3E was read and carried over is in
[docs/foundations.md](/docs/foundations.md).

## License

    Copyright © 2026 LegenLee

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

`@rio-m3e/tokens` bundles [material-color-utilities](https://github.com/material-foundation/material-color-utilities)
by Google LLC, also under the Apache License 2.0. See [NOTICE](/NOTICE).

## README Translations

- [English](/README.md)
- [Korean / 한국어](/i18n/README.ko.md)
