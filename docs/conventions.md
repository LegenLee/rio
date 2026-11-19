# Conventions

How the Rio repository is organized and how code in it is written. Read this before adding a package, a component, a primitive, or a shared helper.

## Packages

| Package            | Contents                                                                                                                                                 | Depends on                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `@rio-m3e/tokens`  | Design tokens: color (via MCU), elevation, motion, shape, typography, and states. Produces CSS variables.                                                | Nothing at runtime (MCU is bundled)                  |
| `@rio-m3e/core`    | Framework-agnostic logic: component prop types, defaults, state, and accessibility attributes, plus DOM behaviors shared across components (primitives). | Nothing                                              |
| `@rio-m3e/styles`  | Plain CSS with no build step: component styles, plus shared base styles in `base/`. Uses only `--rio-*` CSS variables.                                   | Nothing (reads the tokens' CSS variables at runtime) |
| `@rio-m3e/vue`     | Thin Vue adapters over `core`, styled by `styles`. `createRio` wires the theme of `tokens` (`attachTheme`) and the language into the app.                | `core`, `styles`, `tokens`                           |
| `@rio-m3e/testing` | Test helpers the adapters share, such as `expectSkeleton` for the contract tests. Private: never published, no build.                                    | `core`                                               |
| `playground`       | Vite app for trying things out. Not published.                                                                                                           | Everything                                           |
| `docs`             | The docs site (VitePress), with live examples. Published to GitHub Pages, not to npm. See Docs site.                                                     | Everything                                           |

Adapters own state. `core` only reports what should change, and the adapter decides how to store it (`v-model` in Vue, a callback prop in React). See `core/src/switch/switch.ts`.

- **The component APIs keep nothing between calls.** Whatever a component needs to remember, such as whether the date picker opened from the keyboard, is state the adapter holds, which `core` asks to change through `onChange`, `on<State>Change`, or `onStateChange`.
- **DOM behaviors report too.** What an `attach*` finds out about the elements the adapter renders, such as where the pointer hovers on the time picker's dial, whether a dialog's content overflows, or which open menu is inactive, it reports through a callback; the adapter keeps it, and the parts render it as attributes. A DOM behavior writes directly only where the adapter doesn't render (the app's own element a tooltip describes, the document's root, a primitive's own marks such as `data-ripple`); marks it puts on and takes off around a single press, such as the slider's `data-pressed` and `data-dragging`; a native control's own state, which the browser changes too, put back to the adapter's, such as an input's `checked` or `value`; and values no render could keep up with: ones that change every frame, such as a spring's or a drag's, and ones undone within the same task. Detaching never takes off what a part renders.

## Folder layout

Every component has one kebab-case id (`switch`, `button`, `icon-button`, `fab-menu`), and every package uses that same id:

