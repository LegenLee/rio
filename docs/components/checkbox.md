# Checkbox

`RioCheckbox` from `@rio-m3e/vue`, built on `createCheckbox` and the `attachCheckable` primitive from `@rio-m3e/core` and `@rio-m3e/styles/checkbox.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-16.

## Examples

<script setup>
import Basic from './demos/checkbox/Basic.vue';
import Parent from './demos/checkbox/Parent.vue';
import States from './demos/checkbox/States.vue';
</script>

### Basic

Click the box or its label.

<Demo><Basic /></Demo>

::: details Code
<<< ./demos/checkbox/Basic.vue
:::

### Parent and children

The parent is indeterminate while only some children are checked. Checking it checks them all.

<Demo><Parent /></Demo>

::: details Code
<<< ./demos/checkbox/Parent.vue
:::

### Error and disabled

<Demo><States /></Demo>

::: details Code
<<< ./demos/checkbox/States.vue
:::

## Spec

### Anatomy and measurements

- A container and an icon. "Use checkboxes (instead of switches or radio buttons) if multiple options can be selected from a list."
- States: unselected, selected, and indeterminate, each also in error ("New indeterminate states as well as error states" since M2).

| Attribute       | Value                       |
| --------------- | --------------------------- |
| Container       | 18dp, corner 2dp            |
| Outline         | 2dp, unselected only        |
| Icon            | 18dp, centered              |
| State layer     | 40dp, round                 |
| Target          | 48dp                        |
| Focus indicator | 3dp, 2dp outside, secondary |

### Color

| Element     | Unselected                                                       | Selected and indeterminate                |
| ----------- | ---------------------------------------------------------------- | ----------------------------------------- |
| Outline     | on-surface-variant; on-surface when hovered, focused, or pressed | —                                         |
| Container   | —                                                                | primary                                   |
| Icon        | —                                                                | on-primary                                |
| State layer | on-surface; primary when pressed                                 | primary; on-surface when pressed          |
| Error       | error outline                                                    | error container, on-error icon            |
| Disabled    | on-surface outline at 38%                                        | on-surface container at 38%, surface icon |

- The pressed state layer takes the color of the state the press leads to.
- "Use the color role on surface for adjacent text labels. This remains the same even if interacting with the label or component."

### Behavior

- "Checkboxes can have a parent-child relationship with other checkboxes." Checking the parent checks every child, and unchecking it unchecks them. "If some, but not all, child checkboxes are checked, the parent checkbox becomes an indeterminate checkbox. Checking an indeterminate checkbox checks all child items."
- "When selected, a checkbox clearly and instantly communicates its selected state." "If used to turn something on or off, the action should be immediately executed."

### Accessibility

- "Users should be able to select either the text label or the checkbox to select an option."
- "The accessibility label for an individual checkbox is typically the same as its adjacent text label."
- The page's keyboard table is the chips' table (it names chips and Backspace removing an input chip), so it doesn't describe checkboxes.
- "Don't apply density to checkboxes by default — this lowers their targets below our best practice of 48x48 CSS pixels."

## Recommendations

- Use checkboxes to "select one or more options from a list", "present a list containing sub-selections", and "turn an item on or off in a desktop environment".
- "If a list consists of multiple options, don't use switches. Instead, use checkboxes."
- Labels should be scannable. In larger windows, a side sheet can group related checkboxes.

## In Rio

### API

```vue
<label>
  <RioCheckbox v-model:selected="updates" />
  Product updates
</label>
```

| Prop            | Type                                                         | Default |
| --------------- | ------------------------------------------------------------ | ------- |
| `selected`      | `boolean`, with `v-model:selected`                           | `false` |
| `indeterminate` | `boolean`: neither checked nor unchecked, as a parent may be | `false` |
| `error`         | `boolean`: the error colors, and `aria-invalid`              | `false` |
| `disabled`      | `boolean`: native, not focusable                             | `false` |
| `softDisabled`  | `boolean`: `aria-disabled`, still focusable                  | `false` |

- Event: `update:selected`.
- **A native `<input type="checkbox">`** sits invisible over the whole 48px target, with the box drawn under it. The input takes the focus, the presses, and the label's clicks, and submits its value with a form. Material Web does the same.
- **The app wraps it in a `<label>` with its text**, as with the switch, so a click on the text checks it and the text names it. The label's layout is the app's.
- **Attributes**: `class` and `style` go to the root; every other attribute, such as `id`, `name`, `value`, `required`, or `aria-label`, and every listener goes to the input.
- **It lays out at the 48px target**, with the box in the middle, as Compose's minimum interactive size does. Rows of checkboxes stacked directly don't overlap their targets. The box sits 15px in from the root's edge; a list that lines it up with other content can pull the row in by that much.
- **The app owns the state.** A change it turns down (leaving `selected` as it is) doesn't stick: the input shows `selected` again once the change has been handled. A form's reset doesn't change it either; reset `selected` in the app.
- **Indeterminate**: a press makes it checked, from indeterminate whatever `selected` was. `indeterminate` stays the app's: the parent's is usually worked out from its children, as in the example. The input carries it, so assistive technology hears "mixed".
- **Keyboard**: Space checks and unchecks it, as on a native checkbox and in the WAI-ARIA checkbox pattern. Enter doesn't, so it still submits a form.
- `disabled` and `softDisabled` work as on the button (see [button.md](button.md) for the `softDisabled` deviation note). A soft-disabled checkbox takes the focus, but presses and Space don't change it.

### Motion

- **Checking draws the checkmark out from its lowest point, as the fill grows in from 60%** (Rio's choice, after Material Web's checkbox): the marks and the fill move on `fast-spatial`, and fade in and out on `fast-effects`. Between checked and indeterminate, the two marks turn into each other. Unchecking keeps the checkmark's shape as it goes.
- Under reduced motion, the marks and the fill appear at once, and the fades stay.

### Values and their sources

- Sizes and colors come from Material Web's component tokens (`_md-comp-checkbox.scss`, Material 3 v34.0.21), which match the spec page. The checkmark's shape is Material Web's: two 2px bars meeting at (7, 14) in the 18px box, 5.66px and 11.31px long, which lie flat across the middle, 10px long, for the dash.
- The focus ring is a circle around the state layer, 3px wide and 2px out, as Material Web draws it.

### Not yet

- Density.

## Sources

- [M3 Checkbox – Overview](https://m3.material.io/components/checkbox/overview)
- [M3 Checkbox – Specs](https://m3.material.io/components/checkbox/specs)
- [M3 Checkbox – Guidelines](https://m3.material.io/components/checkbox/guidelines)
- [M3 Checkbox – Accessibility](https://m3.material.io/components/checkbox/accessibility)
- [Material Web component tokens @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass) (`_md-comp-checkbox.scss`)
- [Material Web `md-checkbox` @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/checkbox/internal) (`checkbox.ts`, `_checkbox.scss`): the native input, the checkmark's marks, and their motion
- [Compose Material3 `Checkbox.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Checkbox.kt): `Checkbox`, `TriStateCheckbox`, and `CheckboxDefaults.StrokeWidth` (public interface only)
- [WAI-ARIA Authoring Practices: Checkbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
