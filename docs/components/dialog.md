# Dialog

`RioDialog` from `@rio-m3e/vue`, built on `createDialog` and `attachDialog` from `@rio-m3e/core` and `@rio-m3e/styles/dialog.css`. The dialog is a `<dialog>` shown modally in the top layer (see "Overlays" in [conventions.md](../conventions.md)). Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-26.

## Examples

<script setup>
import Adaptive from './demos/dialog/Adaptive.vue';
import Basic from './demos/dialog/Basic.vue';
import FullScreen from './demos/dialog/FullScreen.vue';
import Icon from './demos/dialog/Icon.vue';
import KeepOpen from './demos/dialog/KeepOpen.vue';
import List from './demos/dialog/List.vue';
</script>

### Basic

<Demo><Basic /></Demo>

::: details Code
<<< ./demos/dialog/Basic.vue
:::

### With an icon

An icon centers itself and the headline.

<Demo><Icon /></Demo>

::: details Code
<<< ./demos/dialog/Icon.vue
:::

### A list that scrolls

The headline and the buttons stay put while the list scrolls, and dividers show where more of it is hidden.

<Demo><List /></Demo>

::: details Code
<<< ./demos/dialog/List.vue
:::

### Keeping it open

Change the name, then press Escape or click outside the dialog.

<Demo><KeepOpen /></Demo>

::: details Code
<<< ./demos/dialog/KeepOpen.vue
:::

### Full-screen

Type a title, then press the close button: a basic dialog asks before discarding it.

<Demo><FullScreen /></Demo>

::: details Code
<<< ./demos/dialog/FullScreen.vue
:::

### Adaptive

Full-screen in a window narrower than 600px, and a basic dialog with a Cancel button in a wider one. Resize the window while it is open.

<Demo><Adaptive /></Demo>

::: details Code
<<< ./demos/dialog/Adaptive.vue
:::

## Spec

### Variants

| Variant     | Use                                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Basic       | "Basic dialogs interrupt users with urgent information, details, or actions. Common use cases for basic dialogs include alerts, quick selection, and confirmation."                      |
| Full-screen | "Full-screen dialogs fill the entire screen, containing actions that require a series of tasks to complete." They "are for compact breakpoints only"; larger windows use a basic dialog. |

- "A dialog is a modal window that appears in front of app content to provide critical information or ask for a decision. Dialogs disable all app functionality when they appear, and remain on screen until confirmed, dismissed, or a required action has been taken."
- Anatomy of a basic dialog: container, icon (optional), headline (optional), supporting text, divider (optional), button label text, and scrim.

### Measurements

| Attribute                        | Value                                    |
| -------------------------------- | ---------------------------------------- |
| Container shape                  | 28dp corner radius (corner-extra-large)  |
| Container width                  | min 280dp, max 560dp; height dynamic     |
| Padding                          | 24dp top, bottom, left, and right        |
| Icon                             | 24dp                                     |
| Between the icon and the title   | 16dp                                     |
| Between the title and the body   | 16dp                                     |
| Between the body and the actions | 24dp                                     |
| Between buttons                  | 8dp                                      |
| Alignment                        | centered with an icon, start without one |
| Divider                          | 1dp                                      |

### Color and type

| Element         | Color                  | Type           |
| --------------- | ---------------------- | -------------- |
| Container       | surface-container-high | —              |
| Icon            | secondary              | —              |
| Headline        | on-surface             | headline-small |
| Supporting text | on-surface-variant     | body-medium    |
| Buttons         | primary                | label-large    |
| Divider         | outline                | —              |
| Scrim           | scrim                  | —              |

- Container elevation is level 3.

### Behavior

- Buttons: "Buttons are aligned to the trailing edge of the dialog for easier interaction. The confirmation button is always closest to the edge." "Button alignment responds automatically for right-to-left languages."
- "Dialogs should contain a maximum of two actions." A single action must be an acknowledgement; with two, "one must be a confirming action, and the other a dismissing action". "Stacked buttons accommodate longer button text, but take up more room. Confirming actions appear above dismissive actions."
- Scrolling: "Most dialog content should avoid scrolling. Even when scrolling is required, the dialog title is pinned at the top, with buttons pinned at the bottom." "Dialogs don't scroll with elements outside of the dialog, such as the background."
- Position: "Basic dialogs appear in a center position by default." "Their position can be overridden to provide a more ergonomic experience", within "a 56dp margin from the edges of the screen" on larger screens.
- "To focus attention on the dialog, surfaces behind the container are scrimmed with a temporary overlay to make them less prominent."
- "Dialogs use an enter and exit transition pattern to appear on screen." That pattern, for components within the screen bounds such as dialogs: "Android components expand and collapse along the x or y axis as they enter and exit. Scale and z-axis motion is avoided since they imply elevation change."
- "Dialogs retain focus until dismissed or an action has been taken." "Because they take up the entire screen, full-screen dialogs are the only dialogs over which other dialogs can appear."