```
packages/
  tokens/src/
    color/color.ts          color roles, MCU integration
    elevation/elevation.ts
    motion/motion.ts
    shape/shape.ts
    state/state.ts          state-layer opacities, focus indicator
    typography/typography.ts
    prefix.ts
    theme.ts                combines every token into CSS variables
    index.ts
  core/src/
    primitives/             DOM behaviors shared across components
      anchored-position/
        anchored-position.ts  places a floating element next to an anchor (see Overlays)
      checkable/
        checkable.ts        keeps a native checkbox or radio button in line with the adapter's state
      drag/
        drag.ts
      form-reset/
        form-reset.ts       tells when a form has put its controls back, for the components that show the adapter's state on them
      overlay/
        overlay.ts          the top layer and the order of Rio's overlays (see Overlays)
      ripple/
        ripple.ts
        ripple.test.ts
      reduced-motion/
        reduced-motion.ts   prefersReducedMotion, for the spatial motion JavaScript drives
      shape-morph/
        shape-morph.ts      the corner radius, on top of spring-property
      spring/
        spring.ts           spring math and driver, used by other primitives
      spring-property/
        spring-property.ts  springs a value toward a CSS target per state
    button/                 component logic
      button.ts
      button.test.ts
    button-group/
      button-group.ts       props and selection rules
      interaction.ts        arrow keys and pressed widths (DOM, tested through the Vue component)
    checkbox/
      checkbox.ts           props, parts, and what a change asks for
      checkbox.test.ts
    chip/
      chip.ts               assist, filter, input, and suggestion chips, and the chip set: props, parts, selection
      interaction.ts        the chip set's tab stop, arrow keys, and focus after a removal (DOM, tested through the Vue components)
      chip.test.ts
    date-picker/
      date.ts               ISO dates and months, and writing and reading them as a language does
      date-picker.ts        the calendar, the field's reading, and the docked and modal pickers' parts
      interaction.ts        the calendar's keys and focus; the docked calendar's popover (DOM, tested through the Vue components)
      date.test.ts
      date-picker.test.ts
    dialog/
      dialog.ts             props, parts, and the role
      interaction.ts        opening, closing requests, focus, and scrolling (DOM, tested through the Vue component)
      dialog.test.ts
    icon-button/
      icon-button.ts        wraps createButton
      icon-button.test.ts
    locale/
      locale.ts             the language a component uses, and the first day of its week (see docs/guide/languages.md)
      messages.ts           the message tables' shape, lookup, and placeholders
      messages/             one table per language: en.ts, ko.ts
      locale.test.ts
    menu/
      menu.ts               the menu, its items, submenus, groups, and dividers: props, parts, selection
      interaction.ts        opening, placement, keyboard, focus, and submenus (DOM, tested through the Vue components)
      menu.test.ts
    progress/
      progress.ts           linear and circular indicators: props, parts, and the waves' paths
      interaction.ts        drawing the waves over the flat indicators, every frame (DOM, tested through the Vue components)
      progress.test.ts
    radio/
      radio.ts              the group and its radio buttons: props and parts
      interaction.ts        Shift+Tab into a group with nothing selected (DOM, tested through the Vue components)
      radio.test.ts
    slider/
      slider.ts             the slider and the range slider: props, parts, and the values they take
      interaction.ts        the pointer, the inputs' values, and the inset icon's room (DOM, tested through the Vue components)
      slider.test.ts
    split-button/
      split-button.ts       two createButtons, and the trailing one's menu state
      menu-icon.ts          the menu icon's springs (DOM, tested through the Vue component)
      split-button.test.ts
    switch/
      switch.ts             props, parts, and Enter, over a native checkbox
      handle.ts             the handle's springs and drag (DOM, tested through the Vue component)
      switch.test.ts
    text-field/
      text-field.ts         filled and outlined: props, parts, the label, errors, and the counter
      interaction.ts        a press on the field focuses the input; a text area's least height (DOM, tested through the Vue component)
      text-field.test.ts
    time-picker/
      time.ts               HH:MM times, and a language's clock and its AM and PM
      time-picker.ts        the input picker and the dialog: their parts, the dial's numbers, and reading typed times
      interaction.ts        the dial's pointer and keys, and AM and PM's arrow keys (DOM, tested through the Vue components)
      time.test.ts
      time-picker.test.ts
    tooltip/
      tooltip.ts            plain and rich tooltips: props, parts, roles, placement
      interaction.ts        showing, hiding, and ARIA on the element (DOM, tested through the Vue component)
      tooltip.test.ts
    parts.ts                PartAttrs, CancelableEvent, and mergePartAttrs (see Core output)
    utils/                  level 2 helpers (see Shared helpers)
      css.ts                parsePx: a computed px length as a number, for the DOM behaviors
      disabled.ts           isBlocked and disabledAttrs: disabled and soft-disabled, for every component with both
      focus.ts              FOCUSABLE_SELECTOR: the elements that take the focus themselves, for text field and select
      intl.ts               dateTimeFormat and numberFormat: one Intl format for each language and options
      keyboard.ts           hasModifier: Alt, Ctrl, or Meta held, for the keys components leave to shortcuts
      link.ts               linkAttrs: an `<a>`'s attributes as a link, disabled or not, for buttons and chips
      object.ts             resolveProps, which every component with defaults reads its props through
      typeahead.ts          moving by typing the start of a label, for menu and select
    index.ts
  styles/src/
    base/                   CSS shared across components
      anchored-position.css pairs with core's primitives/anchored-position
      focus-ring.css
      reduced-motion.css    imported by every component that uses motion tokens; pairs with core's primitives/reduced-motion
      ripple.css            pairs with core's primitives/ripple
      shape-morph.css       pairs with core's primitives/shape-morph
      state-layer.css
      touch-target.css      the 48px press target of buttons, chips, and the time picker's period buttons
    button.css
    button-group.css
    checkbox.css
    chip.css                the four chips and the chip set
    dialog.css
    icon-button.css         layered on top of button.css
    menu.css
    progress.css            the linear and circular indicators, flat, and their indeterminate motion
    radio.css               the radio buttons and their group
    slider.css              the slider and the range slider
    split-button.css        layered on top of button.css
    switch.css
    text-field.css
    tooltip.css
  vue/src/
    button/
      Button.vue
    button-group/
      ButtonGroup.vue
      context.ts            what the group provides; buttons read it with useButtonGroupItem
    checkbox/
      Checkbox.vue          a native checkbox; class and style on the root, other attributes on the input
    chip/
      AssistChip.vue
      FilterChip.vue
      InputChip.vue         class and style on the root, other attributes on the chip's action
      SuggestionChip.vue
      ChipSet.vue           holds the selection and the tab stop, and gives the chips their keys
      context.ts            what the set provides to its chips, and the chips' ripple on their state part
      Chip.vrt.test.ts      screenshot test (see Visual regression)
    dialog/
      Dialog.vue            a <dialog> shown modally (see dialog.md)
    icon-button/
      IconButton.vue
    progress/
      LinearProgress.vue
      CircularProgress.vue
      Progress.vrt.test.ts  screenshot test (see Visual regression)
    radio/
      RadioGroup.vue        holds the selection and gives the radio buttons their name
      Radio.vue
      context.ts            what the group provides to its radio buttons
    ripple/
      ripple.ts             the v-ripple directive
    shape-morph/
      shape-morph.ts        v-shape-morph, used inside components (not exported yet)
    slider/
      Slider.vue            a native range input; class and style on the root, other attributes on the input
      RangeSlider.vue       two native range inputs in a group, which takes the app's attributes
      Slider.vrt.test.ts    screenshot test (see Visual regression)
    switch/
      Switch.vue            a native checkbox; class and style on the root, other attributes on the input
      Switch.vrt.test.ts    screenshot test (see Visual regression)
    text-field/
      TextField.vue         class and style on the root, other attributes on the input
    rio/
      rio.ts                createRio: the theme and the language for the whole app
    tooltip/
      Tooltip.vue           wraps the element it is for (see tooltip.md)
    test/
      setup.ts              fails a test during which Vue warns
      vrt.ts                shared setup for the screenshot tests
    contract.test.ts        every component against core's skeletons (see Testing)
    menu/                   a component family keeps its parts together
      Menu.vue
      MenuItem.vue
      SubMenu.vue           an item and the submenu it opens
      MenuGroup.vue
      MenuDivider.vue
      context.ts            what a menu or submenu provides to what is inside it
    index.ts
  testing/src/              private, shared by the adapters' tests
    contract.ts             expectSkeleton and findPart, for the contract tests
    index.ts
```

