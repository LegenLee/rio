# Button group

`RioButtonGroup` from `@rio-m3e/vue`, built on `createButtonGroup` and `attachButtonGroup` from `@rio-m3e/core` and `@rio-m3e/styles/button-group.css`. It holds `RioButton`s and `RioIconButton`s. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-14.

## Spec

### Variants and configurations

| Axis          | Values                                          | Notes                                                     |
| ------------- | ----------------------------------------------- | --------------------------------------------------------- |
| Variant       | standard, connected                             | Both new in M3E. Connected replaces the segmented button. |
| Size          | xsmall, small, medium, large, xlarge            | The size of the buttons inside                            |
| Default shape | round, square                                   | Applied to every button in the group                      |
| Selection     | single-select, multi-select, selection-required |                                                           |

- "Button groups are invisible containers that add padding between buttons and modify button shape." They have no color properties; the buttons keep their own color styles.
- "Button groups can contain buttons and icon buttons."

### Standard

| Token                    | xsmall | small | medium | large | xlarge |
| ------------------------ | ------ | ----- | ------ | ----- | ------ |
| Container height         | 32     | 40    | 56     | 96    | 136    |
| Space between buttons    | 18     | 12    | 8      | 8     | 8      |
| Pressed width multiplier | 15%    | 15%   | 15%    | 15%   | 15%    |

- Values are in dp. The space keeps every button's target at least 48dp.
- **Pressed**: "When a button is pressed, standard button groups modify the width and shape of that button and adjacent buttons." The width change is driven by the `fast-spatial` spring.
- **Selected**: a toggle button's shape changes between square and round, and its color follows the button specs.
- The group hugs the width of its buttons, and its padding lets them animate "without disrupting the product layout".

### Connected

| Token                   | xsmall      | small       | medium      | large  | xlarge          |
| ----------------------- | ----------- | ----------- | ----------- | ------ | --------------- |
| Space between buttons   | 2           | 2           | 2           | 2      | 2               |
| Outer corners           | full        | full        | full        | full   | full            |
| Inner corners           | small       | small       | small       | large  | large-increased |
| Inner corners, pressed  | extra-small | extra-small | extra-small | medium | large           |
| Inner corners, selected | 50%         | 50%         | 50%         | 50%    | 50%             |

- Shape names are steps of the corner radius scale (small 8, large 16, large-increased 20, extra-small 4, medium 12).
- "Connected button groups don't add any interaction between buttons when selected or activated. They only affect the shape of the button being selected or activated."
- **Square connected groups** have the same 2dp spacing; the spec lists their outer corners per size (XS 4, S 8, M 8, L 16, XL 20).
- "Extra small and small connected button groups have 48dp target areas and a minimum width of 48dp."
- The connected group "should span the width of the page or surface it's placed on, increasing the button widths inside."

### Accessibility

- The container isn't focusable and needs no label. Label each button.
- "Use Tab to navigate to a button group, the arrow keys to navigate between each item in the group, and Space or Enter to select a focused button." The keyboard table lists Tab as "Navigate between buttons" and the arrow keys as "Navigate inside the component".
- Each button keeps a 48 × 48dp target; don't reduce the padding of extra small and small groups.

## Recommendations

- By default, all buttons in a standard group should be the same size and shape. Use multiple sizes only for hero moments, and a different shape only for a selected button or to add meaning.
- Use connected groups for related options with single or multi-select toggle buttons; avoid them when no button can be toggled.
- Avoid standard icon buttons and text buttons in groups, since they have no container. Don't mix color styles in a connected group.
- Groups shouldn't wrap to a second line. In compact windows use smaller, narrower buttons; trailing buttons can collapse into an overflow menu at the end of the group.
- In larger windows, consider a maximum width for connected groups.

## In Rio

### API

```vue
<RioButtonGroup>
  <RioIconButton label="Previous" variant="tonal"><SkipPreviousIcon /></RioIconButton>
  <RioIconButton label="Pause" width="wide"><PauseIcon /></RioIconButton>
  <RioIconButton label="Next" variant="tonal"><SkipNextIcon /></RioIconButton>
</RioButtonGroup>

<RioButtonGroup v-model="view" variant="connected" selection="single" required>
  <RioButton value="day">Day</RioButton>
  <RioButton value="week">Week</RioButton>
  <RioButton value="month">Month</RioButton>
</RioButtonGroup>
```

