# Menu

`RioMenu`, `RioMenuItem`, `RioSubMenu`, `RioMenuGroup`, and `RioMenuDivider` from `@rio-m3e/vue`, built on `createMenu`, `createMenuItem`, `createSubMenu`, `createMenuGroup`, `createMenuDivider`, `attachMenu`, and `attachSubMenu` from `@rio-m3e/core` and `@rio-m3e/styles/menu.css`. The menu floats in the top layer next to what opened it (see "Overlays" in [conventions.md](../conventions.md)). Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-15.

## Examples

<script setup>
import Basic from './demos/menu/Basic.vue';
import Context from './demos/menu/Context.vue';
import Selection from './demos/menu/Selection.vue';
import Submenu from './demos/menu/Submenu.vue';
import Vibrant from './demos/menu/Vibrant.vue';
</script>

### Actions

Icons, keyboard shortcuts, a disabled item, a divider, and a labeled group. Open it, then use the arrow keys, Home and End, or type a letter.

<Demo><Basic /></Demo>

::: details Code
<<< ./demos/menu/Basic.vue
:::

### Selection

A single-select menu closes when an item is chosen; a multi-select one stays open until dismissed.

<Demo><Selection /></Demo>

::: details Code
<<< ./demos/menu/Selection.vue
:::

### Submenus

Rest the pointer on an item with an arrow, or focus it and press Right. The menu the pointer or the focus is in keeps the rounder corners.

<Demo><Submenu /></Demo>

::: details Code
<<< ./demos/menu/Submenu.vue
:::

### Vibrant

<Demo><Vibrant /></Demo>

::: details Code
<<< ./demos/menu/Vibrant.vue
:::

### Context menu

<Demo><Context /></Demo>

::: details Code
<<< ./demos/menu/Context.vue
:::

## Spec

### Variants and configurations

| Axis   | Values             | Notes                                                                                 |
| ------ | ------------------ | ------------------------------------------------------------------------------------- |
| Menu   | vertical, baseline | Vertical menus are new in M3E (November 2025), "recommended for new designs"          |
| Color  | standard, vibrant  | "Standard: Surface-based, lower visual emphasis"; "Vibrant: Tertiary-based, higher …" |
| Layout | standard, grouped  | Grouped menus separate groups with gaps. "Gaps are not currently available on web."   |

- "Use a menu to show a temporary set of actions. To show actions on screen at all times, use a toolbar instead."
- Anatomy: menu items with an optional leading icon, label text, optional trailing icon, badge, or trailing text, and optional supporting text; the container; optional label text, gaps, and dividers.

### Measurements

| Token                                    | Value                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------- |
| Container shape                          | corner-large                                                          |
| Container elevation                      | level 2                                                               |
| Item height                              | 44                                                                    |
| Item top and bottom space                | 8                                                                     |
| Item leading and trailing space          | 16                                                                    |
| Space between elements in an item        | 12                                                                    |
| Leading and trailing icon size           | 20                                                                    |
| Item shape                               | corner-extra-small                                                    |
| First and last item shape                | corner-medium, with corner-extra-small on the corners facing the next |
| Selected item shape                      | corner-medium                                                         |
| Gap and group padding                    | 2, 2                                                                  |
| Label text, trailing text                | label-large                                                           |
| Supporting text                          | body-small                                                            |
| Focus indicator                          | secondary, 3dp, drawn inside (inner offset)                           |
| Active and inactive container (submenus) | corner-large, corner-small                                            |

### Color

| Role                    | Standard              | Vibrant                      |
| ----------------------- | --------------------- | ---------------------------- |
| Container               | surface-container-low | tertiary-container           |
| Label text              | on-surface            | on-tertiary-container        |
| Icons, supporting text  | on-surface-variant    | on-tertiary-container        |
| Selected item container | tertiary-container    | tertiary                     |
| Selected item content   | on-tertiary-container | on-tertiary                  |
| Active item state layer | on-surface at 8%      | on-tertiary-container at 8%  |
| Disabled content        | on-surface at 38%     | on-tertiary-container at 38% |

The active item is the one whose submenu is open; its state layer is the hovered one's.

