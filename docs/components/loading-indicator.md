# Loading indicator

`RioLoadingIndicator` from `@rio-m3e/vue`, built on `createLoadingIndicator` and `attachLoadingIndicator` from `@rio-m3e/core` and `@rio-m3e/styles/loading-indicator.css`. Its shapes come from Rio's port of the Material shape library and morphs (see [foundations.md](../foundations.md)). Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-20.

## Examples

<script setup>
import Basic from './demos/loading-indicator/Basic.vue';
import Pull from './demos/loading-indicator/Pull.vue';
import Shapes from './demos/loading-indicator/Shapes.vue';
import Sizes from './demos/loading-indicator/Sizes.vue';
</script>

### Default and contained

<Demo><Basic /></Demo>

::: details Code
<<< ./demos/loading-indicator/Basic.vue
:::

### Sizes

<Demo><Sizes /></Demo>

::: details Code
<<< ./demos/loading-indicator/Sizes.vue
:::

### With progress, as a pull to refresh

<Demo><Pull /></Demo>

::: details Code
<<< ./demos/loading-indicator/Pull.vue
:::

### Your own shapes

<Demo><Shapes /></Demo>

::: details Code
<<< ./demos/loading-indicator/Shapes.vue
:::

## Spec

### Variants and configurations

- One variant, new in M3 Expressive, in two configurations: **default** and **contained**.
- "The active indicator is a looping shape morph sequence composed of seven unique Material 3 shapes."
- For the web, the spec lists the loading indicator as unavailable.

### Anatomy and measurements

Active indicator, and container (optional).

| Attribute       | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Size            | 48dp; "the size is 48dp while the shape container is 38dp" |
| Size range      | 24dp to 240dp                                              |
| Container shape | `corner-full`: a circle                                    |

- "The ratio between the container and the active indicator stays the same when resizing the loading indicator."

### Colors

| Configuration | Active indicator     | Container         |
| ------------- | -------------------- | ----------------- |
| Default       | primary              | —                 |
| Contained     | on-primary-container | primary-container |

### Behavior and accessibility

- "Loading indicators are best for indicating a short, indeterminate wait time": they "should be used when progress isn't detectable, or when it's not necessary to indicate how long an activity will take."
- They are "used in pull-to-refresh functionality", where the indicator "must pass a threshold before the app will refresh", and stays visible until the refresh completes.
- **Accessibility**: the indicator uses "the progress bar accessibility role", with a label "describing the purpose of the loading indicator, such as loading news article or refreshing page". The active indicator needs 3:1 contrast with what is behind it; the container doesn't.

## Recommendations

- Match the indicator to the wait: none under 200ms, a loading indicator from 200ms to 5s, a progress indicator over 5s. It "should replace most uses of the indeterminate circular progress indicator."
- "Don't transition a loading indicator into a progress indicator." Where progress becomes known, go from an indeterminate progress indicator to a determinate one instead.
- Show the container "when the loading indicator is placed over other content", and with pull-to-refresh. "It's not needed when the loading indicator is placed directly on a surface."
- Center it on the page or container that is loading, or in the empty space where new items will appear, without overlapping existing content.
- It can sit in other components, such as a button whose action takes a few seconds; there, keep 3:1 contrast with that component.
- Scale it up in larger windows, in proportion to the space around it, up to 240dp.
- Pull-to-refresh can't rely on the gesture alone: offer another way to refresh, such as a button in an app bar or a menu.

## In Rio

### API

```vue
<RioLoadingIndicator aria-label="Loading news article" />
<RioLoadingIndicator contained aria-label="Refreshing page" />
<RioLoadingIndicator :value="pulled" :max="threshold" contained aria-label="Pull to refresh" />
```

| Prop        | Type                                                            | Default                                                     |
| ----------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| `value`     | `number`, from 0 to `max`                                       | none: indeterminate                                         |
| `max`       | `number`                                                        | `1`                                                         |
| `contained` | `boolean`                                                       | `false`                                                     |
| `size`      | `number`, in px                                                 | `48`                                                        |
| `shapes`    | at least two names from `MATERIAL_SHAPES`, or `RoundedPolygon`s | the spec's seven, or for a value, a circle and a soft burst |

