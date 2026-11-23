# @rio-m3e/core

Framework-agnostic logic for [Rio](https://github.com/LegenLee/rio), a Material 3 Expressive implementation.

- **Each component**: its props, defaults, and state (`createButton`, `createSelect`, …); the attributes of each part of its markup, with a skeleton that describes the markup; and its behaviors in the page (`attachMenu`, `attachSlider`, …).
- **What components share**: the ripple, corner morphs, springs, drag, anchored positions, the Material shape library and its morphs, languages and their messages, dates, and icons; and the overlay that shows menus, dialogs, and tooltips above the page.

Framework adapters such as [`@rio-m3e/vue`](https://www.npmjs.com/package/@rio-m3e/vue) are built on it, and install it for you. Install it directly only to build an adapter, or components of your own; the [conventions](https://legenlee.github.io/rio/conventions) describe what an adapter does with it.

## License

Licensed under the Apache License 2.0. It includes code ported from [Android Jetpack](https://github.com/androidx/androidx) by The Android Open Source Project, also under the Apache License 2.0; see `NOTICE`.
