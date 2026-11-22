# Chips

`RioAssistChip`, `RioFilterChip`, `RioInputChip`, `RioSuggestionChip`, and `RioChipSet` from `@rio-m3e/vue`, built on `createAssistChip`, `createFilterChip`, `createInputChip`, `createSuggestionChip`, `createChipSet`, and `attachChipSet` from `@rio-m3e/core` and `@rio-m3e/styles/chip.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-19.

## Examples

<script setup>
import Assist from './demos/chip/Assist.vue';
import Disabled from './demos/chip/Disabled.vue';
import Filter from './demos/chip/Filter.vue';
import Input from './demos/chip/Input.vue';
import Menu from './demos/chip/Menu.vue';
import Single from './demos/chip/Single.vue';
import Suggestion from './demos/chip/Suggestion.vue';
</script>

### Assist

Tab into the set once, then move between the chips with the arrow keys.

<Demo><Assist /></Demo>

::: details Code
<<< ./demos/chip/Assist.vue
:::

### Filter

<Demo><Filter /></Demo>

::: details Code
<<< ./demos/chip/Filter.vue
:::

### Filter, one at a time

<Demo><Single /></Demo>

::: details Code
<<< ./demos/chip/Single.vue
:::

### Filter with a menu

<Demo><Menu /></Demo>

::: details Code
<<< ./demos/chip/Menu.vue
:::

### Input

Press a chip's X, or focus a chip and press Backspace or Delete, to remove it.

<Demo><Input /></Demo>

::: details Code
<<< ./demos/chip/Input.vue
:::

### Suggestion

<Demo><Suggestion /></Demo>

::: details Code
<<< ./demos/chip/Suggestion.vue
:::

### Disabled

The soft-disabled chip stays focusable.

<Demo><Disabled /></Demo>

::: details Code
<<< ./demos/chip/Disabled.vue
:::

## Spec

### Variants

| Variant    | Purpose                                                         | Example                   |
| ---------- | --------------------------------------------------------------- | ------------------------- |
| Assist     | Smart or automated actions that can span multiple apps          | Add to calendar           |
| Filter     | Filters for a collection                                        | A platform selector       |
| Input      | Discrete pieces of information entered by a person              | A contact in the To field |
| Suggestion | Narrow a person's intent with dynamically generated suggestions | A suggested reply         |

- "Chip elevation defaults to 0 but can be elevated if they need more visual separation." Input chips have no elevated tokens.
- Anatomy: container, label text, leading icon or image (optional), and trailing icon ("required for input chips, optional for filter chips"). Tapping a filter chip "appends a leading checkmark icon"; a filter chip's trailing icon can "open a menu or remove the chip".

### Measurements

| Attribute                    | Value                                           |
| ---------------------------- | ----------------------------------------------- |
| Height                       | 32dp                                            |
| Shape                        | 8dp corner radius (`corner-small`)              |
| Icon size                    | 18dp                                            |
| Left and right padding       | 16dp; 8dp on a side with an icon                |
| Padding between elements     | 8dp                                             |
| Input chip avatar            | 24dp, 12dp corner radius; 4dp left padding      |
| Input chip close icon target | Min 48dp                                        |
| Label text                   | label-large                                     |
| Outline                      | 1dp; none while selected, and on elevated chips |

### Colors

| Part                  | Assist          | Filter, unselected | Filter, selected       | Input              | Suggestion         |
| --------------------- | --------------- | ------------------ | ---------------------- | ------------------ | ------------------ |
| Container             | —               | —                  | secondary-container    | —                  | —                  |
| Outline               | outline-variant | outline-variant    | —                      | outline-variant    | outline-variant    |
| Label                 | on-surface      | on-surface-variant | on-secondary-container | on-surface-variant | on-surface-variant |
| Leading icon          | primary         | primary            | on-secondary-container | on-surface-variant | primary            |
| Trailing icon         | —               | on-surface-variant | on-secondary-container | on-surface-variant | —                  |
| State layer           | on-surface      | on-surface-variant | on-secondary-container | on-surface-variant | on-surface-variant |
| Outline while focused | on-surface      | on-surface-variant | —                      | on-surface-variant | on-surface-variant |

- **Elevated**: surface-container-low (secondary-container when selected), level 1; level 2 while hovered. A selected flat filter chip rises to level 1 while hovered.
- **Pressed**: the state layer of an unselected filter chip is on-secondary-container, and of a selected one on-surface-variant.
- **Disabled**: the label and the icons on-surface at 38%; the outline on-surface at 12%; a selected or elevated container on-surface at 12%, at level 0. An input chip's avatar is at 38%.
- The state layer opacities are the system ones: 8% hovered, 10% focused and pressed, 16% dragged (level 4).
- The focus indicator is secondary, 3dp, 2dp out.
- "The leading icon color for unselected chips can be customized through theming. While the default color role is primary, the on surface variant color role is a good alternative when the icon style requires less emphasis."

### Behavior and accessibility

- **Keyboard**:

  | Keys                | Actions                                           |
  | ------------------- | ------------------------------------------------- |
  | Tab                 | Moves focus to enabled chip or chip group         |
  | Space or Enter      | Activates, selects, or deselects the focused chip |
  | Backspace or Delete | Removes currently focused input chip              |
  | Arrows              | Moves focus between chips                         |

- "A chip that performs an action should present the same semantics as a button to a platform's accessibility API."
- The accessibility label is the chip's label text; images and icons in the chip are hidden. A remove icon is labeled "Remove {chip content}". The labeling table gives these roles:

  | Element                                 | Label                                          | Web                | Android Views      | Compose            |
  | --------------------------------------- | ---------------------------------------------- | ------------------ | ------------------ | ------------------ |
  | Image or icon in the chip               | Hidden                                         | —                  | —                  | —                  |
  | Basic chip (one action)                 | "{chip content}"                               | gridcell           | button             | button             |
  | Selectable chip                         | "{chip content}"                               | gridcell           | radio button       | checkbox           |
  | Remove icon (no other action)           | "Remove {chip content}"                        | —                  | —                  | —                  |
  | Two actions (such as select and remove) | "{chip content}", then "Remove {chip content}" | button or checkbox | button or checkbox | button or checkbox |

- "If a chip only has a remove icon, the entire chip and icon are one focusable element. If a chip has a second action, like select, then the chip content and remove icon are two separate focusable elements."
- "Secondary actions (such as a trailing icon button for Remove) must have a 48x48dp interaction target that doesn't interfere with the chip's primary action … apply a minimum width of 88dp to the chip, or 42dp to the label text."
- "Keep an 8dp minimum space between chips. Chips must also have a minimum 48dp target size, regardless of placement or density."
- Overflowing chips break to the next line; a set one row high can scroll horizontally.
- The label needs 3:1 contrast with the background.

## Recommendations

- Chips are dynamic and contextual; buttons are persistent and progress a task. Don't replace major actions with chips, and don't use them for the final step.
- Show chips in a set, never one on its own.
- Choose the variant by purpose and author: an action (assist) or a filter (filter); content the product makes (suggestion) or the person enters (input).
- Keep labels to 20 characters or fewer; write assist chips as verbs, filter chips as nouns, and avoid negative filters ("Exclude images").
- Elevate chips only on images or busy backgrounds, not on the page; don't use elevation to show a press.
- Don't mix single-select and multi-select chip sets on a page.
- In compact windows, the whole chip should do what its trailing icon does, since the icon's target is too small on its own.
- Show that chips are interactive: a label before the set ("Select type"), page context ("Filter results"), the outline color role instead of outline variant, or an interactive label or leading icon.
- With too many chips for one row, give a way to show them all, such as a "Show all" filter chip that reflows the list, or a menu of the options; don't use the menu with chips that have a second action.
- Don't apply density by default.

## In Rio

### API

```vue
<RioChipSet v-model="sizes" selection="multiple" aria-label="Size">
  <RioFilterChip value="s">
    <template #selected-icon><CheckIcon /></template>
    Small
  </RioFilterChip>