### Behavior

- "Menus temporarily appear in front of all other permanent UI elements."
- Placement: "A menu is positioned relative to the window edge. It typically appears below, next to, or in front of the element that generates it."
- "A menu expands when opened." "In dense products, such as on desktop, menus can open instantly to reduce motion."
- "Menus can scroll when all menu items can't display at once."
- "Single-select menus can have one item selected at a time." "Multi-select menus can have many selected items. They stay open until the person dismisses the menu."
- "On web, menus can open submenus." Item states include "Active (main menu reveals submenu)". "Submenus are not currently available on Jetpack Compose."
- Focus: "When a menu has multiple submenus, focus follows the current hovered or focused submenu."
- Shape morphing: "As a person moves from one submenu to the next, the corners of the focused submenu become more rounded, while the unfocused submenu becomes less rounded." The tokens: active container corner-large, inactive corner-small.
- The spec sets no delay for opening a submenu with the pointer, nor a way across other items to an open one.

### Accessibility

- People exit a menu by "selecting an option", "tapping Escape or outside of the menu", or "using the system back button". "Where focus is placed after closing the menu depends on the app."
- Keyboard: Space or Enter opens a closed menu and selects an item in an open one; Up and Down open a closed menu and move between items; Left and Right open or close a submenu; letters move to the next item starting with them; Escape closes the menu. The table lists Tab as "Focus lands on menu", and the prose says "Tab to select a menu item".
- "Disabled menu items can receive focus but aren't selectable." "Dividers and gaps can't receive focus."
- Selected items change shape and color, with 3:1 contrast to unselected ones; "It's recommended to include another visual cue, like a checkmark".
- "The accessibility label should be the same as the menu item text." Icons next to text are decorative.

## Recommendations

- "If a menu is in a position to be cut off, it should automatically reposition to appear to the left, right, or above the element that generates it."
- "Submenus should open next to the parent menu item without overlapping it." "Position submenus to the side of the parent item."
- "When a menu opens, focus should be placed on the first menu item."
- "When a menu is opened, the corresponding button or icon button should remain the same visually, with the addition of a pressed state."
- "When a menu item can only be used under specific conditions, it should appear disabled rather than be removed."
- Use the vibrant style sparingly.
- Group items with gaps or dividers. Limit gaps to one or two, don't change their size, and don't use them in scrolling menus. "On web, use a divider to separate menu items."
- Slots can hold simple content such as images, progress indicators, or color swatches. Keep the item padding, keep targets at least 48 × 48dp, and don't put buttons, switches, or other actions inside an item.
- On compact screens, consider a bottom sheet instead of a menu. Submenus suit large screens.

## In Rio

### API

```vue
<RioButton ref="button" aria-haspopup="menu" :aria-expanded="open" @click="open = !open">
  Edit
</RioButton>
<RioMenu v-model:open="open" :anchor="button" label="Edit">
  <RioMenuItem @click="cut">
    <template #icon><CutIcon /></template>
    Cut
    <template #trailing-text>Ctrl+X</template>
  </RioMenuItem>
  <RioMenuDivider />
  <RioMenuGroup label="Share">
    <RioMenuItem @click="email">Email</RioMenuItem>
  </RioMenuGroup>
</RioMenu>
```

`RioMenu`

| Prop         | Type                                                                                                | Default      |
| ------------ | --------------------------------------------------------------------------------------------------- | ------------ |
| `open`       | `boolean`, with `v-model:open`                                                                      | `false`      |
| `anchor`     | an element, a component (its template ref), or a point `{ x, y, element? }` in viewport coordinates | —            |
| `variant`    | `'standard' \| 'vibrant'`                                                                           | `'standard'` |
| `selection`  | `'none' \| 'single' \| 'multiple'`                                                                  | `'none'`     |
| `modelValue` | a value (`single`), or an array of values (`multiple`), with `v-model`                              | —            |
| `label`      | `string`: names the menu for assistive technology                                                   | —            |
| `side`       | `'top' \| 'bottom' \| 'start' \| 'end'`                                                             | `'bottom'`   |
| `align`      | `'start' \| 'center' \| 'end'`                                                                      | `'start'`    |
| `offset`     | `number`, in px, between the anchor and the menu                                                    | `0`          |
| `instant`    | `boolean`: opens and closes without the expanding motion                                            | `false`      |

