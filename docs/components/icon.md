# Icon

`RioIcon` from `@rio-m3e/vue`, built on `createIcon` from `@rio-m3e/core` and `@rio-m3e/styles/icon.css`. It draws an icon the app brings, anywhere, as in a component's slot; the icons the components draw on their own are registered once for the app, as [Icons](../guide/icons.md) shows. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-22.

## Examples

<script setup>
import Paths from './demos/icon/Paths.vue';
import Places from './demos/icon/Places.vue';
import Sizes from './demos/icon/Sizes.vue';
</script>

### SVG paths, from `@mdi/js`

<Demo><Paths /></Demo>

::: details Code
<<< ./demos/icon/Paths.vue
:::

### Sizes

<Demo><Sizes /></Demo>

::: details Code
<<< ./demos/icon/Sizes.vue
:::

### Beside text and in slots

<Demo><Places /></Demo>

::: details Code
<<< ./demos/icon/Places.vue
:::

## Spec

### Sizes

| Size       | Use                                                                |
| ---------- | ------------------------------------------------------------------ |
| 24dp       | The standard: "Standard icons are displayed as 24dp x 24dp."       |
| 20dp       | "primarily for desktop, dense layouts, and small scale visuals"    |
| 40dp, 48dp | "optimized for display or headline type, plus larger screen sizes" |

- **Live area**: "Icon content is limited to the 20dp x 20dp live area, with 2dp of padding around the perimeter".
- **Target size**: "Symbols of 24dp should have a target size of 48dp by default." Where a mouse and keyboard are the main input, "A 20dp size symbol can use a target size of 40dp."

### Material Symbols

- "Material Symbols are the new default, and are available in three styles: outlined, rounded, and sharp."
- Each has four axes: **weight**, from thin (100) to bold (700), with 400 as the regular weight; **fill**, from 0 to 1, which "can be used to convey a state of transition, such as unfilled and filled states"; **grade**, a finer change of thickness, where "the default grade for a dark icon on a light background is 0, and -25 for a light icon on a dark background"; and **optical size**, from 20dp to 48dp, which changes the stroke weight with the size, "For the image to look the same at different sizes".

### Accessibility

- "Icon meaning should always be unambiguous and accessible for all users." Label text helps where icons are abstract, as in navigation, and "Use caution if icons are displayed without labels."
- Below 20dp, complex icons and icons with a key action "should have an accompanying text label".

## Recommendations

- **Weight**: "Don't use the lightest weight for standard-size (24dp) icons. The minimum weight for this size should be 200." Don't mix weights.
- **Optical size**: "Use 20dp optical size value for dense layouts on desktop", and "Use larger size 40dp–48dp symbols when primary actions need to be highlighted".
- **Beside text**: give icons the text's size and optical weight, and "Shift down the baseline of symbols to approximately 11.5% of the text size".
- **One style**: "Use and maintain a consistent visual style throughout one icon set".
- **Localizing**: "Translate icons for local markets. For example, different locales may prefer a cart, bag, or basket for checkout experiences." Right to left, icons that point along the line are mirrored (see [Icons](../guide/icons.md#right-to-left)).

## In Rio

### API

```vue
<RioIcon :icon="{ type: 'svg', path: mdiHome }" />
<!-- A name, through the app's resolve -->
<RioIcon icon="home" />
<!-- The icon the app registered for an alias -->
<RioIcon alias="check" />
```

| Prop    | Type                                                                                                                        | Default |
| ------- | --------------------------------------------------------------------------------------------------------------------------- | ------- |
| `icon`  | An icon ([what an icon is](../guide/icons.md#what-an-icon-is)), or a name for the app's `resolve`                           | —       |
| `alias` | One of the [aliases](../guide/icons.md#register-icons-by-alias) of the components' own icons, drawing the app's icon for it | —       |

- **24px**, the spec's standard size. `--rio-icon-size` resizes it, as to the spec's 20, 40, or 48dp; in a component's slot, the component sizes it. It takes the color of the text around it.
- **Hidden from assistive technology** (Rio's choice): the components name what their buttons do, so an icon would only repeat it. An icon that means something on its own needs a name on what holds it, as an icon button's `label`, or text beside it.
- **A ligature's name isn't text in the page** (Rio's choice): the stylesheet draws it, so it is neither read, selected, nor found by the browser's search. An icon font's glyph is as tall as the icon's box, at any size.
- **With `alias`**, it draws the app's icon for that alias, and `icon` is left out. Right to left, an alias's icon that points along the line is mirrored; an `icon` is drawn as it is.
- Without an icon, as for an alias the app didn't register or a name without `resolve`, it draws nothing.

### Drawing

- **SVG paths**: an `<svg>` with one `<path>`, whose paths, given apart, are joined; the view box is `0 0 24 24` unless the icon gives its own. The path is filled in the text's color.
- **An icon font**: a `<span>` box with a `<span>` in it that carries the font's class. A ligature's name is in `data-ligature`, which the stylesheet draws in `::before`. The box is a size container, so the glyph's font size is the box's height (`100cqb`).
- **A component**: drawn as it is, with `rio-icon` and `aria-hidden="true"` on its root.
- For other adapters, `createIcon`'s parts give the attributes, and `iconSvgSkeleton` and `iconFontSkeleton` the markup.

### Not yet

- **Material Symbols' axes**: `RioIcon` sets no weight, fill, grade, or optical size, and doesn't change them with a component's state, as the spec fills an icon to show it selected. The app sets them on the font's class with `font-variation-settings`; for a selected state, the components that have one take a second icon in a slot of its own, as the icon button's `selected-icon`.
- **The baseline beside text**: the guidelines shift an icon about 11.5% of the text size down; `RioIcon` centers on the text's lowercase letters (`vertical-align: middle`).

## Sources

- [M3 Icons – Overview](https://m3.material.io/styles/icons/overview)
- [M3 Icons – Designing icons](https://m3.material.io/styles/icons/designing-icons) (design principles, sizes, the live area, weight)
- [M3 Icons – Applying icons](https://m3.material.io/styles/icons/applying-icons) (styles, axes, typography, accessibility, target size, localizing)
