# Select

`RioSelect` and `RioSelectOption` from `@rio-m3e/vue`, built on `createSelect`, `createSelectOption`, and `attachSelect` from `@rio-m3e/core` and `@rio-m3e/styles/select.css`, on top of `text-field.css` and `menu.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-17.

## Examples

<script setup>
import Form from './demos/select/Form.vue';
import Multiple from './demos/select/Multiple.vue';
import States from './demos/select/States.vue';
import Variants from './demos/select/Variants.vue';
</script>

### Filled and outlined

<Demo><Variants /></Demo>

::: details Code
<<< ./demos/select/Variants.vue
:::

### Multiple

<Demo><Multiple /></Demo>

::: details Code
<<< ./demos/select/Multiple.vue
:::

### Icons, errors, and disabled options

<Demo><States /></Demo>

::: details Code
<<< ./demos/select/States.vue
:::

### In a form

Press Order with nothing chosen: the browser stops the form, as it does for a native `<select>`.

<Demo><Form /></Demo>

::: details Code
<<< ./demos/select/Form.vue
:::

## Spec

### A menu that opens from a text field

M3 has no select component of its own. A select is a menu, opened from a text field:

- The menu guidelines list "Text field dropdown menus" and "Select menus" among the uses of menus, and a menu opens when a person "Selects an element, such as an icon, button, or text field".
- "Dropdown menu and exposed dropdown menu are now both referred to as menu, since they differ only in the element which opens the menu surface" (menus, differences from M2).
- The text field's dropdown icon: "A dropdown arrow indicates that a text field has a nested selection component."

So the field follows the [text field](text-field.md) spec, and the list the [menu](menu.md) spec.

### Behavior

- "Single-select menus can have one item selected at a time. When a new item is selected, the previously selected item is automatically unselected." "Multi-select menus can have many selected items. They stay open until the person dismisses the menu."
- **Selected items**: "By default, menu items change shape and color when selected", with 3:1 contrast to unselected ones. "It's recommended to include another visual cue, like a checkmark."
- Disabled menu items can receive focus but aren't selectable.
- Dividers suit "Text fields with a dropdown menu, where a grouped treatment isn't appropriate". Gaps between groups are "not currently available on web".

### Keyboard

The menu's keyboard table, for web:

| Keys               | Actions                                                                      |
| ------------------ | ---------------------------------------------------------------------------- |
| Tab                | Focus lands on menu                                                          |
| Space or Enter     | For closed menus: Opens menu or submenu. For open menus: Selects a menu item |
| Up and Down arrows | For closed menus: Opens menu. For open menus: Moves focus to the next item   |
| Letters            | Focus moves to the next menu item starting with letter                       |
| Escape             | Closes menu                                                                  |

## Recommendations

- "Use multiple visual cues like color, shape, and icons to show that an item is selected."
- A menu can include a text field that filters its options, also known as autocomplete. Rio doesn't have it yet.

## In Rio

### API

```vue
<RioSelect v-model="size" label="Size">
  <RioSelectOption value="s">Small</RioSelectOption>
  <RioSelectOption value="m">Medium</RioSelectOption>
  <RioSelectOption value="l" disabled>Large</RioSelectOption>
</RioSelect>

<RioSelect v-model="toppings" variant="outlined" label="Toppings" multiple name="toppings">
  …
