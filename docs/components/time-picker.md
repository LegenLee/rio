# Time picker

`RioTimeInput`, `RioTimeScroll`, and `RioTimePickerDialog` from `@rio-m3e/vue`, built on `createTimePicker` and `attachTimePicker` from `@rio-m3e/core`, and `@rio-m3e/styles/time-picker.css`, with the scroll field, the icon button, the button, and the dialog's stylesheet. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-22.

## Examples

<script setup>
import Dialog from './demos/time-picker/Dialog.vue';
import Input from './demos/time-picker/Input.vue';
import Language from './demos/time-picker/Language.vue';
import Layout from './demos/time-picker/Layout.vue';
import Scroll from './demos/time-picker/Scroll.vue';
import ScrollDialog from './demos/time-picker/ScrollDialog.vue';
</script>

### Input, on the page

<Demo><Input /></Demo>

::: details Code
<<< ./demos/time-picker/Input.vue
:::

### Scroll, on the page

<Demo><Scroll /></Demo>

::: details Code
<<< ./demos/time-picker/Scroll.vue
:::

### Dial, in a dialog the app opens

<Demo><Dialog /></Demo>

::: details Code
<<< ./demos/time-picker/Dialog.vue
:::

### 24 hours, horizontal

<Demo><Layout /></Demo>

::: details Code
<<< ./demos/time-picker/Layout.vue
:::

### Scroll, in a dialog

<Demo><ScrollDialog /></Demo>

::: details Code
<<< ./demos/time-picker/ScrollDialog.vue
:::

### Languages

<Demo><Language /></Demo>

::: details Code
<<< ./demos/time-picker/Language.vue
:::

## Spec

### Variants

- The Expressive update (October 2026) "added the scroll time picker variant, updated shapes, and updated color styling to all variants": "Higher contrast on hour and minute fields, and dial selector", "Expressive button shape, color, and behavior for AM and PM buttons", and "Removed select time label". The baseline input and dial pickers "are no longer recommended".
- **Input**: "The input time picker uses keyboard entry to input time. Similar to scroll time picker, it can be used inline or modal, on any kind of surface."
- **Dial**: "Dial time pickers are the most engaging way to select time, but they take up the most space, and are only available in modal dialogs, not inline." "Both the dial and scroll time pickers are built to toggle to input time pickers to ensure accessible time entry." "An icon button must be present to toggle from a dial or scroll time picker to an input time picker."
- **Scroll**: "The scroll time picker is a compact way to select time. It's best placed inline with other content, but can also be used on surfaces like a sheet, menu, or modal dialog." "Use scroll time pickers instead of dial pickers when you want people to see surrounding content." "Scroll time pickers can toggle to input time pickers." Its parts are the scroll fields, the separator, the period selector, and the input mode toggle.
- **Inline or modal**: "Expressive scroll and input time pickers can be placed inline with page content"; all three can be modal, the scroll and input pickers with OK and Cancel under them, as the dial picker has.
- **12 or 24 hours**: "24-hour scroll and input time pickers have no AM and PM buttons." "The time picker should auto-adjust to 24-hour time settings, removing the AM and PM buttons, and adding the inner dial. For dial picker, time moves from 0-11 on the outer dial, switches to 12-23 on the inner dial, and returns to 00 on the outer dial for the 24th hour."
- **Vertical or horizontal**: the vertical dial picker is the default on mobile. "Dial time pickers should swap orientation or variant depending on the breakpoint and available vertical space. Avoid adding scrolling to dial time pickers." "When vertical space is reduced, like rotating a phone, swap to the landscape dial picker to avoid scrolling or cutting off the dial."

### Behavior

- Dial: "When the dial time picker is opened, the hour field is selected by default. Once hour is selected by dial, the minutes field will activate to then select minutes by dial. Selecting either field will reactivate the corresponding dial to select another option." The keyboard icon button swaps to the input picker, and a clock icon swaps back.
- Scroll: "Swipe the scroll fields to select a time value. Values snap into place when released. Tap the inactive value above or below to navigate to it. The keyboard icon swaps the component to an input time picker."
- Input: "Errors should appear below the time picker, and highlight the invalid field with an error color scheme." "The swipe icon allows the input selector to switch to scroll selector."
- Modal: "The OK button confirms the selection and closes the modal. The Cancel button, and interacting on the scrim, dismisses the changes and closes the modal." It uses a dialog's motion.

### Accessibility

