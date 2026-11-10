# Button

`RioButton` from `@rio-m3e/vue`, built on `createButton` from `@rio-m3e/core` and `@rio-m3e/styles/button.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-11.

## Spec

### Configurations

| Axis               | Values                                  | Default | Notes                                           |
| ------------------ | --------------------------------------- | ------- | ----------------------------------------------- |
| Color (variant)    | elevated, filled, tonal, outlined, text | filled  |                                                 |
| Size               | xsmall, small, medium, large, xlarge    | small   | Sizes other than small are new in M3E           |
| Shape              | round, square                           | round   | Square is new in M3E                            |
| Toggle (selection) | on or off                               | off     | New in M3E. Text buttons have no toggle tokens. |

### Sizes

| Token                      | xsmall        | small         | medium        | large              | xlarge             |
| -------------------------- | ------------- | ------------- | ------------- | ------------------ | ------------------ |
| Container height           | 32            | 40            | 56            | 96                 | 136                |
| Leading and trailing space | 12            | 16            | 24            | 48                 | 64                 |
| Icon size                  | 20            | 20            | 24            | 32                 | 40                 |
| Icon–label space           | 8             | 8             | 8             | 12                 | 16                 |
| Outline width (outlined)   | 1             | 1             | 1             | 2                  | 3                  |
| Square shape               | corner-medium | corner-medium | corner-large  | corner-extra-large | corner-extra-large |
| Pressed shape              | corner-small  | corner-small  | corner-medium | corner-large       | corner-large       |
| Selected shape, round      | corner-medium | corner-medium | corner-large  | corner-extra-large | corner-extra-large |
| Selected shape, square     | corner-full   | corner-full   | corner-full   | corner-full        | corner-full        |
| Label type style           | label-large   | label-large   | title-medium  | headline-small     | headline-large     |

- Values are in dp. The round shape is `corner-full` at every size.
- The corner change when pressed is driven by the `fast-spatial` spring.
- **Target area**: "Extra small and small … must have a target size of 48x48dp or larger."

### Colors and elevation

| Variant  | Container             | Label and icon         | Outline         | Elevation (rest → hover) |
| -------- | --------------------- | ---------------------- | --------------- | ------------------------ |
| filled   | primary               | on-primary             | —               | 0 → 1                    |
| tonal    | secondary-container   | on-secondary-container | —               | 0 → 1                    |
| outlined | —                     | on-surface-variant     | outline-variant | —                        |
| elevated | surface-container-low | primary                | —               | 1 → 2                    |
| text     | —                     | primary                | —               | —                        |

Toggle buttons replace those colors:

| Variant  | Unselected container / content                  | Selected container / content                     |
| -------- | ----------------------------------------------- | ------------------------------------------------ |
| filled   | surface-container / on-surface-variant          | primary / on-primary                             |
| tonal    | secondary-container / on-secondary-container    | secondary / on-secondary                         |
| outlined | — / on-surface-variant, outline-variant outline | inverse-surface / inverse-on-surface, no outline |
| elevated | surface-container-low / primary                 | primary / on-primary                             |

- The state layer uses the content color, with the system opacities (section 6 of the foundations).
- Pressing returns the elevation to its resting level.
- **Disabled**: container `on-surface` at 10% (none for outlined and text, except a selected outlined toggle), label and icon `on-surface` at 38%, elevation 0. Outlined keeps its `outline-variant` outline.
- Disabled components can't be focused or pressed.

### Typography

"Material components don't use emphasized type styles by default." The label uses the baseline style for its size.

## Recommendations

- Use 16dp padding on small buttons, not M3's earlier 24dp ("Not recommended. Use 16dp").
- Emphasized type styles work well for buttons for primary actions (typography guidance).

## In Rio

### API

```vue
<RioButton variant="tonal" size="medium" shape="square" @click="save">
  <template #icon><SaveIcon /></template>
  Save
</RioButton>

