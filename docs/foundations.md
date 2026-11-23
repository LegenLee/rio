# Rio Foundations: M3E Core Principles

This document summarizes the Material 3 Expressive (M3E) foundations that Rio follows: two ways to express hierarchy, motion, shape, typography, and interaction states. Every section separates three kinds of statements:

- **Spec**: token values and normative definitions from Google. This means the token tables on m3.material.io and the tokens generated from the same source for Material Web and Jetpack Compose.
- **Recommendations**: guidance prose on m3.material.io, such as dos, don'ts, and "should". Rio's components follow it where it applies, but it doesn't change Rio's defaults by itself.
- **In Rio**: what Rio decides on top, usually because the web needs something the spec leaves to each platform.

**Rio's defaults follow the spec.** Recommendations become options or component-level practice. Where the spec is silent, the "In Rio" part says what Rio chose and why.

> Last verified: 2026-11-11. Sources are listed at the end. Update this document when the spec changes.

## 1. Use contrast for hierarchy within a page

### Spec

> "By default, Material 3's surfaces use tonal difference to indicate separation."

Regions within a page are separated by the tonal difference between surface colors, not by shadows. The tools are the surface roles:

| Role                      | Use                                       |
| ------------------------- | ----------------------------------------- |
| surface                   | Backgrounds and large, low-emphasis areas |
| surface container lowest  | Lowest-emphasis container                 |
| surface container low     | Low-emphasis container                    |
| surface container         | Default container                         |
| surface container high    | High-emphasis container                   |
| surface container highest | Highest-emphasis container                |

The container role names describe **emphasis, not height**: "These roles are not tied to elevation."

### Recommendations

- Give overlapping regions or components different roles.
- The most common pairing is `surface` for the body and `surface container` for navigation.
- Keep each region's role the same across window sizes. Larger screens may add other container roles, as long as they are applied consistently.
- Give the edges of interactive elements at least 3:1 contrast against their background. Use `outline` for those edges, not `outline-variant`.
- Use a shadow within a page only to **protect** an element on a busy background (a pattern or photo behind cards, chips, or buttons), or to **lift** an element briefly during an interaction such as focus, selection, or swipe.

### In Rio

- Every color role is a CSS variable named after the role in kebab-case: surface container high → `--rio-color-surface-container-high`. All 53 roles come from MCU's 2025 color spec (`createColorScheme`).
- Light and dark values are combined with `light-dark()`, so the `color-scheme` of the element using a variable picks one.

## 2. Use elevation for layers that float above

### Spec

Elevation is the distance between two surfaces on the z-axis. Every component has an elevation value, not just floating ones. Elevation can be depicted in three ways:

1. **Tonal difference**: the default, covered in section 1.
2. **Shadow**: a small, sharp shadow reads as close; a large, soft one reads as far.
3. **Scrim**: placed beneath modals and expanded navigation to focus attention. It uses the `scrim` color role at **32% opacity**.

| Level | Height | Use                                             |
| ----- | ------ | ----------------------------------------------- |
| 0     | 0dp    | Resting                                         |
| 1     | 1dp    | Resting                                         |
| 2     | 3dp    | Resting                                         |
| 3     | 6dp    | Resting                                         |
| 4     | 8dp    | Interaction states only, such as hover and drag |
| 5     | 12dp   | Interaction states only, such as hover and drag |

- Every component has a default (resting) level.
- On hover, all Material buttons rise one level. A FAB rests at level 3 and rises to level 4.

> "Tokens have no shadows or color; each platform determines the specific shadows and values to use at each elevation level."

A level's dp value only says how far an element sits above the surface below it. It doesn't define the shadow's shape: offset, blur, spread, opacity, or number of layers. Android's light model computes a shadow from the elevation. On the web, `box-shadow` needs every one of those numbers written out.

### Recommendations

- Don't change a component's default level.
- Change levels only in response to system events or user interaction, and do it consistently across similar elements.
- Use shadows sparingly ("less is more"). Keep the number of levels on a screen small.

### In Rio

- **Shadows come from the M3 Figma Design Kit**, because the spec leaves them to each platform. The kit is Google's design reference, not a token source. Rio uses its `M3/Elevation Light/1–5` and `M3/Elevation Dark/1–5` effect styles. Their light and dark values are identical (only the layer order differs), and each level has two layers:

  | Level | Rio CSS variable         | Key shadow (30%) | Ambient shadow (15%) |
  | ----- | ------------------------ | ---------------- | -------------------- |
  | 0     | `--rio-elevation-level0` | None             | None                 |
  | 1     | `--rio-elevation-level1` | `0 1px 2px 0`    | `0 1px 3px 1px`      |
  | 2     | `--rio-elevation-level2` | `0 1px 2px 0`    | `0 2px 6px 2px`      |
  | 3     | `--rio-elevation-level3` | `0 1px 3px 0`    | `0 4px 8px 3px`      |
  | 4     | `--rio-elevation-level4` | `0 2px 3px 0`    | `0 6px 10px 4px`     |
  | 5     | `--rio-elevation-level5` | `0 4px 4px 0`    | `0 8px 12px 6px`     |

- The kit hard-codes the shadow color as black (`#000000`). Rio mixes the opacity into the `shadow` role (`--rio-color-shadow`) instead, so shadows follow the theme.
- The scrim isn't implemented yet.

## 3. Build motion with springs

### Spec

In May 2025, M3E introduced the **motion physics system**, which replaces the easing-and-duration system. All motion is built from springs, each defined by stiffness, damping, and initial velocity. There are 2 schemes × 2 types × 3 speeds:

| Axis   | Value      | Description                                                                                   |
| ------ | ---------- | --------------------------------------------------------------------------------------------- |
| scheme | expressive | Overshoots the target and bounces back                                                        |
|        | standard   | Eases into the target with minimal bounce                                                     |
| type   | spatial    | Position, size, rotation, and corner radius. Overshoots the target and settles back.          |
|        | effects    | Color and opacity. Never overshoots.                                                          |
| speed  | fast       | Small elements, such as switches and buttons                                                  |
|        | default    | Elements that cover part of the screen, such as bottom sheets and an expanded navigation rail |
|        | slow       | Full-screen transitions                                                                       |

