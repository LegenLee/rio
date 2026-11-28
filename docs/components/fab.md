# Floating action button (FAB)

`RioFab` from `@rio-m3e/vue`, built on `createFab` from `@rio-m3e/core` and `@rio-m3e/styles/fab.css`. One component is the FAB and the extended FAB: `extended` shows the label beside the icon. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-26.

## Examples

<script setup>
import Colors from './demos/fab/Colors.vue';
import Extended from './demos/fab/Extended.vue';
import Scrolling from './demos/fab/Scrolling.vue';
import Sizes from './demos/fab/Sizes.vue';
import Tooltip from './demos/fab/Tooltip.vue';
</script>

### Sizes

<Demo><Sizes /></Demo>

::: details Code
<<< ./demos/fab/Sizes.vue
:::

### Extended

<Demo><Extended /></Demo>

::: details Code
<<< ./demos/fab/Extended.vue
:::

### Color styles

<Demo><Colors /></Demo>

::: details Code
<<< ./demos/fab/Colors.vue
:::

### Shrinking as the content scrolls

<Demo><Scrolling /></Demo>

::: details Code
<<< ./demos/fab/Scrolling.vue
:::

### With a tooltip

<Demo><Tooltip /></Demo>

::: details Code
<<< ./demos/fab/Tooltip.vue
:::

## Spec

### Variants and configurations

- Three variants by size: the FAB, the medium FAB (new in M3 Expressive), and the large FAB. The extended FAB comes in the same three sizes: small, medium, and large.
- "The small FAB is still available, but no longer recommended." The baseline extended FAB is "no longer recommended in the M3 expressive update"; the small extended FAB replaces it. Surface color styles are no longer recommended either.
- "FAB variants are based on size, not color". Six color styles: primary container (the default), secondary container, tertiary container, primary, secondary, and tertiary. M3 Expressive renamed the earlier primary, secondary, and tertiary styles to the container names, "to match the actual color roles used", and added new primary, secondary, and tertiary styles.
- For the web, the spec lists the expressive FAB and extended FAB as unavailable.

### Anatomy and measurements

The FAB: container and icon. The extended FAB: container, label text, and icon (optional).

| Size   | Container | Corner                         | Icon | Extended: ends | Extended: icon to label | Extended: label |
| ------ | --------- | ------------------------------ | ---- | -------------- | ----------------------- | --------------- |
| Small  | 56dp      | `corner-large`, 16dp           | 24dp | 16dp           | 8dp                     | title medium    |
| Medium | 80dp      | `corner-large-increased`, 20dp | 28dp | 26dp           | 12dp                    | title large     |
| Large  | 96dp      | `corner-extra-large`, 28dp     | 36dp | 28dp           | 16dp                    | headline small  |

- The small size is the spec's FAB and small extended FAB. The 40dp small FAB is the one no longer recommended.
- "The extended FAB container is a rounded rectangle that hugs its contents. The extended FAB grows and shrinks with text length."
- "Extended FABs should have margins of 16dp".

### Colors

| Style               | Container           | Icon, label, and state layer |
| ------------------- | ------------------- | ---------------------------- |
| Primary container   | primary container   | on primary container         |
| Secondary container | secondary container | on secondary container       |
| Tertiary container  | tertiary container  | on tertiary container        |
| Primary             | primary             | on primary                   |
| Secondary           | secondary           | on secondary                 |
| Tertiary            | tertiary            | on tertiary                  |

### States and elevation

| State   | Elevation | State layer |
| ------- | --------- | ----------- |
| Enabled | level 3   | —           |
| Hovered | level 4   | 8%          |
| Focused | level 3   | 10%         |
| Pressed | level 3   | 10%         |

### Behavior and accessibility

- "FABs remain in place on scroll. Extended FABs can collapse into a FAB on scroll and expand on reaching the bottom of the view." The FAB and the extended FAB "can transform into each other depending on available space and layout".
- "When a FAB animates on screen, it expands outward from a central point." It "can expand and adapt to any shape using a container transform transition pattern", and "can also transition into a FAB menu".
- Keyboard: Tab focuses it; Space or Enter "perform the default action".
- "The accessibility label should describe the action that the button is performing, such as Compose a new message." For the extended FAB, "the accessibility label must include the same first word as the visible label", and "both the visible label and icon should be treated as one focusable element".

## Recommendations

- Use one FAB, or one extended FAB, per screen, for its most important, constructive action, such as create, favorite, share, or start a process. Don't use it for minor, destructive, or unclear actions, or for controls that belong in a toolbar.
- The medium FAB is "most recommended" and works best in compact and medium windows; the FAB suits compact windows with other actions on screen; the large FAB suits expanded and larger windows. For the extended FAB, the large size suits a compact window with one prominent action, and medium or large suit larger windows.
- Place it in the lower trailing corner in compact and medium windows, or for the extended FAB, at the bottom, centered or at the trailing edge. In expanded windows, consider the upper left, as in a navigation rail. Don't put it on cards or inside other containers, nor an extended FAB over a toolbar; floating toolbars "can be paired with FABs, but not extended FABs".
- "Don't disable the FAB. If the action represented in the FAB is unavailable, the FAB shouldn't appear."
- "Make sure the state layer color is the same as the icon color." "Ensure the icon has a minimum 3:1 contrast ratio with the container."
- Use a clear, filled icon, such as add, message, or edit. "When hovering over a FAB on web products, FABs should display a tooltip with an accompanying icon text label"; consider one on focus too. The extended FAB doesn't need one.
- Use the extended FAB when a label helps; keep it to one or two words, and don't wrap or truncate it.
- Give the FAB an early place in the focus order. Don't let it hide another element's focus indicator completely.
- When the screen changes, as between tabs, the FAB should disappear and reappear rather than move with the content.

