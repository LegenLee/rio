# Switch

`RioSwitch` from `@rio-m3e/vue`, built on `createSwitch` and `attachSwitchHandle` from `@rio-m3e/core` and `@rio-m3e/styles/switch.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-11.

## Spec

### Anatomy and measurements

| Element     | Attribute                 | Value                         |
| ----------- | ------------------------- | ----------------------------- |
| Track       | Size                      | 52 × 32dp, `corner-full`      |
|             | Outline width             | 2dp                           |
| Handle      | Unselected                | 16dp                          |
|             | Selected, or with an icon | 24dp                          |
|             | Pressed                   | 28dp                          |
|             | Shape                     | `corner-full`                 |
| Icon        | Size                      | 16dp                          |
| State layer | Size                      | 40dp circle around the handle |
| Target      | Size                      | 48dp                          |

- Configurations: without icons, an icon on the selected switch only, or icons on both states.
- Some handle tokens on the spec page carry a deprecation warning and aren't in the measurements table: a 20dp handle size, a handle elevation, and a handle shadow color. Rio doesn't use them.

### Colors

| Part                                     | Unselected                | Selected          |
| ---------------------------------------- | ------------------------- | ----------------- |
| Track                                    | surface-container-highest | primary           |
| Track outline                            | outline                   | —                 |
| Handle                                   | outline                   | on-primary        |
| Handle when hovered, focused, or pressed | on-surface-variant        | primary-container |
| Icon                                     | surface-container-highest | primary           |
| State layer                              | on-surface                | primary           |

- The state layer opacities are the system ones (hover 8%, focus and pressed 10%).
- **Disabled**: the track at 12% (on-surface when selected, surface-container-highest when not, with an on-surface outline). The unselected handle is on-surface at 38%; the selected handle is surface at full opacity. Icons are at 38%.
- Adjacent text labels use on-surface.

### Behavior and accessibility

- Toggling slides the handle to the other end of the track, and the handle's size changes. "The effects of a switch should start immediately, without needing to save."
- **Touch: tap and drag.** "When tapped or dragged, the handle size grows."
- **Cursor: hover and click.** Hovering grows the hover area (the state layer); clicking grows the handle.
- **Keyboard**: Tab focuses the switch (focus lands on the handle); **Space or Enter** toggles it.
- The accessibility label comes from the adjacent label text.

## Recommendations

- Use switches for standalone on/off settings that take effect immediately. Use checkboxes for options that need saving, radio buttons for one choice in a list, and a connected button group for opposing options.
- Always pair a switch with an inline label that describes what it does when on. Don't put text inside the switch.
- Icons in the handle should communicate the state clearly, such as a checkmark and an X.
- Don't apply density by default; it would push the target below 48 × 48px.

## In Rio

### API

```vue
<label>
  <RioSwitch v-model:selected="wifi">
    <template #selected-icon><CheckIcon /></template>
  </RioSwitch>
  Wi-Fi
</label>
```

| Prop           | Type                               | Default |
| -------------- | ---------------------------------- | ------- |
| `selected`     | `boolean`, with `v-model:selected` | `false` |
| `disabled`     | `boolean`                          | `false` |
| `softDisabled` | `boolean`                          | `false` |

- Event: `update:selected`.
- Slots: `selected-icon` and `unselected-icon`. **Rio ships no icons**; apps bring their own. Each slot shows only in its state, and the handle grows to the icon size while one is showing. Fill only `selected-icon` for the spec's "icon on selected switch" configuration. The icons are hidden from assistive technology.
- The root is `<button type="button" role="switch" aria-checked>`. A button satisfies the spec's keyboard table natively (both Space and Enter activate it); a checkbox would need Enter handled by hand. `type="button"` keeps it from submitting a form.
- **Labels**: wrap the switch and its text in a `<label>`. A button is a labelable element, so the text becomes its accessible name and clicking the text toggles the switch.
- **Disabled** works as on the button: `disabled` is native and not focusable, and `softDisabled` (`aria-disabled`) stays focusable while presses and drags are blocked. See [button.md](button.md) for the deviation note.

### Motion

- The handle's center and size are springs on the `fast-spatial` token. The stylesheet declares a target for each state (`--rio-switch-handle-x-target` and `--rio-switch-handle-size-target`), and `attachSwitchHandle` springs `--_handle-x` and `--_handle-size` toward them with `attachSpringProperty`. Toggling overshoots slightly and settles, and pressing grows the handle to 28px.
- Colors fade with the `fast-effects` curve.
- Under reduced motion the handle jumps, and colors still fade (foundations, section 3).

### Dragging

- **Touch and pen drag the handle; the mouse clicks**, as the spec lists them. This uses `attachDrag` from `@rio-m3e/core`.
- A drag starts after the pointer moves 8px, so a short touch stays a tap.
- While dragging, the handle follows the finger, clamped to the track, and grows to the pressed size (`data-dragging`).
- On release, a fast flick (over 300px/s) picks the side it's heading to. Otherwise the handle goes to whichever side its center is on. The spring starts at the finger's speed.
- The click the browser fires after the gesture is swallowed, so a drag never toggles twice.
- The track sets `touch-action: pan-y`, so horizontal drags reach the switch while vertical ones still scroll the page. If the browser takes over to scroll, the drag is cancelled and the handle returns.
- In right-to-left layouts the handle is positioned with logical properties and the drag direction flips.

### Ripple and state layer

- Presses land on the whole switch, but the ripple and the state layer draw in the 40px circle around the handle. This uses `attachRipple(root, { surface })`: the surface draws and sets the ripple's size, and both elements get `data-pressed`.
- An invisible `rio-switch__touch` element extends the 32px track to the 48px target.

### Values and their sources

- Measurements and colors come from Material Web's component tokens (`_md-comp-switch.scss`, Material 3 v34.0.21), which match the spec's measurements table and token tables.
- Behavior comes from the spec's guidelines and accessibility pages. Flutter's switch also supports dragging; Compose's and Material Web's don't.

### Not yet

- **Form participation**: a button submits no value. A hidden input for `name` and `value` can be added later, as with link buttons.

## Sources

- [M3 Switch – Specs](https://m3.material.io/components/switch/specs) (token tables read in expanded form)
- [M3 Switch – Guidelines](https://m3.material.io/components/switch/guidelines)
- [M3 Switch – Accessibility](https://m3.material.io/components/switch/accessibility)
- [Material Web `_md-comp-switch.scss` @ d872455](https://github.com/material-components/material-web/blob/d872455c4be56022da2095349b30ef46e0b55bc3/tokens/versions/latest/sass/_md-comp-switch.scss)
- Implementation references, not spec: [Material Web `switch/internal/switch.ts`](https://github.com/material-components/material-web/blob/d872455c4be56022da2095349b30ef46e0b55bc3/switch/internal/switch.ts) (checkbox with `role="switch"`, `icons` and `showOnlySelectedIcon`), [Flutter `switch.dart`](https://github.com/flutter/flutter/blob/master/packages/flutter/lib/src/material/switch.dart) (drag), [Compose `Switch.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Switch.kt) (`thumbContent`, `toggleable`)