| Prop        | Type                                                                   | Default      |
| ----------- | ---------------------------------------------------------------------- | ------------ |
| `variant`   | `'standard' \| 'connected'`                                            | `'standard'` |
| `size`      | `'xsmall' \| 'small' \| 'medium' \| 'large' \| 'xlarge'`               | `'small'`    |
| `shape`     | `'round' \| 'square'`                                                  | `'round'`    |
| `selection` | `'none' \| 'single' \| 'multiple'`                                     | `'none'`     |
| `required`  | `boolean`                                                              | `false`      |
| `value`     | a value (`single`), or an array of values (`multiple`), with `v-model` | —            |

- Event: `update:modelValue`. The parent owns the selection.
- **Buttons take the group's size and shape** unless they set their own. A button can still opt out, for the spec's hero moments.
- **Selection**: with `selection` set, every button with a `value` becomes a toggle whose state the group keeps; its own `toggle`, `selected`, and `update:selected` are ignored. `single` turns the previous button off; `multiple` toggles each value in and out of an array. `required` keeps the last selected button on. Buttons without a `value` stay plain buttons. Selected buttons set `aria-pressed`.
- The root is a `<div role="group">`. It isn't focusable.

### Keyboard

- Tab reaches every button, and **Left and Right arrows move between them**, skipping disabled ones and stopping at the ends. In right-to-left layouts the arrows follow the visual order.
- This reads the spec's table literally: Tab moves between buttons, and the arrows also move inside the group. A roving tab stop (one Tab stop for the whole group, as in a WAI-ARIA toolbar) would match the prose but not the table, and would change how buttons that used to stand alone are reached.

### Standard: pressed width

- `attachButtonGroup` watches the buttons' `data-pressed` (from the ripple), so pointer and keyboard presses both count. The pressed button grows by 15% of its width, and the buttons next to it give up half of that each, so the group keeps its width. The widths move on the `fast-spatial` spring and return when the press ends; at rest the inline width is removed.
- Each neighbor gives up at most 15% of its own width, so a small button next to a large one stays legible. Compose limits this by the neighbor's content padding instead; Rio's limit also works for icon buttons, whose width isn't made of padding.
- **A change of size applies at once**, even during a press: when a button's `data-size` (or an icon button's `data-width`) changes, the widths are measured again and jump to their new targets instead of springing from the old ones. A label that changes while a button is pressed is only picked up at the next press.
- **Under reduced motion the width change is skipped**, like the ripple's growing wave. The spec doesn't cover reduced motion; the effect only signals the press, which the color and shape still show.

### Connected: corners

- Each button's start and end sides spring separately. The stylesheet sets `--rio-shape-morph-start-target` and `--rio-shape-morph-end-target` per position: the first button's start and the last button's end use the group's outer shape, and facing corners use the inner size, which tightens when pressed and opens up fully when selected. Sides follow the writing direction, so right-to-left layouts mirror them.
- **Round groups** use half the button height for "full" and for the selected 50%, so the corners animate into each other.
- **Square groups** use the inner size for the outer corners too. The spec's list of square outer corners matches the inner sizes, except at extra small (see below).
- Buttons share the group's width equally, and extra small and small icon buttons keep a 48px minimum width.

### Values and their sources

- Spacing, heights, inner corners, and the width multiplier come from Material Web's component tokens (`_md-comp-button-group-standard-*.scss`, `_md-comp-button-group-connected-*.scss`, Material 3 v34.0.21). Compose's `ButtonGroupDefaults` and `ConnectedButtonGroupSmallTokens` agree for the small size.
- **Sources disagree on extra small inner corners**: the spec page's measurements say 4dp, while Material Web's `_md-comp-button-group-connected-xsmall.scss` says `corner-value-small` (8dp). Rio uses the token, as it does for other values.

### Not yet

- **Overflow menu**: collapsing trailing buttons into a menu needs the menu component.
- **Vertical groups**: Compose has a sample; the spec doesn't describe them.
- A `disabled` prop for the whole group. Disable the buttons one by one for now.

## Sources

- [M3 Button groups – Overview](https://m3.material.io/components/button-groups/overview)
- [M3 Button groups – Specs](https://m3.material.io/components/button-groups/specs)
- [M3 Button groups – Guidelines](https://m3.material.io/components/button-groups/guidelines)
- [M3 Button groups – Accessibility](https://m3.material.io/components/button-groups/accessibility)
- [Material Web component tokens @ d872455](https://github.com/material-components/material-web/tree/d872455c4be56022da2095349b30ef46e0b55bc3/tokens/versions/latest/sass) (`_md-comp-button-group-*.scss`)
- [Compose Material3 `ButtonGroup.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ButtonGroup.kt): `ButtonGroup` signature and `ButtonGroupDefaults` (public interface only)
- [Compose Material3 `ConnectedButtonGroupSmallTokens.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ConnectedButtonGroupSmallTokens.kt)
