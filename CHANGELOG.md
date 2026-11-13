# Changelog

Notable changes to Rio, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Before 1.0, any minor version may break the API.

Rio isn't on npm. Each version is a GitHub release with the packages attached as tarballs.

## [0.1.0] - 2026-11-13

The first release: the M3E foundations and three components, the button, the icon button, and the switch.

### Added

- **Components** in `@rio-m3e/vue`, with their logic in `@rio-m3e/core` and their styles in `@rio-m3e/styles`. Each has a page in `docs/components/`.
  - `RioButton`: five variants (elevated, filled, tonal, outlined, text), five sizes, round and square shapes, and toggle buttons.
  - `RioIconButton`: four variants (filled, tonal, outlined, standard), five sizes, three widths, two shapes, and toggle buttons with a `selected-icon` slot. `label` is required and names the action.
  - `RioSwitch`: `v-model:selected`, optional icons in the handle, and dragging with touch and pen.
  - Pressed and selected corners and the switch handle move on the `fast-spatial` spring, overshooting slightly with the expressive motion scheme.
  - `disabled` is native and not focusable, as the spec says. `softDisabled` uses `aria-disabled` and stays focusable.
- **`v-ripple`**: the pressed ripple, for any element.
- **Theme** in `@rio-m3e/tokens`. `applyTheme` and `createThemeCss` write every token as a `--rio-*` CSS variable:
  - Color roles from a source color with material-color-utilities (2025 spec): tonal spot, neutral, vibrant, and expressive variants, contrast levels, and light and dark through `light-dark()`.
  - Elevation levels as web shadows.
  - Motion in the standard and expressive schemes, as springs and as the official easing and duration conversions.
  - The shape corner scale, the baseline and emphasized type scales, the state layer opacities, and the focus indicator.
- **Primitives** in `@rio-m3e/core`, for building other components: `attachRipple`, `attachShapeMorph`, `attachSpringProperty`, `attachDrag`, and the spring solver (`solveSpring`, `createSpring`, `readSpringParams`).
- **Reduced motion**: under `prefers-reduced-motion`, spatial motion is instant and fades stay.

### Not yet

- A tooltip, so icon buttons show no description on hover.
- Link buttons (`href`), emphasized button labels, and a form value for the switch.
- Language-specific line heights and variable font axes in the type scale.

[0.1.0]: https://github.com/LegenLee/rio/releases/tag/v0.1.0
