# Text field

`RioTextField` from `@rio-m3e/vue`, built on `createTextField` and `attachTextField` from `@rio-m3e/core` and `@rio-m3e/styles/text-field.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-17.

## Examples

<script setup>
import Icons from './demos/text-field/Icons.vue';
import TextArea from './demos/text-field/TextArea.vue';
import Validation from './demos/text-field/Validation.vue';
import Variants from './demos/text-field/Variants.vue';
</script>

### Filled and outlined

<Demo><Variants /></Demo>

::: details Code
<<< ./demos/text-field/Variants.vue
:::

### Icons, prefix, and suffix

<Demo><Icons /></Demo>

::: details Code
<<< ./demos/text-field/Icons.vue
:::

### Counter, error, read-only, and disabled

Type fewer than six characters.

<Demo><Validation /></Demo>

::: details Code
<<< ./demos/text-field/Validation.vue
:::

### Text area

<Demo><TextArea /></Demo>

::: details Code
<<< ./demos/text-field/TextArea.vue
:::

## Spec

### Variants and anatomy

- "Both variants of text fields use a container to provide a visual cue for interaction and provide the same functionality." "Outlined text fields have less visual emphasis than filled text fields."
- Anatomy: a container, an optional leading icon, the label (in the middle of an empty field, at the top of a populated one), an optional trailing icon, the active indicator (filled) or the outline (outlined), the caret, the input text, and optional supporting text.
- "The container of an outlined text field has rounded corners, while the container of a filled text field has rounded top corners and square bottom corners."

### Measurements

| Attribute                                     | Value                     |
| --------------------------------------------- | ------------------------- |
| Container height                              | 56dp                      |
| Left and right padding                        | 16dp; 12dp beside an icon |
| Between an icon and the text                  | 16dp                      |
| Icons                                         | 24dp, vertically centered |
| Filled top and bottom padding                 | 8dp                       |
| Above the supporting text and the counter     | 4dp                       |
| Between the supporting text and the counter   | 16dp                      |
| Outlined: either side of the label at the top | 4dp                       |
| Corners                                       | extra-small (4dp)         |

### Color and type

| Element                                | Filled                                                                                  | Outlined                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Container                              | surface-container-highest; on-surface state layer on hover                              | —                                                             |
| Active indicator, outline              | on-surface-variant, 1dp; on-surface on hover; primary, 2dp, when focused                | outline, 1dp; on-surface on hover; primary, 3dp, when focused |
| Label                                  | on-surface-variant; primary when focused                                                | the same; on-surface on hover                                 |
| Input text                             | on-surface, body-large                                                                  | the same                                                      |
| Label at the top                       | body-small                                                                              | the same                                                      |
| Supporting text, prefix, suffix, icons | on-surface-variant, body-small for the text                                             | the same                                                      |
| Error                                  | error label, indicator, supporting text, and trailing icon; on-error-container on hover | the same, with the outline                                    |
| Disabled                               | on-surface at 38%; container at 4%                                                      | on-surface at 38%; outline at 12%                             |
| Caret                                  | primary; error in error                                                                 | the same                                                      |

### Behavior

- "Every text field should have a label." It "should be aligned with the input text, and always visible"; "when the field is selected, the label text moves from the middle of the text field to the top." Labels shouldn't be truncated or wrap.
- Required fields put an asterisk after the label, and the form explains it.
- Input: "Single line text fields display only one line of text", "Multi-line text fields grow", and "Text areas are fixed-height fields". Text areas "should be used instead of multi-line fields on the web".
- Prefix text, such as a currency symbol, and suffix text, such as a unit or an email domain.
- Supporting text "conveys additional information about the input field". With a character limit, a counter shows "the ratio of characters used and the total character limit".
- "For text fields that validate their content such as passwords, replace supporting text with error text." "It's strongly recommended to show an error icon when the text field is in the error state."
- Icons are optional: an input method, a clear button ("They appear only when input text is present"), a dropdown, an error. "Leading and trailing icons change their position based on LTR or RTL contexts."
- "Read-only text fields display pre-filled text that people cannot edit." They're styled as regular fields and labeled as read-only.

### Accessibility

- "The accessibility label for a text field is the same as the text field label." A required field's label includes the asterisk.
- "When there is an error, 'alert' is applied to the role and the error message to the text label." With both, supporting text comes before error text.
- Trailing icons that act as buttons are labeled for what they do ("Show password", "Hide password"); an error icon's label is "Error".
- Keyboard: Tab moves to the (non-disabled) text field.
- Outlines need a contrast of at least 3:1 with the background.

## Recommendations

- "If both variants of text field are used in a UI, they should be used consistently within different sections, and not intermixed within the same region."
- Keep labels and error messages brief. "If only one error is possible, error text should describe how to avoid the error."
- Text fields can span a compact window, but shouldn't span the full width of a large screen.
- Don't apply density by default.

## In Rio

### API

```vue
<RioTextField v-model="email" variant="outlined" label="Email" type="email" required />
```

| Prop                               | Type                                                        | Default    |
| ---------------------------------- | ----------------------------------------------------------- | ---------- |
| `modelValue`                       | `string`, with `v-model`; a number with `type="number"`     | `''`       |
| `variant`                          | `'filled' \| 'outlined'`                                    | `'filled'` |
| `label`                            | `string`                                                    | —          |
| `multiline`                        | `boolean`: a text area                                      | `false`    |
| `rows`                             | `number`: a text area's lines                               | `3`        |
| `prefix`, `suffix`                 | `string`                                                    | —          |
| `supportingText`                   | `string`                                                    | —          |
| `error`                            | `boolean`                                                   | `false`    |
| `errorText`                        | `string`: replaces the supporting text while `error` is set | —          |
| `maxlength`                        | `number`: limits the input and shows a counter              | —          |
| `required`, `disabled`, `readonly` | `boolean`                                                   | `false`    |

- Slots: `leading-icon` and `trailing-icon`. A trailing icon may be an icon button, such as a clear button; its icon then lines up where a plain icon would.
- **One component with a `variant`**, as with the button.
- **A native `<input>`, or a `<textarea>` with `multiline`**, inside the container. `class` and `style` go to the root; every other attribute, such as `type`, `name`, `placeholder`, `autocomplete`, or `inputmode`, and every listener goes to the input.
- **Single lines and text areas.** A text area keeps its height and scrolls; a field that grows with its text isn't in yet. **The person can make a text area taller** by dragging the field's corner, never shorter than its `rows`. Material Web's text areas resize both ways; Rio's resize only vertically, since the layout sets the width. Turn it off with `resize: none` on `.rio-text-field__container`. Checked in Chromium; WebKit's resize corner doesn't answer the test driver's drag.
- The label is a `<label>` for the input, so it names it and a click on it focuses it. With `required`, it ends with an asterisk, and the input is `required`. The asterisk stays in the accessible name, as the spec asks ("The accessibility label must include the asterisk").
- An `id` given to the field stays the input's, for the app's own `<label for>` or `aria-labelledby`.
- **The value updates once an IME has finished composing**, as Vue's `v-model` on an input does, so an app that reformats the value doesn't break a syllable being composed.
- **The label moves to the top** while the field is focused or holds text, while the browser autofills it, and for inputs that always show something (dates and times). In the outlined variant it moves into a gap in the outline, at the container's start even beside a leading icon. The prefix, the suffix, and the placeholder show only once the label is out of their way.
- **A press anywhere on the field focuses the input**, with the caret at the end (`attachTextField`). Presses on an icon button in it are its own.
- The width is the app's: style the root, as with `class="w-full"` or `style="inline-size: 320px"`.
- A field that takes the focus but can't be changed is `readonly`; there is no `softDisabled`.

### Supporting text, errors, and the counter

- **`errorText` takes the supporting text's place while `error` is set**, as the spec asks. It comes as a new element with `role="alert"`, so it is announced as it appears. With `error` and no `errorText`, the supporting text stays and only the colors change. The input gets `aria-invalid`.
- **The error icon is the app's**, in the `trailing-icon` slot: Rio ships no icons. In error, the trailing icon takes the error color. The validation example shows one.
- `maxlength` limits the input and shows a counter, such as `3 / 6`, at the end of the supporting line, as Material Web does. The count reads left to right in every writing direction.
- The input is described (`aria-describedby`) by the prefix, the suffix, the supporting or error text, and the counter.
- Rio doesn't show the browser's own validation messages; set `error` and `errorText` from the app's checks.

### Motion

- **The label moves and shrinks on `fast-spatial`, and changes color on `fast-effects`** (Rio's choice; the spec gives the label no motion). The active indicator and the outline change color and width on `fast-effects`, and the outline's gap opens as the label arrives. Under reduced motion the label moves at once.

### Values and their sources

- Colors, sizes, and type come from Material Web's component tokens (`_md-comp-filled-text-field.scss`, `_md-comp-outlined-text-field.scss`, Material 3 v34.0.21) and the spec page's measurements. The tokens give the outlined variant a 3px outline when focused, and the filled variant a 2px indicator.
- The outline's gap is Material Web's: the outline in three pieces, the middle one as wide as the label at its top size, plus 4px at each side.

### Not yet

- Multi-line fields that grow with their text.
- Density.
- Updating the value while an IME composes, for a search that follows each keystroke.
- The browser's validation messages as error text.
- Labeling the counter "character count" for assistive technology, which needs translated strings.

## Sources

- [M3 Text fields – Overview](https://m3.material.io/components/text-fields/overview)
- [M3 Text fields – Specs](https://m3.material.io/components/text-fields/specs)
- [M3 Text fields – Guidelines](https://m3.material.io/components/text-fields/guidelines)
- [M3 Text fields – Accessibility](https://m3.material.io/components/text-fields/accessibility)
- [Material Web component tokens @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass) (`_md-comp-filled-text-field.scss`, `_md-comp-outlined-text-field.scss`)
- [Material Web `md-outlined-field` and `md-filled-field` @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/field/internal), and [`md-filled-text-field` @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/textfield/internal): the outline's gap, error text replacing the supporting text, and the counter
- [Compose Material3 `TextField.kt` and `OutlinedTextField.kt` @ 079e2e3](https://github.com/androidx/androidx/tree/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3): `TextField` and `OutlinedTextField` (public interface only)
