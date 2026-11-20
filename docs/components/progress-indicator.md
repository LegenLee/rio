# Progress indicators

`RioLinearProgress` and `RioCircularProgress` from `@rio-m3e/vue`, built on `createLinearProgress`, `createCircularProgress`, `attachLinearProgress`, and `attachCircularProgress` from `@rio-m3e/core` and `@rio-m3e/styles/progress.css`. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-19.

## Examples

<script setup>
import Circular from './demos/progress-indicator/Circular.vue';
import InButton from './demos/progress-indicator/InButton.vue';
import Known from './demos/progress-indicator/Known.vue';
import Linear from './demos/progress-indicator/Linear.vue';
import Wavy from './demos/progress-indicator/Wavy.vue';
</script>

### Linear

<Demo><Linear /></Demo>

::: details Code
<<< ./demos/progress-indicator/Linear.vue
:::

### Circular

<Demo><Circular /></Demo>

::: details Code
<<< ./demos/progress-indicator/Circular.vue
:::

### Wavy

<Demo><Wavy /></Demo>

::: details Code
<<< ./demos/progress-indicator/Wavy.vue
:::

### From unknown to known progress

<Demo><Known /></Demo>

::: details Code
<<< ./demos/progress-indicator/Known.vue
:::

### In a button

<Demo><InButton /></Demo>

::: details Code
<<< ./demos/progress-indicator/InButton.vue
:::

## Spec

### Variants and configurations

- **Variants**: linear and circular.
- **Behavior**: determinate (default), for known progress and wait time, and indeterminate, for unknown ones.
- **Track thickness**: 4dp by default, or configurable (M3 Expressive). **Shape**: flat (default), or wavy (M3 Expressive).

### Anatomy and measurements

Active indicator, track, and stop indicator.

| Attribute                                        | Linear                              | Circular      |
| ------------------------------------------------ | ----------------------------------- | ------------- |
| Active indicator and track thickness             | 4dp                                 | 4dp           |
| Space between the active indicator and the track | 4dp                                 | 4dp           |
| Stop indicator                                   | 4dp circle, at the end of the track | —             |
| Size, flat                                       | 4dp tall                            | 40dp          |
| Size, wavy                                       | 10dp tall                           | 48dp          |
| Wave amplitude                                   | 3dp                                 | 1.6dp         |
| Wavelength                                       | 40dp                                | 15dp          |
| Shape                                            | `corner-full`                       | `corner-full` |

- The drawings give thicker samples, "for makers to adjust the default version": at 8dp, a flat linear indicator 8dp tall and a wavy one 14dp; circular ones of 44dp and 52dp.
- "Amplitude measures from the center of the resting position to the center of the peak. Wavelength measures the distance between two adjacent peaks."
- The linear indicator is inset 4dp from the edge of the screen.
- The current token table holds the colors and shapes. The thicknesses, the stop indicator's size, and the space are in deprecated tokens; so is an older set for each variant, with a 48dp circle.

### Colors

| Part                             | Color               |
| -------------------------------- | ------------------- |
| Active indicator, stop indicator | primary             |
| Track                            | secondary-container |

### Behavior and accessibility

- Determinate indicators fill from 0% to 100%; indeterminate ones "move along a fixed track, growing and shrinking in size". As more becomes known, an indeterminate indicator should change to determinate.
- Linear indicators move from the leading edge to the trailing; circular ones from the top, clockwise.
- "At low percentages where space is limited, this should appear as a dot to help people understand that there's progress underway."
- The stop indicator "marks the end of a linear determinate progress indicator". It isn't used on indeterminate or circular ones, and it "is required if the track has a contrast below 3:1 with its container or the surface behind the container."
- "When using the wavy shape, the overall height of the component changes."
- Right to left, linear indicators are mirrored; circular ones aren't.
- Circular indicators can range from 24dp to 240dp; "the waveform should scale with the size so the proportions look the same across sizes." Linear ones span the width of the element they are in, with at least 4dp at each end, and aren't used in elements under 40dp.
- **Accessibility**: the indicator has the progress bar role, and a label for the process and what it affects, such as "Loading news article". The active indicator needs 3:1 contrast with what is behind it.

## Recommendations

- Match the indicator to the wait: none under 200ms, a [loading indicator](loading-indicator.md) from 200ms to 5s, a progress indicator over 5s. For a very long wait, let people leave the page.
- Show one indicator for a group of items loading together, not one for each.
- Use one variant for a process throughout the product.
- Place linear indicators on the edge of the container that is loading, or the edge that grows; center circular ones on the container, or where new items will appear.
- Use the wavy shape where a more expressive style fits, as for longer processes. At very small sizes the wave isn't as visible: in small buttons, use the flat shape.
- **In a button**: give the active indicator the color of the button's label or icon, and remove the track, for 3:1 contrast. Use circular indicators in buttons for short, indeterminate activities under 5 seconds, and not in every button of a list.
- Only remove the stop indicator where the track has at least 3:1 contrast with the surfaces around it.
- Reserve very large circular indicators for large windows.

## In Rio

### API

```vue
<RioLinearProgress :value="loaded" :max="total" aria-label="Uploading photos" />
<RioCircularProgress wavy aria-label="Loading episodes" />
```