`RioMenuItem`

| Prop       | Type                                                        | Default |
| ---------- | ----------------------------------------------------------- | ------- |
| `value`    | `string \| number`: makes it selectable in a selecting menu | —       |
| `disabled` | `boolean`                                                   | `false` |

`RioSubMenu`: the item that opens a submenu, and the submenu's items inside it.

| Prop         | Type                                                             | Default  |
| ------------ | ---------------------------------------------------------------- | -------- |
| `label`      | `string`: the item's label, which also names the submenu         | —        |
| `disabled`   | `boolean`: the item stays focusable but doesn't open the submenu | `false`  |
| `selection`  | `'none' \| 'single' \| 'multiple'`: the submenu's own            | `'none'` |
| `modelValue` | the submenu's selection, with `v-model`                          | —        |

```vue
<RioSubMenu v-model="sort" label="Sort by" selection="single">
  <template #trailing-icon><ArrowRightIcon /></template>
  <RioMenuItem value="name">Name</RioMenuItem>
  <RioMenuItem value="date">Date</RioMenuItem>
</RioSubMenu>
```

- Slots: `default` (the label), `icon` (gets `{ selected }`), `supporting-text`, `trailing-text` (such as a keyboard shortcut), and `trailing-icon`. Icons are hidden from assistive technology. `RioSubMenu` takes the same slots for its item, except the label, which is its `label` prop, and its `default` slot holds the submenu's items, groups, dividers, and submenus. Rio ships no icons, so the arrow the M3 Design Kit draws on such an item (`arrow_right`) goes in `trailing-icon`, or is registered once for the app as `submenu` (see [Icons](../guide/icons.md)).
- Events: `click` on the item, which a disabled item doesn't emit. `update:open` and `update:modelValue` on the menu. **The app owns `open` and the selection**: the menu asks for changes and waits.
- `RioMenuGroup` takes a `label`, shown above its items and naming the group. `RioMenuDivider` is a separator.
- **Give the menu a `label`**, usually the trigger's text. ARIA doesn't require a menu to be named, but a screen reader announces the name on entering it.
- Trailing text is part of the item's name ("Cut Ctrl+X"). For a keyboard shortcut, also give the item `aria-keyshortcuts` (`<RioMenuItem aria-keyshortcuts="Control+X">`); attributes fall through to its `<button>`.
- Markup: the menu is a `<div role="menu">` shown as a popover, and each item a `<button>` with the role `menuitem`, `menuitemradio` (`single`), or `menuitemcheckbox` (`multiple`), and `aria-checked`. Groups are `role="group"`, dividers `role="separator"`. A submenu's item is a `menuitem` with `aria-haspopup="menu"` and `aria-expanded`, followed by the submenu's `<div role="menu">`, named by the label. Attributes given to `RioSubMenu` go to its item.

### Submenus

