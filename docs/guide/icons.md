# Icons

Rio's components draw icons in places of their own, such as a select's arrow or a date picker's month arrows. Rio ships no icons: the app brings them, in a component's slot, or once for the whole app.

## Register them once

Give `createRio` the icons for what the components draw on their own, each by its alias:

```ts
// main.ts
import { createRio } from '@rio-m3e/vue';
import { icons } from './icons';

app.use(createRio({ icons }));
```

In each of those places, a component draws the app's slot, if it gives one; otherwise the icon registered for the place's alias; otherwise none. A button without an icon keeps its name for assistive technology.

| Alias      | Where                                                                                                   | Material Symbols      | Material Design Icons     |
| ---------- | ------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------- |
| `dropdown` | A select's arrow, a menu chip's, the date picker's month and year buttons' (`dropdown-icon`)            | `arrow_drop_down`     | `mdiMenuDown`             |
| `previous` | The date picker's previous month (`previous-icon`)                                                      | `chevron_left`        | `mdiChevronLeft`          |
| `next`     | The date picker's next month (`next-icon`)                                                              | `chevron_right`       | `mdiChevronRight`         |
| `edit`     | The date pickers' switch to the text input (`edit-icon`)                                                | `edit`                | `mdiPencil`               |
| `calendar` | The date picker field's button, and the switch back to the calendar (`calendar-icon`)                   | `calendar_today`      | `mdiCalendar`             |
| `keyboard` | The time pickers' switch to the text input (`keyboard-icon`)                                            | `keyboard`            | `mdiKeyboardOutline`      |
| `clock`    | The time picker's switch back to the dial (`clock-icon`)                                                | `schedule`            | `mdiClockOutline`         |
| `swipe`    | The time pickers' switch back to the scroll fields (`swipe-icon`)                                       | `swipe_vertical`      | `mdiGestureSwipeVertical` |
| `remove`   | An input chip's remove button (`remove-icon`)                                                           | `close`               | `mdiClose`                |
| `menu`     | A split button's menu button (`menu-icon`): an expand icon pointing down, not the menu (hamburger) icon | `keyboard_arrow_down` | `mdiChevronDown`          |
| `check`    | A selected filter chip's checkmark (`selected-icon`)                                                    | `check`               | `mdiCheck`                |
| `submenu`  | A menu item's arrow to its submenu (`RioSubMenu`'s `trailing-icon`)                                     | `arrow_right`         | `mdiMenuRight`            |

Right to left, the icons for `previous`, `next`, and `submenu` are drawn mirrored, so register their left-to-right form. The spec mirrors icons that point along the line: "In RTL languages, directional UI icons, like back and forward, should be mirrored." The others stay as they are, as the spec keeps a clock: "Clock icons, circular refresh icons, and progress indicators with arrows pointing clockwise shouldn't be mirrored." ([Bidirectionality & RTL](https://m3.material.io/foundations/layout/bidirectionality-rtl)) The app's icons in slots are drawn as the app gives them.

The icons an app picks for its own content have no alias, and go in their slots: a button's icon, a text field's, an icon button's, a list item's, or a switch's, whose icons are optional in the spec.

### With Material Design Icons

`@mdi/js` holds each icon as SVG path data, and a bundler keeps only the icons imported.

<<< ./icons/mdi.ts

### With Material Symbols

Material Symbols, the icons of Material 3, is an icon font: each icon is a ligature, drawn for its name. Load it with the icons the app uses, as the comment says, and Rio draws each name in it.

<<< ./icons/material-symbols.ts

## What an icon is

- `{ type: 'svg', path, viewBox }`: SVG path data, in `0 0 24 24` unless `viewBox` says otherwise. Several paths are drawn as one.
- `{ type: 'ligature', name, className }`: a ligature of an icon font, set in the font that `className`, a class of the font's stylesheet, applies.
- `{ type: 'class', className }`: classes an icon font's stylesheet draws an icon with, as `mdi mdi-home` from `@mdi/font`.
- A Vue component, as from an icon library.
- A string: a name that `resolve` turns into one of these, as an icon font takes any of its names.

## `RioIcon`

Draws an icon anywhere, as in a slot:

```vue
<RioIcon :icon="{ type: 'svg', path: mdiHome }" />
<!-- A name, through the app's resolve -->
<RioIcon icon="home" />
<!-- An icon the app registered for an alias -->
<RioIcon alias="check" />
```

| Prop    | Type                                                    |
| ------- | ------------------------------------------------------- |
| `icon`  | An icon, or a name for the app's `resolve`              |
| `alias` | One of the aliases above, drawing the app's icon for it |

- **24px**, the spec's default icon size. `--rio-icon-size` resizes it; in a component's slot, the component sizes it. It takes the color of the text around it.
- **Hidden from assistive technology** (Rio's choice): the components name what their buttons do, so an icon would only repeat it.
- **A ligature's name isn't text in the page** (Rio's choice): the stylesheet draws it, so it is neither read, selected, nor found by the browser's search. An icon font's glyph is as tall as the icon's box, at any size.
- Without an icon, as for an alias the app didn't register or a name without `resolve`, it draws nothing.
