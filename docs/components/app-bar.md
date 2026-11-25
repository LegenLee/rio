# App bar

`RioAppBar` from `@rio-m3e/vue`, built on `createAppBar` and `attachAppBar` from `@rio-m3e/core` and `@rio-m3e/styles/app-bar.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-24.

## Examples

<script setup>
import Flexible from './demos/app-bar/Flexible.vue';
import Scrolling from './demos/app-bar/Scrolling.vue';
import Small from './demos/app-bar/Small.vue';
</script>

### Small, at the start and centered

<Demo column><Small /></Demo>

::: details Code
<<< ./demos/app-bar/Small.vue
:::

### Medium flexible and large flexible

<Demo column><Flexible /></Demo>

::: details Code
<<< ./demos/app-bar/Flexible.vue
:::

### Content scrolled under it

<Demo><Scrolling /></Demo>

::: details Code
<<< ./demos/app-bar/Scrolling.vue
:::

## Spec

### Variants and configurations

- "Four variants: Search app bar, small, medium flexible, large flexible". The baseline medium and large app bars "are no longer recommended in M3 Expressive, and should be replaced with medium flexible and large flexible app bars". The center-aligned app bar is "Merged into small", as its centered-text configuration.
- Text alignment: "Text labels, including supporting text, can be aligned to the leading edge or centered", the leading edge by default.
- For the web, the spec lists app bars as unavailable.

### Anatomy and measurements

A container, a leading button, a headline, a subtitle, and trailing elements. It "can be customized to include" an image or logo, a subtitle, and a filled icon button.

| Attribute                  | Small        | Medium flexible            | Large flexible             |
| -------------------------- | ------------ | -------------------------- | -------------------------- |
| Height                     | 64dp         | 112dp; 136dp with subtitle | 120dp; 152dp with subtitle |
| Headline                   | title-large  | headline-medium            | display-small              |
| Subtitle                   | label-medium | label-large                | title-medium               |
| Padding at the ends        | 4dp          | 4dp                        | 4dp                        |
| Space between icon buttons | 0            | 0                          | 0                          |

- The container's shape is `corner-none`, at elevation level 0.
- The measurement drawings: the buttons in 48dp places, 4dp from the ends, an avatar 32dp in one. In a small bar, the headline 4dp after the leading button and 4dp before the trailing ones. In the flexible bars, the buttons in a row 8dp from the top, and the headline 16dp from the start edge and 12dp above the bottom.
- "The medium flexible and large flexible app bars hug the text contents, so they are taller when a subtitle is visible".

### Colors

| Element        | Color                                |
| -------------- | ------------------------------------ |
| Container      | surface; surface container on scroll |
| Leading button | on-surface                           |
| Headline       | on-surface                           |
| Subtitle       | on-surface-variant                   |
| Trailing icons | on-surface-variant                   |

"All app bars share the same color roles. On scroll, the container changes color to surface container." The token for the container's elevation on scroll is level 2, though the overview says "On scroll: No drop shadow, instead a color fill creates separation from content", setting it against M2, where "Elevation and a drop shadow raise the top app bar".

### Accessibility

- "Focus should initially land on the leading button, since it’s the first interactive element of the app bar." Tab moves to the next element; Space or Enter activates it.
- "The accessibility label for a title should be the same as the content within the title." Icon buttons are labeled by the action they take.

## Recommendations

- "Use an app bar to provide content and actions related to the current page, such as page navigation actions, headlines, images, and 1–2 essential actions." "App bars should only have one action, two if necessary"; more go in a toolbar. "Avoid placing an overflow menu in the app bar when possible."
- To emphasize the primary action, make its icon button filled or tonal, perhaps wide. "Avoid using multiple filled or tonal buttons."
- Small: "Use in dense layouts or when a page is scrolled." Medium flexible: "Use to display a larger headline." Large flexible: "Use to emphasize the headline of the page."
- "Use straight corners for app bars", "Always use the default height of the app bar, and make it span the full width of the window."
- The leading button navigates: "A menu icon, which opens a modal expanded navigation rail", or "A back arrow, which returns to the previous screen".
- "Don’t truncate the headline text." "Don’t wrap text in a small app bar"; a long headline goes in a medium flexible or large flexible app bar, on two lines at most.
- "Up to two icon buttons can be placed after the headline", the most used first. "If changing the icon button color style to filled or tonal, only use one icon button."
- "App bars should initially be the same color as the background, then fill with a contrasting color on scroll". The bar can stay at all times, or hide and reappear while scrolling. Medium flexible and large flexible app bars can transform into small ones when scrolled, and "should remain small until the page is scrolled back to the top."

## In Rio

### API

```vue
<RioAppBar headline="Inbox">
  <template #leading><!-- a Back or menu icon button --></template>
  <template #trailing><!-- up to two icon buttons --></template>