- **Token names don't include the scheme**, for example `md.sys.motion.spring.fast.spatial`. The scheme is chosen at the product level and applies to every token at once, so it can be swapped without touching any token.
- "All component motion is driven by two tokens: expressive fast spatial and expressive fast effects."
- The same token resolves to different values on different devices (watch, phone, tablet). Only the relationships hold everywhere, such as fast always being faster than default.

**Raw spring values.** Damping is the damping ratio: 1 settles without overshoot, and lower values bounce.

| Spring          | standard (damping / stiffness) | expressive (damping / stiffness) |
| --------------- | ------------------------------ | -------------------------------- |
| fast spatial    | 0.9 / 1400                     | 0.6 / 800                        |
| default spatial | 0.9 / 700                      | 0.8 / 380                        |
| slow spatial    | 0.9 / 300                      | 0.8 / 200                        |
| fast effects    | 1.0 / 3800                     | 1.0 / 3800                       |
| default effects | 1.0 / 1600                     | 1.0 / 1600                       |
| slow effects    | 1.0 / 800                      | 1.0 / 800                        |

Expressive differs from standard only in the spatial springs, which are softer and bouncier. The effects springs are identical.

**Curves for the web.** The spec publishes a table that converts each spring into a cubic-bezier curve:

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

### Recommendations

- Use the **expressive** scheme for most products, especially hero moments and key interactions. Use **standard** for utilitarian products.
- Most motion in a product should use the same scheme. Swapping the scheme for one element is an advanced customization for key moments.
- On the web: "Use springs when possible, otherwise use curves that mimic the springs for animations without interruptions or gestures."

### In Rio

Each token becomes three CSS variables. The names don't include the scheme.

| Variable                              | Value (expressive)                          | Use                                                                                                     |
| ------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `--rio-motion-fast-spatial`           | `350ms cubic-bezier(0.42, 1.67, 0.21, 0.9)` | Drops straight into `transition` or `animation`: `transition: transform var(--rio-motion-fast-spatial)` |
| `--rio-motion-fast-spatial-duration`  | `350ms`                                     | When the duration is needed on its own                                                                  |
| `--rio-motion-fast-spatial-easing`    | `cubic-bezier(0.42, 1.67, 0.21, 0.9)`       | When the easing is needed on its own                                                                    |
| `--rio-motion-fast-spatial-damping`   | `0.6`                                       | The raw spring, for the spring solver                                                                   |
| `--rio-motion-fast-spatial-stiffness` | `800`                                       | The raw spring, for the spring solver                                                                   |

- The theme picks the scheme: `createRio({ theme: { sourceColor, motion: 'standard' } })`.
- **Rio defaults to `'expressive'`.** The spec itself names no default scheme. Rio follows the recommendation here because it is an M3E library.
- Because the names are shared, a subtree can switch schemes by overriding the variables, the same way Compose swaps the motion scheme for one element.
- **The standard spatial springs are always there too**, whatever the theme's scheme: `--rio-motion-standard-{fast|default|slow}-spatial-{damping|stiffness}`. A few components use the standard scheme by spec, such as the split button's menu icon, and read these.
- **Curves** serve uninterrupted animations, as CSS transitions.
- **Springs** serve interrupted and gesture-driven animations. `@rio-m3e/core` solves them:
  - `solveSpring(params, from, to, velocity, t)` gives the exact position and velocity at any moment, in closed form, for underdamped, critically damped, and overdamped springs with unit mass, as in Compose.
  - `createSpring()` animates a number with `requestAnimationFrame`. A new target takes over from the current position and velocity, so an interrupted press reverses without a jolt.
  - `readSpringParams(el, token)` reads a token's spring from the element's `-damping` and `-stiffness` variables. Reading from CSS lets a subtree that swaps schemes change its springs too, and keeps `core` independent of `tokens`.
  - `attachSpringProperty(el, { target, apply })` is the general form. The stylesheet declares a target length or angle for each state in a registered custom property, and the spring follows it whenever it changes. The stylesheet also gives the target an instant transition, so while the element is rendered the browser reports every change as a transition event, whatever caused it: a state attribute, `:hover`, a theme applied after the components mounted, or a change of position in a group. A change made while the element isn't rendered is caught up when it shows again. So the spring starts from what is on screen. If the app's CSS replaces the element's `transition` list, the spring stays still and the stylesheet's value shows; to add transitions to a Rio element that springs, end the list with `var(--rio-spring-targets)`, for example `transition: opacity 200ms, var(--rio-spring-targets)`. Those elements are the button, the icon button, the switch, and the split button's two buttons (`.rio-split-button__leading` and `.rio-split-button__trailing`). Don't use it anywhere else, such as on a button group or on the split button's root: the variable isn't defined there, so the whole `transition` declaration would be dropped. A drag can take over with `hold()` and hand back with `release(velocity)`.
  - A theme applied after the components mounted moves their targets once, so shapes spring into place at load. Apply the theme before mounting (`createRio`, which writes it as the app installs Rio, or `createThemeCss` in a stylesheet) to avoid it.
  - `attachCornerMorph(el)` uses it for the corner radius, toward the `--rio-corner-morph-target` its stylesheet declares (`@rio-m3e/styles/base/corner-morph.css`). The start and end sides spring separately, so a stylesheet can give them different targets (`--rio-corner-morph-start-target` and `-end-target`), as the connected button group does; with `axis: 'block'`, the sides are the top and the bottom, as for a segmented list's ends. The button uses it for its press and selection shapes.
  - The button group uses `createSpring` directly for the pressed button's width and its neighbors'.
  - The switch uses it for its handle's position and size, and `attachDrag` lets touch and pen drag the handle. The spring then starts at the finger's speed.
  - The split button uses it for its menu icon's turn and offset, on the standard scheme's `fast-spatial` spring.
