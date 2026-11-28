# Icons

Rio's components draw icons in places of their own, such as a select's arrow or a date picker's month arrows. Rio ships no icons: the app brings them, in a component's slot, or once for the whole app. To draw an icon anywhere else, as in a button's slot, use [`RioIcon`](../components/icon.md).

<script setup>
import { RioIcon } from '@rio-m3e/vue';
import Mirrored from './demos/icons/Mirrored.vue';
import Registered from './demos/icons/Registered.vue';
</script>

## Register icons by alias

Each place where a component draws an icon of its own has an alias, named for what the icon does there: `dropdown` for a select's arrow, `previous` and `next` for a date picker's months. Give `createRio` an icon for each alias, once for the whole app:

```ts
// main.ts
import { createRio } from '@rio-m3e/vue';
import { icons } from './icons';

app.use(createRio({ icons }));
```

In each of those places, a component draws the app's slot, if it gives one; otherwise the icon registered for the place's alias; otherwise none. A button without an icon keeps its name for assistive technology.

These docs register the [Material Design Icons below](#with-material-design-icons), so these components draw their icons with no slot:

<Demo><Registered /></Demo>

::: details Code
<<< ./demos/icons/Registered.vue
:::

| Alias      | Where                                                                                                   | Material Symbols      | Material Design Icons                               |
| ---------- | ------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------- |
| `dropdown` | A select's arrow, a menu chip's, the date picker's month and year buttons' (`dropdown-icon`)            | `arrow_drop_down`     | <RioIcon alias="dropdown" /> `mdiMenuDown`          |
| `previous` | The date picker's previous month (`previous-icon`)                                                      | `chevron_left`        | <RioIcon alias="previous" /> `mdiChevronLeft`       |
| `next`     | The date picker's next month (`next-icon`)                                                              | `chevron_right`       | <RioIcon alias="next" /> `mdiChevronRight`          |
| `edit`     | The date pickers' switch to the text input (`edit-icon`)                                                | `edit`                | <RioIcon alias="edit" /> `mdiPencil`                |
| `calendar` | The date picker field's button, and the switch back to the calendar (`calendar-icon`)                   | `calendar_today`      | <RioIcon alias="calendar" /> `mdiCalendar`          |
| `keyboard` | The time pickers' switch to the text input (`keyboard-icon`)                                            | `keyboard`            | <RioIcon alias="keyboard" /> `mdiKeyboardOutline`   |
| `clock`    | The time picker's switch back to the dial (`clock-icon`)                                                | `schedule`            | <RioIcon alias="clock" /> `mdiClockOutline`         |
| `swipe`    | The time pickers' switch back to the scroll fields (`swipe-icon`)                                       | `swipe_vertical`      | <RioIcon alias="swipe" /> `mdiGestureSwipeVertical` |
| `remove`   | An input chip's remove button (`remove-icon`)                                                           | `close`               | <RioIcon alias="remove" /> `mdiClose`               |
| `menu`     | A split button's menu button (`menu-icon`): an expand icon pointing down, not the menu (hamburger) icon | `keyboard_arrow_down` | <RioIcon alias="menu" /> `mdiChevronDown`           |
| `check`    | A selected filter chip's checkmark (`selected-icon`)                                                    | `check`               | <RioIcon alias="check" /> `mdiCheck`                |
| `submenu`  | A menu item's arrow to its submenu (`RioSubMenu`'s `trailing-icon`)                                     | `arrow_right`         | <RioIcon alias="submenu" /> `mdiMenuRight`          |
| `close`    | A full-screen dialog's close button (`RioDialog`'s `close-icon`)                                        | `close`               | <RioIcon alias="close" /> `mdiClose`                |

### With Material Design Icons

`@mdi/js` holds each icon as SVG path data, and a bundler keeps only the icons imported. These docs register these:

<<< ./icons/mdi.ts

### With Material Symbols

Material Symbols, the icons of Material 3, is an icon font: each icon is a ligature, drawn for its name. Load it with the icons the app uses, as the comment says, and Rio draws each name in it.

<<< ./icons/material-symbols.ts

### Right to left

Right to left, the icons for `previous`, `next`, and `submenu` are drawn mirrored, so register their left-to-right form. The spec mirrors icons that point along the line: "In RTL languages, directional UI icons, like back and forward, should be mirrored." The others stay as they are, as the spec keeps a clock: "Clock icons, circular refresh icons, and progress indicators with arrows pointing clockwise shouldn't be mirrored." ([Bidirectionality & RTL](https://m3.material.io/foundations/layout/bidirectionality-rtl)) The app's icons in slots are drawn as the app gives them.

<Demo column><Mirrored /></Demo>

::: details Code
<<< ./demos/icons/Mirrored.vue
:::

## Icons of the app's own

The icons an app picks for its own content have no alias, and go in their slots: a button's icon, a text field's, an icon button's, a list item's, or a switch's, whose icons are optional in the spec. `RioIcon` draws them there, from the same kinds of icons (see [Icon](../components/icon.md)).

## What an icon is

What `aliases` and `resolve` give, and what `RioIcon`'s `icon` takes:

- `{ type: 'svg', path, viewBox }`: SVG path data, in `0 0 24 24` unless `viewBox` says otherwise. Several paths are drawn as one.
- `{ type: 'ligature', name, className }`: a ligature of an icon font, set in the font that `className`, a class of the font's stylesheet, applies.
- `{ type: 'class', className }`: classes an icon font's stylesheet draws an icon with, as `mdi mdi-home` from `@mdi/font`.
- A Vue component, as from an icon library.
- A string: a name that `resolve` turns into one of these, as an icon font takes any of its names.