- Inside a folder, the main file is named after the folder (`switch/switch.ts`, `color/color.ts`).
- Don't add `index.ts` barrels inside folders. Each package has exactly one, at `src/index.ts`.

## File naming

- TypeScript and CSS files use kebab-case.
- Vue SFCs use PascalCase without the `Rio` prefix (`Switch.vue`). They are exported with the prefix (`RioSwitch`).
- Each adapter otherwise names its files the way its framework does: a React adapter's components would be PascalCase too (`Button.tsx`).
- Tests sit next to the code they test: `switch.ts` → `switch.test.ts`.

## Public API

- Each package's only entry point is `src/index.ts`. The `exports` field in `package.json` blocks deep imports.
- Exception: `@rio-m3e/styles` exposes CSS files one by one, including those in `base/` (`@rio-m3e/styles/switch.css`, `@rio-m3e/styles/base/ripple.css`).
- Inside the workspace, the `@rio-m3e/source` export condition points TypeScript and Vite at `src/` instead of `dist/`, so changes show up without a rebuild.

## Core output

How `core` hands a component's markup to the adapters. The stylesheets depend on that markup, so it is a contract: every adapter has to produce the same thing. Keeping it in `core` means a new adapter is a thin layer, not a second copy of the markup.

- **Parts.** A component's `core` API returns one attribute bundle for each part of its markup: the root, and parts such as `touch`, `icon`, and `label`. A part is named after the element in its class (`rio-button__icon` is `icon`).
- **Classes come from `core`.** Each bundle includes the part's `class`, so the class names the stylesheet selects on are written once, in `core`.
- **Adapters render the skeleton that `core` defines** (see below): the elements, how they nest, and where content goes are all in `core`. Whether an optional part renders (`showsIcon()`) and which content fills it (`showsSelectedIcon()`) are `core`'s calls too; the adapter only wires them to its conditional rendering (`v-if` in Vue) and puts its slots or children where the skeleton says.
- **Bundles are HTML attributes**, as `setAttribute` would take them:
  - Names are HTML attribute names: `class`, `tabindex`, `aria-pressed`, `data-variant`. Never a framework's spelling, such as `className` or `tabIndex`.
  - Values are strings, or `undefined` to leave the attribute out. Boolean HTML attributes, such as `disabled`, are `''` when on and `undefined` when off. ARIA states are `'true'` and `'false'`.
  - `style` carries only Rio's own custom properties, as `name: value` declarations separated by `;` (the time picker's `--rio-time-picker-angle`), for values the stylesheet can't select on.