- **The pointer opens a submenu after resting on its item for 100ms, and a click opens it at once** (the timings are Radix's). Pointing at another item closes it. **Heading for an open submenu, the pointer may cross other items**: for 300ms after it leaves the item, it keeps the submenu while it stays within the triangle from where it left to the submenu's near side and moves that way, as in Radix. A submenu that had no room beside its item, and went below or above it, gets the same way down or up. The spec sets neither; Material Web waits 400ms both ways instead. A touch has no hover: a tap opens the submenu.
- **A click on the item of an open submenu keeps it open.** The item is the submenu's invoker (`popovertarget`), so that click isn't a click outside; the submenu still opens through `open`, not the browser.
- **Keys**: Right (Left in right-to-left layouts), Enter, and Space on the item open the submenu with the focus on its first item, or its selected one; a space while letters are being typed is part of the search. Left (Right) and Escape close it and give the focus back to the item, one level at a time. Tab and a choice close the whole menu. A click without a pointer, as from assistive technology, moves the focus in like the keys.
- **The focus follows the pointer into another open menu**, as the spec's "focus follows the current hovered or focused submenu" says: pointing at an item of a submenu, or back at one in the menu around it, moves the focus there, so the keys carry on where the pointer is. Opening a submenu with the pointer leaves the focus where it is, and within one menu, pointing doesn't move it. Heading for an open submenu across other items doesn't move it either.
- **Active and inactive shapes**: with a submenu open, the menu the pointer or the focus was last in keeps corner-large, and the other open menus take corner-small, on the `fast-spatial` curve as Rio's choice (`data-inactive`, which `attachMenu` reports and the menu's part renders). The active item, whose submenu is open, shows the hovered state layer, as the tokens say, where a menu button with its menu open shows the pressed one.
- **Placement**: beside the item on the end side, 4px off the menu around it, with the submenu's first item lined up with the item (Rio's choice; the kit draws no open submenu). Without room, it opens on the start side, then follows the menu's fallbacks.
- **A submenu keeps its own selection** (`selection`, `v-model`), as a menu does: choosing in a single-select one, or in one without a selection, closes the whole menu; a multi-select one stays open. Its color style and `instant` come from the menu around it.

### Opening and closing

- **The trigger is the app's.** It sets `aria-haspopup="menu"` and `aria-expanded` and toggles `open`. While both say so, a Rio button shows the pressed state layer, as the spec recommends (`base/state-layer.css`). It takes `aria-haspopup`: a button that only expands something, such as an accordion's, keeps its look. A split button does all this itself.
- **Placement**: next to the anchor on `side`, lined up by `align`, `offset` px away. Without room there, it tries the opposite side, then the sides of the anchor (from the bottom: top, end, start). A side only counts when the whole menu fits there. When nothing fits, it stays below or above, whichever has more room, and scrolls. Start and end follow the writing direction.
- **Anchors**: a template ref to a Rio component counts as its root element. A split button's menu uses `:anchor="split.trailing"`, `:offset="4"`, and `align="end"`, for the spec's "4dp from the split button" lined up with the trailing button. A context menu passes the point of the secondary click, with the `element` it is on. The menu keeps to that spot on the element as the page or a panel scrolls, as it follows an element anchor. The spec says nothing of scrolling while a menu is open; it ties a context menu to "a specific element", and a menu fixed on the screen would sit over whatever scrolled under it. A point without an element stays where it is on the screen. A new anchor, a point or an element, is a new request: an open menu opens afresh there, with the opening motion, as it opened the first time. Only an anchor that fills in where there was none, such as a template ref after the first render, moves it. The element also counts as what the menu opened from, so a context menu asked for inside an open popover opens within it rather than closing it.
- **A context menu opens when the press ends.** Browsers fire `contextmenu` while the button is still down on Linux and macOS, and by the spec's light dismiss, releasing it then counts as a click outside: WebKit closed such a menu at once. So from a `contextmenu` that comes with a button down, opening or moving the menu waits for the release, or a second at most if the release never comes. Other clicks and the keyboard never wait. A right-click elsewhere while it is open leaves it in place during the press, and it opens afresh at the new point on release. On Windows, where `contextmenu` comes after the release, the new point does the same. Where the release closes it and the closing is animated, as in VS Code's integrated browser, the closing is cut short first; reopening a menu still on screen would only turn the closing back. Checked in Chromium, WebKit, and Firefox; the Windows order only with synthetic events.
- **It closes** when an item is chosen (except in a multi-select menu), on Escape, on Tab, and on a click outside, including the trigger, which then closes it rather than reopening it. Opening another unrelated menu, or a modal dialog, closes it too.
- **Clicks and presses in the menu stay in it** (Rio's choice), its submenus' included, as in dialogs and tooltips: the menu shows in the top layer but sits in the app's markup, and a click on an item doesn't reach a card or a row around it with its own click. Keys go on. A right-click in an open menu opens nothing, not the browser's own menu either (Rio's choice), except on a field that takes text, for pasting and spelling. Code that listens for clicks on the document doesn't get them either, unless it listens while capturing, as VueUse's `onClickOutside` does.

### Keyboard and focus

