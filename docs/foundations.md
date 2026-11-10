# Rio Foundations: M3E Core Principles

This document summarizes the Material 3 Expressive (M3E) foundations that Rio follows. They rest on three pillars: two ways to express hierarchy, and one for motion. Each section cites Google's official spec and notes how Rio implements it.

> Last verified: 2026-11-10. Sources are listed at the end. Update this document when the spec changes.

## 1. Use contrast for hierarchy within a page

> "By default, Material 3's surfaces use tonal difference to indicate separation."

Within a page, separate regions by the tonal difference between surface colors, not by shadows.

### Tools: surface roles

| Role                      | Rio CSS variable                        | Use                                       |
| ------------------------- | --------------------------------------- | ----------------------------------------- |
| surface                   | `--rio-color-surface`                   | Backgrounds and large, low-emphasis areas |
| surface container lowest  | `--rio-color-surface-container-lowest`  | Lowest-emphasis container                 |
| surface container low     | `--rio-color-surface-container-low`     | Low-emphasis container                    |
| surface container         | `--rio-color-surface-container`         | Default container                         |
| surface container high    | `--rio-color-surface-container-high`    | High-emphasis container                   |
| surface container highest | `--rio-color-surface-container-highest` | Highest-emphasis container                |

The container role names describe **emphasis, not height**. The spec says so explicitly: "These roles are not tied to elevation."

### Rules

- Overlapping regions or components use different roles.
- The most common pairing is `surface` for the body and `surface container` for navigation.
- Keep each region's role the same across window sizes. Larger screens may add other container roles, as long as they are applied consistently.
- Edges of interactive elements need at least 3:1 contrast against their background. Use `outline` for those edges. Don't use `outline-variant` to define boundaries or hierarchy.

### Exceptions: shadows within a page

- **Protection**: when a busy background, such as a pattern or a photo, would swallow cards, chips, or buttons.
- **Interaction**: to lift an element briefly during focus, selection, swipe, or similar interactions. All buttons rise one elevation level on hover.
- **FAB**: separated from body content by a shadow even at rest (level 3, level 4 on hover).

## 2. Use elevation for layers that float above

Elevation is the distance between two surfaces on the z-axis. It isn't a property of floating elements only: **every component has an elevation value**. A shadow is just one way to depict it.

### Levels

| Level | Height | Use                                             |
| ----- | ------ | ----------------------------------------------- |
| 0     | 0dp    | Resting                                         |
| 1     | 1dp    | Resting                                         |
| 2     | 3dp    | Resting                                         |
| 3     | 6dp    | Resting                                         |
| 4     | 8dp    | Interaction states only, such as hover and drag |
| 5     | 12dp   | Interaction states only, such as hover and drag |

- Every component has a default level. Don't change it.
- Change a level only in response to system events or user interaction, and apply the change consistently across similar elements.
- Shadows are more powerful when used sparingly. Keep the number of levels on a screen small.

### Ways to depict elevation

1. **Tonal difference**: the default, covered in section 1.
2. **Shadow**: a small, sharp shadow reads as close; a large, soft one reads as far.
3. **Scrim**: placed beneath modals and expanded navigation to focus attention. It uses the `scrim` color role at **32% opacity**.

### What Rio has to decide

> "Tokens have no shadows or color; each platform determines the specific shadows and values to use at each elevation level."

A level's dp value only says how far an element sits above the surface below it. It doesn't define the shadow's shape: offset, blur, spread, opacity, or number of layers. On Android, the OS light model computes the shadow from the elevation. On the web, `box-shadow` needs every one of those numbers written out.

Rio uses the **per-level shadow styles in the M3 Figma Design Kit** (`M3/Elevation Light/1–5` and `M3/Elevation Dark/1–5`) as its reference. The kit's light and dark values are identical; only the layer order differs. Each level has two layers.