## In Rio

### API

```vue
<RioFab label="Compose" @click="compose">
  <PencilIcon />
</RioFab>

<RioFab label="Compose" size="medium" :extended="atTop">
  <PencilIcon />
</RioFab>
```

| Prop       | Type                                                                          | Default    |
| ---------- | ----------------------------------------------------------------------------- | ---------- |
| `label`    | `string`, required                                                            | —          |
| `size`     | `'small' \| 'medium' \| 'large'`                                              | `'small'`  |
| `variant`  | `'tonal' \| 'filled'`                                                         | `'tonal'`  |
| `color`    | `'primary' \| 'secondary' \| 'tertiary' \| 'error'`, or a static color's name | primary    |
| `extended` | `boolean`                                                                     | `false`    |
| `type`     | `'button' \| 'submit' \| 'reset'`                                             | `'button'` |
| `href`     | `string`, which makes it a link                                               | —          |

- Events: `click`. The default slot is the icon, hidden from assistive technology. **Rio ships no icons**; apps bring their own.
- **`label` names the action, and is the label an extended FAB shows.** It is the FAB's `aria-label` whether the label shows or not, so the name stays the same as the FAB extends and shrinks; the visible label is hidden from assistive technology rather than read twice. A longer name, such as "Compose a new message", goes in `aria-label` on the FAB, which replaces it; start it with the visible label's first word, as the spec asks.
- **The spec's six color styles are a `color` and a `variant`** (Rio's choice: `color` names a color of the theme, as on the buttons, and `variant` how the FAB takes it, as a button's variant does; the spec's own FAB variants are its sizes, `size` here). `tonal`, the default, puts it on the color's container: primary container, secondary container, or tertiary container. `filled` puts it on the color itself: primary, secondary, or tertiary. `color` takes `'error'` and the theme's static colors too, as `'success'`, beyond the spec's six; a name the theme doesn't have leaves primary's roles.
- **`extended` shows the label beside the icon**, and turning it off shrinks the FAB back to its icon, as on scroll. Without an icon, the label always shows: a FAB needs an icon to shrink to.
- **No `disabled`** (Rio's choice): the recommendation is not to disable a FAB but to leave it out, so render it only while its action is available, as with `v-if`.
- **For the tooltip the guidelines ask for**, wrap a FAB that shows only its icon in a [`RioTooltip`](tooltip.md) with the same text as `label`, as for an icon button.
- **`href` makes it a link**: an `<a>` that looks the same, named by `label`. `type` doesn't apply to it.
- **Where it sits is the app's**: position it in the corner, 16px in, as with `position: fixed`, or in a navigation rail.
- A native `<button>`, with the ripple, the state layer, and the focus ring, as on the button; `type` defaults to `'button'`.

### Motion

- **Extending and shrinking** (Rio's choice, as Compose's extended FABs with `expanded`): the width moves on `fast-spatial`, the label's room growing or shrinking with the space before it, and the label fades on `fast-effects`. Under reduced motion, the width changes at once and the fade stays.
- Hovering lifts it from level 3 to level 4 on `fast-effects`.

### Values and their sources

- The sizes, corners, spacing, type styles, colors, and elevations come from the spec's token tables (`md.comp.fab.*`, `md.comp.extended-fab.*`), read on the spec page with each token set selected; the corners and type styles from each value's details.
- Compose's tokens at androidx `079e2e3` differ from the spec in places: `FabLargeTokens.IconSize` is 32dp, where the spec gives 36dp, and `ExtendedFabMediumTokens` and `ExtendedFabLargeTokens` give 16dp and 20dp between the icon and the label, where the spec gives 12dp and 16dp. Compose's own `FloatingActionButton.kt` marks all three as incorrect and uses the spec's values, as Rio does.

### Not yet

- **The FAB menu**, which a FAB opens into.
- **Appearing and disappearing**, expanding from the center, and the **container transform** into another surface, such as a full-screen dialog.
- **Shrinking on scroll by itself**: the app sets `extended` from its own scrolling, as in the example.

## Sources

- [M3 FAB – Overview](https://m3.material.io/components/floating-action-button/overview)
- [M3 FAB – Specs](https://m3.material.io/components/floating-action-button/specs) (token tables read with each set selected)
- [M3 FAB – Guidelines](https://m3.material.io/components/floating-action-button/guidelines)
- [M3 FAB – Accessibility](https://m3.material.io/components/floating-action-button/accessibility)
- [M3 Extended FAB – Overview](https://m3.material.io/components/extended-fab/overview)
- [M3 Extended FAB – Specs](https://m3.material.io/components/extended-fab/specs) (token tables read with each set selected)
- [M3 Extended FAB – Guidelines](https://m3.material.io/components/extended-fab/guidelines)
- [M3 Extended FAB – Accessibility](https://m3.material.io/components/extended-fab/accessibility)
- Implementation reference, not spec: Compose Material3 @ androidx `079e2e3`: [`FloatingActionButton.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/FloatingActionButton.kt) (the extended FAB's `expanded` motion) and its [`tokens/`](https://github.com/androidx/androidx/tree/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens) (`Fab*Tokens`, `ExtendedFab*Tokens`)
