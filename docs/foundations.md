# Rio Foundations: M3E Core Principles

This document summarizes the Material 3 Expressive (M3E) foundations that Rio follows: two ways to express hierarchy, motion, shape, and typography. Each section cites Google's official spec and notes how Rio implements it.

> Last verified: 2026-11-11. Sources are listed at the end. Update this document when the spec changes.

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

## 4. Shape corners with a radius scale

> "Material components use a corner radius scale to define all rectangular shapes, such as buttons, carousels, and dialogs."

### The scale

The scale has ten steps, named for how rounded the corner is. Three of them (`large-increased`, `extra-large-increased`, `extra-extra-large`) are new in M3E.

| Step                  | Radius        | Rio CSS variable                           |
| --------------------- | ------------- | ------------------------------------------ |
| none                  | 0dp           | `--rio-shape-corner-none`                  |
| extra-small           | 4dp           | `--rio-shape-corner-extra-small`           |
| small                 | 8dp           | `--rio-shape-corner-small`                 |
| medium                | 12dp          | `--rio-shape-corner-medium`                |
| large                 | 16dp          | `--rio-shape-corner-large`                 |
| large-increased       | 20dp          | `--rio-shape-corner-large-increased`       |
| extra-large           | 28dp          | `--rio-shape-corner-extra-large`           |
| extra-large-increased | 32dp          | `--rio-shape-corner-extra-large-increased` |
| extra-extra-large     | 48dp          | `--rio-shape-corner-extra-extra-large`     |
| full                  | Fully rounded | `--rio-shape-corner-full` (`9999px`)       |

### Asymmetric shapes

- Components can use different values for different corners, from the same scale. Closely grouped items, such as menus and split buttons, use this for their **inner corners**.
- The spec's partial tokens (`extra-small-top`, `large-start`, `large-end`, `large-top`, `extra-large-top`) need no extra variables in Rio. Set individual corners with logical properties such as `border-start-start-radius`, so the shapes also flip correctly in right-to-left layouts.

### Customizing

The spec allows two levels of customization:

1. **Resize a step.** Every component mapped to that step follows. In Rio: `applyTheme(el, { sourceColor, shapes: { medium: 16 } })`. Only the eight middle steps can be resized; `none` and `full` are fixed, as in Compose's `Shapes`.
2. **Remap a component** to a different step, for example buttons from `full` to `small`. In Rio, this will be a component-level variable defined with each component.

### Rules

- **Optical roundness**: when nesting rounded shapes, don't reuse the outer radius. Use _outer radius − padding = inner radius_ (for example, 48dp − 14dp = 34dp).
- Don't apply large or full corners to information-dense components such as cards.
- **Animating `full`**: `9999px` works for static shapes but animates badly. A transition from `9999px` to `12px` stays fully round until the very end. Components that morph between `full` and another step must use half their height instead.

### Not covered: the shape library and shape morph

M3 also has a library of expressive shapes that morph into each other, used by the button group and the loading indicator. The spec says "Web is not currently available"; it exists only as a Compose API. It is out of scope for v0.1. The press effect on M3E buttons is a corner radius animation, which CSS handles.

## 5. Set text with a type scale

> "Material 3 has one type scale containing two sets of type styles: 15 baseline and 15 emphasized."

### The scale

Values are in px (the spec writes pt). Rio emits them in rem: 16px = 1rem.

| Style           | Typeface | Size / line height | Weight (baseline → emphasized) | Tracking |
| --------------- | -------- | ------------------ | ------------------------------ | -------- |
| display-large   | brand    | 57 / 64            | 400 → 500                      | -0.25    |
| display-medium  | brand    | 45 / 52            | 400 → 500                      | 0        |
| display-small   | brand    | 36 / 44            | 400 → 500                      | 0        |
| headline-large  | brand    | 32 / 40            | 400 → 500                      | 0        |
| headline-medium | brand    | 28 / 36            | 400 → 500                      | 0        |
| headline-small  | brand    | 24 / 32            | 400 → 500                      | 0        |
| title-large     | brand    | 22 / 28            | 400 → 500                      | 0        |
| title-medium    | plain    | 16 / 24            | 500 → 700                      | 0.15     |
| title-small     | plain    | 14 / 20            | 500 → 700                      | 0.1      |
| body-large      | plain    | 16 / 24            | 400 → 500                      | 0.5      |
| body-medium     | plain    | 14 / 20            | 400 → 500                      | 0.25     |
| body-small      | plain    | 12 / 16            | 400 → 500                      | 0.4      |
| label-large     | plain    | 14 / 20            | 500 → 700                      | 0.1      |
| label-medium    | plain    | 12 / 16            | 500 → 700                      | 0.5      |
| label-small     | plain    | 11 / 16            | 500 → 700                      | 0.5      |

Today the emphasized set differs from the baseline only in weight. The spec mentions "other minor adjustments", so check this table again when the tokens change.