- **Without a `value`, the indicator loops**, as the spec means it to. With one, it morphs as far as the value goes, as Compose's determinate loading indicator does for pull-to-refresh (Rio's choice to offer it). A value off the range shows at its end; a `max` that isn't above 0 is 1.
- **Name it** with `aria-label` or `aria-labelledby`, which go to the root, a `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, and, with a value, `aria-valuenow`.
- **`shapes`** morphs through other shapes, in order, as Compose's `polygons`: by name, such as `['heart', 'flower']`, or as polygons, such as one from `starPolygon` or `featuresFromSvgPath`. While looping, the last morphs back to the first. The indicator builds its morphs again whenever a shape changes, so make polygons once, as in `setup`, rather than in the template.
- **Colors** (Rio's choice): `--rio-loading-indicator-color` and `--rio-loading-indicator-container-color` replace the active indicator's and the container's, as for an indicator in a button: `--rio-loading-indicator-color: currentColor`.

### Drawing

- The shape is an SVG path in a 1 by 1 view box, which `attachLoadingIndicator` redraws on every frame while the indicator loops. Before the script runs, as when rendered on the server, the path holds the loop's first moment.
- The shapes are scaled to fit the indicator as they turn, at the spec's 38dp in 48dp, and centered by the bounds of their points, as Compose's `calculateScaleFactor` and `processPath` do: they take the same share of any size. The path's coordinates are rounded to 1e-4 of the size, 0.012px at 240px.
- The root clips to a circle in both configurations, as Compose clips to the container shape; the shapes stay inside it.

### Motion

- **Looping**, as Compose's: every 650ms a morph to the next shape starts, on a spring (damping 0.6, stiffness 200); the drawing turns a quarter turn with each morph, overshooting with the spring, and on top of that, a full turn every 4666ms, clockwise.
- **The spring runs until it is within 0.01 of the shape**, Compose's default, at 569ms, before the next morph starts (Rio's choice). Compose ends it within 0.1, at 297ms, but that is just after it overshoots the most: the drawing snaps back 8.5° there, and the shape 9%. Within 0.01, the spring comes back by itself.
- **With a value**: the morphs share the range in turn, and the drawing turns half a turn counterclockwise over all of it. A change of value shows at once.
- **Under reduced motion**, the morphs ease in without overshooting, on a critically damped spring, which ends at 469ms; the indicator keeps morphing and turning, since that movement is what says the process is going on, as the indeterminate progress indicators do (Rio's choice).

### Values and their sources

- The sizes and colors come from the spec, which Compose's `LoadingIndicatorTokens` match.
- The shapes, their sequence, the scale, and the motion aren't in the spec's pages beyond "seven unique Material 3 shapes"; Rio takes them from Compose's `LoadingIndicator.kt` and `MaterialShapes.kt`. The shape engine is a port of androidx graphics-shapes, checked against the original's own output; in the loop's morphs it matches Compose frame by frame. The spring's end differs, as above; where the engine differs from Android elsewhere, foundations.md says so.

### Not yet

- **Pull-to-refresh** itself: the gesture, its threshold, and the indicator's place over the list. `value` gives the indicator what the gesture would.

## Sources

- [M3 Loading indicator – Overview](https://m3.material.io/components/loading-indicator/overview)
- [M3 Loading indicator – Specs](https://m3.material.io/components/loading-indicator/specs)
- [M3 Loading indicator – Guidelines](https://m3.material.io/components/loading-indicator/guidelines)
- [M3 Loading indicator – Accessibility](https://m3.material.io/components/loading-indicator/accessibility)
- Compose Material3 @ androidx `079e2e3`: [`LoadingIndicator.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/LoadingIndicator.kt) (the sequences, the scale, and the motion), [`MaterialShapes.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MaterialShapes.kt), [`LoadingIndicatorTokens.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/LoadingIndicatorTokens.kt) (v0_7_0)
- Compose animation @ androidx `079e2e3`: [`SpringEstimation.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/animation/animation-core/src/commonMain/kotlin/androidx/compose/animation/core/SpringEstimation.kt) (when the morph's spring ends)