</RioAppBar>
<RioAppBar variant="large-flexible" headline="Photos" subtitle="Last week" align="center" />
```

| Prop           | Type                                               | Default             |
| -------------- | -------------------------------------------------- | ------------------- |
| `variant`      | `'small' \| 'medium-flexible' \| 'large-flexible'` | `'small'`           |
| `align`        | `'start' \| 'center'`                              | `'start'`           |
| `headline`     | `string`                                           | —                   |
| `subtitle`     | `string`                                           | —                   |
| `headingLevel` | `1` to `6`                                         | `1`                 |
| `scrolled`     | `boolean`                                          | the scroll target's |
| `scrollTarget` | `HTMLElement`                                      | the window          |

- **Slots**: `leading` and `trailing` for the buttons; `headline` and `subtitle` in place of the props, as for a logo.
- **Markup** (Rio's choice): the root is a `<header>`, and the headline an `<h1>`, or the heading at `headingLevel`, so the page's title is in the document's outline. The subtitle is a `<p>`.

### Scrolling

- **The container fills with surface container while content is scrolled under it**: `attachAppBar` watches the scroll target, the window unless `scrollTarget` gives an element, and the bar turns at the first pixel scrolled from the top and back. The color changes on the default effects curve (Rio's choice). `scrolled` sets it instead, as for an app that knows better, or for a bar that isn't at the top of the page, as in the first two examples here, which take `scrolled: false`.
- **The color fill, without a shadow**, as the overview says, though the token gives level 2. Compose's public `TopAppBarDefaults.topAppBarColors()` likewise only changes the container's color on scroll (`scrolledContainerColor`).
- **Where it sits is the app's** (Rio's choice): to keep it at the top as the content scrolls, give it `position: sticky; top: 0`, and a `z-index` such as 1, as in the example. Without one, content the page positions itself, such as a card with `position: relative`, scrolls over the bar rather than under it. Rio's components keep their own layers to themselves, so they stay under a bar with a `z-index` of 1 or more.

### Layout

- **Small**: one row. An icon button in the leading or trailing slot, in a `RioTooltip` or not, takes a 48dp place, 4dp of margin each side of its 40dp container; other content, as an avatar, should take 48dp too. The headline starts 4dp after the leading button, or 16dp from the edge without one (Rio's choice: the flexible bars' 16dp), and ends 4dp before the trailing buttons. The headline and subtitle stay on one line, ending in an ellipsis if they don't fit.
- **Medium flexible and large flexible**: the buttons in a 64dp row, and the headline and subtitle in a row of their own under it, 16dp from the edges and 12dp above the bottom, wrapping as they need; the bar grows with them, and with one line it has the spec's height.
- **Centered**: the text in the middle of the whole bar, whatever the buttons beside it, pushed aside if it would run into them.

### Not yet

- **The search app bar**, with the search bar and the search view.
- **Scrolling behaviors**: hiding the bar as the page scrolls, and a medium flexible or large flexible bar collapsing into a small one.
- **Overflowing**: moving trailing actions into a menu as the window narrows.

## Sources

- [M3 App bars – Overview](https://m3.material.io/components/app-bars/overview)
- [M3 App bars – Specs](https://m3.material.io/components/app-bars/specs), its measurement drawings for the small, medium flexible, and large flexible app bars, and the token data it loads (`/_dsm/data/dsdb-m3/2026-11-19_06-20-01/TOKEN_TABLE.07341534518f78d0.json` and `TOKEN_TABLE.3ec622835c7987b5.json`, `md.comp.app-bar.*`)
- [M3 App bars – Guidelines](https://m3.material.io/components/app-bars/guidelines)
- [M3 App bars – Accessibility](https://m3.material.io/components/app-bars/accessibility)
- Compose Material3 @ androidx `079e2e3`: [`AppBar.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/AppBar.kt) (`TopAppBarDefaults`)