### Emphasized styles

- New in M3E. Use them for selection, actions, headlines, and other editorial emphasis, together with the baseline styles.
- **Components don't use emphasized styles by default.** To emphasize something, swap in the emphasized token of the same style: `md.sys.typescale.display-large` → `md.sys.typescale.emphasized.display-large`.
- They work well for badges, buttons for primary actions, extended FABs, and selected list and menu items.

### Typefaces

- `brand` sets the larger styles (display, headline, title-large) for expression. `plain` sets the rest for readability.
- Both default to Roboto. Rio's default value is `Roboto, system-ui, sans-serif`. Rio doesn't load any font itself; load Roboto in the app, or the system font is used.
- Override with `applyTheme(el, { sourceColor, typefaces: { brand: '"Roboto Flex", sans-serif' } })`.

### In Rio

Each style becomes six CSS variables, and the emphasized set uses the spec's `emphasized` segment:

| Variable                                                     | Value                                            | Use                                          |
| ------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------- |
| `--rio-typescale-label-large`                                | `500 0.875rem/1.25rem var(--rio-typeface-plain)` | Drops straight into `font`                   |
| `--rio-typescale-label-large-tracking`                       | `0.00625rem`                                     | `letter-spacing`, which `font` doesn't cover |
| `--rio-typescale-label-large-{font,size,line-height,weight}` |                                                  | Individual properties                        |
| `--rio-typescale-emphasized-label-large…`                    | `700 0.875rem/1.25rem …`                         | The same six for the emphasized set          |

Sizes, line heights, and tracking are in rem so text follows the user's font size setting, as Android's sp does.

### Not implemented yet: language height

> "Ignoring language height can lead to overlapping text and broken UI elements, leading to major internationalization issues and failing readability standards."

The type scale adapts line heights to the height of the script being set. The spec defines four categories:

| Category     | Line height vs. small | Scripts                                                                                                                                                                                  |
| ------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Small (base) | —                     | Cyrillic, Greek, Hebrew, Latin-based languages (except Vietnamese)                                                                                                                       |
| Medium       | ~7% taller            | Amharic, Arabic, Armenian, Bangla, Chinese, Gujarati, Hindi, Japanese, Kannada, Khmer, Korean, Lao, Malayalam, Odia, Punjabi, Sinhala, Tamil, Thai, Vietnamese, and most other languages |
| Large        | ~30% taller           | Burmese, Telugu                                                                                                                                                                          |
| Extra large  | ~100% taller          | Nastaliq                                                                                                                                                                                 |

What the spec asks for:

- **Default to medium**, because most languages fall into it, and switch categories based on the detected language.
- **Components with vertical padding** should adapt automatically: their height follows the line height.
- **Components with fixed heights** are built for the small values and may not adapt by default. Each such component needs a deliberate decision.

What's missing:

- The percentages above are approximate. The exact line-height tokens per category sit behind a "language height context" switch at the top of the token module on the spec page, and the default view shows only small.
- Material Web's generated tokens don't include them either. Its files are built for one context, with no language-height tag.
- Rio currently emits only the small (base) values. Its defaults are therefore too tight for Korean, Chinese, Japanese, and most other non-Latin text.

Planned approach:

1. Read the exact values by switching the context on the spec page in a headless browser. Don't derive them by multiplying by 1.07; the spec's tokens are rounded per style.
2. Emit the line heights per category and select them with `:lang()`, for example `:lang(ko, ja, zh) { --rio-typescale-body-large-line-height: …; }`. Any element can then opt in by setting `lang`, which pages should set anyway.
3. Decide the default the spec recommends (medium) versus Latin-first (small), and make it a theme option.
4. Audit fixed-height components (buttons, chips, text fields) against the medium and large categories once they exist.

### Not implemented yet: variable font axes

> "Static fonts like Roboto are currently applied by default to all Material 3 components. Variable fonts like Roboto Flex have many more axes for expression, but aren't yet part of the M3 typescale."

The token tables still list axis values for every style. The pattern across all 30 styles:

| Axis                                           | Value                                                                                                                           | Meaning                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `wght`                                         | Same as the static weight, **except 600 where the static weight is 700** (emphasized title-medium, title-small, and all labels) | Weight                                                                     |
| `wdth`                                         | 100                                                                                                                             | Width (normal)                                                             |
| `opsz`                                         | The font size in px (57 for display-large, 11 for label-small)                                                                  | Optical size                                                               |
| `GRAD`, `ROND`, `CRSV`, `slnt`, `FILL`, `HEXP` | 0                                                                                                                               | Grade, roundness, cursive, slant, fill, and hexp (unexplained in the spec) |

Related guidance from the fonts page:

