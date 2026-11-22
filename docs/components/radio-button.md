# Radio button

`RioRadioGroup` and `RioRadio` from `@rio-m3e/vue`, built on `createRadioGroup`, `createRadio`, `attachRadioGroup`, and the `attachCheckable` primitive from `@rio-m3e/core` and `@rio-m3e/styles/radio.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-16.

## Examples

<script setup>
import Basic from './demos/radio-button/Basic.vue';
</script>

### Basic

Click an option or its label, or Tab to the group and use the arrow keys.

<Demo><Basic /></Demo>

::: details Code
<<< ./demos/radio-button/Basic.vue
:::

A [dialog](./dialog.md#a-list-that-scrolls) also holds a group of radio buttons.

## Spec

### Anatomy and measurements

- A selected or unselected icon, with an adjacent label. "Always pair radio buttons with an adjacent label describing what the radio button selects."

| Attribute   | Value       |
| ----------- | ----------- |
| Icon        | 20dp        |
| State layer | 40dp, round |
| Target      | 48dp        |

### Color

| Element     | Unselected                                                       | Selected                         |
| ----------- | ---------------------------------------------------------------- | -------------------------------- |
| Icon        | on-surface-variant; on-surface when hovered, focused, or pressed | primary                          |
| State layer | on-surface; primary when pressed                                 | primary; on-surface when pressed |
| Disabled    | on-surface at 38%                                                | on-surface at 38%                |

- The pressed state layer takes the color of the state the press leads to.
- "Use the color role on surface for adjacent text labels."

### Behavior and accessibility

- "Only one radio button can be selected at a time." "Once a radio button is selected, the group can't be deselected"; offer a "Not applicable" option or a separate way to clear it.
- "A radio button is successfully selected when a person clicks or taps either the radio button icon or the label." "Radio buttons should take effect immediately, unless they're in a dialog or page that needs to be saved."
- Keyboard:

| Keys        | Actions                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Tab         | "Moves focus into the group to the selected radio button, or the first if none are selected"                                     |
| Shift + Tab | "Moves focus into the group to the selected radio button, or the last if none are selected"                                      |
| Arrows      | "Moves focus and selects the previous or next radio button. Wraps focus and selection between the first and last radio buttons." |
| Space       | "Selects a focused radio button. If already selected, does nothing."                                                             |

- "The accessibility label for a group of radio buttons is typically the same as its title. The role is Radio group." Each radio button's label is its adjacent text.

## Recommendations

- "Use radio buttons when there are five or fewer options." Consider a menu when space is tight.
- "Radio buttons should be vertically listed and have one option always selected." Avoid horizontal lists, nesting, and selecting more than one.
- Don't apply density by default, which lowers the targets below 48 × 48 CSS pixels.

## In Rio

### API

```vue
<RioRadioGroup v-model="size" label="Size">
  <label><RioRadio value="small" />Small</label>
  <label><RioRadio value="medium" />Medium</label>
</RioRadioGroup>
```

| `RioRadioGroup` prop | Type                                                | Default      |
| -------------------- | --------------------------------------------------- | ------------ |
| `modelValue`         | the selected radio button's `value`, with `v-model` | —            |
| `label`              | `string`: names the group, typically its title      | —            |
| `name`               | `string`: the name a form submits the value under   | a unique one |

| `RioRadio` prop | Type                                        | Default |
| --------------- | ------------------------------------------- | ------- |
| `value`         | `string \| number`, required in a group     | —       |
| `selected`      | `boolean`: outside a group, shows it        | `false` |
| `disabled`      | `boolean`: native, not focusable            | `false` |
| `softDisabled`  | `boolean`: `aria-disabled`, still focusable | `false` |

- **`RioRadioGroup` holds the selection**, as a button group does: it is a `role="radiogroup"` named by `label` (or the app's `aria-labelledby`), and gives the radio buttons inside a shared `name`. A `RioRadio` in a group without a `value` throws an error. Outside a group, a radio button only shows `selected`, and nothing changes it: it is for drawing a list item's state ([list.md](list.md)).
- **Native `<input type="radio">`s** sit invisible over each 48px target, with the ring drawn under them. The browser moves the tab stop and the arrow keys within the group, wraps around, skips disabled ones, and submits the selected value with a form.
- **The app wraps each in a `<label>` with its text**, as with the checkbox and the switch. The group stacks what it holds; the labels' layout is the app's.
- **Attributes**: on `RioRadio`, `class` and `style` go to the root; every other attribute and listener goes to the input.
- **Each lays out at the 48px target**, with the ring in the middle, so a stacked group's targets don't overlap. The ring sits 14px in from the root's edge.
- **The app owns the selection.** A change it turns down doesn't stick: every input shows the selection again once the change has been handled. A form's reset doesn't change it either; reset the selection in the app.
- **Where engines differ from the spec's keyboard table, `attachRadioGroup` follows the table** (Rio's choice):
  - Shift+Tab into a group with nothing selected focuses the last radio button. Chromium and Firefox 160 focus the first, WebKit the last; when keyboard focus from after the group lands on the first, the group moves it on to the last.
  - At either end, the arrow keys wrap around to the other end and select it. Chromium does; WebKit stops at the ends. When the focus stays put, the group moves it.
- A soft-disabled radio button takes the focus, even from the arrow keys, but isn't selected; the selection stays where it was.

### Motion

- **Selecting grows the dot from the middle** (Rio's choice, after Material Web's radio button) on `fast-spatial`, fading in on `fast-effects`. Under reduced motion it appears at once.

### Values and their sources

- Sizes and colors come from Material Web's component tokens (`_md-comp-radio-button.scss`, Material 3 v34.0.21), which match the spec page. The ring and the dot are Material Web's: a 20px ring with a 2px stroke, and a 10px dot.

### Not yet

- Density, and a `disabled` prop for the whole group. Disable the radio buttons one by one for now.

## Sources

- [M3 Radio button – Overview](https://m3.material.io/components/radio-button/overview)
- [M3 Radio button – Specs](https://m3.material.io/components/radio-button/specs)
- [M3 Radio button – Guidelines](https://m3.material.io/components/radio-button/guidelines)
- [M3 Radio button – Accessibility](https://m3.material.io/components/radio-button/accessibility)
- [Material Web component tokens @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass) (`_md-comp-radio-button.scss`)
- [Material Web `md-radio` @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/radio/internal) (`radio.ts`, `_radio.scss`): the ring, the dot, and its motion
- [Compose Material3 `RadioButton.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/RadioButton.kt): `RadioButton` (public interface only)
- [WAI-ARIA Authoring Practices: Radio Group Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