- **State attributes are written by how many states they have.** Stylesheets select on these, so the spelling is part of the contract, and primitives follow it too.
  - Two states (on or off): present as `''`, or absent. `data-pressed`, `data-dragging`, `data-icon`, `data-ripple`, `data-shape-morph`.
  - Three states (doesn't apply, off, on): absent, `'false'`, or `'true'`, like `aria-pressed`. `data-selected` is absent on a button that isn't a toggle and `'false'` on a toggle that is off, which the filled toggle needs for its own off colors.
  - More values: the value itself. `data-variant`, `data-size`, `data-shape`, `data-width`.
- **Events stay out of the bundles.** `core` exposes named handlers, such as `handleClick`. Each adapter wires them in its own syntax (`@click`, `onClick`, `on:click`).
  - A handler takes any event it can cancel (`CancelableEvent`, which only needs `preventDefault()`): a DOM event, or a framework's own, such as React's synthetic events. `core` hands the same event back where it reports one (`onClick(event)`), so the components are generic over the event's type, with `MouseEvent` as the default, and the app gets its framework's event.
- **Callbacks to the adapter are named by what they report: `onChange` for state, the event's name for anything else.** A request to change the state the adapter owns is `onChange`, with the requested value, which the adapter may or may not accept: the `selected` of the button, the icon button, and the switch, and the button group's selection. Anything else gets its own name, such as the button's `onClick`. The adapter maps `onChange` to its framework's way of reporting state, such as `update:selected` for `v-model:selected` in Vue.
  - A component that owns more than one state keeps `onChange` for its main value and names the others `on<State>Change`: a menu would have `onChange` for its selection and `onOpenChange` for whether it is open. In Vue they become `v-model` and `v-model:open`.
- **One normalize function per adapter** turns a bundle into its framework's props. For Vue it changes nothing, since `v-bind` takes HTML attributes as they are. A React adapter would map `class` to `className`, `tabindex` to `tabIndex`, `style` to an object, and `''` booleans to `true`. How an adapter reads a bundle is its own business; only the bundle's shape is fixed.
- **The app's attributes and a part's meet in `mergePartAttrs`**, wherever an adapter passes the app's attributes to an element of the component's own, such as a text field's input. A part's `undefined` means Rio sets nothing there, not that the app's value goes, so the app's value stays. A value the part sets wins, except in an id list (`aria-describedby`, `aria-labelledby`, ...), where the app's ids come first and the part's follow: an app's own description of an input and Rio's supporting text both reach assistive technology. In `aria-labelledby` the names add up too: an app's own label and Rio's `label` make one name. `class` and `style` are merged the framework's way. `packages/vue/src/attrs.test.ts` holds every such component to it.
  - On a component's root, the framework's own way of passing attributes on applies instead. In Vue, its fallthrough lets the app's values win there, Rio's included, id lists too: an app's `aria-labelledby` on a dialog replaces the headline's id rather than adding to it.
- **Text a component shows comes from `core`'s message tables** (`locale/messages/`), in the language the adapter resolves: the component's own `locale`, or one provided the framework's way (in Vue, `RioLocaleProvider` and `createRio`, through `provide`; in React, a context), with `resolveLocale` filling in the rest. The app's own tables and fallback language reach `messagesFor` the same way. A component's `messages` prop replaces any of its text. Dates and numbers go through `Intl` in the same language. See `docs/guide/languages.md`.
- **Why HTML**: HTML attributes are the DOM standard rather than any framework's convention, so `core` stays framework-neutral, and each adapter's normalize function absorbs the differences.

For example, `createButton` returns `parts.root()`, `parts.touch()`, `parts.icon()`, and `parts.label()`, plus `showsIcon()`. The adapter tells `core` what content it has through `content` (`{ icon: true }` when the icon slot is filled), because only the adapter can see its slots or children; `core` turns that into attributes such as the switch's `data-icon`.

Each component also exports its **skeleton** (`buttonSkeleton`, a `PartNode` tree): which part sits inside which, what element each one is, which render only on a decision such as `showsIcon`, and which hold content. It is the machine-readable form of the contract, which the contract tests check every adapter against (see Testing). When the props change which element a part is, the component exports a skeleton for each, and a decision that says which applies: a button with `href` is `buttonLinkSkeleton`, an `<a>`, while `isLink()` is true.

## Adapters

How an adapter turns `core`'s API into components.

- **An adapter holds only what its framework needs.** If a second adapter would have to write the same code again (DOM work, a default, a type), it belongs in `core`, or in `tokens` for the theme.
- **Defaults live in `core`.** Adapters declare props without defaults, and `core` fills in whatever is still undefined. Every component with defaults (`switchDefaults`, `sliderDefaults`, ...) reads its props through `resolveProps` (`utils/object.ts`), which takes a prop passed as `undefined` as its default. Vue passes an absent string prop that way, and so does an adapter that hands on a prop the app left out, as a React one would. That leaves room for a button group to supply the size or shape a button didn't set. In Vue, list each prop twice (in the destructuring and in the getter passed to `core`) and end the getter with `satisfies Record<keyof ButtonProps, unknown>`, so a prop missing from the getter fails the build instead of silently disappearing.
  - One catch: Vue turns an absent boolean prop into `false`. That is harmless while every boolean default in `core` is `false`. A boolean whose default is `true` needs `= undefined` in the destructuring, which stops the cast and lets `core`'s default through.
- **Each adapter decides what belongs to its framework**: the framework versions it supports (its `peerDependencies`), how state and its callbacks are named in the framework's idiom (Vue's `v-model:selected`; in React, a controlled `selected` with `onSelectedChange`), and its file names (see File naming). Within one adapter, every component follows the same naming.
- **Rio's CSS variables fit the framework's `style` types.** Apps put `createThemeVariables(…)` and Rio's public variables (`--rio-focus-ring-color`, `--rio-spring-targets`) in `style`. Vue's `CSSProperties` takes any `--*` key already. React's leaves custom properties out on purpose and points to module augmentation, so a React adapter adds `--rio-*` keys, and only those, to React's `CSSProperties`; `@rio-m3e/tokens` stays free of any framework's types.

## Primitives

A primitive is a DOM behavior that several components share, such as the press ripple. Primitives live in `core/src/primitives/` and are public API, exported from `core/src/index.ts` for every adapter to use.

- **Only behaviors that need JavaScript.** If CSS alone can do it, it belongs in `styles/src/base/` instead. The state layer and the focus ring turned out to be CSS-only; the ripple needs the press position, and the spring needs per-frame math.
- **Not every primitive attaches to an element.** `spring/` is math plus a value driver (`solveSpring`, `createSpring`), which element primitives such as `shape-morph/` build on. It still lives in `primitives/` because it exists to drive DOM animation.
- **DOM behavior that belongs to one component** stays in that component's folder in `core` (for example `switch/handle.ts`), built from primitives. It moves into `primitives/` once a second component needs it, like a shared helper.
- **Shape: `attachX(element)` returns `{ detach() }`.** It takes a real element, adds listeners or animations, and gives back a handle that undoes everything. Adapters attach on mount and detach before unmount.
- **State goes out through `data-*` attributes** on the element (`data-ripple`, `data-pressed`), so CSS can react without knowing about the JavaScript.
- **Visuals go in a paired base stylesheet**: `primitives/ripple/ripple.ts` pairs with `styles/src/base/ripple.css`. The primitive handles behavior, and the stylesheet handles appearance.
- **The stylesheet selects on the primitive's data attribute, not on a class** (`[data-ripple]`, not `.rio-ripple`). Vue rewrites `class` whenever a `:class` binding changes and would drop a class the primitive added, but it leaves attributes it doesn't own alone.
- **Adapters expose primitives in their framework's idiom.** In Vue, that's a directive (`vRipple` → `v-ripple`) that attaches on mount, detaches before unmount, and imports the paired stylesheet. A React adapter would use a hook instead.
- **Springs see their targets through a transition.** A stylesheet that declares a target for `attachSpringProperty` (directly, or through `attachShapeMorph`) does two things on the element:
  - It lists the target in `transition` as `<target> 1ms step-end`. While the element is rendered, the browser then reports every change of the target, whatever causes it: a state attribute, `:hover`, a theme variable on an ancestor, or the element's position among its siblings. A change made while it isn't rendered (`display: none`, or out of the document) makes no transition; the primitive catches up, without animating, when the element shows again. Without the transition, including when the app's CSS replaces the `transition` list, the spring never moves and the stylesheet's value shows.
  - It draws the animated property from the target, not from the expression behind it: `border-start-start-radius: var(--rio-shape-morph-start-target)`, not `var(--_radius)`. `step-end` holds the old value until the spring takes over, so the new value doesn't flash for a frame first.

  CSS can't add to a `transition` list, so components keep their spring targets in the public `--rio-spring-targets` and end their `transition` with `var(--rio-spring-targets)`. A stylesheet that springs more targets on an element extends the variable, as the split button's trailing button does, and an app that sets its own `transition` on one of these elements includes it. The variable is defined only on elements that spring, so it doesn't belong in a `transition` anywhere else: an undefined `var()` drops the whole declaration.