### Full-screen dialogs

Anatomy: container, header, icon (close affordance), headline (optional), text button, and divider (optional).

| Attribute                  | Value                                     |
| -------------------------- | ----------------------------------------- |
| Container shape            | 0dp corner radius (corner-none)           |
| Container width and height | the container's width, max 560dp; dynamic |
| Header                     | 56dp high, the container's width          |
| Headline                   | start-aligned, title-large                |
| Icon (close affordance)    | 24dp                                      |
| Content padding            | 24dp top, left, and right                 |
| Between elements           | 8dp                                       |
| Divider                    | 1dp                                       |
| Bottom action bar          | 56dp high, the container's width          |

| Element                      | Color (tokens)                       |
| ---------------------------- | ------------------------------------ |
| Container                    | surface                              |
| Header                       | surface; surface container on scroll |
| Close icon                   | on-surface                           |
| Headline                     | on-surface                           |
| Header and action bar button | primary, label-large                 |
| Divider                      | surface-variant                      |

- The container, header, and bottom action bar are at elevation level 0; the header's and the action bar's tokens give level 2 on scroll.
- The measurement drawing puts the close icon 16dp from the start edge and the headline 16dp after it, the content 24dp from the sides, and the Save button's label about 30dp from the end edge. It brackets the header at 64dp, where the table and the token (`header.container.height`) give 56dp.
- The spec page's color drawing labels the container "Surface container high", while its token data, and Material Web's `_md-comp-full-screen-dialog.scss`, give surface.
- "Full-screen dialogs fill the entire screen, containing actions that require a series of tasks to complete. One example is creating a calendar entry with the event title, date, location, and time." They suit content with form fields, changes that "aren’t saved instantly", and dialogs that open more dialogs.
- "Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and expanded breakpoints, use a basic dialog." "Dialogs can swap variants as the breakpoint changes. For example, a full-screen dialog can change into a basic dialog at larger breakpoints." The breakpoints page sets compact "Under 600dp", and among its swappable components gives a compact window a "Basic or full-screen dialog" and medium and expanded windows a "Basic dialog".
- "To save a selection in a full-screen dialog, use Save. The close icon or dismissive action, such as Cancel or Back, should close the dialog." "Because full-screen dialogs can only be completed, dismissed, or closed, the close “X” icon button should be the only navigation option in the app bar."
- "When someone dismisses a full-screen dialog, a basic dialog should appear to confirm that they want to discard the unsaved changes."
- "Use a container transform pattern to transition a FAB into a full-screen dialog." The motion scheme's slow speed is for "Full-screen transitions" ([foundations.md](../foundations.md)).

### Accessibility

- "When a dialog appears, focus should automatically land on the first interactive element within the dialog."
- Keyboard: Tab, "Focus lands on the next interactive element contained in the dialog, or the first element if focus is currently on the last element"; Shift+Tab, the same backward; Space or Enter, "Triggers or commits the action of the focused element"; Escape, "Closes the dialog".
- "The accessibility label for a dialog is typically the same as the dialog's title or headline." "On web, basic dialogs should have the alert dialog role."
- People should be able to "scroll the dialog to access all of its contents if that content extends beyond the container of the dialog".

## Recommendations

- "Dialogs are purposefully interruptive, so they should be used sparingly." Use them "for prompts that block an app's normal operation, and for critical information that requires a specific user task, decision, or acknowledgement". "Don't use dialogs for low- or medium-priority information. Instead use a snackbar."
- Headlines should "contain a brief, clear statement or question" and "avoid apologies ('Sorry for the interruption'), alarm ('Warning!'), or ambiguity ('Are you sure?')".
- "Disable confirming actions until a choice is made. Dismissive actions are never disabled." "Don't place dismissive actions to the right of confirming actions."
- "Providing a third action, such as Learn more, is not recommended as it navigates the user away from the dialog."
- Keep strings concise, so they don't wrap or truncate at 200% text size.
- Full-screen: "Avoid placing long headlines in a full-screen dialog’s app bar", "as the truncated text may lead to misunderstanding"; shorten the text, or place a longer headline in the content. "Don’t use the confirming action to dismiss the full-screen dialog".