- In JavaScript, `getMotionSpring(scheme, token)` and `getMotionCurve(scheme, token)` from `@rio-m3e/tokens` return the same values.

### Reduced motion

**Spec**: none found. The M3 pages Rio has read don't define what happens when the user asks the OS to reduce motion. Those pages are the motion physics pages, easing and duration, transitions, and the accessibility, designing, usability, and building-for-all foundations. The closest is a recommendation on the usability page: "use it sparingly since motion can be distracting."

**In Rio**: under `prefers-reduced-motion: reduce`, **spatial motion becomes instant and effects motion stays**.

- Spatial motion moves things: position, size, rotation, and corner radius. Movement and overshoot are what reduced motion is meant to prevent, so they go.
- Effects motion changes color and opacity. Short fades don't cause that discomfort, so they stay. This matches iOS's Reduce Motion, which keeps crossfades. Android's "Remove animations" goes further and drops everything.
- Switching to the standard scheme was considered and rejected. Standard still moves and still overshoots slightly (y 1.06), and the spec presents it as a product style, not an accessibility mode.
- **Implementation**: `@rio-m3e/styles/base/reduced-motion.css` sets the three spatial tokens and their `-duration` parts to `0ms` on every element, with `!important`. That beats the inline theme variables and any subtree that swaps schemes. Components that use motion tokens import it. In JavaScript, `prefersReducedMotion()` from `@rio-m3e/core` applies the same rule: the ripple skips the growing wave and keeps the fade, `attachCornerMorph` jumps straight to its target, and a wavy progress indicator's wave holds still.
- **Indeterminate indicators keep moving**: the progress indicators and the loading indicator. That movement is what says the process is going on, so taking it away would take away what they mean. The loading indicator's morphs stop overshooting.

## 4. Shape corners with a radius scale

### Spec

> "Material components use a corner radius scale to define all rectangular shapes, such as buttons, carousels, and dialogs."

The scale has ten steps, named for how rounded the corner is. Three of them (`large-increased`, `extra-large-increased`, `extra-extra-large`) are new in M3E.

| Step                  | Radius        |
| --------------------- | ------------- |
| none                  | 0dp           |
| extra-small           | 4dp           |
| small                 | 8dp           |
| medium                | 12dp          |
| large                 | 16dp          |
| large-increased       | 20dp          |
| extra-large           | 28dp          |
| extra-large-increased | 32dp          |
| extra-extra-large     | 48dp          |
| full                  | Fully rounded |

- Shapes can be symmetric, or asymmetric with different steps per corner. Closely grouped items, such as menus and split buttons, use asymmetric **inner corners**.
- Partial tokens exist for common asymmetric shapes: `extra-small-top`, `large-start`, `large-end`, `large-top`, `extra-large-top`.
- Shapes can be customized at two levels: **resize a step**, so every component mapped to it follows, or **remap a component** to another step (for example, buttons from `full` to `small`).
- M3 also has a library of expressive shapes that morph into each other, used by the button group and the loading indicator. For the web, the spec says: "Web is not currently available."

### Recommendations

- **Optical roundness**: when nesting rounded shapes, don't reuse the outer radius. Use _outer radius − padding = inner radius_ (for example, 48dp − 14dp = 34dp).
- Don't apply large or full corners to information-dense components such as cards.
- Use the shape library sparingly, for mostly visual elements rather than text-heavy containers.

### In Rio

- Each step is a CSS variable: `--rio-shape-corner-<step>`, for example `--rio-shape-corner-medium`.
- `full` is `9999px`, the same value as Material Web's token. It works for static shapes but animates badly: a transition from `9999px` to `12px` stays fully round until the very end. Components that morph between `full` and another step must use half their height instead.
- The partial tokens need no extra variables. Components set individual corners with logical properties such as `border-start-start-radius`, so shapes also flip correctly in right-to-left layouts.
- **Resizing a step**: `createRio({ theme: { sourceColor, shapes: { medium: 16 } } })`. Only the eight middle steps can be resized; `none` and `full` are fixed, as in Compose's `Shapes`.
- **Remapping a component** will be a component-level variable, defined with each component.
- The press effect on M3E buttons is a corner radius animation, which CSS handles.

#### The shape library and shape morphing

The spec has no web version, so Rio ports Google's own: androidx graphics-shapes, the engine behind Compose's shapes, and Compose Material3's `MaterialShapes`, at androidx `079e2e3`. It is in `@rio-m3e/core`, and the loading indicator is built on it.