</RioChipSet>
```

| Component           | Props                                                                                                             | Events                                    | Slots                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| `RioAssistChip`     | `elevated`, `href`, `disabled`, `softDisabled`                                                                    | `click`                                   | default (label), `icon`                                   |
| `RioSuggestionChip` | `elevated`, `href`, `disabled`, `softDisabled`                                                                    | `click`                                   | default (label), `icon`                                   |
| `RioFilterChip`     | `selected` (`v-model:selected`), `value`, `elevated`, `menu`, `open` (`v-model:open`), `disabled`, `softDisabled` | `click`, `update:selected`, `update:open` | default (label), `icon`, `selected-icon`, `dropdown-icon` |
| `RioInputChip`      | `removeOnly`, `disabled`, `softDisabled`, `locale`, `messages`                                                    | `click`, `remove`                         | default (label), `icon`, `avatar`, `remove-icon`          |
| `RioChipSet`        | `selection` (`'none' \| 'single' \| 'multiple'`), `required`, `modelValue` (`v-model`), `scroll`                  | `update:modelValue`                       | default (the chips)                                       |

- Every boolean defaults to `false`, and `selection` to `'none'`: the spec's defaults, flat and unselected.
- **Rio ships no icons**: the filter chip's checkmark (`selected-icon`), the input chip's X (`remove-icon`), and a menu chip's dropdown arrow (`dropdown-icon`) are the app's, as the select's arrow is. Without them the chip still works, but shows no checkmark, and its remove button no X; give them, as the examples do.

### The chips

- **Assist and suggestion chips** are buttons, or links with `href`, as `RioButton` is: disabled, a link keeps no `href`. `type` is always `button`, so a chip in a form doesn't submit it.
- **Filter chips** are toggle buttons (`aria-pressed`). While selected, the `selected-icon` slot takes the leading icon's place, as the spec appends a checkmark; without it, a selected chip shows no icon. A selected chip has no outline.
- **A menu filter chip** (`menu`) is a menu button (`aria-haspopup="menu"`, `aria-expanded`): a press asks to open or close the menu (`v-model:open`) instead of selecting the chip, and the dropdown icon turns over while open. The app anchors a `RioMenu` to the chip and sets `selected` when a filter applies (Rio's choice).
- **Input chips** hold the chip's action, a button for whatever a press on the chip does (`click`), and a remove button. The remove button is named after the label: "Remove Ada" in English, "Ada 삭제" in Korean (`messages` replaces it). Its X is 18px, with its own state layer in a 24px circle around it (Rio's choice) and a 48px target. `remove` asks the app to remove the chip: the chip is the app's, and the app takes it out of its list.
  - **Backspace or Delete** on either button asks to remove it too, unless the event was already handled.
  - **`removeOnly`**: a chip without an action of its own. Its remove button is the one focusable element, and the focus ring goes round the whole chip, as the spec makes the chip and its icon one element. A press anywhere on the chip removes it, as the guidelines let the whole chip do what a too-small trailing icon does (Rio's choice).
  - Backspace or Delete with Alt, Ctrl, or Meta is left to the app (Rio's choice). Held down, they remove chip after chip as the focus moves on, as they delete text.
  - `class` and `style` dress the chip; every other attribute, such as `aria-describedby`, and every listener goes to the action, or to the chip on a remove-only one.
  - A chip with an action of its own is at least 88px wide, as the guidelines ask, so the remove button's 48px target leaves room for the action. A remove-only chip has one target, and no minimum.
- **Elevated** assist, filter, and suggestion chips trade the outline for a shadow (`elevated`). Input chips aren't elevated, as the tokens have it.
- **Disabled** works as on the button: `disabled` is native and not focusable, and `softDisabled` (`aria-disabled`) stays focusable while presses and removals are blocked. See [button.md](button.md) for the deviation note.
- Each chip's state layer and ripple draw on its state part over the whole chip, in their own color, so a filter chip's press shows the color it leads to (`attachRipple` with a `surface`).

### The chip set

- **`RioChipSet` is a toolbar** (`role="toolbar"`), and its chips are buttons: name it with `aria-label` or `aria-labelledby`. Its chips wrap to new rows, 8px apart; with `scroll`, they stay on one row that scrolls sideways.

  > **Deviation from the spec.** The labeling table gives chips on the web the `gridcell` role. Rio makes the set a toolbar instead, with a chip that acts as a button, as the same page asks of a chip that performs an action, a filter chip as a toggle button (`aria-pressed`), and an input chip as a button beside its remove button. A grid needs rows and a two-dimensional keyboard model of its own, which the spec's keyboard table doesn't describe; a toolbar gives the table's one tab stop and arrow keys. Material Web's chip set is a toolbar too.

- **One stop in the tab order** (Rio's choice): Tab enters the set at one chip, and the arrow keys move through the chips and their remove buttons, wrapping around at the ends; Home and End go to the first and the last. Right to left, the arrows go the other way. Tab comes back to the chip the focus was last on. Disabled chips are passed over; soft-disabled ones take the focus.
  - Which chip takes the Tab is state: `attachChipSet` reports it (`onTabStopChange`), the set keeps it, and the chips render it as `tabindex`.
- **Removing the chip with the focus** moves the focus to the chip that takes its place, or to the one before it if it was the last (Rio's choice).
- **Selection**, as in `RioButtonGroup`: with `selection`, filter chips that have a `value` take their selection from the set's `v-model`, a value for `single` and an array for `multiple`, and `required` keeps the last one selected. Other chips keep their own selection, and menu chips their own `selected`.

### Values and their sources

- Measurements and colors come from the spec's token tables (one set for each variant) and measurements tables, which Material Web's component tokens (`_md-comp-assist-chip.scss` and the others, Material 3 v34.0.21) match.
- The color roles lists on the specs page name outline for assist and suggestion chips; their token tables, and Material Web's, give outline-variant (`flat-outline-color`). Rio follows the tokens.
- The label is at 16px from the container's edge: the 1px border, which stays, transparent, on selected and elevated chips, takes its share of the padding, so selecting a chip doesn't move its label.

### Not yet

- **A text field of input chips**, which turns what the person types into chips and selects a chip with Backspace before removing it. The selected input chip's colors in the tokens belong to it.
- **Dragging chips** to reorder them, and the dragged state.
- **Removable filter chips** (a trailing X on a filter chip).
- **Editing input chips** in place.

## Sources

- [M3 Chips – Overview](https://m3.material.io/components/chips/overview)
- [M3 Chips – Specs](https://m3.material.io/components/chips/specs) (each variant's token set read in expanded form, and the measurements tables)
- [M3 Chips – Guidelines](https://m3.material.io/components/chips/guidelines)
- [M3 Chips – Accessibility](https://m3.material.io/components/chips/accessibility)
- Material Web @ 763a973: [`_md-comp-assist-chip.scss`](https://github.com/material-components/material-web/blob/763a97326fc2d0f425366cc3fa87bd0eccfaabdc/tokens/versions/latest/sass/_md-comp-assist-chip.scss), [`_md-comp-filter-chip.scss`](https://github.com/material-components/material-web/blob/763a97326fc2d0f425366cc3fa87bd0eccfaabdc/tokens/versions/latest/sass/_md-comp-filter-chip.scss), [`_md-comp-input-chip.scss`](https://github.com/material-components/material-web/blob/763a97326fc2d0f425366cc3fa87bd0eccfaabdc/tokens/versions/latest/sass/_md-comp-input-chip.scss), [`_md-comp-suggestion-chip.scss`](https://github.com/material-components/material-web/blob/763a97326fc2d0f425366cc3fa87bd0eccfaabdc/tokens/versions/latest/sass/_md-comp-suggestion-chip.scss)
- Implementation reference, not spec: [Material Web `chips/internal`](https://github.com/material-components/material-web/tree/763a97326fc2d0f425366cc3fa87bd0eccfaabdc/chips/internal) (the chip set as a toolbar with one tab stop and the arrow keys, filter chips with `aria-pressed`, the remove button named "Remove" and the label)
- [WAI-ARIA Authoring Practices: Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)