- Opening focuses the first item, or in a menu that keeps a selection, the selected one. **Disabled items take the focus**, as the spec says.

  > **Deviation from a recommendation.** The spec says "When a menu opens, focus should be placed on the first menu item." With a selection, Rio starts from the selected item instead, so a keyboard user starts from the current choice, as a listbox does in the WAI-ARIA practices. Without one, it is the first item.

- Up and Down move between items, wrapping around. Home and End go to the ends. Letters move to the next item whose label starts with them; letters typed within 500ms add up, and repeating one letter cycles through its items.
- **Tab closes the menu and moves on from the trigger**, as in the WAI-ARIA menu button pattern. The spec's keyboard table and prose disagree about Tab; Rio reads them as Tab reaching the menu's trigger. With a point anchor, or an anchor that can't take the focus, there is nothing to move on from: Tab closes the menu and the focus goes back to the start of the document.
- Escape and choosing an item give the focus back to the anchor, or, for a point anchor, to whatever had it before. A click outside leaves the focus where the click put it.
- Pointing at an item shows its hover state but doesn't move the focus, unless the focus is in another open menu (see Submenus).

### Shape and spacing

- The M3 Design Kit lays out each item in a 48px row, with the 44px item inset 2px above and below and 4px at the sides. So items sit 4px apart and 4px from the container's edges, and the first item's corner-medium nests inside the container's corner-large. Each item keeps a 48px target over the space around it.
- **Sources disagree on the space between an item's elements**: the kit draws 8px, while the tokens and the spec page say 12px. Rio uses the token.
- Not in the vertical menu's tokens, so Rio takes them from the baseline menu: a minimum width of 112px and a maximum of 280px, and a 1px surface-variant divider. The group label is label-large in on-surface-variant, in a 32px row, as Rio's choice.
- Selecting changes an item's corners with the `fast-spatial` curve, in CSS. The item's top and bottom corners differ (first and last items), which the corner-morph primitive's start and end sides can't express.

### Motion

- Opening expands the menu from its anchor's side: it scales from 80% height on the `fast-spatial` curve and fades in on `fast-effects`. The side comes from `data-side` and `data-align`, so a menu that flipped above its anchor grows upward. Closing reverses it where the browser can animate leaving the top layer; elsewhere the menu closes at once, as in Firefox (checked in 160).
- `instant` turns the motion off, for dense products, as the spec allows. Under reduced motion the expansion is instant and the fade stays.

### Not yet

- Opening a menu from its trigger with the arrow keys.
- An alternative to submenus on compact screens, which the spec leaves to its adaptive guidance.
- Gaps between groups ("not currently available on web"), horizontal menus, the baseline menu, density, and filtering.
- `aria-controls` on the trigger, pointing at the menu.

## Sources

- [M3 Menus – Overview](https://m3.material.io/components/menus/overview)
- [M3 Menus – Specs](https://m3.material.io/components/menus/specs)
- [M3 Menus – Guidelines](https://m3.material.io/components/menus/guidelines)
- [M3 Menus – Accessibility](https://m3.material.io/components/menus/accessibility)
- [Material Web component tokens @ d872455](https://github.com/material-components/material-web/tree/d872455c4be56022da2095349b30ef46e0b55bc3/tokens/versions/latest/sass) (`_md-comp-menus.scss`, `_md-comp-menus-standard.scss`, `_md-comp-menus-vibrant.scss`, and the baseline `_md-comp-menu.scss`)
- M3 Design Kit (Figma), Menu page: the vertical menu's item rows and insets, and the active item and its arrow
- [WAI-ARIA Authoring Practices: Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
- [Material Web `sub-menu.ts` @ 37aa14b](https://github.com/material-components/material-web/blob/37aa14b843dcaeb3a46f898679fa6fcd109b1905/menu/internal/submenu/sub-menu.ts): 400ms hover delays, and the keys
- [Radix Menu `menu.tsx` @ eb3a2b7](https://github.com/radix-ui/primitives/blob/eb3a2b7091293e27df8f9ba906632d8daa3d81a3/packages/react/menu/src/menu.tsx#L1127-L1172): the 100ms hover delay, and the 300ms way to an open submenu
