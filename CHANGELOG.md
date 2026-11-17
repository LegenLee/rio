# Changelog

Notable changes to Rio, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Before 1.0, any minor version may break the API.

Each version is published to npm and as a GitHub release, with the same tarballs attached.

## [0.5.0] - 2026-11-18

### Added

- **Link buttons**: `href` on `RioButton` and `RioIconButton` (and `createButton` and `createIconButton`) renders the same button as an `<a href>`, with `buttonLinkSkeleton`, `iconButtonLinkSkeleton`, and `isLink()` for adapters. A link can't toggle. Disabled, it keeps no `href` and takes `role="link"` with `aria-disabled="true"`; `softDisabled` keeps it focusable. A router's link works through its `custom` slot, passing `href` and `navigate`.
- **`RioSelect`** and **`RioSelectOption`**, with `createSelect`, `createSelectOption`, and `attachSelect` in `@rio-m3e/core`: a text field that opens a list of options, filled or outlined, with `v-model`. The list is an M3E menu (standard or vibrant), placed below the field and at least as wide. `multiple` keeps the list open, and the field lists the selected options separated by commas, unless the app shows the selection itself in the `value` slot. The focus moves into the list, and the keys follow the menu's. A hidden native `<select>` submits the selection under `name` and checks `required`, and a change the browser makes to it, as autofill would, comes back through `v-model`. Without a width from the app, the field is as wide as its widest option. The app brings the dropdown arrow, in a slot.
- **`RioDatePicker`** and **`RioDatePickerDialog`**, with `createCalendar`, `createDatePicker`, `createDatePickerDialog`, `attachCalendar`, and `attachDatePickerMenu` in `@rio-m3e/core`: the docked date picker, a calendar below a text field, and the modal one, a calendar in a dialog that switches to a text input. Dates are ISO strings, `YYYY-MM-DD`. Typed dates are read on Enter and on leaving the field, in any separators, and written back in the language's format. Choosing a day waits for OK; Enter on a day chooses and confirms. `min`, `max`, `isDateDisabled`, an opt-in Clear, a month list and a year list, and `name` for forms. The app brings the icons, in slots.
- **`RioTimeInput`** and **`RioTimePickerDialog`**, with `createTimePicker` and `attachTimePicker` in `@rio-m3e/core`: the M3 Expressive input time picker, on the page, and the dial time picker in a dialog, which switches to the text input. Times are `HH:MM` on a 24-hour clock. The clock, 12 hours with the language's AM and PM or 24 with an inner ring, comes from the language, or `hourCycle`. The dial picks with the pointer, following a drag, and goes on to the minutes after an hour; from the keyboard, Enter on the hour or minute moves onto it. The dialog lays the dial out below the fields, or beside them in a short window, or as `layout` says. The app opens the dialog with its own button, and brings the mode button's icons in slots.
- `style` in a core part's attributes, for Rio's own custom properties; the contract tests compare it declaration by declaration.
- **`createRio`** in `@rio-m3e/vue`, one plugin for the whole app: `app.use(createRio({ theme, locale }))`. It writes the theme on the page's root before the app mounts, again whenever a ref or getter to it changes, and takes it off when the app unmounts; `rio.css` holds the theme as a stylesheet, for server rendering. It sets the app's language, adds the app's own message tables (`messages`), and names the language that fills in for one Rio has no table for (`fallbackLocale`). `@rio-m3e/vue` now installs `@rio-m3e/tokens`.
- **Languages**: `RioLocaleProvider`, `useLocale`, and `useMessages` in `@rio-m3e/vue`, and `resolveLocale`, `firstDayOfWeek`, `messagesFor`, and `formatMessage` in `@rio-m3e/core`, with message tables in English and Korean. A component takes its language from its own `locale`, the nearest provider, `createRio`, the document's `lang`, the browser's language, or English, and its `messages` prop replaces any of its text.
- `colorScheme` in `createThemeCss` (`@rio-m3e/tokens`): another `color-scheme` than `light dark`, or `false` for none.
- `data-focused` on a text field's root makes it look focused while the focus is elsewhere, as a select's is while its list is open.

### Fixed

- Attributes the app gives `RioTextField`, `RioSelect`, `RioCheckbox`, `RioRadio`, or `RioSubMenu`, such as `aria-describedby` or `aria-invalid`, were dropped wherever Rio had no value of its own for them. They now stay. Rio's own values still win, and `aria-describedby` and `aria-labelledby` list the app's ids first, then Rio's. Adapters merge them with the new `mergePartAttrs` in `@rio-m3e/core`.
- In a menu, once letters had moved the focus to an item, Space no longer pressed items until the menu closed, even after typing had stopped. It now presses the item once the letters typed stop adding up, after 500ms.

## [0.4.0] - 2026-11-17

Form controls: the checkbox, radio buttons, and the text field. Core no longer keeps clicks inside tooltips and dialogs, which hid them from frameworks such as React; adapters do it with their own events, which breaks code that passed `contain` to `attachOverlay`.

### Added