<RioButton v-model:selected="bold" toggle>Bold</RioButton>
```

| Prop           | Type                                                        | Default    |
| -------------- | ----------------------------------------------------------- | ---------- |
| `variant`      | `'filled' \| 'tonal' \| 'outlined' \| 'elevated' \| 'text'` | `'filled'` |
| `size`         | `'xsmall' \| 'small' \| 'medium' \| 'large' \| 'xlarge'`    | `'small'`  |
| `shape`        | `'round' \| 'square'`                                       | `'round'`  |
| `toggle`       | `boolean`                                                   | `false`    |
| `selected`     | `boolean`, with `v-model:selected`                          | `false`    |
| `disabled`     | `boolean`                                                   | `false`    |
| `softDisabled` | `boolean`                                                   | `false`    |
| `type`         | `'button' \| 'submit' \| 'reset'`                           | `'button'` |

- Events: `click` (only when not blocked), and `update:selected` (toggle buttons).
- Slots: the default slot is the label, and `icon` is a leading icon. The icon is hidden from assistive technology, so the label must stand on its own.
- The root is a native `<button>`, with the ripple (`v-ripple`), the state layer, and the focus ring.
- `type` defaults to `'button'`, so a button inside a form doesn't submit it by accident.
- `toggle` on a text button is ignored, because the spec has no tokens for it. A toggle button sets `aria-pressed`.

### Disabled: two props

- `disabled` is the native attribute. The button leaves the tab order and can't be pressed. This is the spec's behavior, and Android View, Compose, Flutter, and Material Web all work this way by default.
- `softDisabled` sets `aria-disabled="true"` instead. The button looks disabled but stays focusable. The component blocks clicks itself: it doesn't emit `click` or `update:selected`, and it calls `preventDefault()`, so a soft-disabled submit button doesn't submit its form. `pointer-events: none` isn't used, because it leaves keyboard activation working, lets clicks fall through to the element underneath, and hides the hover that makes a focusable disabled button useful.

> **Deviation from the spec.** The spec says disabled components can't be focused. `softDisabled` keeps the button focusable so that keyboard and screen reader users can find it and learn why it is unavailable, for example in a toolbar. Material Web offers the same option as `soft-disabled`, citing the WAI-ARIA Authoring Practices on focusability of disabled controls. It is opt-in; `disabled` follows the spec.

### Values and their sources

- Sizes, shapes, colors, and elevation come from Material Web's component tokens (`_md-comp-button.scss`, `_md-comp-button-{filled,tonal,outlined,elevated,text}.scss`, `_md-comp-button-{xsmall,small,medium,large,xlarge}.scss`, Material 3 v34.0.21).
- Label type styles per size come from Compose's `ButtonDefaults.textStyleFor`, because Material Web's tokens don't include them.
- **Sources disagree on extra small padding**: Material Web has 12dp and Compose's `ButtonXSmallTokens` (v0_11_0) has 16dp. Rio uses Material Web's newer token set. The spec page shows the measurements only as images.

### Implementation notes

- **The round shape is half the height**, not `corner-full` (`9999px`), so the pressed and selected shape changes animate smoothly.
- **Pressed shape**: `data-pressed` from the ripple switches the corners to the pressed shape. The change uses the `fast-spatial` curve as a CSS transition for now; the spec's spring comes with Rio's spring solver. CSS transitions already reverse smoothly when a press is interrupted. Under reduced motion the corners change instantly, while color and elevation keep their short fades (foundations, section 3).
- **Touch target**: an invisible `rio-button__touch` element extends extra small and small buttons to 48px.
- Variant, size, shape, and toggle selectors are wrapped in `:where()`, so they add no specificity. The disabled and pressed rules always win, and an app can override any of them with a single class.

### Not yet

- **Link buttons** (`href` rendering an `<a>`) are deferred.
- **Emphasized labels** for primary actions: there's no prop for them yet.
- Icon-only buttons are the separate icon button component.

## Sources

- [M3 Buttons – Specs](https://m3.material.io/components/buttons/specs)
- [Material Web component tokens @ d872455](https://github.com/material-components/material-web/tree/d872455c4be56022da2095349b30ef46e0b55bc3/tokens/versions/latest/sass) (`_md-comp-button*.scss`)
- [Material Web `button/internal/button.ts` @ d872455](https://github.com/material-components/material-web/blob/d872455c4be56022da2095349b30ef46e0b55bc3/button/internal/button.ts): `soft-disabled` (implementation reference, not spec)
- [Compose Material3 `Button.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Button.kt): `ButtonDefaults.textStyleFor` (Defaults object)
- [Compose Material3 `ButtonXSmallTokens.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ButtonXSmallTokens.kt)
- Disabled behavior on other platforms: Android `View.canTakeFocus()`, Compose `Modifier.clickable(enabled)`, Flutter `ButtonStyleButton` (`canRequestFocus: widget.enabled`).