- **The 35 shapes by name**: `materialShape('cookie-9-sided')`, with the names in `MATERIAL_SHAPES`. Shapes of your own come from `roundedPolygon`, `circlePolygon`, `rectanglePolygon`, `starPolygon`, `pillPolygon`, `pillStarPolygon`, and `polygonFromFeatures`, or from an SVG path with `featuresFromSvgPath`. `serializeFeatures` and `parseFeatures` keep a shape's features as text.
- **Morphs**: `createMorph(start, end)` gives the shape in between at any progress, as cubics (`cubics(progress)`), and `cubicsPath(cubics)` writes cubics as SVG path data, for a `<path>`'s `d` or CSS's `path()`.
- **Plain data and functions** (Rio's choice): a polygon is a plain object and a cubic a tuple of eight numbers, and where the original has classes and methods, Rio has functions, such as `transformPolygon`, `normalizePolygon`, and `polygonBounds`. Inside, the port keeps the original's structure.
- **Checked against the original**: the tests compare the port with what the original library returns on the JVM, within 1e-4, for the shape functions with a range of options, the 35 shapes, morphs (the loading indicator's frame by frame), SVG paths, and serialization. See [conventions.md](conventions.md).
- **It differs from Android** where Android's 32-bit numbers or the original's bugs change the outcome. Rio computes in 64 bits without imitating 32-bit rounding, and follows what the original's code and comments mean:
  - A morph can pair two shapes' corners differently where two candidates are equal in theory: in 32 bits they come out equal and the original keeps their order, while in 64 bits rounding tells them apart. The start and end shapes are the same, but the shapes in between differ, as from a triangle to a square.
  - A corner on a straight line between its neighbors, as two of the pixel circle's, is convex or not by rounding, and a morph pairs it accordingly, so the shapes in between can differ, as from a heart to a pixel circle.
  - A 90° SVG arc becomes 2 cubics, as the original's comment means; Android's comes out a little over 90° and takes 3.
  - `pillStarPolygon` with a `startLocation` above 0 places the vertices past the start where they belong.
  - `featuresFromSvgPath` keeps the last side of the first shape in a path of several; turns quadratic curves (`Q`, `T`) into cubics exactly, as SVG defines them; reflects a `T` or `S` after `Z` from the current point; keeps the first corner of a path that starts with an empty segment; and finds corners and their convexity by how the path turns, also where a curve's control points sit on its ends, as when a tool draws a straight line as a curve.
  - `serializeFeatures` writes numbers in full and never with an exponent, which the original's `parseFeatures` would misread.

## 5. Set text with a type scale

### 5.1 The type scale

#### Spec

> "Material 3 has one type scale containing two sets of type styles: 15 baseline and 15 emphasized."

Values are in px (the spec writes pt).

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

- The emphasized set is new in M3E. Today its tokens differ from the baseline only in weight, although the prose mentions "other minor adjustments". Check this table again when the tokens change.
- "Material components don't use emphasized type styles by default." To emphasize something, swap in the emphasized token of the same style: `md.sys.typescale.display-large` → `md.sys.typescale.emphasized.display-large`.

#### Recommendations

- Use emphasized styles for selection, actions, headlines, and other editorial emphasis, together with the baseline styles.
- They work well for badges, buttons for primary actions, extended FABs, and selected list and menu items, and on text that already uses a heavier weight.

#### In Rio

Each style becomes six CSS variables, and the emphasized set uses the spec's `emphasized` segment:

| Variable                                                     | Value                                            | Use                                          |
| ------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------- |
| `--rio-typescale-label-large`                                | `500 0.875rem/1.25rem var(--rio-typeface-plain)` | Drops straight into `font`                   |
| `--rio-typescale-label-large-tracking`                       | `0.00625rem`                                     | `letter-spacing`, which `font` doesn't cover |
| `--rio-typescale-label-large-{font,size,line-height,weight}` |                                                  | Individual properties                        |
| `--rio-typescale-emphasized-label-large…`                    | `700 0.875rem/1.25rem …`                         | The same six for the emphasized set          |

- Sizes, line heights, and tracking are emitted in **rem** (16px = 1rem), so text follows the user's font size setting, as Android's sp does. The spec defines no web unit; Material Web makes the same choice.
- Components use the baseline styles, as the spec says. Each component decides where emphasis applies.

### 5.2 Typefaces

#### Spec

- Both typefaces are `Roboto` (`md.ref.typeface.brand` and `md.ref.typeface.plain`).
- `brand` sets the larger styles (display, headline, title-large) for expression. `plain` sets the rest for readability.

#### Recommendations

- Consider replacing Roboto to strengthen brand expression, especially on emphasized styles.

#### In Rio

- **The default value is `Roboto, system-ui, sans-serif`.** The fallbacks aren't in the spec. They are there because Roboto may not be loaded on the web, and CSS expects a generic family at the end of `font-family`.
- Rio doesn't load any font itself. Load Roboto in the app; otherwise the system font is used.
- Override with `createRio({ theme: { sourceColor, typefaces: { brand: '"Roboto Flex", sans-serif' } } })`.

### 5.3 Language height

#### Spec

The type scale adapts line heights to the height of the script being set, in four categories:

| Category     | Scripts                                                                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Small (base) | Cyrillic, Greek, Hebrew, Latin-based languages (except Vietnamese)                                                                                                                       |
| Medium       | Amharic, Arabic, Armenian, Bangla, Chinese, Gujarati, Hindi, Japanese, Kannada, Khmer, Korean, Lao, Malayalam, Odia, Punjabi, Sinhala, Tamil, Thai, Vietnamese, and most other languages |
| Large        | Burmese, Telugu                                                                                                                                                                          |
| Extra large  | Nastaliq                                                                                                                                                                                 |

The page calls medium "~7% taller", large "~30%", and extra large "~100%". The tokens behind them, `md.ref.typeface.<style>.line-height` under the `language.height` context, are rounded per style and don't keep to those ratios: medium is 14% taller for display-large and 8% for display-medium. In px:

| Style           | Small | Medium | Large | Extra large |
| --------------- | ----- | ------ | ----- | ----------- |
| display-large   | 64    | 73     | 89    | 120         |
| display-medium  | 52    | 56     | 71    | 99          |
| display-small   | 44    | 47     | 57    | 80          |
| headline-large  | 40    | 42     | 50    | 75          |
| headline-medium | 36    | 38     | 45    | 66          |
| headline-small  | 32    | 35     | 41    | 59          |
| title-large     | 28    | 31     | 36    | 53          |
| title-medium    | 24    | 27     | 31    | 42          |
| title-small     | 20    | 23     | 26    | 36          |
| body-large      | 24    | 27     | 31    | 41          |
| body-medium     | 20    | 23     | 26    | 35          |
| body-small      | 16    | 18     | 21    | 30          |
| label-large     | 20    | 23     | 26    | 36          |
| label-medium    | 16    | 18     | 21    | 30          |
| label-small     | 16    | 18     | 21    | 29          |

- The small values are the type scale's own (section 5.1). The `md.sys.typescale` tokens, baseline and emphasized, carry no language height context.
- "Material components that use vertical padding should adapt to language height automatically. Components with fixed heights are built for small values and may not adapt by default."
- The values come from the typography token data that the spec page loads (`TYPOGRAPHY.<id>.json`, revision of 2026-11-19); the page's own context switch didn't change the module in a headless browser. Material Web's generated tokens are built for one context, with no language height.

#### Recommendations

> "Ignoring language height can lead to overlapping text and broken UI elements, leading to major internationalization issues and failing readability standards."

- Default to the medium category, because most languages fall into it, and switch categories based on the detected language.

#### In Rio

- **The theme takes a category**, `languageHeight` (`'small'`, `'medium'`, `'large'`, or `'extra-large'`), and writes its line heights into the `-line-height` variables and the `font` shorthands alike, baseline and emphasized. Without one, the small values (Rio's choice: the spec's tokens, where the recommendation says medium).
- **`createRio` picks it from the app's language** unless the theme gives one: `createRio`'s `locale`, or else the document's `lang`, or else the browser's language, as for the components' text. `languageHeightOf(locale)` in `@rio-m3e/tokens` does it, by the script `Intl.Locale` gives the language: Latin (except Vietnamese), Greek, Cyrillic, and Hebrew are small; Burmese (`Mymr`) and Telugu (`Telu`) large; Nastaliq (`Aran`) extra large; any other script medium. A language whose script `Intl` doesn't know is small, as on a server without the app's language (Rio's choice: the spec's tokens, where the recommendation defaults to medium).
- **Nastaliq by its script code only** (Rio's choice): `ur` is Urdu in Arabic script, medium, as `Intl` gives it; `ur-Aran`, or `languageHeight: 'extra-large'`, sets it in Nastaliq.
- **The emphasized styles take the same line heights** (Rio's choice: their tokens equal the baseline ones in the small category, and the spec gives no others).
- **Part of a page in another script**: the theme is the page's, and a `RioLocaleProvider` doesn't change it. Write one on that part, with `attachTheme(element, { ...theme, languageHeight: languageHeightOf('my') })`.
- **Components** were checked in every category against the visual tests' galleries:
  - Those with vertical padding grow, as the spec says: text fields, list items, menus, dialogs, the date pickers' headers.
  - Those with fixed heights keep them, with the text in the middle: buttons, chips, the date pickers' days, the time picker's fields. In the extra large category, a 32px button's or a chip's label line is taller than the button, which only the line box shows.
  - A scroll field's slots keep their 52px (Rio's choice: the spec's measurement, and a taller slot would show less of the values around), and its values stay in the middle of them, a taller line spilling out evenly.

### 5.4 Variable fonts

#### Spec

> "Static fonts like Roboto are currently applied by default to all Material 3 components. Variable fonts like Roboto Flex have many more axes for expression, but aren't yet part of the M3 typescale."

The typography token data the spec page loads (section 5.3) has a variable type scale beside the static one: `md.sys.typescale.variable.<style>` and `md.sys.typescale.variable.emphasized.<style>`. Its typefaces are `md.ref.typeface.variable.brand` and `.plain`, which are Roboto Flex for third parties (Google's own products use Google Sans Flex). Its sizes and line heights are the static scale's, its letter spacing is 0 for every style, and each of its 30 styles has a weight and seven axes:

| Weight and axis        | Value                                                                                                                                            | Meaning                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| weight, `wght`         | The static weight, **except 600 where the static weight is 700** (emphasized title-medium, title-small, and all labels)                          | Weight                    |
| `wdth`                 | 100                                                                                                                                              | Width (normal)            |
| `opsz`                 | The font size (57 for display-large, 11 for label-small); undefined on the web and on iOS                                                        | Optical size              |
| `ROND`                 | 0; 100 on the emphasized styles for Google's own fonts (`md.ref.typeface.emphasized.rond`), 0 for third parties (Roboto Flex has no `ROND` axis) | Roundness                 |
| `GRAD`, `CRSV`, `slnt` | 0                                                                                                                                                | Grade, cursive, and slant |

- The static scale's tokens carry the same axes, and `FILL` and `HEXP` at 0, with `opsz` defined on the web too. Their `wght` is the one above, while their weight stays 700 where the variable scale's is 600.
- The data's `Font` context, which switched the static scale to a variable font, is deprecated: "DEPRECATED. Use variable font tokens instead! - Applies variable font (like Google Sans Flex, Roboto Flex)." Under it, for third parties (`3P/Variable`), the typefaces are Roboto Flex and the letter spacing is 0, with the static weights.

#### Recommendations

- Products using variable fonts should fall back in the order Roboto Flex → Roboto → the Noto Sans collection. Roboto Flex covers only Latin, Greek, and Cyrillic, so Korean and other scripts fall through to Noto Sans. No token encodes this.
- For reference, Roboto Flex has slant, width, weight, grade, and optical size axes, plus advanced axes: thick stroke (`XOPQ`), thin stroke (`YOPQ`), counter width (`XTRA`), uppercase height (`YTUC`), lowercase height (`YTLC`), ascender height (`YTAS`), descender depth (`YTDE`), and figure height (`YTFI`).

#### In Rio

- **The theme's `typescale: 'variable'`** sets the spec's variable type scale (`md.sys.typescale.variable.*`) in the type scale's variables (Rio's choice for the API: one theme option switches the scale, named after the spec's variable type scale, and no second set of variables is written). The default is `'static'`, as the spec applies Roboto.
  - The typefaces default to `"Roboto Flex", Roboto, "Noto Sans", system-ui, sans-serif`, the recommendation's order. `typefaces` replaces them as before.
  - The letter spacing is 0 for every style.
  - The emphasized title-medium, title-small, and labels are 600, the variable type scale's weight and `wght` alike; the deprecated `Font` context keeps the static weight token's 700 beside a `wght` of 600.
  - Sizes and line heights are the static scale's, with the language heights of section 5.3.
- **No `font-variation-settings`** (Rio's choice): on the web, `font-weight` sets `wght`, and `font-optical-sizing: auto`, CSS's default, sets `opsz` to the font size, the value the static scale's tokens give and the one the variable type scale leaves to the platform on the web. `font-stretch: normal` is a `wdth` of 100; `GRAD`, `CRSV`, and `slnt` are the fonts' defaults; and `ROND` is only for Google's own fonts. A theme or a component can still set `font-variation-settings` itself.
- **Rio doesn't load the font.** Load Roboto Flex with its optical size axis: Google Fonts names it `Roboto Flex`; Fontsource's `@fontsource-variable/roboto-flex/opsz.css` names it `Roboto Flex Variable`, so pass that name through `typefaces`.

## 6. Show interaction with states

### Spec

There are six states: enabled, disabled, hover, focused, pressed, and dragged.

> "A state layer is a semi-transparent covering on an element that indicates its state."

- A state layer is an overlay with a fixed opacity per state, in **the same color as the content** (usually the "on" color, for example `on-primary` on a `primary` container).
- Layer order: container → state layer → content.
- **Only one state layer** shows at a time, though states can be combined (for example, selected and hovered).
- A state layer covers the whole element or a circle over part of it. Where it is a circle, it is 40dp, while the interactive target is 48dp.
- Pressed is shown with a **ripple**. Some components, such as buttons and cards, also rise in elevation when pressed.
- Disabled components can't be focused, dragged, or pressed, and they don't change state when hovered or tapped. They don't need to meet Material's contrast requirements.
- Focus from the keyboard shows a ring-like **keyboard focus indicator**.

| Token                                       | Value |
| ------------------------------------------- | ----- |
| `md.sys.state.hover.state-layer-opacity`    | 0.08  |
| `md.sys.state.focus.state-layer-opacity`    | 0.1   |
| `md.sys.state.pressed.state-layer-opacity`  | 0.1   |
| `md.sys.state.dragged.state-layer-opacity`  | 0.16  |
| `md.sys.state.disabled.state-layer-opacity` | 0.38  |
| `md.sys.state.focus-indicator.thickness`    | 3dp   |
| `md.sys.state.focus-indicator.outer-offset` | 2dp   |
| `md.sys.state.focus-indicator.inner-offset` | -3dp  |

- Despite its name, the disabled opacity (0.38) is what components apply to disabled labels and icons. The disabled container opacity is a component token (0.1 on `on-surface` for the filled button).
- The focus indicator's color is a component token. The button, icon button, and switch tokens all set it to `secondary`.
- The spec lists which component families inherit each state. For example, buttons get hover, focus, and pressed but not dragged, and dialogs get none.

### Recommendations

- Hover is low-emphasis and fades in and out. Pressed is high-emphasis. Dragged is low-emphasis, so it doesn't distract.
- Don't show an unavailable FAB disabled; don't show it at all.
- From the gestures page: "UI elements should respond to gestures in real time."

### In Rio

- Each token is a CSS variable with the same name: `--rio-state-hover-state-layer-opacity`, `--rio-state-focus-indicator-thickness`, and so on. They are part of the theme variables.
- **Every disabled 38% reads `--rio-state-disabled-state-layer-opacity`** (Rio's choice): labels, icons, outlines, handles, tracks, and some containers, such as a checked checkbox's, in every component, so a theme changes them all at once. Where a component's tokens give another disabled opacity, such as 12% for a chip's outline or a switch's track, 4% for a filled text field's container, and 10% for a button's container, it stays a number.
- **`@rio-m3e/styles/base/state-layer.css`**: the class `rio-state-layer` draws the overlay with `currentColor`, so a component sets its content color and the layer follows. The overlay sits on a `::before` with `z-index: -1` inside an isolated element, which places it between the container and the content. Later rules win, so only one state shows: pressed beats focus, and focus beats hover.
- Hover applies only under `@media (hover: hover)`, because touch screens keep `:hover` after a tap.
- The fade uses the `fast-effects` motion token, following the low-emphasis fade recommendation with the spec's token for opacity changes.
- **`@rio-m3e/styles/base/focus-ring.css`**: the class `rio-focus-ring` draws an `outline` on `:focus-visible`, so only keyboard-style focus shows it. The color defaults to `secondary` and can be changed through `--rio-focus-ring-color`. `data-focus-ring="inner"` uses the inner offset. Where the ring goes round another element than the one with the focus, as a checkbox's circle while its hidden input has it, that element carries `rio-focus-ring-target`: the base stylesheet gives it the ring's width, color, and offset, and the component's stylesheet only sets `outline-style: solid` while the focus is where it rings for. The checkbox, the radio button, the switch, the input chip, the slider's handles, the scroll field while typing, and the list item draw it so.
- **`@rio-m3e/styles/base/touch-target.css`**: the class `rio-touch-target`, on an empty element inside a pressable one, takes presses at least 48 × 48px around the element's center, so a smaller element still has the 48dp target. Buttons, chips, and the time picker's period buttons render it as their `touch` parts.
- **Ripple**: `attachRipple(el)` from `@rio-m3e/core` adds a press ripple to any element, like Flutter's InkWell. `@rio-m3e/styles/base/ripple.css` draws it on every element the primitive marks with `data-ripple`, so no class is needed.
  - In Vue, use the `v-ripple` directive (`vRipple` from `@rio-m3e/vue`), which also loads the stylesheet. `v-ripple="false"` turns it off.
  - **It only draws the ripple.** It doesn't make an element pressable: put it on a `button` or a link, or give the element a role, focusability, and keyboard handling yourself. Making things pressable is the job of components such as the button.
  - It draws on `::after`, above the state layer on `::before` and below the content. The wave is a radial gradient in `currentColor` at the pressed opacity, so it stays inside rounded corners without `overflow: hidden`.
  - While pressed, the element has `data-pressed`. Elements with a ripple (`data-ripple`) don't get the flat pressed overlay.
  - Behavior follows Material Web's ripple, Google's web implementation:
    - Mouse and pen presses start at once. Touch presses wait 150ms, so a scroll that starts on the element doesn't ripple, and a tap shorter than that still ripples.
    - > **Deviation from a recommendation.** The 150ms touch delay goes against "respond to gestures in real time". Without it, every scroll that starts on a pressable element would flash a ripple. Rio accepts the slight delay to avoid that, as Material Web does. Neither the spec nor the gestures page defines any touch behavior for the ripple; the timings and rules above are implementation choices.
    - Keyboard activation (a click without a pointer) ripples from the center.
    - A press stays visible for at least 225ms.
    - The wave grows for 450ms with M3's legacy standard easing, moving from the press point to the center. It fades in over 105ms and out over 375ms.
  - The ripple and the state layer are hidden under `forced-colors`, where backgrounds are replaced.
  - Elements without a ripple keep the flat pressed overlay (`:active` or `data-pressed`).
- **Reduced motion**: see section 3. The ripple skips its growing wave and only fades.
- **Disabled and focus**: pressable components get two props. `disabled` is native and not focusable, as the spec says. `softDisabled` uses `aria-disabled` and stays focusable, which deviates from the spec on purpose so keyboard and screen-reader users can find the control. See [components/button.md](components/button.md).

## 7. Add colors to the scheme

### Spec

- **Static colors**, formerly custom colors: "You can define additional colors in your scheme that stay static even when other colors dynamically change. When you input a desired reference color, Material will return four derived color roles that align with the design of existing roles in the color scheme." "The main color, on-main color, container color, and on-container color all follow the conventions of the accent colors in the main scheme", and they "support features like dynamic color and user-controlled contrast". The spec's example is a green Success.
- **Harmonization** "adjusts the hue of static colors, making them closer to the hue of the scheme's primary color", and "limits the amount that a color's hue can change", so a red stays a red.
- **Your own baseline scheme**: "By providing your own custom input colors for the primary, secondary, tertiary, and neutral colors in the scheme, Material will provide back the scheme's regular color roles with values derived from your reference colors."
- **Color fidelity** "adjusts tones in color roles to produce the closest match to your input color". The Material Theme Builder turns it on by default for a custom baseline scheme and for static colors.

### Recommendations

- Error is already a static color: "you do not need to define your own static color for a semantic red color."
- Harmonize static colors in a dynamic scheme, but "Don't harmonize colors whose appearance should stay absolutely consistent, such as brand colors."
- Give each key color its role: tertiary complements primary, and secondary, neutral variant, and neutral "match primary in hue but are progressively less chromatic in that order".
- Define custom color roles "only if you cannot achieve your desired colors with other Material color solutions."

### In Rio

- **`staticColors`** in the theme, by name: `{ success: '#2e7d32' }` writes `--rio-color-success`, `--rio-color-on-success`, `--rio-color-success-container`, and `--rio-color-on-success-container`, in `light-dark()` as the other colors. A name is camelCase or kebab-case. One that would write a variable the theme already has, as `primary`, throws.
- **Made the way the primary color's roles are** (Rio's choice): the static color's palette, of its own hue and chroma, takes the primary palette's place in the scheme, and its four roles are that scheme's primary, on-primary, primary container, and on-primary container. The variant and `contrast` apply to them as to every other role, as the spec's "user-controlled contrast" asks. MCU's `customColor` takes fixed tones instead (40, 100, 90, and 10 in light), which no contrast changes.
- **Harmonized by default** (Rio's choice: the spec leaves it to the app), toward the scheme's primary color, the primary palette's key color, with MCU's `Blend.harmonize`. `{ color: '#ff5722', harmonize: false }` keeps a brand color's hue.
- **`keyColors`** in the theme: `primary`, `secondary`, `tertiary`, `neutral`, `neutralVariant`, and `error`, each a palette of its own hue and chroma in place of the one the variant derives from the source color. `error` is Rio's addition, as MCU takes an error palette too.
- **The source color is a seed, not the primary color**: the variant takes its hue and sets the chroma, as 32 for tonal-spot in light, so even `#ffffff` makes a colored primary. `keyColors.primary` keeps a color's own chroma, though its roles still take the variant's tones; color fidelity, which would match them to the color, is not yet in Rio.
- **No baseline scheme** (Rio's choice). `sourceColor: '#6750a4'` makes a scheme from that color, which matches the baseline's fixed values in few roles.
- `createStaticColors` and `staticColorVars` in `@rio-m3e/tokens` give the same colors and names outside a theme.

#### Not yet

- **Color fidelity**: MCU's 2025 color spec has no fidelity variant, so the tones follow the variant's rules, not the input colors' own.
- **Custom color roles**, from a palette's tones and contrast rules of the app's own.

## Implementation status

| Item                                               | Package                 | Status                                                                                                                                                                  |
| -------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color roles (2025 spec, light and dark)            | `tokens`                | Done: `createColorScheme`, `attachTheme`, `createThemeCss`                                                                                                              |
| Static colors and key colors                       | `tokens`                | Done: `staticColors` and `keyColors` in the theme, `createStaticColors`, `staticColorVars`. See section 7.                                                              |
| Elevation levels and web shadows                   | `tokens`                | Done: `elevationVar`, `createElevationVariables`. Also included in the theme variables (`attachTheme`, `createThemeCss`).                                               |
| Scrim (32%)                                        | `tokens`                | To do                                                                                                                                                                   |
| Motion curves (official conversion table)          | `tokens`                | Done: `motionVar`, `createMotionVariables`, `getMotionCurve`. Also included in the theme variables, with the scheme chosen by `motion`.                                 |
| Spring solver (handles interruptions and gestures) | `core`, `tokens`        | Done: `solveSpring`, `createSpring`, `readSpringParams`, and the `-damping` and `-stiffness` motion variables.                                                          |
| Corner morph (corner radius)                       | `core`, `styles`        | Done: `attachCornerMorph`, `base/corner-morph.css`, built on `attachSpringProperty`.                                                                                    |
| Drag                                               | `core`                  | Done: `attachDrag` (touch and pen by default, threshold, release velocity, click swallowing).                                                                           |
| Shape: corner radius scale                         | `tokens`                | Done: `shapeVar`, `createShapeVariables`. Also included in the theme variables, with step sizes overridable through `shapes`.                                           |
| Shape: shape library and morphing                  | `core`                  | Done: `materialShape`, the polygon functions, `createMorph`, `featuresFromSvgPath`, and `cubicsPath`, ported from androidx graphics-shapes. See section 4.              |
| Typography: baseline and emphasized type scales    | `tokens`                | Done: `typescaleVar`, `typefaceVar`, `createTypographyVariables`, `getTypeStyle`. Also included in the theme variables, with typefaces overridable through `typefaces`. |
| Typography: language height                        | `tokens`                | Done: `languageHeight` in the theme, `languageHeightOf`, `LANGUAGE_HEIGHTS`. `createRio` picks it from the app's language. See section 5.3.                             |
| Typography: variable fonts                         | `tokens`                | Done: `typescale: 'variable'` in the theme, `TYPESCALES`, `typescale` in `TypeStyleOptions`. See section 5.4.                                                           |
| State layer opacities and focus indicator          | `tokens`                | Done: `stateLayerOpacityVar`, `focusIndicatorVar`, `createStateVariables`. Also included in the theme variables.                                                        |
| State layer and focus ring CSS                     | `styles`                | Done: `base/state-layer.css`, `base/focus-ring.css`.                                                                                                                    |
| Ripple (pressed)                                   | `core`, `styles`, `vue` | Done: `attachRipple`, `base/ripple.css`, `v-ripple`.                                                                                                                    |
| Reduced motion                                     | `styles`                | Done: `base/reduced-motion.css`. Spatial motion is instant, and effects fades stay.                                                                                     |

## Sources

### Spec and recommendations: m3.material.io

- [Elevation – Overview](https://m3.material.io/styles/elevation/overview)
- [Elevation – Applying elevation](https://m3.material.io/styles/elevation/applying-elevation)
- [Motion physics – How it works](https://m3.material.io/styles/motion/overview/how-it-works)
- [Motion physics – Specs](https://m3.material.io/styles/motion/overview/specs) (includes the web conversion table)
- [Color roles](https://m3.material.io/styles/color/roles)
- [Color – Advanced customizations](https://m3.material.io/styles/color/advanced/overview), [Define new colors](https://m3.material.io/styles/color/advanced/define-new-colors), and [Adjust existing colors](https://m3.material.io/styles/color/advanced/adjust-existing-colors) (section 7)
- [Shape – Corner radius scale](https://m3.material.io/styles/shape/corner-radius-scale)
- [Shape – Shape morph](https://m3.material.io/styles/shape/shape-morph)
- [Typography – Type scale & tokens](https://m3.material.io/styles/typography/type-scale-tokens) (token tables read in expanded form), and the typography token data it loads (`/_dsm/data/dsdb-m3/2026-11-19_06-20-01/TYPOGRAPHY.20543ce18892f7d9.json`): the language heights (section 5.3) and the font contexts and axes (section 5.4)
- [Typography – Fonts](https://m3.material.io/styles/typography/fonts)
- [States – State layers](https://m3.material.io/foundations/interaction/states/state-layers)
- [States – Applying states](https://m3.material.io/foundations/interaction/states/applying-states)
- [Gestures](https://m3.material.io/foundations/interaction/gestures)

### Spec token values, generated per platform

- [Material Web `tokens/versions/latest` @ d872455](https://github.com/material-components/material-web/tree/d872455c4be56022da2095349b30ef46e0b55bc3/tokens/versions/latest/sass): Material 3 v34.0.21, generated for the web. It is the source of Rio's typography values (`_md-sys-typescale.scss`, `_md-sys-typescale-emphasized.scss`, `_md-ref-typeface.scss`), which match the expanded tables on m3.material.io. It also confirms Rio's shape scale (including `full` as `9999px`), the elevation levels, and the standard motion springs (`_md-sys-shape.scss`, `_md-sys-elevation.scss`, `_md-sys-motion.scss`). It ships only the standard motion scheme. The state tokens come from `_md-sys-state.scss` and `_md-sys-state-focus-indicator.scss`, and the focus indicator color and disabled opacities from the component tokens (`_md-comp-button.scss`, `_md-comp-button-filled.scss`, `_md-comp-icon-button.scss`, `_md-comp-switch.scss`). The 177 component token files include the M3E components: buttons in five sizes, button groups, split buttons, icon buttons, and the switch.
- Jetpack Compose Material3 tokens @ androidx `079e2e3`:
  - [`ExpressiveMotionTokens.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ExpressiveMotionTokens.kt) and [`StandardMotionTokens.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/StandardMotionTokens.kt) (token version v0_14_0): the source of the raw spring values, the expressive ones in particular.
  - [`ShapeTokens.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ShapeTokens.kt) (14_1_0) and [`ElevationTokens.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ElevationTokens.kt): agree with the spec and Material Web.
  - `TypeScaleTokens.kt` (v0_103): **not used**. It disagrees with the spec on several tracking values (-0.2 for display-large, 0.2 for title-medium and body-medium, and different emphasized tracking), so it appears rounded or out of date.
- Jetpack Compose Material3 interfaces @ androidx `079e2e3`, read for API shape only: [`MotionScheme.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt), [`Shapes.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Shapes.kt).

### Implementation reference (not spec)

- [Material Web `ripple/internal/ripple.ts` and `_ripple.scss` @ d872455](https://github.com/material-components/material-web/tree/d872455c4be56022da2095349b30ef46e0b55bc3/ripple/internal): Google's web ripple. Rio's `attachRipple` follows its behavior (touch delay, minimum press time, keyboard ripple, growth and fade timings) with its own code and structure.

### Ported code (not spec)

- [androidx graphics-shapes @ 079e2e3](https://github.com/androidx/androidx/tree/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/graphics/graphics-shapes/src/commonMain/kotlin/androidx/graphics/shapes) and Compose Material3's [`MaterialShapes.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MaterialShapes.kt) at the same commit, Apache-2.0: ported to `@rio-m3e/core` as Rio's shape library. The tests compare it with graphics-shapes 1.1.0, whose code matches that commit.

### Design reference (not spec)

- Material 3 Design Kit (Figma Community): the `M3/Elevation Light` and `M3/Elevation Dark` effect styles, used for Rio's web shadows.