- Primitives are tested in a real browser (see Testing).

### Overlays

Menus, tooltips, and dialogs float above the page. Two primitives carry them: `attachOverlay` shows them and keeps them in order, and `attachAnchoredPosition` places menus and tooltips next to what opened them. These are Rio's decisions; the spec only asks that "menus temporarily appear in front of all other permanent UI elements".

- **Overlays live in the top layer, not on a z-index.** Menus and tooltips are popovers, and dialogs are `<dialog>` shown with `showModal()`. The top layer stacks them in the order they open, above the page, so a dialog covers a menu opened before it, and a menu opened from a dialog covers the dialog. No ancestor's `overflow` or `transform` clips them, and the app doesn't manage z-indexes. The cost: nothing outside the top layer can sit above an open Rio overlay. A top layer element the app opens later, such as its own dialog, does.
- **Menus use the browser's popover stack** (`popover="auto"`). A popover inside another one, or shown from an element inside it (`show(source)`), keeps that one open; showing an unrelated one closes the rest; a click outside closes them all; and a modal dialog closes them as it opens. That is how nested menus behave, and it held in Chromium 158, WebKit 27.2, and Firefox 160.
- **Rio fills in where the browser falls short or differs:**
  - Escape closes only the topmost overlay. Firefox closes at once every popover that opened without a user activation, such as a submenu opened on hover, while Chromium and WebKit close the topmost. `attachOverlay` takes the keydown first (bubbling, so an element that handles Escape itself keeps it), cancels the browser's handling, and asks the topmost overlay to close.
    - Escape aimed at a dialog or popover the app opened itself, with the focus inside it, is left to the browser. One case is left over: an auto popover of the app's own, above a Rio overlay and without the focus, doesn't get Escape.
    - While a Rio overlay is open, even a tooltip, Escape arrives canceled. An app that handles Escape on `window` only when `defaultPrevented` is false doesn't see it then. That's accepted: closing a tooltip with Escape is what WCAG 1.4.13 asks for.
  - Closing an overlay closes the overlays opened from it. The browser does this for nested popovers but not for a popover opened from a dialog.
  - A transient overlay, such as a tooltip, closes when any other overlay opens. Tooltips are `manual` popovers, since Safari doesn't support `popover="hint"` yet.
  - `covered()` tells whether an overlay opened later, other than a transient one, is still open. A click on a dialog's scrim asks the dialog to close only when nothing covers it, so the click closes the menu over it first (Rio's choice).
  - Each document keeps its own record, so overlays in an iframe stack among themselves.
- **Adapters keep clicks and presses in a tooltip or a dialog**, in their framework's own events. The overlay shows in the top layer but sits in the app's markup, where a card or a row around it may handle clicks of its own. Keys go on, for Escape. Core can't do it: frameworks such as React handle events at the app's root, so a native `stopPropagation()` in the overlay would hide every click in it from the app. Vue stops them on the overlay's element (`@click.stop`); a React adapter would stop React's events where its portal begins.
- **`open` stays the adapter's,** with one limit. The adapter calls `show()` and `hide()`, and `onClose(reason)` tells it when an overlay closes or asks to close on its own:
  - `'escape'`: Escape, or the back gesture on a dialog. This one is a request: the overlay is still open, and the adapter can turn it down, as a dialog with unsaved changes might.
  - `'dismiss'`: the browser closed it, after a click outside or another popover or modal dialog opening. A closing popover's `beforetoggle` can't be canceled, so this can't be stopped.
  - `'parent'`: the overlay it was opened from closed.
  - `'replaced'`: another overlay opened, and this transient one gave way.

  All but `'escape'` arrive after the overlay closed, so the adapter has to follow them. A component's own API still reports through `onChange` and `on<State>Change` (see Core output); the reason is the primitive's.

- **The adapter may apply `open` late, or not at all.** React, for one, renders state set outside its own events a task or more later. So `attachTooltip` and `attachSubMenu` go by the state they last asked for, or were synced to, rather than by what the DOM shows: a press between asking a tooltip to open and its opening still closes it, and moving on from an item closes the submenu it asked to open. An app may also turn a request down by leaving `open` as it is; the next event asks again. `attachDialog` asks at every Escape and click on the scrim, so a request turned down that way never blocks the next.