## In Rio

### API

```vue
<RioDialog v-model:open="open" headline="Discard draft?">
  Your draft will be lost.
  <template #actions>
    <RioButton variant="text" @click="open = false">Cancel</RioButton>
    <RioButton variant="text" @click="discard">Discard</RioButton>
  </template>
</RioDialog>
```

| Prop       | Type                                                | Default                                              |
| ---------- | --------------------------------------------------- | ---------------------------------------------------- |
| `open`     | `boolean`, with `v-model:open`                      | `false`                                              |
| `variant`  | `'basic' \| 'full-screen' \| 'adaptive'`            | `'basic'`                                            |
| `headline` | `string`: says what the dialog is for, and names it | —                                                    |
| `role`     | `'alertdialog' \| 'dialog'`                         | `'alertdialog'` for basic, `'dialog'` for the others |
| `locale`   | `string`: the close and Cancel buttons' language    | the provided one, or the page's                      |
| `messages` | `Partial<DialogMessages>`: their names              | —                                                    |

- Slots: `default` (the supporting text, or a list or a form), `icon` (above the headline; a basic dialog only), `actions` (up to two buttons, usually text buttons; the confirming one only, for a full-screen or adaptive dialog), and `close-icon` (the full-screen dialog's close icon, in place of the registered `close`).
- Event: `cancel`, with a `DialogCancelEvent` (`reason`: `'escape'`, `'scrim'`, or `'dismiss'`, from the close or Cancel button). See below.
- Fallthrough attributes, such as `class` or `aria-label`, go to the `<dialog>`.

### Opening and closing

- The app owns `open`. Rio opens the `<dialog>` with `showModal()`: it sits in the top layer above a scrim, and the rest of the page is inert.
- **Escape and a click on the scrim ask to close**, and so do a full-screen dialog's close button and an adaptive one's Cancel button. `cancel` fires first; the dialog closes unless a listener calls `preventDefault()`, as a dialog with unsaved changes might. The spec's "Basic dialogs require a person to take action before it will close" leaves the scrim open to reading; Compose (`DialogProperties.dismissOnClickOutside`, `true` by default) and Material Web close on it, and Rio does too.
- A click on the scrim while a menu or another dialog opened from this one is open closes only that one. A press that starts in the dialog and ends on the scrim, as selecting text may, doesn't count.
- Buttons close the dialog through the app, by setting `open`. A `<form method="dialog">` inside closes it too, and `open` follows.
- **Clicks and presses in the dialog stay in it** (Rio's choice): they don't reach the app's markup around the `RioDialog`, such as a card with its own click. Keys go on. Code that listens for clicks on the document doesn't get them either, unless it listens while capturing, as VueUse's `onClickOutside` does.
- Opening a modal dialog closes the open menus, and a dialog closes with the overlay it sits in. Put a `RioDialog` outside a menu's markup, next to the menu rather than in an item.
- **The content renders only while the dialog is open**: from opening until the closing motion ends, which `attachDialog` reports with `onClosed`. A closed dialog is an empty `<dialog>`, so no headline or ids stay in the page for a table of contents, a script, or the server-rendered HTML to find. Input that isn't bound to the app's state starts over at each opening, and so does the scroll position.
- **The page behind doesn't scroll while a dialog is open**: the document's root gets `overflow: hidden`. A page that had a scrollbar keeps its space (`scrollbar-gutter: stable`), so the page doesn't shift sideways; a page that reserves it already is left as it is. The root's own inline styles come back when the last dialog closes. A page that scrolls inside an element of its own, rather than the document, still scrolls.

### Focus and keyboard

- **Opening moves the focus to the first element Tab reaches**: the first button, or a radio group's checked button. An element marked `autofocus` takes it instead. Browsers differ here on their own (Chromium focused a scrolling list, WebKit a group's first radio button), so Rio moves the focus itself (Rio's choice).
- For other adapters, `attachDialog` takes `initialFocus`, which comes ahead of `autofocus`: React, for one, doesn't leave `autoFocus` in the DOM, and focuses the element as it mounts, while the dialog is still closed.
- Closing returns the focus to where it was before, usually the button that opened the dialog. The browser does this.
- **Tab and Shift+Tab go round the dialog**, as the spec's keyboard table says. A native modal dialog lets Tab leave for the browser's own UI after its last element. Elements inside shadow roots aren't counted.
- **Content that scrolls, with nothing inside that takes the focus, takes it itself** (`tabindex="0"`, Rio's choice), so the keyboard can scroll it. Chromium does this for scrolling elements already; WebKit doesn't. When the dialog opens, the focus still goes to the first button.

### Assistive technology

- **The role is `alertdialog` by default for a basic dialog, and `role="dialog"` switches to a plain dialog**. The spec says "On web, basic dialogs should have the alert dialog role"; WAI-ARIA keeps `alertdialog` for messages that ask for a response, and a screen reader announces it as an alert. Use `role="dialog"` for a list, a picker, or a form.
- An alert dialog is described by its content (`aria-describedby`), so its message is read with its name.
- The headline names the dialog (`aria-labelledby`) and is an `<h2>`. Without a headline, give the dialog an `aria-label`.
- The icon is hidden from assistive technology (`aria-hidden`): the headline says what the dialog is for.

### Layout

- A basic dialog sizes to its content between 280px and 560px wide, keeps 24px from the window's edges, and sits in the center. The app can move it with CSS on `.rio-dialog`, for the spec's custom positions.
- **Buttons sit at the end, in the order the app gives them: the dismissing one first, then the confirming one, nearest the edge.** When they don't fit side by side, they stack with the confirming one on top. Right-to-left layouts mirror this. It is CSS only (`flex-wrap: wrap-reverse`), so it follows the DOM order.
- The buttons' containers keep the 24px padding; text buttons' labels sit further in by the buttons' own padding.
- **The content scrolls between the pinned headline and buttons, with dividers that show while it scrolls**, at the edge where more of it is hidden: below the headline once it has scrolled down, and above the buttons while there is more below. `attachDialog` reports where more is hidden, and the content's part renders it as `data-overflow-top` and `data-overflow-bottom`. Scrolling stops at the content's ends rather than moving on to the page (`overscroll-behavior: contain`).

### Full-screen and adaptive

- **`variant="full-screen"` covers the window**, whatever its width. Its container is surface, from the tokens. The header, 56dp high as the table and the token give it, holds the close button, the headline, and the `actions` slot, with the content under it, padded 24dp on each side.

  > **Deviation from the spec.** The measurement table gives the container "Container width; Max 560dp", while the guidelines say full-screen dialogs "fill the entire screen", and are for compact windows only, where the window is that wide or narrower anyway. Rio covers the window at any width: a full-screen dialog narrower than the window would need a position, a shape, and a scrim the spec doesn't give it. For a wider window, use `variant="adaptive"`, which turns basic from 600px up.

- **Rio draws the close button**, a standard icon button on surface with the registered `close` icon, or the `close-icon` slot's, named "Close" in the dialog's language (`messages.close`). It asks to close as Escape does: `cancel` fires with the reason `'dismiss'`, and `preventDefault()` keeps the dialog open, as to show a basic dialog that confirms discarding, as in the example. A dialog opened from it shows in front.
- **Header**: as the measurement drawing shows, the close icon 16dp from the start and the headline 16dp after it: the close button in a 48dp place, 4dp from the start, as in an app bar, and 4dp on to the headline. The headline is title-large on one line, ending in an ellipsis if it doesn't fit. The `actions`, a text button such as Save, sit 12dp from the end, so the button's label ends 28dp in, where the drawing's ends about 30dp in (Rio's choice: a 4dp step, near the drawing). Without a headline or actions, only the close button.
- **The header fills with surface container while the content is scrolled under it**, the token's on-scroll color, without a shadow, as an app bar does. The content scrolls under the header, and has no dividers.
- **A full-screen dialog has no icon**, as its anatomy has none: the `icon` slot shows only while it is basic.
- **The role is `dialog`** for a full-screen or adaptive dialog (Rio's choice: the spec gives the alert dialog role to basic dialogs only, and a full-screen dialog holds a form, which is no alert). `role="alertdialog"` sets it back.
- **`variant="adaptive"` is full-screen in a compact window, narrower than 600px, and basic from 600px up**, at the spec's compact breakpoint, switching as the window changes while it is open. `attachDialog` reports it (`onCompactChange`) and `createDialog` takes it (`compact`). Basic, it draws a Cancel text button (`messages.cancel`) before the `actions`, in place of the close button, which asks to close the same way (Rio's choice: the spec's dismissive action, "such as Cancel or Back", where a basic dialog's buttons go). The content stays mounted as it switches, as when a phone turns, so a text field keeps the focus and what was typed in it. The `actions` move between the header and the bottom, so they render anew: a button in them that had the focus loses it, and a component there starts over.
- Opening focuses the close button, the first element Tab reaches: "focus should automatically land on the first interactive element".

### Motion

- **The container expands downward from the top and the content fades in once the container is under it; closing fades it all out as the container collapses** (Rio's choice, after Material Web's dialog). The container starts at 35% of its height, as Material Web's does, and expands on `default-spatial`; the content fades in on `fast-effects` after `fast-effects`; the scrim fades in on `default-effects`. Closing fades out on `fast-effects` while the container collapses on `fast-spatial`.
- Under reduced motion the container doesn't expand or collapse; the fades stay.
- **A full-screen dialog slides up 48px as it fades in, and back down as it fades out** (Rio's choice), its content with it. It opens at the spec's speed for full-screen transitions: `slow-spatial` and `slow-effects`; it closes on `default-spatial` and `default-effects`. The container reaches 48px below the window, so the slide's overshoot doesn't uncover the bottom. Under reduced motion it fades without moving.
- Where the browser can't keep a closing dialog in the top layer (the `overlay` property, missing in WebKit and Firefox 160), closing is instant. Fading out of the top layer, the dialog would no longer be modal, and would move off its place to wherever the page's scroll puts it.
- Checked in Chromium, WebKit, and Firefox 160 with real input: the motion, Escape, the scrim, and Tab. Focus only in Chromium and WebKit: headless Firefox fires no focus events.
- The full-screen and adaptive dialogs, checked in Chromium and WebKit, and in Firefox 161 with real input: the slide, the close button, a confirming dialog in front, Escape, and the switch as the window resizes.

### Values and their sources

- Colors, type, the shape, the icon size, and the elevation come from Material Web's component tokens (`_md-comp-dialog.scss`, Material 3 v34.0.21). The sizes and spacing come from the spec page's measurements.
- The full-screen dialog's come from the spec page's token data (`md.comp.full-screen-dialog.*`) and its measurements.
- The scrim is the `scrim` color at 32% opacity (`_md-comp-scrim.scss`).
- The M3 Design Kit's Dialogs page holds basic, list, scrollable list, and XR dialogs, and no full-screen dialog.

### Not yet

- **The container transform from a FAB** into a full-screen dialog, which waits for FABs.
- **The bottom action bar** and the optional divider of a full-screen dialog.
- **Full-screen date and time pickers** for compact windows ([date-picker.md](date-picker.md)).

## Sources

- [M3 Dialogs – Overview](https://m3.material.io/components/dialogs/overview)
- [M3 Dialogs – Specs](https://m3.material.io/components/dialogs/specs), its measurement drawing for the full-screen dialog, and the token data it loads (`/_dsm/data/dsdb-m3/2026-11-19_06-20-01/TOKEN_TABLE.0b1e39a67d5bafdc.json`, `md.comp.full-screen-dialog.*`)
- [M3 Dialogs – Guidelines](https://m3.material.io/components/dialogs/guidelines)
- [M3 Dialogs – Accessibility](https://m3.material.io/components/dialogs/accessibility)
- [M3 Motion – Transition patterns](https://m3.material.io/styles/motion/transitions/transition-patterns): enter and exit
- [M3 Breakpoints – Overview](https://m3.material.io/foundations/layout/breakpoints/overview): compact, under 600dp, and the swappable components
- [Material Web component tokens @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass) (`_md-comp-dialog.scss`, `_md-comp-scrim.scss`, `_md-comp-full-screen-dialog.scss`)
- [Material Web `md-dialog` @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/dialog/internal) (`dialog.ts`, `animations.ts`, `_dialog.scss`): the 35% container, the click on the scrim, and the dividers
- [Compose Material3 `AlertDialog.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/AlertDialog.kt): `AlertDialog` and `BasicAlertDialog` signatures (public interface only)
- [Compose UI `Dialog.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/ui/ui/src/commonMain/kotlin/androidx/compose/ui/window/Dialog.kt#L35-L42): `DialogProperties` (public, `dismissOnClickOutside = true`)
- M3 Design Kit (Figma), Dialogs page: the dialogs it holds
- [WAI-ARIA Authoring Practices: Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) and [Alert and Message Dialogs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)
