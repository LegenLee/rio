# Split button

`RioSplitButton` from `@rio-m3e/vue`, built on `createSplitButton` and `attachSplitButtonMenuIcon` from `@rio-m3e/core` and `@rio-m3e/styles/split-button.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-15.

## Examples

<script setup>
import Disabled from './demos/split-button/Disabled.vue';
import Icon from './demos/split-button/Icon.vue';
import Sizes from './demos/split-button/Sizes.vue';
import Variants from './demos/split-button/Variants.vue';
</script>

Rio has no menu component yet, so these trailing buttons only switch `open`, and the menu icon turns. Hover or press either button to see its inner corners change.

### Variants

<Demo><Variants /></Demo>

::: details Code
<<< ./demos/split-button/Variants.vue
:::

### Sizes

<Demo><Sizes /></Demo>

::: details Code
<<< ./demos/split-button/Sizes.vue
:::

### Icon

<Demo><Icon /></Demo>

::: details Code
<<< ./demos/split-button/Icon.vue
:::

### Disabled

The soft-disabled buttons stay focusable. Press Tab to reach them.

<Demo><Disabled /></Demo>

::: details Code
<<< ./demos/split-button/Disabled.vue
:::

## Spec

### Variants and configurations

| Axis  | Values                               | Notes                                                            |
| ----- | ------------------------------------ | ---------------------------------------------------------------- |
| Size  | xsmall, small, medium, large, xlarge | The same sizes as buttons and icon buttons. Small is the default |
| Color | elevated, filled, tonal, outlined    | No text style                                                    |

- New in M3E (May 2025). "Split buttons are made of a common button and a menu icon button."
- "The leading button in split buttons can have an icon, label text, or both. The trailing button should always have a menu icon."

### Measurements

| Token                                    | xsmall      | small       | medium      | large           | xlarge          |
| ---------------------------------------- | ----------- | ----------- | ----------- | --------------- | --------------- |
| Container height                         | 32          | 40          | 56          | 96              | 136             |
| Space between the buttons                | 2           | 2           | 2           | 2               | 2               |
| Leading button padding, start / end      | 12 / 10     | 16 / 12     | 24 / 24     | 48 / 48         | 64 / 64         |
| Trailing button padding, each side       | 13          | 13          | 15          | 29              | 43              |
| Menu icon                                | 22          | 22          | 26          | 38              | 50              |
| Outer corners                            | full        | full        | full        | full            | full            |
| Inner corners                            | extra-small | extra-small | extra-small | small           | medium          |
| Inner corners, hovered and pressed       | small       | medium      | medium      | large-increased | large-increased |
| Trailing inner corners, selected         | 50%         | 50%         | 50%         | 50%             | 50%             |
| Menu icon offset from center, unselected | -1          | -1          | -2          | -3              | -6              |

- Values are in dp. Shape names are steps of the corner radius scale (extra-small 4, small 8, medium 12, large-increased 20).
- "Text and icons are optically centered when the buttons are asymmetrical. They're centered normally when symmetrical."

### States

- "Split buttons use the same color schemes as standard buttons. However, unlike toggle buttons, the split button color doesn't change when selected—only a state layer is applied."
- Leading button: "The inner corners change shape for hovered, focused, and pressed states."
- Trailing button: "The inner corners change shape for hovered, focused, and pressed states, and the icon becomes centered when selected."

### Behavior

- "The split button uses the standard motion scheme (not the expressive motion scheme) when rotating the menu button."
- "The menu button rotates inwards 180° when opened and closed."
- "In right-to-left languages, the component layout is mirrored."

### Accessibility

- "Each button in the split button needs a minimum target area of 48x48dp." Extra small and small split buttons are shorter, so their targets extend past them.
- "Focus should land on the leading button then move to the trailing button." Tab navigates between the buttons; Space or Enter activates the focused one.
- "The accessibility label for the leading button is the same as buttons."
- "The trailing icon button should have an extra state or similar label indicating that the menu is expanded or collapsed." Its label "should indicate that it provides additional choices related to the action of the main button. For instance, if the main button says 'Watch later,' the secondary button should be something like 'More watch options.'"

## Recommendations

- Keep the leading button brief, "just one or two words, with an icon that best matches the action."
- "The trailing button should always have the expand and collapse icon since it rotates when selected. Avoid modifying the icon."
- The split button typically opens a menu, but can open other components, such as cards. Avoid modifying the menu in unusual ways.
- "Align the menu with the trailing button when possible", otherwise with one of the sides of the leading or trailing button. "The menu should be 4dp from the split button."
- Scale the split button up in large windows, or to add emphasis in smaller ones. It can be a different size from the buttons around it.

## In Rio

### API

```vue
<RioSplitButton v-model:open="open" menu-label="More watch options" @click="watchLater">
  <template #icon><ClockIcon /></template>
  Watch later
  <template #menu-icon><ExpandMoreIcon /></template>
