# Toolbar

`RioToolbar` from `@rio-m3e/vue`, built on `createToolbar` and `attachToolbar` from `@rio-m3e/core` and `@rio-m3e/styles/toolbar.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-23.

## Examples

<script setup>
import Docked from './demos/toolbar/Docked.vue';
import Floating from './demos/toolbar/Floating.vue';
import Overflow from './demos/toolbar/Overflow.vue';
import Vertical from './demos/toolbar/Vertical.vue';
</script>

### Docked

<Demo><Docked /></Demo>

::: details Code
<<< ./demos/toolbar/Docked.vue
:::

### Floating, standard and vibrant

<Demo><Floating /></Demo>

::: details Code
<<< ./demos/toolbar/Floating.vue
:::

### Vertical

<Demo><Vertical /></Demo>

::: details Code
<<< ./demos/toolbar/Vertical.vue
:::

### With an overflow menu

<Demo><Overflow /></Demo>

::: details Code
<<< ./demos/toolbar/Overflow.vue
:::

## Spec

### Variants and configurations

- "Two expressive variants: docked toolbar and floating toolbar". The **docked** toolbar "Spans the full width of the window"; the **floating** toolbar "Floats above the body content".
- Two colors, **standard** (the default) and **vibrant**, and for the floating toolbar two layouts, **horizontal** (the default) and **vertical**.
- "The bottom app bar is no longer recommended and should be replaced with the docked toolbar, which functions similarly, but is shorter and has more flexibility."
- For the web, the spec lists toolbars as unavailable.

### Anatomy and measurements

A container, and the components placed in it: "think of it as a container with several slots."

| Attribute              | Docked        | Floating                          |
| ---------------------- | ------------- | --------------------------------- |
| Height                 | 64dp          | 64dp; a vertical one is 64dp wide |
| Padding at the ends    | 16dp          | 8dp                               |
| Space between items    | 4dp to 32dp   | 4dp                               |
| Shape                  | `corner-none` | `corner-full`                     |
| Elevation              | —             | level 3                           |
| Margin from the window | —             | 16dp; a vertical one 24dp         |

- "By default all toolbars are 64dp high, center-aligned, have equal padding between items, and have a minimum outside padding of 16dp."

### Colors

| Configuration | Container         | Icons                | A selected button's container and icon      |
| ------------- | ----------------- | -------------------- | ------------------------------------------- |
| Standard      | surface-container | on-surface-variant   | secondary-container, on-secondary-container |
| Vibrant       | primary-container | on-primary-container | surface-container, on-surface               |

The icon buttons the spec pairs with each: standard, "Filled button (Primary, On primary)", "Toggle tonal button (Secondary container, On secondary container)", and "Standard button (Primary)"; vibrant, "Filled button (Primary, On primary)", "Toggle tonal button: (Surface container, On surface)", and "Standard button (On primary container)". A button that isn't selected takes the container's color, and disabled icons are on-surface at the disabled opacity. The standard "Standard button (Primary)" differs from the token, `md.comp.toolbar.standard.icon.color`, which is on-surface-variant; Rio follows the token.

### Accessibility

- "The toolbar has no interactions by default. All interactions are with the elements placed inside."
- "Focus lands on the first interactive element. Use Tab to navigate through all other actions." Keys: "Tab or Arrows" navigate between interactive elements; "Space or Enter" activate the focused one.
- "On web, the toolbar container should have the toolbar role."

## Recommendations

- "Use a toolbar to provide actions related to the current page." The docked toolbar is "best used for global actions that remain the same across multiple pages"; the floating one "for contextual actions relevant to the body content or the specific page".
- Standard is "A low-emphasis color scheme best used for focusing attention on the body content"; vibrant "draws attention to the controls. It can also indicate a temporary change in the page behavior, such as entering edit mode."
- Don't show a toolbar and a navigation bar at the same time: the navigation bar on primary pages, the toolbar on subsequent pages with actions.
- "When actions don’t fit in a toolbar, add a menu", as an overflow menu in the trailing slot.
- "Avoid emphasizing more than one action at a time", as with a single filled icon button. "Avoid using square icon buttons in floating toolbars"; "To keep vertical toolbars compact, don’t use wide icon buttons."
- "All elements need a minimum 48x48dp target area to be accessible."
- Docked: "Only place docked toolbars at the bottom of the window", with straight corners, though "On web and large screens, the docked toolbar can be rounded." "As long as there's a minimum of 16dp padding on the leading and trailing edge, arrange controls inside however you see fit. The 32dp padding between items is just the default." In compact windows, space the items evenly; in larger ones, center them, or center a key action and align the others to the edges.
- Floating: "Floating toolbars have elevation by default", which "can be removed" if the content beneath is visually distinct. "Horizontal toolbars should have a minimum 16dp margin from the edge of the window"; "Vertical toolbars should have a minimum 24dp margin", and "aren’t recommended for compact windows". "Don’t use multiple toolbars in compact windows."
- Right to left, "mirror individual items that need it, like icons and text direction. If the order of actions is important, flip the order of the actions as well."

## In Rio

### API

```vue
<RioToolbar aria-label="Message">…</RioToolbar>
<RioToolbar aria-label="Formatting" variant="floating" color="vibrant">…</RioToolbar>
<RioToolbar aria-label="Tools" variant="floating" orientation="vertical" flat>…</RioToolbar>
```

| Prop          | Type                         | Default        |
| ------------- | ---------------------------- | -------------- |
| `variant`     | `'docked' \| 'floating'`     | `'docked'`     |
| `color`       | `'standard' \| 'vibrant'`    | `'standard'`   |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `flat`        | `boolean`                    | `false`        |

- **Name it** with `aria-label` or `aria-labelledby`, which go to the root, a `role="toolbar"`, with `aria-orientation="vertical"` when vertical. The `default` slot holds the items: buttons, icon buttons, text fields, a menu, or anything else.
- **`orientation`** is the floating toolbar's; a docked toolbar is always horizontal. **`flat`** takes a floating toolbar's shadow off.

### Keyboard

- **Every item stays in the tab order**, as the spec's "Use Tab to navigate through all other actions": Tab goes through them all, and the toolbar changes no item's `tabindex`. WAI-ARIA's toolbar pattern makes the toolbar one stop instead ("Tab and Shift + Tab: Move focus into and out of the toolbar"), so a page with many items takes more Tab presses to cross.
- **The arrow keys also move between the items**, as the spec's "Tab or Arrows": left and right in a horizontal toolbar, up and down in a vertical one, wrapping around at the ends; Home and End go to the first and the last (Rio's choice: the wrapping and Home and End, which WAI-ARIA's pattern makes optional). Right to left, left goes forward.
- **The items are what Tab reaches**: enabled and shown, one radio button for a group, as Tab stops at the checked one or else the first, and nothing inside a menu, dialog, or other overlay open within the toolbar.
- **An item's own keys stay its own**: no key moves the focus out of a text field or a select; a radio button's arrows move through its group, checking each, as they do anywhere, and Tab leaves the group; and an item that handles an arrow itself, as a chip set or a slider, keeps it.

### Layout and colors

- **Docked**: the width it is given. In a compact window, narrower than 600px, the spec's compact breakpoint (section 8 of [foundations.md](../foundations.md)), its items spread across it, at least 4dp apart, as the spec's "evenly spaced" and Compose's public `BottomAppBarDefaults.FlexibleHorizontalArrangement`; in a wider one, they gather in the middle 32dp apart, the spec's default, as Compose's `FlexibleFixedHorizontalArrangement`. The width is the window's, as a docked toolbar spans it.
- **Floating**: only as large as its items, with the spec's level 3 shadow. Compose's public `FloatingToolbarDefaults.ContainerExpandedElevation` is level 0, with a note to read it from the token, which says level 3.
- **Where it sits is the app's** (Rio's choice): a docked toolbar at the bottom of the window, as with `position: fixed`, and a floating one at least 16dp, or 24dp when vertical, from the window's edges.
- **The buttons inside follow its colors**, the spec's above: the toolbar sets `--rio-button-standard-content-color`, `--rio-button-tonal-toggle-container-color` and `--rio-button-tonal-toggle-content-color`, and `--rio-button-tonal-selected-container-color` and `--rio-button-tonal-selected-content-color`, which `button.css` reads. A menu, dialog, or tooltip opened inside the toolbar sets them back.

### Not yet

- **A FAB beside the floating toolbar**, 8dp away, in secondary container (standard) or tertiary container (vibrant), with the FABs.
- **Scrolling**: hiding the toolbar as the page scrolls, or collapsing a floating toolbar into a single action.
- **Overflowing**: moving the trailing items into a menu as the window narrows. An app puts its own menu in the toolbar, as in the example above.
- **The bottom app bar**, which the spec no longer recommends.

## Sources

- [M3 Toolbars – Overview](https://m3.material.io/components/toolbars/overview)
- [M3 Toolbars – Specs](https://m3.material.io/components/toolbars/specs), and the token data it loads (`/_dsm/data/dsdb-m3/2026-11-19_06-20-01/TOKEN_TABLE.2956a7939bf0879c.json`, `md.comp.toolbar.*`)
- [M3 Toolbars – Guidelines](https://m3.material.io/components/toolbars/guidelines)
- [M3 Toolbars – Accessibility](https://m3.material.io/components/toolbars/accessibility)
- [M3 Breakpoints – Overview](https://m3.material.io/foundations/layout/breakpoints/overview): compact, under 600dp
- [WAI-ARIA Authoring Practices – Toolbar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)
- Compose Material3 @ androidx `079e2e3`: [`FloatingToolbar.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/FloatingToolbar.kt) (`FloatingToolbarDefaults`), [`AppBar.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/AppBar.kt) (`BottomAppBarDefaults`)