- "Material requires time pickers to allow direct time entry through text input in addition to the scroll and dial selector."
- On dial pickers the hour and minute fields are toggles; on input pickers they are text inputs; "On scroll time pickers, the fields are rotors". "The AM/PM buttons use a radio group role, as only one can be selected at a time."
- "Each hour on the dial input is listed out of 12 for a 12-hour dial. Minutes are listed out of 60": "Hour 7 of 12", "Hour 23", "Minute 24 of 60". The mode button is "Toggle input picker", "Toggle dial picker", or "Toggle scroll picker".
- "Initial focus lands on the hour field."
- "Tab to move through the hour, minute, and AM/PM options. Use arrow keys to toggle between AM and PM, and Enter to select. Enter on the hour or minute field will allow selection of specific numbers. Once focus moves to the dial, it begins on minute 0 or hour 12. Right or Down will move through hours or minutes clockwise. Left or Up will move counter-clockwise. Selecting Enter will confirm hour or minute."
- Keys on scroll fields: "Up / down moves to previous / next option in scroll field." Space or Enter "Activates the (non-disabled) time slot or button", "Allows direct entry of numbers in input", and "Confirms hour and minute for dial, input, and scroll."
- Targets for the AM and PM buttons, the mode button, and each number on the dial are 48 × 48dp at least. "Scroll fields, whether active or inactive, must be at least 48dp high", and so must the targets of their inactive values.

## Recommendations

- "Whenever possible, place time pickers inline so surrounding content remains visible." Use a modal "rarely, when the UI is too cluttered for more components."
- "Only use time pickers when any time can be chosen, down to the minute." For preset times or intervals, use a button group, a menu, or a select.
- "Avoid using dial time pickers for granular time selection, such as milliseconds for a stopwatch application."
- "On touch devices, when time pickers can't be placed inline, consider using a scroll time picker in a menu."
- "Scroll and input time pickers can resize to fit the container they're placed in. Each field should resize evenly." "When using narrower and larger typography, use taller scroll field heights so the surrounding options are at least half-visible."

## In Rio

### API

```vue
<RioTimeInput v-model="time" />

<RioTimeScroll v-model="time">
  <template #keyboard-icon><KeyboardIcon /></template>
  <template #swipe-icon><SwipeIcon /></template>
</RioTimeScroll>

<RioTimePickerDialog v-model="time" v-model:open="open">
  <template #keyboard-icon><KeyboardIcon /></template>
  <template #clock-icon><ClockIcon /></template>
</RioTimePickerDialog>

<RioTimePickerDialog v-model="time" v-model:open="open" picker="scroll">
  <template #keyboard-icon><KeyboardIcon /></template>
  <template #swipe-icon><SwipeIcon /></template>
</RioTimePickerDialog>
```

`RioTimeInput` and `RioTimeScroll`:

| Prop         | Type                                                         | Default        |
| ------------ | ------------------------------------------------------------ | -------------- |
| `modelValue` | `string`, `HH:MM` on a 24-hour clock, with `v-model`         | —              |
| `hourCycle`  | `12 \| 24`                                                   | the language's |
| `locale`     | `string`: the language, for this picker only (see Languages) | —              |
| `messages`   | replaces any of the picker's text                            | —              |

`RioTimePickerDialog`:

| Prop          | Type                                                                        | Default        |
| ------------- | --------------------------------------------------------------------------- | -------------- |
| `modelValue`  | `string`, `HH:MM`, with `v-model`; it changes on OK                         | —              |
| `open`        | `boolean`, with `v-model:open`                                              | `false`        |
| `hourCycle`   | `12 \| 24`                                                                  | the language's |
| `layout`      | `'auto' \| 'vertical' \| 'horizontal'`: the dial below or beside the fields | `'auto'`       |
| `picker`      | `'dial' \| 'scroll'`: the picker, which switches to the text input          | `'dial'`       |
| `initialMode` | `'picker' \| 'input'`: what each opening starts in                          | `'picker'`     |
| `locale`      | `string`                                                                    | —              |
| `messages`    | replaces any of the dialog's text                                           | —              |

- **Values are `HH:MM` on a 24-hour clock**, as `<input type="time">` takes them, whatever clock the picker shows (Rio's choice). `Temporal.PlainTime.from(time)` reads one.
- **The dialog opens from the app's own button** (Rio's choice): there is no field that opens it. The app shows the time chosen wherever it likes.
- **Slots are icons, which the app brings**: `keyboard-icon` on the mode button of the dial or the scroll fields, and `clock-icon` or `swipe-icon` on the text input's, back to either. A slot left empty leaves the button without an icon; its name for assistive technology stays.
- Attributes and listeners go to the root: the `<div>` on the page, or the `<dialog>`.

### The clock

- **12 or 24 hours comes from the language**, through `Intl`: `en-US` and `ko-KR` count 12 with AM and PM, `de-DE` and `en-GB` 24. `hourCycle` sets it for one picker. AM and PM are the language's own words, such as 오전 and 오후.
- A 12-hour dial has 12 at the top, then 1 to 11. A 24-hour dial has 00 to 11 on its outer ring and 12 to 23 on the inner one.
- The dial shows the language's digits. The text fields read and write Latin digits.

