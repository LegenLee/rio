# Slider

`RioSlider` and `RioRangeSlider` from `@rio-m3e/vue`, built on `createSlider`, `createRangeSlider`, and `attachSlider` from `@rio-m3e/core` and `@rio-m3e/styles/slider.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-18.

## Examples

<script setup>
import Basic from './demos/slider/Basic.vue';
import Centered from './demos/slider/Centered.vue';
import Disabled from './demos/slider/Disabled.vue';
import Range from './demos/slider/Range.vue';
import Sizes from './demos/slider/Sizes.vue';
import Stops from './demos/slider/Stops.vue';
import Vertical from './demos/slider/Vertical.vue';
</script>

### Basic

Drag the handle, or press anywhere on the track. With the keyboard, the arrows move it by one, Page Up and Page Down by a tenth, and Home and End to the ends.

<Demo><Basic /></Demo>

::: details Code
<<< ./demos/slider/Basic.vue
:::

### Stops and the value indicator

<Demo><Stops /></Demo>

::: details Code
<<< ./demos/slider/Stops.vue
:::

### Centered

<Demo><Centered /></Demo>

::: details Code
<<< ./demos/slider/Centered.vue
:::

### Range

<Demo><Range /></Demo>

::: details Code
<<< ./demos/slider/Range.vue
:::

### Sizes and the inset icon

Drag the extra large slider up from zero: the icon moves onto the active track once there is room for it.

<Demo><Sizes /></Demo>

::: details Code
<<< ./demos/slider/Sizes.vue
:::

### Vertical

<Demo><Vertical /></Demo>

::: details Code
<<< ./demos/slider/Vertical.vue
:::

### Disabled

The soft-disabled slider stays focusable. Press Tab to reach it.

<Demo><Disabled /></Demo>

::: details Code
<<< ./demos/slider/Disabled.vue
:::

## Spec

### Variants and configurations

- **Variants**: standard (formerly "continuous"), centered, and range. The former discrete slider is the stops configuration.
- **Configurations**: horizontal (default) or vertical; sizes XS (default), S, M, L, and XL; an optional inset icon (standard sliders only); stop indicators (no by default); a value indicator (no by default).
- Sizes S to XL are "available as tokens on other platforms": "swap the default size tokens `md.comp.slider.xsmall.[...]` with those of the desired size."

### Anatomy and measurements

Value indicator (optional), stop indicators (optional), active track, handle, inactive track, and inset icon (optional).

| Attribute                  | XS   | S    | M    | L    | XL    |
| -------------------------- | ---- | ---- | ---- | ---- | ----- |
| Track height               | 16dp | 24dp | 40dp | 56dp | 96dp  |
| Track's outer corners      | 8dp  | 8dp  | 12dp | 16dp | 28dp  |
| Handle height              | 44dp | 44dp | 52dp | 68dp | 108dp |
| Inset icon                 | —    | —    | 24dp | 24dp | 32dp  |
| Inset icon padding (token) | —    | —    | 6dp  | 6dp  | 8dp   |

| Element         | Attribute                           | Value                               |
| --------------- | ----------------------------------- | ----------------------------------- |
| Handle          | Width                               | 4dp; 2dp while focused or pressed   |
|                 | Shape                               | `corner-full`                       |
| Tracks          | Space to the handle on each side    | 6dp                                 |
|                 | Corners next to the handle          | 2dp                                 |
| Stop indicator  | Size                                | 4dp, `corner-full`                  |
|                 | Trailing space (to the track's end) | 4dp                                 |
| Value indicator | Size                                | 48 × 44dp                           |
|                 | Label                               | 14/20pt, weight 400, tracking 0.5pt |
|                 | Bottom space (token)                | 12dp                                |

- The measurements drawing shows the value indicator as a pill with 12dp above and below its label and 16dp on each side, 4dp above the handle.
- The stops drawing spaces the stop indicators evenly, the first and the last 6dp from the track's ends, with the handle centered on one: the handle travels between those 6dp insets.
- The centered slider's drawing leaves a 4dp gap between the tracks at the middle.
- Tokens on the spec page marked deprecated, which Rio doesn't use: the 40dp state layer and its opacities, tick marks, the older label (28dp, primary), a handle elevation and shadow, and a handle outline for overlapping handles.

### Colors

| Part                                 | Color                                             |
| ------------------------------------ | ------------------------------------------------- |
| Active track, handle                 | primary                                           |
| Inactive track                       | secondary-container                               |
| Stop indicator on the active track   | on-primary                                        |
| Stop indicator on the inactive track | on-secondary-container                            |
| Inset icon on the active track       | on-primary                                        |
| Inset icon on the inactive track     | on-secondary-container                            |
| Value indicator                      | inverse-surface, with an inverse-on-surface label |

- The inset icon's colors come from the color roles drawing; they aren't tokens.
- **Disabled**: the active track and the handle are on-surface at 38%, the inactive track on-surface at 12%. The stop indicators are inverse-on-surface on the active track and on-surface on the inactive one; a deprecated token puts them at 38%.
- Hovered, focused, and pressed colors are the same as enabled.

### Behavior and accessibility

- "The slider value should take effect immediately."
- **Select and drag**: dragging the handle selects a value. **Select jump**: selecting part of the track moves the handle there. With stop indicators, the handle snaps to the nearest stop.
- "The slider handle shrinks in width and the value appears" while pressed: when tapped or dragged with touch, and when clicked and dragged with a cursor. Hovering changes the cursor. The states drawing shows the focused slider with the narrow handle, a focus ring around it, and the value.
- A range slider shows "only one value … at a time", on the handle in use.
- The inset icon: "When there's not enough space for the icon on the active track, like at a low value, the icon moves to the inactive track."
- "All sliders have stops at the end of the inactive track to ensure at least a 3:1 contrast with the background. If the inactive track has this level of contrast already, the end stops can be removed."
- For right-to-left languages, the values increase from right to left. A vertical slider has zero at the bottom.
- **Keyboard**:

  | Keys           | Actions                                                               |
  | -------------- | --------------------------------------------------------------------- |
  | Tab            | Moves focus to the slider handle                                      |
  | Arrows         | Increase and decrease the value by one value or one stop indicator    |
  | Space & Arrows | Increase and decrease the value by one interval or one stop indicator |
  | Home or End    | Set the slider to the first and last values on the slider             |

- The slider has the slider role, and its accessibility label "is typically the same as the slider's adjacent text label".

## Recommendations

- Use a slider for settings such as volume and brightness, whose effect shows as the value changes. Present the full range of values.
- Standard sliders start from zero or the start of a sequence; centered sliders suit ranges with zero, or the default, in the middle; range sliders select a minimum and a maximum.
- Don't put a range slider in vertical orientation.
- Keep XL sliders for "hero moments", where the slider is the focus of the page.
- Use the inset icon only on standard M, L, and XL sliders, not on centered or range ones. It should show what the slider controls; consider a different icon at zero, such as mute for volume.
- Don't add so many stop indicators that the slider gets crowded.
- Icons or text at the ends, such as minus and plus, can mark the range, instead of stop indicators.
- A text field next to the slider can show and set the value instead of the value indicator; keep the two in step, and put the field right after the slider in the Tab order.

## In Rio

### API

```vue
<label for="volume">Volume</label>
<RioSlider id="volume" v-model="volume" :step="10" stops value-indicator />

