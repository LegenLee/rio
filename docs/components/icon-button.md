# Icon button

`RioIconButton` from `@rio-m3e/vue`, built on `createIconButton` from `@rio-m3e/core` and `@rio-m3e/styles/icon-button.css` (on top of `button.css`). Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-11.

## Spec

### Configurations

| Axis               | Values                                  | Default | Notes                                 |
| ------------------ | --------------------------------------- | ------- | ------------------------------------- |
| Color              | filled, tonal, outlined, standard       | filled  |                                       |
| Size               | xsmall, small, medium, large, xlarge    | small   | Sizes other than small are new in M3E |
| Shape              | round, square                           | round   | Square is new in M3E                  |
| Width              | narrow, default, wide                   | default | Narrow and wide are new in M3E        |
| Toggle (selection) | on or off, available in all four colors | off     |                                       |

### Sizes

The container is as tall as the button of the same size. Its width is the icon size plus the leading and trailing space for that width, on each side.

| Token                               | xsmall | small | medium | large | xlarge |
| ----------------------------------- | ------ | ----- | ------ | ----- | ------ |
| Container height                    | 32     | 40    | 56     | 96    | 136    |
| Icon size                           | 20     | 24    | 24     | 32    | 40     |
| Leading and trailing space, narrow  | 4      | 4     | 12     | 16    | 32     |
| Leading and trailing space, default | 6      | 8     | 16     | 32    | 48     |
| Leading and trailing space, wide    | 10     | 14    | 24     | 48    | 72     |
| Width, narrow                       | 28     | 32    | 48     | 64    | 104    |
| Width, default                      | 32     | 40    | 56     | 96    | 136    |
| Width, wide                         | 40     | 52    | 72     | 128   | 184    |
| Outline width (outlined)            | 1      | 1     | 1      | 2     | 3      |

- Values are in dp. The default width makes a circle (round) or a square with rounded corners (square).
- The small icon is 24dp, not the 20dp of a small button.
- **Target area**: "Extra small and small icon buttons must have a target size of 48x48dp or larger to be accessible." The accessibility page asks for at least 48dp "even when nested".

### Shapes

| Shape   | xsmall | small | medium | large | xlarge |
| ------- | ------ | ----- | ------ | ----- | ------ |
| Round   | full   | full  | full   | full  | full   |
| Square  | 12     | 12    | 16     | 28    | 28     |
| Pressed | 8      | 8     | 12     | 16    | 16     |

- These are the button's shape tokens: `corner-medium`, `corner-large`, and `corner-extra-large` for square, and `corner-small`, `corner-medium`, and `corner-large` for pressed.
- "Both round and square icon buttons should have the same pressed shape radius." The pressed shape is driven by the `fast-spatial` spring.
- **When selected**: "toggle icon buttons also change the resting shape from round (unselected) to square (selected) by default. If the resting shape is square, the selected shape should be round."

### Colors

| Color    | Default container / icon                     | Toggle, unselected                           | Toggle, selected                     |
| -------- | -------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| filled   | primary / on-primary                         | surface-container / on-surface-variant       | primary / on-primary                 |
| tonal    | secondary-container / on-secondary-container | secondary-container / on-secondary-container | secondary / on-secondary             |
| outlined | outline-variant outline / on-surface-variant | outline-variant outline / on-surface-variant | inverse-surface / inverse-on-surface |
| standard | — / on-surface-variant                       | — / on-surface-variant                       | — / primary                          |

- These match the button's toggle colors, with `standard` added. "The standard icon button's container is invisible at rest, but visible when the state layer is applied."
- The state layer uses the icon color, with the system opacities (hover 8%, focus and pressed 10%).
- **No elevation.** No icon button token sets one, not even for filled.
- **Disabled**: container `on-surface` at 10% (none for outlined and standard, except a selected outlined toggle), icon `on-surface` at 38%. Outlined keeps its `outline-variant` outline.
- Other color roles may replace these "as long as the container and text have a 3:1 contrast ratio".

### Accessibility

- **Keyboard**: Tab focuses an icon button that isn't disabled; Space or Enter activates it.
- **Label**: "The accessibility label for icon buttons describes the action the button is executing, such as Add to favorites, Bookmark, or Send message."
- The icon needs a 3:1 contrast ratio with the surface or background.

## Recommendations

