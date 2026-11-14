# Changelog

Notable changes to Rio, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Before 1.0, any minor version may break the API.

Each version is published to npm and as a GitHub release, with the same tarballs attached.

## [0.2.0] - 2026-11-15

Two new components, the button group and the split button, and a docs site with live examples. `@rio-m3e/core` changes how it hands markup to adapters, which breaks code built on it directly; the Vue components keep their props and events.

### Added

- **`RioButtonGroup`**, with `createButtonGroup` and `attachButtonGroup` in `@rio-m3e/core`.
  - Standard groups: a pressed button grows by 15% and its neighbors make room.
  - Connected groups: buttons 2px apart that fill their container, with round ends and small facing corners.
  - Five sizes and round or square shapes, passed down to the buttons inside, which can still set their own.
  - Single and multi-select with `v-model`, optionally required. Arrow keys move between the buttons.
- **`RioSplitButton`**, with `createSplitButton` and `attachSplitButtonMenuIcon`.
  - Four variants (elevated, filled, tonal, outlined) and five sizes.
  - `v-model:open` for the menu button, which sets `aria-expanded`, and `popup` for `aria-haspopup`. Its icon turns half a circle on the standard scheme's spring.
  - The two buttons are exposed as `leading` and `trailing`, to place a menu and return the focus. Rio has no menu component yet, so the app renders the menu.
- **Parts and skeletons** in `@rio-m3e/core`: each component's API returns an attribute bundle per part (`parts.root()`, `parts.icon()`, ...), and `buttonSkeleton`, `iconButtonSkeleton`, `switchSkeleton`, `buttonGroupSkeleton`, and `splitButtonSkeleton` say how the parts nest (`PartAttrs`, `PartNode`). Every adapter renders the same markup from them.
- `prefersReducedMotion()` in `@rio-m3e/core`.
- The standard scheme's spatial springs in every theme, whatever its scheme: `--rio-motion-standard-{fast|default|slow}-spatial-{damping|stiffness}`, with `standardSpringVar` and `SPATIAL_MOTION_TOKENS` in `@rio-m3e/tokens`.
- `--rio-spring-targets` on the elements that spring (button, icon button, switch, and the split button's two buttons). An app that sets its own `transition` on one of them ends the list with `var(--rio-spring-targets)` to keep the shape springs.
- **Docs site** at https://legenlee.github.io/rio/, with live examples for each component.

### Changed

- **BREAKING**: in `@rio-m3e/core`, `rootAttrs()` is replaced by `parts`, one bundle per part; `parts.root()` is the old root.
- **BREAKING**: `createIconButton` returns `IconButtonApi` instead of `ButtonApi`.
- **BREAKING**: `onSelectedChange` is renamed `onChange` in `createButton`, `createIconButton`, `createSwitch`, and `attachSwitchHandle`. The Vue events are unchanged (`update:selected`).
- **BREAKING**: `attachSpringProperty` and `attachShapeMorph` no longer take a `watch` option, and `STATE_ATTRIBUTES` is no longer exported. Springs now see their targets change through a transition: a stylesheet lists each target in the element's `transition` as `<target> 1ms step-end` (or ends the list with `var(--rio-spring-targets)`) and draws the animated property from the target. Rio's stylesheets already do.

### Fixed

- In right-to-left layouts, the touch targets of buttons, icon buttons, and switches sat off the component.
- A shape could jump when its target changed while the spring rested, for example when the theme was applied after the components mounted: the next press started from the old shape. Springs now start from what is on screen.

### Not yet

- A menu, for the split button and for button groups that overflow.
- A tooltip, so icon buttons show no description on hover.
- Link buttons (`href`), emphasized button labels, and a form value for the switch.
- Language-specific line heights and variable font axes in the type scale.

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
[0.2.0]: https://github.com/LegenLee/rio/releases/tag/v0.2.0