- Roboto Flex has slant, width, weight, grade, and optical size axes, plus advanced axes: thick stroke (`XOPQ`), thin stroke (`YOPQ`), counter width (`XTRA`), uppercase height (`YTUC`), lowercase height (`YTLC`), ascender height (`YTAS`), descender depth (`YTDE`), and figure height (`YTFI`).
- **Fallback order** for variable fonts: Roboto Flex → Roboto → the Noto Sans collection. Roboto Flex covers only Latin, Greek, and Cyrillic, so Korean and other scripts fall through to Noto Sans.

Planned approach, once Rio supports variable fonts:

1. Treat it as a separate mode, not a tweak of the static one. The `wght` 600 vs. weight 700 difference means a variable-font theme needs its own weights.
2. Emit a `--rio-typescale-<style>-axes` variable per style for `font-variation-settings`, and use `font-optical-sizing: auto` where the font supports `opsz`.
3. Reconsider Rio's default typeface stack. It is `Roboto, system-ui, sans-serif` today, and the spec's fallback guidance suggests adding Noto Sans before the system font.

### Sources and cross-checks

- The values come from Material Web's generated tokens (Material 3 v34.0.21, platform web), and they match the expanded token tables on m3.material.io.
- Compose's `TypeScaleTokens` (v0_103) disagrees on several tracking values. It has -0.2 for display-large, 0.2 for title-medium and body-medium, and different emphasized tracking. It appears to be rounded or out of date, so Rio doesn't use it for typography.
- The same Material Web tokens confirm Rio's shape scale (including `full` as `9999px`), the elevation levels, and the standard motion springs.

## Implementation status

| Item                                               | Package  | Status                                                                                                                                                                  |
| -------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color roles (2025 spec, light and dark)            | `tokens` | Done: `createColorScheme`, `applyTheme`, `createThemeCss`                                                                                                               |
| Elevation levels and web shadows                   | `tokens` | Done: `elevationVar`, `createElevationVariables`. Also included in the theme variables (`applyTheme`, `createThemeCss`).                                                |
| Scrim (32%)                                        | `tokens` | To do                                                                                                                                                                   |
| Motion curves (official conversion table)          | `tokens` | Done: `motionVar`, `createMotionVariables`, `getMotionCurve`. Also included in the theme variables, with the scheme chosen by `motion`.                                 |
| Spring solver (handles interruptions and gestures) | `core`   | To do. The raw values are ready in `getMotionSpring`.                                                                                                                   |
| Shape: corner radius scale                         | `tokens` | Done: `shapeVar`, `createShapeVariables`. Also included in the theme variables, with step sizes overridable through `shapes`.                                           |
| Shape: shape library and morphing                  | —        | Not planned for v0.1. The spec lists it as unavailable on the web.                                                                                                      |
| Typography: baseline and emphasized type scales    | `tokens` | Done: `typescaleVar`, `typefaceVar`, `createTypographyVariables`, `getTypeStyle`. Also included in the theme variables, with typefaces overridable through `typefaces`. |
| Typography: language height, variable font axes    | `tokens` | Not yet. See section 5.                                                                                                                                                 |

## Sources

- [M3 Elevation – Overview](https://m3.material.io/styles/elevation/overview)
- [M3 Elevation – Applying elevation](https://m3.material.io/styles/elevation/applying-elevation)
- [M3 Motion physics – How it works](https://m3.material.io/styles/motion/overview/how-it-works)
- [M3 Motion physics – Specs](https://m3.material.io/styles/motion/overview/specs)
- [M3 Color roles](https://m3.material.io/styles/color/roles)
- [M3 Shape – Corner radius scale](https://m3.material.io/styles/shape/corner-radius-scale)
- [M3 Shape – Shape morph](https://m3.material.io/styles/shape/shape-morph)
- Material 3 Design Kit (Figma Community): the `M3/Elevation Light` and `M3/Elevation Dark` effect styles
- [Compose Material3 `ElevationTokens.kt`](https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ElevationTokens.kt)
- [Compose Material3 `StandardMotionTokens.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/StandardMotionTokens.kt)
- [Compose Material3 `ExpressiveMotionTokens.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ExpressiveMotionTokens.kt)
- [Compose Material3 `MotionScheme.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt): interface only
- [Compose Material3 `ShapeTokens.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ShapeTokens.kt)
- [Compose Material3 `Shapes.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Shapes.kt): interface only
- [M3 Typography – Type scale & tokens](https://m3.material.io/styles/typography/type-scale-tokens)
- [M3 Typography – Fonts](https://m3.material.io/styles/typography/fonts)
- [Material Web `tokens/versions/latest` @ d872455](https://github.com/material-components/material-web/tree/d872455c4be56022da2095349b30ef46e0b55bc3/tokens/versions/latest/sass): `_md-sys-typescale.scss`, `_md-sys-typescale-emphasized.scss`, `_md-ref-typeface.scss`, plus `_md-sys-shape.scss`, `_md-sys-elevation.scss`, and `_md-sys-motion.scss` for cross-checks