| Level | Rio CSS variable         | Key shadow (30%) | Ambient shadow (15%) |
| ----- | ------------------------ | ---------------- | -------------------- |
| 0     | `--rio-elevation-level0` | None             | None                 |
| 1     | `--rio-elevation-level1` | `0 1px 2px 0`    | `0 1px 3px 1px`      |
| 2     | `--rio-elevation-level2` | `0 1px 2px 0`    | `0 2px 6px 2px`      |
| 3     | `--rio-elevation-level3` | `0 1px 3px 0`    | `0 4px 8px 3px`      |
| 4     | `--rio-elevation-level4` | `0 2px 3px 0`    | `0 6px 10px 4px`     |
| 5     | `--rio-elevation-level5` | `0 4px 4px 0`    | `0 8px 12px 6px`     |

The kit hard-codes the shadow color as black (`#000000`). Rio instead mixes the opacity into the `shadow` role (`--rio-color-shadow`), so shadows follow the theme's shadow role.

## 3. Build motion with springs

In May 2025, M3E introduced the **motion physics system**, which replaces the previous easing-and-duration system. All motion is built from springs, and a spring is defined by three values: stiffness, damping, and initial velocity.

### Structure: 2 schemes × 2 types × 3 speeds

| Axis   | Value          | Description                                                                                   |
| ------ | -------------- | --------------------------------------------------------------------------------------------- |
| scheme | **expressive** | The default; use it in most cases. Overshoots the target and bounces back.                    |
|        | standard       | For utilitarian products. Barely bounces.                                                     |
| type   | **spatial**    | Position, size, rotation, and corner radius. Overshoots the target and settles back.          |
|        | **effects**    | Color and opacity. Never overshoots.                                                          |
| speed  | fast           | Small elements, such as switches and buttons                                                  |
|        | default        | Elements that cover part of the screen, such as bottom sheets and an expanded navigation rail |
|        | slow           | Full-screen transitions                                                                       |

- **Token names don't include the scheme.** For example: `md.sys.motion.spring.fast.spatial`. The scheme is chosen at the product level and applies to every token at once, so it can be swapped without touching any token.
- Two tokens drive nearly all component motion. The spec says: "All component motion is driven by two tokens: expressive fast spatial and expressive fast effects."
- The same token resolves to different values on different devices (watch, phone, tablet). Only the relationships hold everywhere, such as fast always being faster than default.

### Web guidance

> "Use springs when possible, otherwise use curves that mimic the springs for animations without interruptions or gestures."

Animations that are never interrupted and aren't driven by gestures may use curves instead of springs. This is the official conversion table:

| Spring                     | cubic-bezier           | Duration |
| -------------------------- | ---------------------- | -------- |
| Expressive fast spatial    | 0.42, 1.67, 0.21, 0.90 | 350ms    |
| Expressive default spatial | 0.38, 1.21, 0.22, 1.00 | 500ms    |
| Expressive slow spatial    | 0.39, 1.29, 0.35, 0.98 | 650ms    |
| Expressive fast effects    | 0.31, 0.94, 0.34, 1.00 | 150ms    |
| Expressive default effects | 0.34, 0.80, 0.34, 1.00 | 200ms    |
| Expressive slow effects    | 0.34, 0.88, 0.34, 1.00 | 300ms    |
| Standard fast spatial      | 0.27, 1.06, 0.18, 1.00 | 350ms    |
| Standard default spatial   | 0.27, 1.06, 0.18, 1.00 | 500ms    |
| Standard slow spatial      | 0.27, 1.06, 0.18, 1.00 | 750ms    |
| Standard fast effects      | 0.31, 0.94, 0.34, 1.00 | 150ms    |
| Standard default effects   | 0.34, 0.80, 0.34, 1.00 | 200ms    |
| Standard slow effects      | 0.34, 0.88, 0.34, 1.00 | 300ms    |

The three standard spatial springs share one curve and differ only in duration. The effects curves are the same in both schemes.

### Raw spring values

Curves can't imitate animations that get interrupted or are driven by gestures. Those need a real spring, computed from the values below.

