# Scroll fields

`RioScrollField` from `@rio-m3e/vue`, built on `createScrollField` and `attachScrollField` from `@rio-m3e/core` and `@rio-m3e/styles/scroll-field.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-22.

## Examples

<script setup>
import Basic from './demos/scroll-field/Basic.vue';
import Camera from './demos/scroll-field/Camera.vue';
import Editing from './demos/scroll-field/Editing.vue';
import Loop from './demos/scroll-field/Loop.vue';
</script>

### A number

<Demo><Basic /></Demo>

::: details Code
<<< ./demos/scroll-field/Basic.vue
:::

### Values set together

<Demo><Camera /></Demo>

::: details Code
<<< ./demos/scroll-field/Camera.vue
:::

### Looping

<Demo><Loop /></Demo>

::: details Code
<<< ./demos/scroll-field/Loop.vue
:::

### Typing the value

<Demo><Editing /></Demo>

::: details Code
<<< ./demos/scroll-field/Editing.vue
:::

## Spec

### Overview

- Scroll fields are new in M3 Expressive. They "provide a flexible, focused way for people to input or adjust specific measurements and numeric values".
- Two modes of input: scroll and input (text). The list can be finite or loop infinitely.
- Three sizes: small (1–2 digits), medium (3 digits), and large (4 digits).

### Anatomy and measurements

Scroll field container, inactive value, active value, selected scroll field container with highlight, selected active value, and cursor.

| Attribute                    | Value                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Container min height         | 120dp                                                                                                                               |
| Container height             | 200dp                                                                                                                               |
| Container min width          | 100dp (2 digits), 120dp (3 digits), 186dp (4 digits)                                                                                |
| Horizontal padding (drawing) | 16dp, 24dp for 4 digits                                                                                                             |
| Gap between items            | 16dp                                                                                                                                |
| Container shape              | 16dp, rounded                                                                                                                       |
| Unselected value             | display-medium (45/52, weight 400)                                                                                                  |
| Selected value               | emphasized display-large (57/64, weight 500)                                                                                        |
| Selection transition         | `fast-spatial`: a spring, damping 0.9 and stiffness 1400 in the standard scheme the table shows (0.6 and 800 in the expressive one) |
| Active container outline     | 2dp                                                                                                                                 |
| Focus indicator              | 3dp, 2dp outer offset                                                                                                               |

- "Scroll fields hug the contents by default, down to a minimum width and height per size. In larger windows, the fields can fill the container instead, or have a custom fixed size."
- The guidelines' Sizing section gives the medium size 144dp; the token table and the measurement drawing give 120dp.

### Colors and states

| Part                                                                          | Color                    |
| ----------------------------------------------------------------------------- | ------------------------ |
| Container                                                                     | surface-container-lowest |
| Unselected value                                                              | outline                  |
| Selected value                                                                | on-surface               |
| State layer (hover 0.08, focus 0.1)                                           | on-surface               |
| Active: container outline, selected value, caret                              | primary                  |
| Focus indicator                                                               | secondary                |
| Disabled: container and values at 0.38, the active outline on-surface at 0.38 | —                        |

States: enabled, hovered, focused, and disabled, each inactive (scrolling) and active (typing).

### Behavior and accessibility

- To scroll, swipe the field, or tap the inactive value above or below to move to it. Values snap to the vertical center; the active value is darker and larger.
- In text input, the numeric or standard keyboard enters values. "For strings, the selection should auto-complete based on the initial character entered." "Any errors should appear below the scroll fields, and should highlight the incorrect value."
- "Material recommends only using up to four digits in scroll fields."
- **Accessibility**: assistive technology selects or enters values; "Any scroll field needs a way to also input text with a keyboard, like a toggle button next to the scroll fields, or a separate text field." Inactive values keep a 48dp target.
- **Keys**: Tab focuses the field, Space or Enter activates it, and Up and Down select the option above or below.

## Recommendations

- Use scroll fields for numbers, or for other values they can be customized to: distance, weight, temperature. To choose a time, use a time picker instead.
- Pair them with other controls, such as button groups, for more precise choices; label each field when several side by side track different values.
- Avoid very long lists, such as consecutive numbers of five or more digits: add intervals, or use another component, like a text field.
- Prefer placing them inline with the content; otherwise in a non-modal dialog, and rarely in a modal one.
- On larger screens, consider taller and wider fields. Crop the inactive values so people can tell there is more to scroll, and keep the corner radius at 16dp or more.

## In Rio

### API

```vue
<RioScrollField v-model="minutes" :min="0" :max="59" label="Minutes" />
<RioScrollField v-model="unit" :options="['g', 'kg', 'lb']" label="Unit" />
```

| Prop                       | Type                                          | Default                                                       |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `modelValue`               | `number \| string`, with `v-model`            | the first value                                               |
| `min`, `max`               | `number`                                      | `0`, `100`                                                    |
| `step`                     | `number`                                      | `1`                                                           |
| `options`                  | `(number \| string)[]`, in place of the range | none                                                          |
| `format`                   | `(value) => string`                           | numbers in the language's digits, two at least; text as it is |
| `label`                    | `string`, the name for assistive technology   | none                                                          |
| `loop`                     | `boolean`                                     | `false`                                                       |
| `size`                     | `'small' \| 'medium' \| 'large'`              | from the longest value written                                |
| `editing`                  | `boolean`, with `v-model:editing`             | `false`                                                       |
| `invalid`                  | `boolean`, with `v-model:invalid`             | `false`                                                       |
| `locale`                   | `string`                                      | the app's language                                            |
| `name`                     | `string`, submits the value with a form       | none                                                          |
| `disabled`, `softDisabled` | `boolean`                                     | `false`                                                       |

- **Numbers or the app's values**: a range of numbers (`min`, `max`, `step`, as a native range input reads them), or `options`. Numbers are written in the language's digits with at least two, as Compose's default item writes them (Rio's choice).
- **Finite unless `loop`** (Rio's choice): the spec allows both and sets no default. A finite field tells assistive technology its range. Compose's scroll field only loops.
- **The size follows the longest value written** (Rio's choice): 1 or 2 characters small, 3 medium, more large. `size` sets it.
- **Assistive technology** sees a list box (Rio's choice): the values are its options, each named by its text, and the value's option is selected and active (`aria-activedescendant`). Up and Down move to the option above and below, as the spec's keys and the list box's both say; a spin button would raise the value with Up, the other way from the column. Name it with `label`. A looping field's copies around its options are hidden from assistive technology.
- **Disabled** works as on the button: `disabled` takes the field out of the tab order, and `softDisabled` keeps it focusable while nothing changes it. See [button.md](button.md) for the deviation note.

### Measurements

- **The height is 120px** (Rio's choice): the measurement drawing's field and Compose's `ScrollFieldDefaults.ScrollFieldHeight`. The token table also lists a 200dp height; give the field a `block-size` to show more values.
- **The medium width is 120px**, from the token table and the drawing, not the guidelines' 144dp.
- **Each value sits in a 52px slot**, display-medium's line height, as Compose's scroll field spaces its items (Rio's choice, from Compose's `ScrollField.kt`, not its public API). That leaves the token's 16dp between the values and keeps every value above the 48dp target. `--rio-scroll-field-item-height` sets another slot, as the scroll time picker on the page sets 60px ([time-picker.md](time-picker.md)).
- The width holds as values scroll through the middle: each value keeps room for itself written large.

### Scrolling

- **The browser scrolls the column** (Rio's choice), snapping a value to the middle with CSS scroll snapping, so the wheel, a trackpad, and a finger keep the platform's momentum. A press on a value above or below scrolls it into the middle; a mouse doesn't drag the column.
- **The value follows the middle as the person scrolls**, as Compose's `ScrollFieldState.selectedOption` does: `v-model` changes as each value passes the middle. Only scrolls the person makes with a trackpad, a touch, or a pen choose values; a scroll the field makes itself, or one nobody made, doesn't.
- **The app decides**: when it turns a value down, the scroll goes back to the value once it stops.
- **Keys** (Rio's choice for Home and End, from the WAI-ARIA list box pattern): Up and Down move to the value above and below, round the ends while looping; Home and End go to the first and the last value; Space and Enter start typing.
- **A notch of a mouse wheel moves one value**, as an arrow key does (Rio's choice): the browser would scroll a notch as far as two values. A trackpad and a finger scroll freely, and snap. Ctrl and the wheel zoom the page, and over a disabled field the wheel scrolls the page.
- A looping field holds its values in copies and, once a scroll stops, moves to the same value in the middle copy, so there is always more to scroll.

### Typing

- **Text input is built in** (Rio's choice). Space or Enter on the field starts it, or the app, through `v-model:editing`, as with a keyboard button next to the field. The value in the middle becomes a text input with its text selected, inside the active outline.
- **Typed values are taken at once**: `v-model` changes as soon as the text is one of the values, so ending editing from the app's button keeps what was typed. Text values complete as they are typed.
- **Enter** ends typing when the text is a value; otherwise it marks the field invalid (`v-model:invalid`, `aria-invalid`, the error color for the outline and the value) and typing goes on. **Escape** puts back the value from before and ends typing. Either puts the focus back on the field. Leaving the input keeps typing, and marks text that isn't a value invalid.
- **The message is the app's**, below the fields, as the spec says. The app can set `invalid` too, as for values that don't go together. The spec's tokens have no error colors; Rio uses `error` (Rio's choice).

### Motion

- The value in the middle grows into emphasized display-large and darkens with the `fast-spatial` motion token, the spec's selection spring. Scrolling to a value is the browser's smooth scroll.
- **Under reduced motion**, the size changes and scrolls to a value are instant, and the color fades stay.

### Not yet

- **Long lists render every value**: keep them short, as the spec recommends. A field of thousands of values works, but renders slower.

## Sources

- [M3 Scroll fields – Overview](https://m3.material.io/components/scroll-fields/overview)
- [M3 Scroll fields – Specs](https://m3.material.io/components/scroll-fields/specs) (the token table read in expanded form, and the measurement drawing)
- [M3 Scroll fields – Guidelines](https://m3.material.io/components/scroll-fields/guidelines)
- [M3 Scroll fields – Accessibility](https://m3.material.io/components/scroll-fields/accessibility)
- Compose Material3 @ 079e2e3: [`ScrollField.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ScrollField.kt) (`ScrollFieldDefaults`, `ScrollFieldState`, and the public KDoc; under In Rio, the item height of its implementation)
- [WAI-ARIA Authoring Practices: Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