- **Emphasis, from most to least**: filled, tonal, outlined, standard. Use filled sparingly, for key actions. Use standard for low emphasis or on colorful surfaces.
- **Icons**: "Default icon buttons should use filled icons. Toggle buttons should use an outlined icon when unselected, and a filled version of the icon when selected." If no filled version exists, use a semibold weight (bold if semibold isn't enough), so selection shows through more than color alone.
- Don't use a toggle for actions that have no selected state, such as an overflow menu.
- **Tooltip**: "On hover, the icon button displays a tooltip describing its action, rather than the name of the icon itself." The accessibility page also wants a tooltip "when applicable".
- Give buttons of similar importance the same size. Use size, width, and color to make the main action stand out.
- Don't apply density by default; it would push the target below 48 × 48px.

## In Rio

### API

```vue
<RioIconButton label="Search" @click="openSearch">
  <SearchIcon />
</RioIconButton>

<RioIconButton v-model:selected="favorite" label="Add to favorites" variant="standard" toggle>
  <HeartOutlineIcon />
  <template #selected-icon><HeartIcon /></template>
</RioIconButton>
```

| Prop           | Type                                                     | Default     |
| -------------- | -------------------------------------------------------- | ----------- |
| `label`        | `string`, required                                       | —           |
| `variant`      | `'filled' \| 'tonal' \| 'outlined' \| 'standard'`        | `'filled'`  |
| `size`         | `'xsmall' \| 'small' \| 'medium' \| 'large' \| 'xlarge'` | `'small'`   |
| `width`        | `'narrow' \| 'default' \| 'wide'`                        | `'default'` |
| `shape`        | `'round' \| 'square'`                                    | `'round'`   |
| `toggle`       | `boolean`                                                | `false`     |
| `selected`     | `boolean`, with `v-model:selected`                       | `false`     |
| `disabled`     | `boolean`                                                | `false`     |
| `softDisabled` | `boolean`                                                | `false`     |
| `type`         | `'button' \| 'submit' \| 'reset'`                        | `'button'`  |
| `value`        | `string \| number`, for button groups                    | —           |

- Events: `click` (only when not blocked), and `update:selected` (toggle buttons).
- Slots: the default slot is the icon. `selected-icon` replaces it while a toggle button is selected, for the filled icon the guidelines ask for. **Rio ships no icons**; apps bring their own. Both slots are hidden from assistive technology.
- **`label` is required** and becomes `aria-label`, so the accessible name always describes the action, as the spec asks. Describe the action ("Add to favorites"), not the icon ("Heart").
- **The default is filled**, as the spec says. Material Web's `<md-icon-button>` and Compose's `IconButton` are the standard style, with filled, tonal, and outlined as separate components, so code ported from them should set `variant="standard"`.
- Everything else works as on the button: a native `<button>` with the ripple, the state layer, and the focus ring; `type` defaults to `'button'`; a toggle sets `aria-pressed`; and `disabled` and `softDisabled` are the same two props. See [button.md](button.md) for the `softDisabled` deviation note.
- Inside a [button group](button-group.md), `size` and `shape` default to the group's, and a group that keeps a selection owns the state of icon buttons with a `value`, including which icon they show.

### Built on the button

- `createIconButton` wraps `createButton` and adds `aria-label`, `data-width`, and the icon button's variants. The click guard, toggling, and disabled handling are the button's.
- The root carries both `rio-button` and `rio-icon-button`. It reuses the button's stylesheet for shapes, shape morphing, colors, disabled rules, the touch target, and the state layer. `icon-button.css` adds only the widths, the icon sizes, and removing elevation.
- The `standard` colors live in `button.css` with the other variants, so they don't depend on which stylesheet loads first. Every rule in `icon-button.css` uses `.rio-button.rio-icon-button`, which beats the button's `:where()` rules in any order and still leaves the disabled and pressed rules in charge.

### Values and their sources

- Sizes, widths, shapes, and colors come from Material Web's component tokens (`_md-comp-icon-button.scss`, `_md-comp-icon-button-{filled,tonal,outlined,standard}.scss`, `_md-comp-icon-button-{xsmall,small,medium,large,xlarge}.scss`, Material 3 v34.0.21). They match the spec page's corner radius table and color tables.
- The spec page shows the widths only as images; the leading and trailing spaces come from those token files.

### Not yet

- **Tooltip**: there's no tooltip component yet. Until there is, `label` gives screen readers the name, but mouse users see no description on hover.
- **Link icon buttons** (`href`), as with the button.

## Sources

- [M3 Icon buttons – Specs](https://m3.material.io/components/icon-buttons/specs) (token tables read in expanded form)
- [M3 Icon buttons – Guidelines](https://m3.material.io/components/icon-buttons/guidelines)
- [M3 Icon buttons – Accessibility](https://m3.material.io/components/icon-buttons/accessibility)
- [Material Web component tokens @ d872455](https://github.com/material-components/material-web/tree/d872455c4be56022da2095349b30ef46e0b55bc3/tokens/versions/latest/sass) (`_md-comp-icon-button*.scss`)
- Implementation references, not spec: [Material Web `iconbutton/`](https://github.com/material-components/material-web/tree/d872455c4be56022da2095349b30ef46e0b55bc3/iconbutton) (`md-icon-button` is the standard style), [Compose Material3 `IconButton.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/IconButton.kt) (`IconButton`, `FilledIconButton`, `FilledTonalIconButton`, `OutlinedIconButton`)