- **Placing is done in JavaScript, not with CSS anchor positioning.** Anchor positioning reached every engine only in January 2026 (Chrome 125, Safari 26, Firefox 147), so older browsers would get no placement at all. JavaScript also tells the stylesheet which side the element ended up on (`data-side`), which the opening motion needs, and can anchor to a point, as context menus do. Revisit once anchor positioning is Baseline widely available (mid-2028).

## Shared helpers

A helper moves up only when a second caller actually needs it.

| Level | When                                       | Where                                                                                                         |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1     | Used in one file (the default)             | Stays in that file, not exported                                                                              |
| 2     | A second file in the same package needs it | `src/utils/<topic>.ts`, not exported from the package                                                         |
| 3     | A second package needs it                  | `packages/shared`, a private package bundled into each consumer by tsdown. Created the day it's first needed. |

- Don't extract ahead of time. For example, `kebab` in `color/color.ts` stays at level 1 until another file needs it.
- Group helpers by topic (`utils/string.ts`, `utils/math.ts`). No catch-all `utils.ts` or `helpers.ts`.
- Rename on the way up. A short local name like `kebab` becomes `kebabCase` once it's shared.
- Helpers are not public API. Functions users call, such as `colorVar` and `elevationVar`, live in their feature folder and are exported from `index.ts`. Helpers never are.
- Helpers are pure functions. Nothing in `utils/` or `shared` touches the DOM or a framework. DOM behaviors are primitives.
- A helper may keep what it made for the next call with the same arguments, as `utils/intl.ts` keeps `Intl` formats; what it returns stays the same.
- Helpers get tests, next to the source like everything else.

## Code style

- **Formatting**: oxfmt with single quotes, semicolons, and a 100-column line width (`.oxfmtrc.json`). Run `pnpm fmt` to format and `pnpm fmt:check` to check.
- **Linting**: oxlint with the eslint, typescript, unicorn, oxc, and vue plugins (`.oxlintrc.json`). Run `pnpm lint`. Vue templates aren't linted yet; ESLint may be added for them later if template mistakes become common.
- **Language**: write code comments, everything under `docs/`, `README.md`, and the package READMEs in English. Localized READMEs live in `i18n/`, such as `i18n/README.ko.md`.
- **Version pins**:
  - tsdown, oxfmt, and oxlint are pinned to exact versions because they are pre-1.0 or move fast.
  - Vitest and `@vitest/browser-playwright` are pinned to the same exact version, so the browser provider always matches Vitest.
  - TypeScript stays on 6.x until vue-tsc supports TypeScript 7.
  - VitePress is pinned to an exact version while 2.0 is in alpha. Its stable 1.x line is built on Vite 5.
  - Shared versions live in the `catalog` in `pnpm-workspace.yaml`.

## Writing about the spec

`docs/foundations.md` covers the system-wide foundations, and each component gets its own page in `docs/components/<id>.md` (for example `docs/components/button.md`), with Spec, Recommendations, and In Rio sections.

In all of them, keep three kinds of statements apart and label them:

