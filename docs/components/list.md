# Lists

`RioList` and `RioListItem` from `@rio-m3e/vue`, built on `createList`, `createListItem`, `attachList`, and `attachListItem` from `@rio-m3e/core` and `@rio-m3e/styles/list.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-22.

## Examples

<script setup>
import Actions from './demos/list/Actions.vue';
import Basic from './demos/list/Basic.vue';
import Selection from './demos/list/Selection.vue';
</script>

### A list to read

<Demo><Basic /></Demo>

::: details Code
<<< ./demos/list/Basic.vue
:::

### Links and buttons

<Demo><Actions /></Demo>

::: details Code
<<< ./demos/list/Actions.vue
:::

### Choosing

<Demo><Selection /></Demo>

::: details Code
<<< ./demos/list/Selection.vue
:::

## Spec

### Variants and configurations

- The M3 Expressive update (December 2025) "added expressive list", "Recommended for new designs"; the baseline list "is still available" but "Not recommended. Use expressive lists instead." Expressive lists have "a new segmented visual style, improved selection treatment, and support for slots".
- **Styles**: standard or segmented. "The standard and segmented styles are a visual choice, and don't affect a list's behavior." A segmented list's items are apart, with round outer corners.
- **Selection modes**: "A list can have only one selection mode at a time."
  - Single-action: "the entire list item performs one action, such as navigating to a new page." No secondary actions, no persistent selected state.
  - Multi-action: "a primary action, and one or more secondary actions". "The primary action should take up the majority of the space in the leading and content positions. Place supplementary actions, like a bookmark or menu, in the trailing position."
  - Single-select: a radio button, no multi-actions, no checkboxes.
  - Multi-select: checkboxes or switches, no secondary actions, no radio buttons.
  - Non-interactive: "They don't perform any actions and can't be selected."
- **Interactions**: expand and collapse, in a folder-like manner with a container transform; swipe to reveal, on Android Views only.

### Anatomy and slots

- "Container and label text are required. All other elements are optional": overline, label text, trailing text, supporting text, trailing icon, divider, leading avatar, leading icon, leading image or video, and a trailing checkbox, radio button, or switch.
- Three slots: leading (an avatar, icon, image, or video thumbnail; a selection control; a badge or a larger image), content (the label and supporting text, the largest; optional badges, icons, labels, more text), and trailing (an icon, an icon button, or trailing text; a selection control). "Slots are not accessible by default": they keep the list's structure, padding, and 48 × 48dp targets.
- "For selection lists, use only one selection interaction per list item."
- "The selected state applies to the entire list item. For example, when an item with a checkbox is selected, both the list item and the checkbox show a selected state."

### Measurements, colors, and shapes

| Attribute                  | Value                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Item height                | 56dp (one line), 72dp (two), 88dp (three)                                                 |
| Padding                    | 16dp at the sides, 10dp above and below; 12dp between the leading element, text, trailing |
| Leading and trailing icons | 20dp; avatar 40dp; image 56 × 56dp; video 100 × 56dp                                      |
| Segment gap                | 2dp                                                                                       |
| Label                      | body large, `on-surface`                                                                  |
| Supporting text            | body medium, `on-surface-variant`                                                         |
| Overline, trailing text    | label small, `on-surface-variant`                                                         |
| Container                  | `surface`; selected `secondary-container`, its content `on-secondary-container`           |
| State layer                | `on-surface`: hover 0.08, focus 0.1, pressed 0.1                                          |
| Focus indicator            | `secondary`, 3dp, 3dp inside                                                              |
| Disabled                   | content `on-surface` at 0.38; selected container `on-surface` at 0.38                     |
| Corners                    | unselected 4dp inside the list and 16dp at its ends; selected 16dp                        |

- "The tallest element within a list item determines the list item's height." Elements are middle-aligned, and top-aligned "If a list is 88dp or larger, or contains three or more lines of text".
- "When a list item is selected, the corner shape changes to highlight the active item": "Unselected corner radius: 4dp inner, 16dp outer. Selected corner radius: 16dp."
- Gaps or dividers: "Use gaps for contained lists." "Limit dividers to uncontained or complex lists, only when a stronger visual separation is necessary."

### Accessibility

- "Navigate to a list item. Select a list item." Selection takes more than color: a checkbox, a radio button, an icon, or another visual style.
- **Single-action lists**: "The first element in a list should always receive focus, unless the list has a selected element. In that case, focus should go to the selected list item instead." The arrow keys move between items; "All list items must be able to be activated using the Space or Enter key."
- **Multi-action lists**: Tab "focuses the first element"; the arrow keys "Move between between all focusable elements in the list": Down and Right to "the next action of the list item, or to the first action in the next item", Up and Left to the previous one, and from an item's first action to "the last action of the previous item".

| Keys                 | Actions                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Tab                  | "To move focus to the first list item, last list item, or outside of the list component"                                  |
| Down and right arrow | "Moves to the next element in the list; if the focused element is the last in the list, it wraps back to the top"         |
| Up and left arrow    | "Moves to the previous element in the list; if the focused element is the first in the list, it wraps back to the bottom" |
| Space or Enter       | "To select a list item not yet selected"                                                                                  |

- **Labels and roles**: an item's label is its label text and supporting text. On the web, single- and multi-select lists are a list box, "Container label: Should describe selection type", with options "Selected or Not-selected". "If a list isn't selectable, the label text is read out without a role."

## Recommendations

- Order items logically, keep them short and scannable, and keep each element in the same place from item to item. Limit supporting text to one to three lines.
- Anchor visuals to the leading edge. Use a leading icon that relates to the label; a trailing icon for a status or an action; trailing text for a price, a count, or a date.
- Use checkboxes to select several items, switches to turn settings on or off, and radio buttons to select one.
- Let lists run edge to edge in compact windows; at larger sizes, keep lines between 40 and 60 characters, show more per item, or swap the list for cards or a carousel.

## In Rio

### API

```vue
<RioList>
  <RioListItem>
    <template #leading><FolderIcon /></template>
    Documents
    <template #supporting>12 files</template>
  </RioListItem>