| Prop        | Type                                    | Default                                                        |
| ----------- | --------------------------------------- | -------------------------------------------------------------- |
| `value`     | `number`, from 0 to `max`               | none: indeterminate                                            |
| `max`       | `number`                                | `1`                                                            |
| `wavy`      | `boolean`                               | `false`                                                        |
| `thickness` | `number`, in px                         | `4`                                                            |
| `size`      | `number`, in px (`RioCircularProgress`) | 36px more than the thickness, 44px when wavy: 40 and 48 at 4px |

- **Without a `value`, the indicator is indeterminate**, as a native `<progress>` is (Rio's choice). A value off the range shows at its end; a `max` that isn't above 0 is 1.
- **Name it** with `aria-label` or `aria-labelledby`, which go to the root, a `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, and, while determinate, `aria-valuenow`.
- The default circular size keeps the spec's samples: the thickness and the wave grow the box, and the circle's radius stays.
- **Colors** (Rio's choice): `--rio-progress-color` and `--rio-progress-track-color` replace the active indicator's and the track's, as for an indicator in a button: `--rio-progress-color: currentColor; --rio-progress-track-color: transparent`.

### Drawing

- **The flat shape is CSS** (Rio's choice): it shows from the first paint, server rendering included, before any JavaScript runs. A linear indicator is a row of rounded spans, a circular one two circles in an SVG, whose dashes are the progress.
- **The wavy shape is drawn in JavaScript**: on every frame, `attachLinearProgress` and `attachCircularProgress` read where the stylesheet lays the flat indicators out and draw a wave over the same stretch, which then stands in for the flat one. Until the script runs, the flat shape shows.
- The wave is fixed to the track and moves toward the end by one wavelength a second, as Compose's default `waveSpeed`. A circular wave fits a whole number of waves round the circle, so it closes without a seam (Rio's choice).
- The wave lies flat up to 10% and from 95% of determinate progress, as Compose's `WavyProgressIndicatorDefaults.indicatorAmplitude` does, and its height eases in and out over 500ms (Rio's choice).
- The track keeps 4dp from the active indicator; with no progress, it runs the whole way. As soon as there is progress, the indicator shows as a dot.
- The stop indicator ends every determinate linear track (Rio's choice): there's no prop yet to remove it where the track has 3:1 contrast.
- A circular indeterminate indicator has no track, as Compose's `circularIndeterminateTrackColor` is transparent; a linear one keeps it.

### Motion

- **A change of value** moves the indicator there over 500ms, linearly, as Compose's `WavyProgressIndicatorDefaults.ProgressAnimationSpec` (Rio's choice, for the flat shape too). Turning from indeterminate to determinate, the indicator grows from no progress to the value.
- **Indeterminate linear** (Rio's choice): two indicators cross the track in turn every 2 seconds, each growing and then shrinking, as in Material Web's 2-second cycle. The track keeps its gaps around them, and has none where an indicator is off the track.
- **Indeterminate circular**: the indicator grows to three quarters of the circle and shrinks from its tail every 1333ms, on `cubic-bezier(0.4, 0, 0.2, 1)`, while the circle turns once every 1568ms, as Material Web's circular indicator does. Each time it shrinks, it starts again where its tail got to.
- **Under reduced motion**, a change of value shows at once, and the wave holds still. The indeterminate indicators keep moving, since that movement is what says the process is going on (Rio's choice).

### Values and their sources

- The colors and shapes come from the spec's token table; the measurements from its drawings, which Compose's tokens (`LinearProgressIndicatorTokens`, `CircularProgressIndicatorTokens`) match, and which add the indeterminate wavelength of 20dp.
- The motion of indeterminate indicators isn't in the spec's pages; Rio takes the timing above from Material Web and Compose's public defaults.

### Not yet

- **Removing the stop indicator** where the track has enough contrast.
- **Four-color indicators**, in the deprecated circular tokens.

## Sources

- [M3 Progress indicators – Overview](https://m3.material.io/components/progress-indicators/overview)
- [M3 Progress indicators – Specs](https://m3.material.io/components/progress-indicators/specs) (the token table read in expanded form, its deprecated sets, and the measurement drawings)
- [M3 Progress indicators – Guidelines](https://m3.material.io/components/progress-indicators/guidelines)
- [M3 Progress indicators – Accessibility](https://m3.material.io/components/progress-indicators/accessibility)
- Compose Material3 @ acea2f5: [`WavyProgressIndicator.kt`](https://github.com/androidx/androidx/blob/acea2f5c1fbed47dd06e10a320162576e4cb1fd7/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/WavyProgressIndicator.kt) (`WavyProgressIndicatorDefaults`, and the public KDoc of `waveSpeed`), [`ProgressIndicator.kt`](https://github.com/androidx/androidx/blob/acea2f5c1fbed47dd06e10a320162576e4cb1fd7/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ProgressIndicator.kt) (`ProgressIndicatorDefaults`), [`LinearProgressIndicatorTokens.kt`](https://github.com/androidx/androidx/blob/acea2f5c1fbed47dd06e10a320162576e4cb1fd7/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/LinearProgressIndicatorTokens.kt), [`CircularProgressIndicatorTokens.kt`](https://github.com/androidx/androidx/blob/acea2f5c1fbed47dd06e10a320162576e4cb1fd7/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/CircularProgressIndicatorTokens.kt)
- Implementation reference, not spec: [Material Web `progress/internal`](https://github.com/material-components/material-web/tree/763a97326fc2d0f425366cc3fa87bd0eccfaabdc/progress/internal) @ 763a973 (`_circular-progress.scss`: the 1333ms arc and the 1568ms turn; `_linear-progress.scss`: the 2-second cycle)