</RioSelect>
```

`RioSelect`:

| Prop                   | Type                                                                | Default      |
| ---------------------- | ------------------------------------------------------------------- | ------------ |
| `modelValue`           | a value, or an array of values with `multiple`, with `v-model`      | —            |
| `open`                 | `boolean`, with `v-model:open`; the select keeps it when not bound  | `false`      |
| `variant`              | `'filled' \| 'outlined'`                                            | `'filled'`   |
| `label`                | `string`                                                            | —            |
| `multiple`             | `boolean`                                                           | `false`      |
| `supportingText`       | `string`                                                            | —            |
| `error`                | `boolean`                                                           | `false`      |
| `errorText`            | `string`: replaces the supporting text while `error` is set         | —            |
| `required`, `disabled` | `boolean`                                                           | `false`      |
| `name`                 | `string`: submits the selection with a form                         | —            |
| `autocomplete`         | `string`: lets the browser fill the selection in, such as `country` | —            |
| `menuVariant`          | `'standard' \| 'vibrant'`: the list's color style, as a menu's      | `'standard'` |
| `instant`              | `boolean`: opens and closes without the motion, as a menu's         | `false`      |

`RioSelectOption`:

| Prop       | Type                                      | Default |
| ---------- | ----------------------------------------- | ------- |
| `value`    | `string \| number`, required              | —       |
| `disabled` | `boolean`: focusable, but can't be chosen | `false` |

- Values are strings or numbers. `v-model` takes the option's own `value`, a number stays a number. The hidden native `<select>` holds them as text, so they must differ as text too (`1` and `'1'` don't), and without `multiple`, `''` stands for no selection there.
- **Without `label`**, name the select with `aria-label` or `aria-labelledby`. It goes to the field, and the list takes the same name.
- `RioSelect` slots: the default slot holds the `RioSelectOption`s, `leading-icon` goes before the selection, `dropdown-icon` is the arrow at the end, and `value` shows the selection the app's way (see Multiple selection).
- `RioSelectOption` slots, as a menu item's: the default slot is the label, which the field shows while the option is selected. `icon` gets `{ selected }`, for a check mark next to the color and shape. Then `supporting-text`, `trailing-text`, and `trailing-icon`.
- Events: `update:modelValue` and `update:open`. **The app owns the selection**: the select asks for a change and waits.
- `class` and `style` go to the root. Every other attribute, such as `id` or `aria-label`, and every listener goes to the field. An `id` given to the select stays the field's.
- The width is the app's, as with the text field: style the root. Without that, it fits the widest option (see Width).

### Built from the text field and the menu

M3 leaves the select as a pattern, a text field and a menu, rather than a component. Rio makes it one component (Rio's choice), as Material Web (`md-filled-select`, `md-outlined-select`) and Compose (`ExposedDropdownMenuBox`) do, so the field, the list, and the keys work together without the app wiring them.

- **The field is a text field's markup and stylesheet** with a `combobox` in place of the input. It looks like a text field in every state: the label moves to the top once something is selected, and while the list is open the field keeps its focused look (`data-focused`), since the focus is in the list.
- **The list is a menu's surface and items** (M3E vertical menu), with the `listbox` and `option` roles. `menuVariant="vibrant"` and `instant` work as on a menu. A selected option gets the menu's selected color and shape, and `aria-selected`. Compose's official select sample uses the same M3E menu.
- **The dropdown arrow is the app's**, in the `dropdown-icon` slot, as arrow_drop_down: Rio ships no icons. Rio turns it over while the list is open, as Compose turns its `TrailingIcon`, and gives it the primary color while focused, as Material Web's select tokens do.
- **Markup**: the field is a `<div role="combobox">` named by the label (`aria-labelledby`), with `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `aria-required`, and `aria-invalid`. The list is a `<div role="listbox">`, named by the label too, or without one, by the name the app gave the field, with `aria-multiselectable` for `multiple`. Each option is a `<button role="option">` with `aria-selected`.