- **`RioCheckbox`**, with `createCheckbox` in `@rio-m3e/core`: a native checkbox with `v-model:selected`, `indeterminate`, an error state, and `disabled` or `softDisabled`. Indeterminate becomes checked on a press, for parent checkboxes.
- **`RioRadioGroup`** and **`RioRadio`**, with `createRadioGroup`, `createRadio`, and `attachRadioGroup`: native radio buttons in a `role="radiogroup"` that holds the selection with `v-model` and gives them a shared `name`. The browser moves the arrow keys and the tab stop; where engines differ, the group follows the spec: the arrow keys wrap around at the ends, and Shift+Tab into a group with nothing selected lands on the last.
- Both lay out at the 48px target, take their label from the app's `<label>`, submit their value with a form, and keep showing the app's state when it turns a change down.
- `attachCheckable` in `@rio-m3e/core`: keeps a native checkbox or radio button in line with the adapter's state.
- **`RioTextField`**, with `createTextField` and `attachTextField`: filled and outlined text fields with `v-model`, a label that moves to the top (into a gap in the outline for the outlined variant), leading and trailing icon slots, prefix and suffix text, supporting text, error text that takes its place and is announced, a counter for `maxlength`, `required`, `readonly`, and `disabled`. `multiline` makes it a text area, which the person can make taller from its corner.
- `initialFocus` in `attachDialog`'s options: the element to focus as the dialog opens, ahead of `autofocus`. React, for one, doesn't leave `autoFocus` in the DOM.

### Changed

- **BREAKING**: `attachOverlay` no longer takes `contain`, and `attachTooltip` and `attachDialog` no longer keep clicks and presses in the overlay. A native `stopPropagation()` there hid every click inside from frameworks that handle events at the app's root, such as React. Adapters keep them in with their framework's own events; `RioTooltip` and `RioDialog` still do.

### Fixed

- With an adapter that applies `open` late, as React does for state set outside its own events, a press between asking a tooltip to open and its opening left it open afterward, and a submenu kept opening after the pointer had moved on. Both now go by the state they last asked for.

### Not yet

- Full-screen dialogs, which wait for a top app bar.
- Text fields that grow with their text, and updating the value while an IME composes.
- Opening a menu from its trigger with the arrow keys, horizontal menus, and filtering.
- Link buttons (`href`), emphasized button labels, and a form value for the switch.
- Language-specific line heights and variable font axes in the type scale.

## [0.3.0] - 2026-11-16

Three components that float above the page: the menu, with submenus, the tooltip, and the dialog. Two new primitives carry them, one that shows them in the top layer and keeps them in order, and one that places them. Nothing breaks: core's click handlers now also take other frameworks' events.

### Added

- **`RioMenu`**, with `RioMenuItem`, `RioMenuGroup`, `RioMenuDivider`, and `RioSubMenu`, built on `createMenu`, `createMenuItem`, `createMenuGroup`, `createMenuDivider`, `createSubMenu`, `attachMenu`, and `attachSubMenu`.
  - Standard and vibrant color styles, single and multi-select with `v-model`, and `v-model:open`.
  - Anchored to an element, a Rio component, or a point for context menus. It opens on any side of the anchor, flips where there is no room, and follows the anchor as the page scrolls.
  - Keyboard: arrow keys, Home and End, type-ahead, Escape, and Tab, as in the WAI-ARIA menu button pattern.
  - Submenus open after the pointer rests 100ms, on a click, or with the arrow keys. The pointer may cross other items on its way to an open submenu, and each submenu keeps its own selection.
  - A Rio button that opened a menu (`aria-haspopup` and `aria-expanded`) shows the pressed state layer while the menu is open. A split button's menu is a `RioMenu` anchored to `split.trailing`.
- **`RioTooltip`**, with `createTooltip` and `attachTooltip`.
  - Plain and rich tooltips. A rich one may have a subhead and up to two text buttons, and may be persistent: it opens on a click and stays.
  - It shows after the pointer rests 500ms, at once on keyboard focus, and on a held touch, and hides 1.5s after the pointer and the focus leave.
  - It describes its element (`aria-describedby`) unless the element's name already says the same.
  - Button groups look through a tooltip's wrapper, so a button inside a tooltip still counts as one of the group's buttons.
- **`RioDialog`**, with `createDialog` and `attachDialog`: basic dialogs.
  - An alert dialog by default, or `role="dialog"` for lists and forms. It has an optional icon and headline, and up to two buttons, which stack with the confirming one on top when they don't fit side by side.
  - Escape and a click on the scrim fire a cancelable `cancel` event. Tab stays inside the dialog. The focus starts at the first element and goes back where it was when the dialog closes.
  - The content scrolls between the pinned headline and buttons, with dividers, and the page behind doesn't scroll while the dialog is open.
  - A closed dialog renders no content.
- **Primitives** in `@rio-m3e/core`:
  - `attachOverlay` shows menus, tooltips, and dialogs in the top layer and keeps them in order. Escape closes only the topmost one, and closing one closes what it opened.
  - `attachAnchoredPosition` places a floating element next to an anchor or a point.
- **`CancelableEvent`** in `@rio-m3e/core`: `createButton`, `createIconButton`, `createSplitButton`, and `createMenuItem` are generic over the click event, `MouseEvent` by default, so an adapter can pass its framework's own events, such as React's synthetic events. `createSwitch`'s `handleClick` takes any cancelable event.

### Not yet

- Full-screen dialogs, which wait for a top app bar.
- Opening a menu from its trigger with the arrow keys, horizontal menus, and filtering.
- Link buttons (`href`), emphasized button labels, and a form value for the switch.
- Language-specific line heights and variable font axes in the type scale.

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
[0.3.0]: https://github.com/LegenLee/rio/releases/tag/v0.3.0
[0.4.0]: https://github.com/LegenLee/rio/releases/tag/v0.4.0