- **Spec**: token values and normative definitions from Google.
- **Recommendations**: guidance prose on m3.material.io (dos, don'ts, "should").
- **In Rio**: what Rio decides on top, with the reason.

From Compose Material3, use only the public interface: signatures, `*Defaults` objects, `tokens/*.kt`, and public KDoc and samples. Never rely on `private` or `internal` code, and link the files at the androidx commit you read.

Rio's defaults follow the spec. Recommendations become options or component-level practice, and never quietly change a default. Never present a Rio decision as the spec. Where Rio goes against the spec or a recommendation, mark the spot with a quoted note that starts with **Deviation from the spec.** or **Deviation from a recommendation.**, and say what Rio does instead and why. See the ripple's touch delay in `docs/foundations.md`, section 6.

## Docs site

`docs/` is also a VitePress site (`@rio-m3e/docs`). `.github/workflows/docs.yml` publishes it to GitHub Pages when a release is published, together with npm, so the site matches the released packages. Run `pnpm docs:dev` to work on it and `pnpm docs:build` to check it; the build fails on dead links, but not on dead anchors (`page.md#heading`), so check those by hand.

Publishing needs a one-time setup on GitHub:

1. **Settings → Pages → Source**: "GitHub Actions".
2. **Settings → Environments → github-pages → Deployment branches and tags**: allow the branch `main` and the tags `v*`. GitHub creates this environment with the first step and usually allows only the default branch, which is `dev`. A deployment from a release tag or from `main` then fails with "… is not allowed to deploy to github-pages due to environment protection rules".

- **Pages** are the Markdown files under `docs/`. The navigation and sidebar are in `docs/.vitepress/config.ts`, so a new page needs an entry there.
- **Examples**: each component page starts with an Examples section. An example is a plain SFC in `docs/components/demos/<id>/`, written as app code would be (imports from `@rio-m3e/vue`, no docs-only helpers), because the page shows its source as the example's code:

  ```md
  <Demo><Variants /></Demo>

  ::: details Code
  <<< ./demos/button/Variants.vue
  :::
  ```

- **One adapter draws the examples.** Every adapter renders the same markup (see Core output and Markup contract), so the live examples use the Vue adapter only. When another adapter exists, its code goes next to the Vue code in a code group, and the live example stays Vue.
- **The site wears Rio's theme.** `docs/.vitepress/theme/` writes the theme variables during server rendering and points VitePress's colors and font at them. Examples sit in `.vp-raw`, which keeps VitePress's styles out (`docs/postcss.config.mjs`), so they look the way they do in an app.
- **Imports come from `src`** through the `@rio-m3e/source` condition, as in the playground, so the site always shows the current code without a build.
- The build also writes `llms.txt` and `llms-full.txt`, Markdown copies of the docs for AI tools, with each example's code in place of the live example (vitepress-plugin-llms).
- On GitHub, the Markdown shows `<Demo>` and `:::` blocks as plain text. Read the docs on the site.

## Testing

Vitest runs three projects, configured in the root `vitest.config.ts`:

| Project   | Covers                                                          | Runs in                                                        | Command            |
| --------- | --------------------------------------------------------------- | -------------------------------------------------------------- | ------------------ |
| `unit`    | `packages/tokens`, `packages/core` (except `primitives`)        | Node                                                           | `pnpm test`        |
| `browser` | `packages/vue` (`*.test.ts`) and `packages/core/src/primitives` | Headless Chromium through Playwright                           | `pnpm test`        |
| `vrt`     | `packages/vue` (`*.vrt.test.ts`)                                | Headless Chromium at 1280×720; in CI, the Playwright container | `pnpm test:visual` |

- `pnpm test` watches for changes locally and runs once in CI. Pass `--run` to run once locally.
- First-time setup: `pnpm exec playwright install chromium`.

### Calculations

- Assert exact values for anything transcribed from a spec, and keep a second copy of the spec values in the test, written independently of the source (see `elevation.test.ts`). A typo in the source then fails the test instead of slipping through.
- Use snapshots for output too large to write by hand (see `color.test.ts`). Snapshots live in `__snapshots__/` next to the test and are committed.
- Review snapshot diffs like code. An unexpected diff after a dependency upgrade, such as MCU, is a regression until proven otherwise. Update snapshots with `pnpm test --run -u` only when the change is intended.

### Rendering and behavior

- Render components with `vitest-browser-vue` in real Chromium, and query elements by role (`getByRole('switch')`), not by class name.
- Test the adapter contract: what the component emits, and that the parent owns the state.
- Test primitives on a plain element built in the test, by dispatching the events they listen to (see `ripple.test.ts`).
- Playwright refuses to click elements with `aria-disabled="true"`, but real pointers can still click them. To test a disabled guard, use `click({ force: true })`.
- Check focusability with `element.focus()` and `document.activeElement`, not with Tab. Where Tab lands depends on where the previous test left the focus, which can be outside the page, so Tab-based tests pass or fail depending on test order.
- **A test during which Vue warns fails** (`packages/vue/src/test/setup.ts`, a setup file of the browser projects). Vue warns only in development, so nothing else would catch what it warns about. A warning that comes after a test has ended fails the next test, or the file.

### Markup contract

- `packages/vue/src/contract.test.ts` renders every component in a few configurations and checks the DOM against the component's skeleton from `core` with `expectSkeleton` (`@rio-m3e/testing`). For each configuration it builds the `core` API from the same props and content, and checks, part by part:
  - the tag, and the order and nesting of the parts, with none missing and none extra, and no part whose decision is false;
  - every attribute `core` gives the part: class names as tokens, `undefined` as absent;
  - no text outside the parts that hold content, since it would end up in the accessible name;
  - on parts inside the root, no `aria-*`, `role`, or `tabindex` that `core` didn't give, so an adapter can't hide or rename what assistive technology reads.
- Other extra attributes are allowed, such as `data-ripple` from a primitive, and so is anything on the root, which the app can pass attributes through to.
- Which content fills a part (`showsSelectedIcon()`) is checked in the contract test itself, with `findPart`, since the skeleton doesn't look inside content.
- Configurations cover each decision both ways (with and without an icon, on and off, toggles), disabled states, and one with every non-boolean prop away from its default, which catches a prop the adapter fails to pass on.
- A new component gets a skeleton in `core` and a block in the contract test. A new adapter writes the same test against the same skeletons, with the same `expectSkeleton` from `@rio-m3e/testing`, a private package that is never published, since it uses the DOM and Vitest.

### Visual regression

Pixels differ across operating systems, fonts, and browser versions, so the committed reference screenshots come from one fixed environment: the official Playwright container (`mcr.microsoft.com/playwright:v1.65.0-noble`) that the `visual` job in `ci.yml` runs in. They are never made on a local machine.

- **Writing tests**: name them `*.vrt.test.ts`, next to the component. Import the helpers from `packages/vue/src/test/vrt.ts`: they load Roboto from `@fontsource/roboto` instead of relying on system fonts, apply the default theme, and render a gallery on the theme's surface in the light or dark scheme. `keyboardFocus()` focuses an element so it shows its focus ring; assert `:focus-visible` before the screenshot.
- **Keep galleries inside the 1280×720 test frame.** Anything past it is cut off; lay large sizes out in rows.
- **References** are stored in `__screenshots__/` next to the test and committed. In CI a missing or different screenshot fails the `visual` job, which uploads the actual and diff images as the `visual-diffs` artifact.
- **Locally**, `pnpm test:visual --run` compares against references in `.vitest/screenshots/` instead, which is git-ignored, so it shows what your change did on your machine. The first run creates them and fails with "Review it before running tests again"; run it again.
- **To add or update references**: push the branch, run **Actions → Update screenshots** on it, download the `screenshots` artifact, and extract it at the repository root (`unzip screenshots.zip && tar xf screenshots.tar`). Review the images like code, then commit them.
- **Upgrading Playwright**: the version in the root `package.json` is pinned and must match the container tag in `ci.yml` and `screenshots.yml`. Change all three together, then retake every reference.
- Failure artifacts (actual and diff images) go to `.vitest/attachments/`, which is git-ignored.

### Known quirks

- The `unit` project inlines `@material/material-color-utilities` (`server.deps.inline`) because MCU 0.4.0 breaks under Node ESM (upstream #195).
- If Vitest warns that Vite reloaded a test page, add the newly optimized dependency to `optimizeDeps.include` in the browser projects.
- `getAnimations()` doesn't report animations on a pseudo-element that doesn't exist, which is the case when the test loads no CSS that gives it `content`. To check that a primitive animates `::after`, spy on `element.animate` instead.

## Branches and commits

- `dev` is the working branch and GitHub's default. Open pull requests against `dev`.
- `main` moves only on releases.
- Before you commit, run:

  ```sh
  pnpm fmt:check && pnpm lint && pnpm typecheck && pnpm test --run && pnpm build && pnpm docs:build
  ```

- CI (`.github/workflows/ci.yml`) runs the same checks on every push to `dev` and every pull request against `dev` or `main`, on Node 24 with a frozen lockfile. Its `visual` job runs the `vrt` project in the Playwright container (see Visual regression).
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `ci:`, `chore:`.
  - `test:` changes only tests, test helpers, or reference screenshots.
  - `ci:` changes only `.github/workflows/`.

## Releases

Each version goes to npm and to a GitHub release, as the same four tarballs. The packages are published under the `@rio-m3e` scope, which belongs to the `rio-m3e` organization on npm.

- **Versions move together.** Every published package under `packages/` has the same version, and the tag is that version with a `v` (`v0.1.0`). Private packages, such as `testing`, keep `0.0.0`; the release scripts skip them. Before 1.0, a minor version may break the API.
- **CHANGELOG.md** gets a `## [x.y.z] - date` section for each release, in the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format, plus a link reference at the bottom. The release notes are that section, followed by a `pnpm add` line.
- **Tarballs** come from `pnpm release:pack`, which builds and packs each package into `release/`. Each tarball carries the repository's `LICENSE` and `NOTICE`, which Apache-2.0 requires with every copy; the NOTICE also credits material-color-utilities, bundled in `@rio-m3e/tokens`. That's why `NOTICE` is in each package's `files`.
- **Preview the notes** with `pnpm release:notes v0.1.0`. The script fails if a package's version doesn't match the tag or the changelog has no section for it.
- **npm publishing is trusted publishing** (OIDC) from `.github/workflows/publish.yml`. No npm token is stored anywhere, and npm attaches provenance, which needs the `repository` field in each `package.json`. `publishConfig.access` is `public` because scoped packages are private by default.

To release:

1. On `dev`, set the version in every `packages/*/package.json`, add the CHANGELOG.md section, and commit.
2. Merge `dev` into `main` with `--no-ff`, so each release is one merge commit on `main`, and push `main`.
3. Tag that merge commit (`git tag -a v0.1.0 -m v0.1.0`) and push the tag.
4. Fast-forward `dev` to `main` and push it, so the tag is reachable from `dev` too (`git describe` and `git log v0.1.0..` work there).
5. `.github/workflows/release.yml` runs the CI checks, writes the notes, packs, and creates a **draft** release with the tarballs attached.
6. Review the draft on GitHub and publish it. That starts `publish.yml`, which publishes the same tarballs to npm, dependencies first. Versions already on npm are skipped, so a failed run can be re-run. It also starts `docs.yml`, which publishes the docs site.

### Trusted publishing setup

npm can only trust a workflow for a package that already exists, so the first version of each package is published by hand:

1. After `release.yml` has made the draft, download its four tarballs.
2. Log in with `npm login`. With a passkey as the second factor, finish the login in a browser that can reach the passkey: Chrome, or the phone itself. Firefox on Linux can't.
3. Publish the tarballs, dependencies first: `npm publish ./rio-m3e-tokens-0.1.0.tgz`, then `core`, `styles`, and `vue`. Keep the `./`: npm reads a path like `release/x.tgz` as a GitHub repository.
4. Publish the draft. `publish.yml` finds every version already on npm and skips them.

Then, shortly before the next release, set up each package on npmjs.com:

1. **Settings → Trusted Publisher → GitHub Actions**: owner `LegenLee`, repository `rio`, workflow `publish.yml`, environment `npm`. The label is optional. A new trusted publisher expires if it doesn't publish within 2 days, so don't set it up long before a release.
   - **Allowed actions**: turn on **Allow npm publish**, and leave **Allow npm dist-tag** off. `npm stage publish` is always allowed, and new trusted publishers allow only that by default. A staged version waits in npmjs.com → Staged Packages until a maintainer approves it with the second factor, and the approval can't use OIDC. `publish.yml` publishes directly with `npm publish`, so it needs the publish permission. It sets the dist-tag while publishing (`--tag`), which worked for v0.2.0 without the dist-tag permission; that permission is for running `npm dist-tag` on its own.
   - The provider and the required fields can't be changed later; to change them, delete the trusted publisher and create a new one.
   - Editing a package's settings needs a session signed in with the second factor. If npmjs.com answers "Please configure 2FA to edit this package" although 2FA is on, sign in again where the passkey works (Chrome, or the phone).
2. After the first release published this way, set **Settings → Publishing access** to "Require two-factor authentication and disallow tokens". Trusted publishing keeps working, because it doesn't use tokens.