> **Not the native customizable select** (Rio's choice). `appearance: base-select` lets a page style a native `<select>` and its picker. It ships in Chrome and Edge 135 and Safari 27, but Firefox has it only behind a flag, with no date to turn it on; it isn't Baseline or part of Interop 2026. Firefox would show the browser's plain select there. Rio builds the select on its own overlay and placement instead, as it builds the menu, and keeps a native `<select>` hidden inside for forms (see Forms).

### Opening and closing

- **A press anywhere on the field opens the list**: the container, the label, or the arrow. A press while it is open closes it. A press on something in the field that takes the focus itself, such as an icon button, is left to it.
- **Placement**: below the field, lined up at its start, or above it without room there. It follows the field as the page scrolls.
- **Width**: at least as wide as the field, as Material Web's select and Compose's `ExposedDropdownMenu` make it, and up to 280px, the baseline menu's limit, for options longer than the field.
- **It closes** when an option is chosen (except with `multiple`), on Escape, on Tab, and on a click outside. Opening another unrelated menu, or a modal dialog, closes it too.
- Disabling the select closes its list.

### Keyboard and focus

- **The focus moves into the list** as it opens, to the selected option, or else the first, as in Rio's menu. The field keeps its focused look meanwhile. Material Web's select, Compose's (`PrimaryNotEditable`: "focus will move to the menu"), and the HTML spec's customizable select move the focus the same way. The WAI-ARIA practices' select-only combobox keeps the focus on the field instead and points at the option with `aria-activedescendant`.
- **On the field**: Down, Up, Enter, Space, and Alt+Down open the list. Home and End open it on the first and the last option. Letters open it on the next option whose label starts with them, as in the WAI-ARIA practices (Rio's choice: a native `<select>` and Material Web's select change the selection without opening).
- **In the list**: Up and Down move between the options and **stop at the ends** (Rio's choice: the list is a listbox, which stops at the ends in the WAI-ARIA practices and in a native `<select>`, while Rio's menu wraps around). Home and End go to the ends, Page Up and Page Down ten options at a time, and letters move as on the field; letters typed within 500ms add up, and repeating one letter cycles through its options. Enter and Space choose; a space while letters are being typed is part of the search. **Disabled options take the focus**, as the spec says of menu items.
- **Escape and Alt+Up close the list without changing the selection**, and the focus goes back to the field.
- **Tab closes the list without changing the selection** and moves on from the field (Rio's choice, as in Rio's menu and Material Web's select). The WAI-ARIA practices' select-only combobox chooses the focused option on Tab; Rio doesn't, so looking through the options with the arrow keys never changes the selection by accident.

### Multiple selection

- With `multiple`, `v-model` is an array, the list stays open while choosing, and each option is added or taken out.
- **The field shows the selected options' labels, separated by commas**, such as `Small, Large` (Rio's choice: M3 doesn't say how a field shows several values). They come in the list's order, not the order chosen, so the field reads the same however the options were picked. What doesn't fit is cut short with an ellipsis.
- The `value` slot shows the selection the app's way instead. It gets `selected`, the values, and `labels`, the selected options' labels, in the list's order. For example, the first label and a count:

  ```vue
  <RioSelect v-model="toppings" label="Toppings" multiple>
    <template #value="{ labels }">
      {{ labels[0] }}<template v-if="labels.length > 1"> (+{{ labels.length - 1 }})</template>
    </template>
    …
  </RioSelect>
  ```

### Width

- **Without a width from the app, the field fits the widest option**, as a native `<select>` does, and the label. It doesn't change as the selection does. The stylesheet stacks the label and every option's label unseen in the field (`rio-select__sizer`), and the widest sets the width.
- With a width from the app, the field takes it, and a selection that doesn't fit is cut short with an ellipsis.
- **Several selected options don't widen the field either**: their labels are cut short at its width. A multi-select usually wants a width of its own, as in the example above.

### Forms

A native `<select>` sits hidden over the field's container (`aria-hidden`, out of the tab order, transparent), holding an option for each `RioSelectOption`, with the same selection.

- **`name` submits the selection** with the form, under that name: the option's value as text, or every selected value with `multiple`.
- **`required` stops a form with nothing selected**, as a native `<select>` does, and the focus goes on to the field. An empty first option stands for no selection, as the HTML spec asks of a required `<select>`.
- **A change the browser makes to the hidden select**, as autofill would with `autocomplete`, comes back through `v-model`. Only the change is checked, with a script; a real autofill of a select the person can't see wasn't.
- **A form's reset** puts the hidden select back in line with `v-model`. Resetting the selection is the app's, as with Rio's checkbox.
- As with the text field, Rio doesn't show the browser's messages as error text; set `error` and `errorText` from the app's own checks.

### Values and their sources

- The field's sizes, colors, and type are the text field's, from Material Web's `_md-comp-filled-text-field.scss` and `_md-comp-outlined-text-field.scss`; the select tokens (`_md-comp-filled-select.scss`, `_md-comp-outlined-select.scss`, Material 3 v34.0.21) match them.
- The arrow's colors come from the select tokens: on-surface-variant, primary while focused, and the text field's error and disabled colors. Compose keeps it on-surface-variant while focused; Rio follows the tokens.
- The list's values are the menu's (`_md-comp-menus.scss`). The select tokens' own menu values (4dp corners, `surface-container`, `surface-container-highest` for the selected option) are the baseline menu's, which M3E replaced with the vertical menu.

### Not yet

- Groups and dividers in the list.
- Filtering the options as the person types, and fields the person can type a value into (editable comboboxes).
- `softDisabled`, as on the button.
- The field shows the option labels only once the options have rendered, so server-rendered HTML shows an empty field until the page runs.

## Sources

- [M3 Menus – Overview](https://m3.material.io/components/menus/overview) (differences from M2)
- [M3 Menus – Guidelines](https://m3.material.io/components/menus/guidelines)
- [M3 Menus – Accessibility](https://m3.material.io/components/menus/accessibility)
- [M3 Text fields – Guidelines](https://m3.material.io/components/text-fields/guidelines) (dropdown icon)
- [Material Web component tokens @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass) (`_md-comp-filled-select.scss`, `_md-comp-outlined-select.scss`)
- Implementation references, not spec: [Material Web `select/internal/select.ts` @ 37aa14b](https://github.com/material-components/material-web/blob/37aa14b843dcaeb3a46f898679fa6fcd109b1905/select/internal/select.ts) (combobox and listbox, focus on the options, the menu as wide as the field, a native `<select>` for validation); [Compose Material3 `ExposedDropdownMenu.kt` @ 807cd48](https://github.com/androidx/androidx/blob/807cd489d33d48421b3cb1f8469d93e72ab0ea81/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ExposedDropdownMenu.kt) (`ExposedDropdownMenuBox`, `ExposedDropdownMenuAnchorType`, `matchAnchorWidth`, `ExposedDropdownMenuDefaults.TrailingIcon`; public interface only)
- [WAI-ARIA Authoring Practices: Select-Only Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/)
- Customizable select: [MDN, Customizable select elements](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select), [webstatus.dev](https://webstatus.dev/features/customizable-select), [Interop 2026](https://github.com/web-platform-tests/interop/blob/main/2026/README.md)