### The input picker

- **Two text fields**, each named Hour or Minute, with the name under it as supporting text. They take two digits and bring up a numeric keyboard.
- **What was typed is read on Enter, and when a field loses the focus after a change**, then written back with two digits. A minute left empty counts as 00, and both fields left empty clear the time. A field focused other than by the pointer, as by Tab or as the dialog opens, has its text selected, so typing replaces both digits; a press puts the caret where it lands.
- An hour outside 1 to 12 (0 to 23 on a 24-hour clock), or a minute outside 0 to 59, shows an error under the fields, marks that field with the error color, and leaves the time as it was. The error is announced as it appears.
- **AM and PM** are a radio group named "Select AM or PM", beside the fields. The arrow keys choose the other one, and only the checked one is in the tab order. Choosing one moves the time by 12 hours; without a time yet, it waits for one. Each takes presses up to 48 × 48px, past its 40px edges, as the spec's targets have it.
- `RioTimeInput` is the input picker alone, with no mode button: the dial is for dialogs, as the spec has it, and `RioTimeScroll` is the scroll picker that switches to the text input.

### The scroll picker

- **Two scroll fields** ([scroll-field.md](scroll-field.md)), list boxes named Hour and Minute (Rio's choice, the scroll field's: the spec's table calls the fields rotors), with the separator between them and AM and PM beside them. The hours are 1 to 12, or 0 to 23 on a 24-hour clock, and the minutes 0 to 59, in the language's digits. They go round, as the spec's images show 59 above 00.
- **The time follows the fields as they scroll**, as a scroll field's value does: `v-model` changes as each hour or minute passes the middle (in a dialog, the time OK sets). Up and Down move to the value above and below, as the spec has it; a press on the value above or below scrolls it into the middle, as the spec has it too. An hour keeps the half of the day: from 12, PM goes on to 1 PM.
- **Without a time, the fields show 12:00 AM** (Rio's choice), as the dialog opens on, and `v-model` stays empty until the person changes a field, or AM or PM, which sets the time shown.
- **Space or Enter on a field switches to the text input, with the focus on that field** and its text selected (Rio's choice). The spec's Space or Enter activates a scroll field, for direct entry, and also confirms the time; a scroll field's own typing would duplicate the text input the picker switches to, so the fields don't take typed text. In a dialog, Enter on a field switches too, rather than confirming.
- **The mode button** sits under AM and PM: a keyboard icon, named "Toggle input picker", switches to the text input, and a swipe icon, "Toggle scroll picker", switches back, as the spec has them. The time goes along: what doesn't read as one is left behind, and both fields left empty clear it. The focus stays on the button.
- In the text input, the fields are the input picker's, as `RioTimeInput` has them.

### The dialog

- It opens on its picker, the dial or the scroll fields with `picker: 'scroll'` (or the text input, with `initialMode`), at the time it was given, or 12:00 AM without one, with the focus on the hour. It is named "Select time" on either picker and "Enter time" in the text input; the Expressive update removed the label from view.
- **The scroll fields** work as the scroll picker's on the page, above.
- **The value changes on OK** (or Enter in the text input). Cancel, Escape, and a press outside leave it. Each opening starts afresh from the value.
- **On the dial, the fields are toggles** that choose which numbers the dial shows: the hour's or the minute's. Their names say the time they hold, from the message tables: "Hour 7" and "Minute 30", or 7시 and 30분 (Rio's choice: the spec's table names them Hour and Minute, which would leave the time unsaid).
- **A press on the dial picks the number nearest the pointer, and the selector follows it while the pointer moves.** The release picks it for good; after an hour, the dial goes on to the minutes, as the spec has it. The focus stays where it was.
- **Keys**: Tab goes through the hour, the minute, and AM or PM, past the dial, as the spec has it. Enter or Space on the hour or minute moves onto the dial, at hour 12 or minute 0, as the spec has it; on a 24-hour dial, that is the 12 on the inner ring. Right and Down move to the next number, clockwise, and Left and Up to the one before. On a 24-hour dial they go through every hour, from 11 on to 12 inside and from 23 back to 0 (Rio's choice: the spec describes one ring). Enter or Space picks the number; after an hour, the dial stays on the hours, so the person moves on (Rio's choice: the spec only says that Enter confirms).
- The numbers show the focus ring, and a state layer on hover and focus. They overlap, 60 of them for the minutes, so the hover state shows on the number nearest the pointer, the one a press would pick.
- **Right to left, the dial stays a clock**: 12 at the top and 3 on the right, and a press picks the number under it. The fields keep hours before minutes, left to right, as times are written in those languages too; AM and PM, the dial's side, and the buttons follow the writing direction (Rio's choice: the spec doesn't say).
- The dial is a group named Hour or Minute. Its numbers are buttons, as the spec's table has them, named as it has them too; the selected one is pressed (`aria-pressed`; Rio's choice: the spec's table doesn't say how the selected number is marked). All 60 minutes are buttons; the dial shows the fives.
- The mode button switches between the picker and the text input, with the time chosen so far. What doesn't read as a time is left behind.
- **`layout: 'auto'`** puts the dial below the fields, and beside them where the window is less than 560px tall (Rio's choice of where).

### Languages

Every text and the clock come from the language: the picker's `locale`, or a `RioLocaleProvider` or `createRio`, or the document's `lang`, or the browser's language (see [Languages](../guide/languages.md)).

### Values and their sources

- Sizes, gaps, and colors come from the spec page's Expressive tokens: fields 100 × 120px (132px wide on a 24-hour vertical dial) on `surface-container-lowest`, the selected one `primary`, with a 16px separator; AM and PM 56px wide in a dialog, 40px on the page, and 100px wide under the fields of a horizontal dial, `primary-container` when selected; a 256px dial on `surface-container-lowest`, with a 48px handle, an 8px center, and a 2px track in `primary`; and the dialog on `surface-container`.
- Vertically, AM and PM sit 8px beside the fields, 8px apart, and the dial 12px below, in 12px of padding. Horizontally, AM and PM sit 16px under the fields, 16px apart, the dial 52px beside them, and the buttons 24px below, in 24px of padding.
- Type, from the same tokens: the separator is emphasized display large; AM and PM are title medium, and emphasized (bold) when selected; the dial's numbers are body large. The fields have no type token; they are display large.
- **AM and PM change shape when chosen**: the tokens make them round, and the selected one rounded square. The spec page's image of the scroll time picker measures the rest: 40 × 40px on the page and 56 × 56px in a dialog, with 12px and 16px corners when selected, as a selected button of that height has them. The corners spring from one shape to the other, as a button's do. On a horizontal dial, the 100 × 40px buttons take 12px corners (Rio's choice, after the 40px ones).
- The same image puts the mode button, Cancel, and OK 16px from the dialog's sides and bottom: 4px inside the padding, which reaches the icon button's 48px target.
- The numbers sit 102px from the dial's center, and 74px on a 24-hour dial's inner ring, as the M3 Design Kit's dial has them.
- **The scroll fields are 100px wide.** On the page, the measurement drawing draws them 136px tall (measured against its 40dp AM button), in a picker it marks 140px tall at least, with AM, PM, and the mode button 40px each and 8px apart beside them, 8px away: the button's bottom meets the fields'. Compose's time scroll picker with a mode button has the same heights. The token for the gap between their values, 24dp, puts each value in a 60px slot, 8px more than a scroll field's, as Compose's time scroll picker with a mode button spaces them (Rio's choice, from Compose's `TimePicker.kt`, not its public API). In a dialog, the token makes them 120px tall, a scroll field's slots and all.
- **On a 24-hour clock, the mode button keeps its place** at the fields' bottom, as the spec's image of the 24-hour scroll picker has it.
- In the text input, the fields and their supporting text are 140px tall, the picker's height, so the mode button and what comes after the picker stay where they are.

### Not yet

- Scroll fields that fill a wider container, as the measurement drawing allows: they keep 100px.
- Seconds, limits on the time, and steps.
- Swapping the dial for the text input where the window is very short or zoomed in, as the guidelines suggest; `layout: 'auto'` only turns the dial picker on its side.

## Sources

- [M3 Time pickers – Overview](https://m3.material.io/components/time-pickers/overview)
- [M3 Time pickers – Specs](https://m3.material.io/components/time-pickers/specs)
- [M3 Time pickers – Guidelines](https://m3.material.io/components/time-pickers/guidelines)
- [M3 Time pickers – Accessibility](https://m3.material.io/components/time-pickers/accessibility)
- The spec page's image of the scroll time picker, inline and modal (Specs, Configurations): the AM and PM buttons' size and corners, and where the buttons sit; of the 24-hour scroll time picker; and the measurement drawing of the inline scroll time picker (Specs, Measurements)
- Compose Material3 @ 079e2e3: [`TimePicker.kt`](https://github.com/androidx/androidx/blob/079e2e3f562935f1dd9a6c8efc5bc6095534fda8/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/TimePicker.kt) (under In Rio, the slot of the scroll picker's values on the page, and the height of its fields, from its implementation)
- [M3 Design Kit (Figma)](https://www.figma.com/design/KUbK7eyq8eGvywjORqcJbt/Material-3-Design-Kit--Community-) (Date & time pickers page): the dial's rings