<span id="price">Price</span>
<RioRangeSlider v-model="price" :max="500" aria-labelledby="price" />
```

| Prop             | Type                                                                          | Default                     |
| ---------------- | ----------------------------------------------------------------------------- | --------------------------- |
| `modelValue`     | `number` (`RioSlider`), `[number, number]` (`RioRangeSlider`), with `v-model` | `min` (`[min, max]`)        |
| `min`, `max`     | `number`                                                                      | `0`, `100`                  |
| `step`           | `number`                                                                      | `1`                         |
| `stops`          | `boolean`                                                                     | `false`                     |
| `size`           | `'xsmall' \| 'small' \| 'medium' \| 'large' \| 'xlarge'`                      | `'xsmall'`                  |
| `vertical`       | `boolean`                                                                     | `false`                     |
| `valueIndicator` | `boolean`                                                                     | `false`                     |
| `format`         | `(value: number) => string`                                                   | the language's numbers      |
| `locale`         | `string`                                                                      | provided, or the document's |
| `disabled`       | `boolean`                                                                     | `false`                     |
| `softDisabled`   | `boolean`                                                                     | `false`                     |
| `centered`       | `boolean` (`RioSlider` only)                                                  | `false`                     |
| `name`           | `string` (`RioRangeSlider` only)                                              | —                           |
| `messages`       | `Partial<SliderMessages>` (`RioRangeSlider` only)                             | —                           |

- Event: `update:modelValue`, as the value changes, so the effect is immediate.
- Slot (`RioSlider`): `icon`, the inset icon. **Rio ships no icons**. Only standard sliders of size M, L, or XL show it, the sizes the spec gives it a size for, as the guidelines ask (Rio's choice); on XS, S, or a centered slider it doesn't render. It is hidden from assistive technology.
- `min`, `max`, and `step` work as on a native range input: a `max` below `min` is `min`, and where `max` isn't on a step, the last step below it is the highest value. A value from the app off the range or the steps shows at the nearest one; Rio doesn't ask the app to change it.

### Markup and the keyboard

- **Native range inputs** (`<input type="range">`), transparent over the slider (Rio's choice): one, or the range slider's two. They take the focus, the keys, and assistive technology, including the swipes that change a value with VoiceOver on iOS, and submit the value with a form. Each takes the slider role from the browser.
- **The keys are the native ones**: the arrows move by a step, Home and End go to the ends, and Page Up and Page Down move by a tenth of the range or a step, whichever is more.

  > **Deviation from the spec.** The spec's keyboard table moves by a larger interval with "Space & Arrows". Rio leaves that to Page Up and Page Down instead, which every browser's range input and the ARIA practices for sliders use; Space and an arrow do what the arrow does alone.

- **Labels**: point a `<label>` at the slider's `id`, or wrap the slider in one, or give it `aria-label`. `class` and `style` dress the slider; every other attribute, such as `id`, `name`, `form`, or `aria-label`, and every listener goes to the input, as on `RioCheckbox`.
- **Forms**: the slider submits its value under `name`. A form's reset leaves the app's value, which the slider keeps showing; resetting it is the app's.
- **`RioRangeSlider`** is a group (Rio's choice): the app's attributes, such as `aria-label` or `aria-labelledby`, go to it and name it. Its inputs are named "Minimum" and "Maximum" in English and "최솟값" and "최댓값" in Korean (`messages` replaces them), and both submit under `name`, the start first. Each input's `min` or `max` is the other's value, so the keys stop there, and assistive technology reads the range it can still reach.
- **Disabled** works as on the button: `disabled` is native and not focusable, and `softDisabled` (`aria-disabled`) stays focusable while presses, drags, and keys are blocked. See [button.md](button.md) for the deviation note.
- `format` writes the value for the value indicator and for assistive technology (`aria-valuetext`). Without it, the value indicator shows the number in the slider's language (`Intl.NumberFormat`), and assistive technology reads the number.

### The pointer

- The inputs take no presses; the slider's root takes them (`attachSlider`), so the value under the pointer is the one drawn there, and a range slider can move the handle nearest the press (Rio's choice). The focus goes to the input, without a focus ring, as a click on a native input gives none.
- **The mouse**: a press moves the handle there at once, and dragging follows it.
- **Touch and a pen**: a tap moves the handle there as it lifts, and dragging follows once the pointer has moved 8px (Rio's choice). The slider sets `touch-action: pan-y` (`pan-x` when vertical), so a swipe across it still scrolls the page; if the page takes the swipe, nothing changes.
- The handle snaps to the steps as it moves, and stops at the ends.
- **Range**: the handle nearer the press moves (Rio's choice). Where both handles sit, the one on the side the pointer goes moves; a handle stops at the other rather than passing it.
- Each change from a press goes to the input too, with an `input` event, and a `change` event as the press ends, as a native range input sends them, so the app's `@input` and `@change` and a form's listeners hear about them.

### Layout and motion

- The handle travels between insets of 6px from the slider's ends, the stop indicators' centers, so it sits on a stop at each step.
- The tracks keep 6px from each side of the handle, and the centered slider's 2px from each side of the middle, as the drawing shows. The active track starts at the slider's start on a standard slider, at the middle of the range on a centered one, and at the start handle on a range slider. As the handle nears an end, the track beside it shortens, and its corners shrink with it.
- The inactive tracks show a stop indicator at the slider's ends; with `stops`, every track shows one at each step. Rio keeps the end stops on every slider.
- The slider is as wide as its container, and its row as tall as its handle, at least 48px, the touch target. A vertical slider is 200px tall unless the app sets its height (Rio's choice).
- **The value indicator** shows while a handle is pressed or dragged, and while its input has keyboard focus, as the states drawing does: over the handle, or beside it at the inline start on a vertical slider (Rio's choice). It fades on the `fast-effects` curve (Rio's choice). It overflows the slider, so leave room above it; an ancestor's `overflow: hidden` cuts it off.
- The handle narrows to 2px on the `fast-spatial` curve (Rio's choice: the spec gives no motion token for it). Under reduced motion it narrows at once (foundations, section 3).
- **The inset icon** sits at the active track's start, 6px in (8px on XL), and moves past the handle onto the inactive track, in the inactive track's color, when the active track is shorter than the icon and its padding on both sides. `attachSlider` measures the track and reports it (`onIconInactiveChange`); the adapter keeps it (`iconInactive`), and the root renders it as `data-icon-inactive`.
- The focus ring goes round the handle, as `base/focus-ring.css` draws rings.

### Values and their sources

- Measurements and colors come from the spec's token tables, measurements table, and drawings. Material Web's component tokens (`_md-comp-slider.scss` and one file per size, Material 3 v34.0.21) match them, except the M handle height: 44px there, 52dp in the spec's token table and measurements table. Rio follows the spec.
- Where the drawings show what the tokens don't (the value indicator's padding and its 4dp from the handle, the stops' insets, the centered slider's gap, and the inset icon's colors), Rio follows the drawings.

### Not yet

- **Removing the end stops** where the inactive track already has 3:1 contrast with the background.
- **A value text field** kept in step with the slider: apps can bind one to the same `v-model` and place it after the slider.

## Sources

- [M3 Sliders – Overview](https://m3.material.io/components/sliders/overview)
- [M3 Sliders – Specs](https://m3.material.io/components/sliders/specs) (token tables read in expanded form, for each size; measurements, color roles, and states drawings)
- [M3 Sliders – Guidelines](https://m3.material.io/components/sliders/guidelines) (the stops, centered, range, vertical, and inset icon drawings)
- [M3 Sliders – Accessibility](https://m3.material.io/components/sliders/accessibility)
- [Material Web `_md-comp-slider.scss` @ 763a973](https://github.com/material-components/material-web/blob/763a97326fc2d0f425366cc3fa87bd0eccfaabdc/tokens/versions/latest/sass/_md-comp-slider.scss), and [`_md-comp-slider-medium.scss`](https://github.com/material-components/material-web/blob/763a97326fc2d0f425366cc3fa87bd0eccfaabdc/tokens/versions/latest/sass/_md-comp-slider-medium.scss) with the other sizes beside it
- [WAI-ARIA Authoring Practices: Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) and [Multi-Thumb Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/) (Page Up and Page Down; each thumb's range)