</RioSplitButton>
```

| Prop           | Type                                                     | Default    |
| -------------- | -------------------------------------------------------- | ---------- |
| `menuLabel`    | `string`, required                                       | —          |
| `label`        | `string`                                                 | —          |
| `variant`      | `'filled' \| 'tonal' \| 'outlined' \| 'elevated'`        | `'filled'` |
| `size`         | `'xsmall' \| 'small' \| 'medium' \| 'large' \| 'xlarge'` | `'small'`  |
| `open`         | `boolean`, with `v-model:open`                           | `false`    |
| `popup`        | `'menu' \| 'listbox' \| 'tree' \| 'grid' \| 'dialog'`    | `'menu'`   |
| `disabled`     | `boolean`                                                | `false`    |
| `softDisabled` | `boolean`                                                | `false`    |
| `type`         | `'button' \| 'submit' \| 'reset'`                        | `'button'` |

- Slots: `default` (the label text), `icon`, and `menu-icon`.
- Events: `click`, from the leading button, and `update:open`, from the trailing button. **The parent owns `open`**: the trailing button asks for the opposite and changes nothing until the parent passes it back.
- The root is a `<div>` holding two native `<button>`s. It has no role and isn't focusable: the spec describes two buttons, and each has its own name.
- The leading button is named by its label text. `label` names it when it has only an icon, and is ignored when there is label text, so the visible label stays its name (WCAG 2.5.3, Label in Name).
- The trailing button is named by `menuLabel`, and carries `aria-haspopup` (from `popup`) and `aria-expanded` (from `open`), which is the spec's "extra state".
- The component exposes the two `<button>` elements as `leading` and `trailing` (through a template ref in Vue). Attributes on the component go to the root, so the elements are how the app reaches the buttons.
- `disabled` and `softDisabled` apply to both buttons, with the same meaning as on the button. `type` applies to the leading button only; the trailing button is always `type="button"`, so opening the menu never submits a form.

### The menu

- Rio has no menu component yet, so the split button only reports `open`. The app renders the menu (or another popup), places it 4px from the split button, aligned with `trailing`, and sets `open` back to `false` when it closes. When the menu closes with Escape, move the focus back to `trailing`, as in the WAI-ARIA menu button pattern.
- `popup` tells assistive technology what opens. Use the matching value when it isn't a menu, such as `'dialog'` for a card.

### Menu icon

- **The app provides the icon** in the `menu-icon` slot, as for every icon in Rio, which ships none. Use an expand icon pointing down. It's hidden from assistive technology.
- **Offset**: closed, the icon sits toward the start by the spec's offset (1px for extra small and small, then 2, 3, and 6px). The spec says "-1dp from center" without a direction; the M3 Design Kit in Figma places the extra large icon 6dp toward the leading button. Open, the icon is centered.
- **Turn**: opening turns the icon 180°, and closing turns it back. Rio reads the spec's "inwards" as the point of the icon swinging through the start side, toward the leading button: clockwise in left-to-right layouts and counterclockwise in right-to-left ones. The spec shows this only as a video, so the direction is Rio's reading.
- **Motion**: `attachSplitButtonMenuIcon` springs the turn (`--_menu-turn`) and the offset (`--_menu-shift`) on the trailing button toward the targets its stylesheet declares for each state. Both use the **standard** scheme's `fast-spatial` spring, as the spec says, whatever the theme's scheme: every theme exports the standard spatial springs for this (foundations, section 3). The corners use the theme's scheme, like any button's. Under reduced motion, the icon jumps.

### Corners

- The outer corners are round. The facing ones use the size's inner corner, which grows to the hovered and pressed size while that button is hovered (on devices that can hover), focused, or pressed. Each button changes on its own.
- **Focused**: the spec says the inner corners change when focused, but the tokens give only hovered and pressed sizes, which are the same. Rio uses that size for focus too. Focus here means keyboard focus (`:focus-visible`), as for the focus ring, so a click doesn't count.
- **When open, the trailing button is fully round.** The token says 50%, which in CSS would make the trailing buttons that are wider than tall (extra small and small) elliptical. Rio reads it as half the height, a pill, the way "full" works for the outer corners.
- **Disabled** buttons don't react to hover, focus, or press, so their facing corners stay at rest. A disabled trailing button that is open stays fully round, and only loses the open state layer to the disabled colors. The split button pages don't cover this case; Rio follows the button spec's toggle figures, where a disabled selected button keeps its selected shape and only its colors change.
- The corners move on the `fast-spatial` spring, each side separately (`attachShapeMorph`, as in the connected button group). Right-to-left layouts mirror them.

### Open

- The colors stay, and the trailing button shows a state layer instead. The spec says "only a state layer is applied" without an opacity, so Rio uses the pressed opacity (10%).
- The trailing button carries `data-open` for the stylesheet.

### Values and their sources

- Heights, paddings, icon sizes, and corners come from Material Web's component tokens (`_md-comp-split-button-*.scss`, Material 3 v34.0.21). The spec page's extra small table agrees.
- The trailing button is its icon plus padding on each side: 48, 48, 56, 96, and 136px wide. That is square from medium up, and meets the 48px minimum below.
- The menu icon offsets come from the spec page's measurements, and their direction from the M3 Design Kit.

### Not yet

- **The menu**, and placing it next to the split button. Both wait for the menu component.
- **`aria-controls`** on the trailing button, pointing at the menu. It's optional in the WAI-ARIA menu button pattern, and how to set it depends on how the menu component connects to the split button. Until then, the app can set it on `trailing`.
- Form attributes on the leading button (`name`, `value`, `form`) for a `type="submit"` split button. The app can set them on `leading` for now.

## Sources

- [M3 Split button – Overview](https://m3.material.io/components/split-button/overview)
- [M3 Split button – Specs](https://m3.material.io/components/split-button/specs)
- [M3 Split button – Guidelines](https://m3.material.io/components/split-button/guidelines)
- [M3 Split button – Accessibility](https://m3.material.io/components/split-button/accessibility)
- [Material Web component tokens @ d872455](https://github.com/material-components/material-web/tree/d872455c4be56022da2095349b30ef46e0b55bc3/tokens/versions/latest/sass) (`_md-comp-split-button-*.scss`)
- M3 Design Kit (Figma), split button component: the menu icon's placement
