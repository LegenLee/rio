# Dialog

`RioDialog` from `@rio-m3e/vue`, built on `createDialog` and `attachDialog` from `@rio-m3e/core` and `@rio-m3e/styles/dialog.css`. The dialog is a `<dialog>` shown modally in the top layer (see "Overlays" in [conventions.md](../conventions.md)). Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-16.

## Examples

<script setup>
import Basic from './demos/dialog/Basic.vue';
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

| Prop       | Type                                                | Default         |
| ---------- | --------------------------------------------------- | --------------- |
| `open`     | `boolean`, with `v-model:open`                      | `false`         |
| `headline` | `string`: says what the dialog is for, and names it | —               |
| `role`     | `'alertdialog' \| 'dialog'`                         | `'alertdialog'` |

- Slots: `default` (the supporting text, or a list or a form), `icon` (above the headline), and `actions` (up to two buttons, usually text buttons).
- Event: `cancel`, with a `DialogCancelEvent` (`reason`: `'escape'` or `'scrim'`). See below.
- Fallthrough attributes, such as `class` or `aria-label`, go to the `<dialog>`.
- **Basic dialogs only**. The full-screen dialog waits for the top app bar, which its header is.

### Opening and closing

- The app owns `open`. Rio opens the `<dialog>` with `showModal()`: it sits in the top layer above a scrim, and the rest of the page is inert.
- **Escape and a click on the scrim ask to close**. `cancel` fires first; the dialog closes unless a listener calls `preventDefault()`, as a dialog with unsaved changes might. The spec's "Basic dialogs require a person to take action before it will close" leaves the scrim open to reading; Compose (`DialogProperties.dismissOnClickOutside`, `true` by default) and Material Web close on it, and Rio does too.
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

- **The role is `alertdialog` by default, and `role="dialog"` switches to a plain dialog**. The spec says "On web, basic dialogs should have the alert dialog role"; WAI-ARIA keeps `alertdialog` for messages that ask for a response, and a screen reader announces it as an alert. Use `role="dialog"` for a list, a picker, or a form.
- An alert dialog is described by its content (`aria-describedby`), so its message is read with its name.
- The headline names the dialog (`aria-labelledby`) and is an `<h2>`. Without a headline, give the dialog an `aria-label`.
- The icon is hidden from assistive technology (`aria-hidden`): the headline says what the dialog is for.

### Layout

- The dialog sizes to its content between 280px and 560px wide, keeps 24px from the window's edges, and sits in the center. The app can move it with CSS on `.rio-dialog`, for the spec's custom positions.
- **Buttons sit at the end, in the order the app gives them: the dismissing one first, then the confirming one, nearest the edge.** When they don't fit side by side, they stack with the confirming one on top. Right-to-left layouts mirror this. It is CSS only (`flex-wrap: wrap-reverse`), so it follows the DOM order.
- The buttons' containers keep the 24px padding; text buttons' labels sit further in by the buttons' own padding.
- **The content scrolls between the pinned headline and buttons, with dividers that show while it scrolls**, at the edge where more of it is hidden: below the headline once it has scrolled down, and above the buttons while there is more below. `attachDialog` reports where more is hidden, and the content's part renders it as `data-overflow-top` and `data-overflow-bottom`. Scrolling stops at the content's ends rather than moving on to the page (`overscroll-behavior: contain`).

### Motion

- **The container expands downward from the top and the content fades in once the container is under it; closing fades it all out as the container collapses** (Rio's choice, after Material Web's dialog). The container starts at 35% of its height, as Material Web's does, and expands on `default-spatial`; the content fades in on `fast-effects` after `fast-effects`; the scrim fades in on `default-effects`. Closing fades out on `fast-effects` while the container collapses on `fast-spatial`.
- Under reduced motion the container doesn't expand or collapse; the fades stay.
- Where the browser can't animate leaving the top layer (the `overlay` property, missing in WebKit and Firefox 160), closing is instant.
- Checked in Chromium, WebKit, and Firefox 160 with real input: the motion, Escape, the scrim, and Tab. Focus only in Chromium and WebKit: headless Firefox fires no focus events.

### Values and their sources

- Colors, type, the shape, the icon size, and the elevation come from Material Web's component tokens (`_md-comp-dialog.scss`, Material 3 v34.0.21). The sizes and spacing come from the spec page's measurements.
- The scrim is the `scrim` color at 32% opacity (`_md-comp-scrim.scss`).
- The M3 Design Kit's Dialogs page holds basic, list, scrollable list, and XR dialogs, and no full-screen dialog.

### Not yet

- **Full-screen dialogs**, and swapping a full-screen dialog for a basic one at larger window sizes. Sources disagree on its container color: the spec page says surface-container-high, and Material Web's `_md-comp-full-screen-dialog.scss` says surface.

## Sources

- [M3 Dialogs – Overview](https://m3.material.io/components/dialogs/overview)
- [M3 Dialogs – Specs](https://m3.material.io/components/dialogs/specs)
- [M3 Dialogs – Guidelines](https://m3.material.io/components/dialogs/guidelines)
- [M3 Dialogs – Accessibility](https://m3.material.io/components/dialogs/accessibility)
- [M3 Motion – Transition patterns](https://m3.material.io/styles/motion/transitions/transition-patterns): enter and exit
- [Material Web component tokens @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass) (`_md-comp-dialog.scss`, `_md-comp-scrim.scss`, `_md-comp-full-screen-dialog.scss`)
- [Material Web `md-dialog` @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/dialog/internal) (`dialog.ts`, `animations.ts`, `_dialog.scss`): the 35% container, the click on the scrim, and the dividers
- [Compose Material3 `AlertDialog.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/AlertDialog.kt): `AlertDialog` and `BasicAlertDialog` signatures (public interface only)
- [Compose UI `Dialog.kt` @ 079e2e3](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/ui/ui/src/commonMain/kotlin/androidx/compose/ui/window/Dialog.kt#L35-L42): `DialogProperties` (public, `dismissOnClickOutside = true`)
- M3 Design Kit (Figma), Dialogs page: the dialogs it holds
- [WAI-ARIA Authoring Practices: Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) and [Alert and Message Dialogs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)