</RioList>

<RioList v-model="toppings" selection="multiple" label="Toppings">
  <RioListItem value="cheese">Cheese</RioListItem>
</RioList>
```

| `RioList` prop    | Type                                                       | Default        |
| ----------------- | ---------------------------------------------------------- | -------------- |
| `modelValue`      | the selected value or values, with `v-model`               | —              |
| `variant`         | `'standard' \| 'segmented'`                                | `'standard'`   |
| `selection`       | `'none' \| 'single' \| 'multiple'`                         | `'none'`       |
| `required`        | `boolean`: keeps one item selected                         | `false`        |
| `control`         | `'checkbox' \| 'radio' \| 'switch' \| 'none'`              | by `selection` |
| `controlPosition` | `'leading' \| 'trailing'`                                  | `'trailing'`   |
| `label`           | `string`: names the list; a list box's says what is chosen | —              |

| `RioListItem` prop | Type                                                | Default |
| ------------------ | --------------------------------------------------- | ------- |
| `value`            | `string \| number`: the item's value in a selection | —       |
| `href`             | `string`: makes the item a link                     | —       |
| `disabled`         | `boolean`                                           | `false` |
| `@click`           | listening makes the item a button                   | —       |

Slots on `RioListItem`: the default slot is the label; `overline` and `supporting` sit above and under it; `leading` and `trailing` sit at the item's sides, and get `{ selected, disabled }`.

- **Expressive lists only** (Rio's choice: the spec doesn't recommend the baseline list), in either style, `variant`.
- **One list, one mode, from its props and its items'** (Rio's choice):
  - With `selection`, the list is a list box, and every item is an option, chosen by its `value`, which `v-model` holds: one, or an array of them. `required` keeps the last one selected, as in the button group and the chip set; without it, a press on the selected item turns it off.
  - Without `selection`, an item with `href` is a link, one with a `@click` listener is a button, and one with neither is static. In a list of links and buttons, what takes the focus in an item's `trailing` slot is a secondary action, so the item is multi-action.
- **Each option draws the selection's control** (Rio's choice: the spec has radio buttons select one item, checkboxes select several, and switches turn settings on or off, and its anatomy puts the control at the end): a radio button with `single`, and a checkbox with `multiple`, after the text, with the item's state. `control="switch"` draws switches with `multiple`, for settings; `control="none"` draws nothing, for an icon or another style that shows the selection, as the spec allows. A control the selection doesn't take, such as a checkbox with `single`, gives way to its own. `controlPosition="leading"` draws it before the text. The app's own content in that slot takes its place, so a slot with a control on the other side wants `controlPosition` or `control="none"`, or the item shows two.
- **Controls only show the state** (Rio's choice): in a list box, the `leading` and `trailing` slots take no presses, and what takes the focus in them is kept out of the tab order, so a checkbox, a radio button, or a switch there leaves both to the option, as the list's own does. Bind the slot's `selected` to one there. Their text stays part of the option's name, such as a count in the trailing slot; an option's content has no roles of its own for assistive technology. `RioRadio` shows `selected` outside a radio group for this (see [radio-button.md](radio-button.md)).
- **Attributes**: `class` and `style` go to the `<li>`; every other attribute and listener goes to a link's or a button's `<a>` or `<button>`, and otherwise to the `<li>`.

### Keys and focus

- **The list is one tab stop**, as the spec's keys have it: Tab enters at the selected item, or else the first, and leaving the list brings the stop back there.
- **The arrow keys** go through every item and every secondary action in order, and wrap around at the ends, as the spec's table has them: Down and Right forward, Up and Left back. Right to left, Right and Left swap, as in the chip set (Rio's choice). Home and End go to the first and the last (Rio's choice, from the WAI-ARIA list box pattern).
- **Space and Enter** choose an option and turn a chosen one off, as a press does. Enter follows a link, and Space does too, as the spec has every item activate with either. A button takes both itself.
- The arrow keys don't choose (Rio's choice: the spec's Space and Enter "select a list item not yet selected").
- **Disabled items stay focusable** among the items, as disabled menu items do, and nothing they do happens (Rio's choice). A disabled link keeps no `href`.
- Secondary actions are out of the tab order while the list holds them; the arrow keys reach them. When the item with the focus goes away, the focus goes to the one that takes its place.

### Layout and shape

- **One, two, or three lines**: an item with supporting text or an overline is two lines; with both, or with supporting text that wraps, three, aligned to the top. The list measures the supporting text in the page to tell (Rio's choice: the spec's height rule, as Compose's list item reads it).
- **A press anywhere on a link or a button item acts**, the trailing element's empty space and text included; what takes the focus in the trailing element acts on its own.
- **The corners spring** with the `fast-spatial` motion token, as the button's do: 4px, 12px under the pointer, 16px when focused, pressed, or selected. A segmented list's first item keeps 16px at the top and its last at the bottom. The hovered, focused, and pressed corners are Rio's choice, from Compose's tokens (`ListTokens.kt`): the spec page lists those shape tokens, but its table doesn't show their values.
- The state layer and the ripple cover the whole item, and the focus ring sits 3px inside it.
- `20px` sizes the `svg` icons in the leading and trailing slots; avatars, images, and videos are the app's, at the sizes in the table above.

### Values and their sources

- Sizes, colors, and type come from the spec page's token table (List - Common), the paddings from its measurement drawing of the expressive list item, and the unselected and selected corners from its text on shape morphing. Compose's tokens (`ListTokens.kt`) carry the same values, and the corners of the other states.

### Not yet

- Expanding and collapsing items, dragging to reorder, and swiping.
- Dividers between items: the spec keeps them for uncontained or complex lists, and prefers gaps.
- Typing a letter to move to an item, as the WAI-ARIA list box pattern suggests.
- The baseline list.

## Sources

- [M3 Lists – Overview](https://m3.material.io/components/lists/overview)
- [M3 Lists – Specs](https://m3.material.io/components/lists/specs) (the token table, List - Common; the measurement drawing; the images of the styles and selection)
- [M3 Lists – Guidelines](https://m3.material.io/components/lists/guidelines)
- [M3 Lists – Accessibility](https://m3.material.io/components/lists/accessibility)
- Compose Material3 @ 079e2e3: [`ListItem.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ListItem.kt) (`ListItem`, `SegmentedListItem`; under In Rio, how the number of lines is told, from its implementation), [`ListItemDefaults.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ListItemDefaults.kt), and [`tokens/ListTokens.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ListTokens.kt)
- [WAI-ARIA Authoring Practices: Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