| Spring          | standard (damping / stiffness) | expressive (damping / stiffness) |
| --------------- | ------------------------------ | -------------------------------- |
| fast spatial    | 0.9 / 1400                     | 0.6 / 800                        |
| default spatial | 0.9 / 700                      | 0.8 / 380                        |
| slow spatial    | 0.9 / 300                      | 0.8 / 200                        |
| fast effects    | 1.0 / 3800                     | 1.0 / 3800                       |
| default effects | 1.0 / 1600                     | 1.0 / 1600                       |
| slow effects    | 1.0 / 800                      | 1.0 / 800                        |

Damping is the damping ratio: 1 settles without overshoot, and lower values bounce. The values come from `StandardMotionTokens` and `ExpressiveMotionTokens` in Jetpack Compose Material3 (token version v0_14_0, androidx commit `079e2e3`). Expressive differs from standard only in the spatial springs, which are softer and bouncier. The effects springs are identical.

### In Rio

Each token becomes three CSS variables. The names don't include the scheme.

| Variable                             | Value (expressive)                          | Use                                                                                                     |
| ------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `--rio-motion-fast-spatial`          | `350ms cubic-bezier(0.42, 1.67, 0.21, 0.9)` | Drops straight into `transition` or `animation`: `transition: transform var(--rio-motion-fast-spatial)` |
| `--rio-motion-fast-spatial-duration` | `350ms`                                     | When the duration is needed on its own                                                                  |
| `--rio-motion-fast-spatial-easing`   | `cubic-bezier(0.42, 1.67, 0.21, 0.9)`       | When the easing is needed on its own                                                                    |

- The theme picks the scheme: `applyTheme(el, { sourceColor, motion: 'standard' })`. It defaults to `'expressive'`.
- Because the names are shared, a subtree can switch schemes by overriding the variables, the same way Compose swaps the motion scheme for one element.
- The raw spring values are available from JavaScript through `getMotionSpring(scheme, token)`, for the spring solver.

## Implementation status

| Item                                               | Package   | Status                                                                                                                                  |
| -------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Color roles (2025 spec, light and dark)            | `tokens`  | Done: `createColorScheme`, `applyTheme`, `createThemeCss`                                                                               |
| Elevation levels and web shadows                   | `tokens`  | Done: `elevationVar`, `createElevationVariables`. Also included in the theme variables (`applyTheme`, `createThemeCss`).                |
| Scrim (32%)                                        | `tokens`  | To do                                                                                                                                   |
| Motion curves (official conversion table)          | `tokens`  | Done: `motionVar`, `createMotionVariables`, `getMotionCurve`. Also included in the theme variables, with the scheme chosen by `motion`. |
| Spring solver (handles interruptions and gestures) | `core`    | To do. The raw values are ready in `getMotionSpring`.                                                                                   |
| Shape (corner scale, shape morphing)               | Undecided | Spec not yet summarized                                                                                                                 |
| Typography (including emphasized styles)           | Undecided | Spec not yet summarized                                                                                                                 |

## Sources

- [M3 Elevation – Overview](https://m3.material.io/styles/elevation/overview)
- [M3 Elevation – Applying elevation](https://m3.material.io/styles/elevation/applying-elevation)
- [M3 Motion physics – How it works](https://m3.material.io/styles/motion/overview/how-it-works)
- [M3 Motion physics – Specs](https://m3.material.io/styles/motion/overview/specs)
- [M3 Color roles](https://m3.material.io/styles/color/roles)
- Material 3 Design Kit (Figma Community): the `M3/Elevation Light` and `M3/Elevation Dark` effect styles
- [Compose Material3 `ElevationTokens.kt`](https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ElevationTokens.kt)
- [Compose Material3 `StandardMotionTokens.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/StandardMotionTokens.kt)
- [Compose Material3 `ExpressiveMotionTokens.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ExpressiveMotionTokens.kt)
- [Compose Material3 `MotionScheme.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt): interface only
