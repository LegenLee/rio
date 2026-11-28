# Date picker

`RioDatePicker`, `RioDatePickerDialog`, and `RioDateRangePickerDialog` from `@rio-m3e/vue`, built on `createCalendar`, `createDatePicker`, `createDatePickerDialog`, `createRangeCalendar`, `createDateRangePickerDialog`, `attachCalendar`, `attachRangeCalendar`, and `attachDatePickerMenu` from `@rio-m3e/core`, and `@rio-m3e/styles/date-picker.css`, with the text field, the icon button, the button, and the dialog's stylesheet. Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-22.

## Examples

<script setup>
import Dialog from './demos/date-picker/Dialog.vue';
import Docked from './demos/date-picker/Docked.vue';
import Language from './demos/date-picker/Language.vue';
import Limits from './demos/date-picker/Limits.vue';
import Modal from './demos/date-picker/Modal.vue';
import Range from './demos/date-picker/Range.vue';
</script>

### Docked

Type a date, or press the field or its calendar button.

<Demo><Docked /></Demo>

::: details Code
<<< ./demos/date-picker/Docked.vue
:::

### Modal

<Demo><Modal /></Demo>

::: details Code
<<< ./demos/date-picker/Modal.vue
:::

### A dialog the app opens

<Demo><Dialog /></Demo>

::: details Code
<<< ./demos/date-picker/Dialog.vue
:::

### A range of dates

<Demo><Range /></Demo>

::: details Code
<<< ./demos/date-picker/Range.vue
:::

### Limits and unavailable dates

<Demo><Limits /></Demo>

::: details Code
<<< ./demos/date-picker/Limits.vue
:::

### Languages

<Demo><Language /></Demo>

::: details Code
<<< ./demos/date-picker/Language.vue
:::

## Spec

### Variants

- **Docked**: "The docked date picker displays a date input field by default, and a dropdown calendar appears when the user taps on the input field. Either form of date entry can be interacted with." Its anatomy: an outlined text field, menu buttons for the month and the year, each with its arrows, the weekdays, the days (the days of the months around included), and text buttons. The year and month menus replace the calendar.
- **Modal**: a dialog with a title, the selected date as its headline, an icon button to the text input, the month and year with arrows, and the days. Tapping the year opens a grid of years. "Don't use a modal date picker to prompt for dates in the distant past or future, such as a date of birth. In these cases, use a modal input picker or a docked date picker instead."
- **Modal input**: the dialog with a text field instead of the calendar. "You can swap between the modal date picker and modal date input using the edit or calendar icon."
- **Date range selection** (modal): "Date range selection provides a start and end date. Common use cases include: Booking a flight, Reserving a hotel." "To select a range of dates, tap the start and end dates on the calendar." "To navigate across months, scroll vertically." Its anatomy: a headline, supporting text, a close icon button, the container, a text button (Save), an icon button to the text input, a divider, the weekdays, today, the selected range with its start, unselected dates, the month labels, and text buttons. "Modal date inputs allow the manual entry of dates using the numbers on a keyboard. People can input a date or a range of dates in a dialog": a range takes two text fields side by side, the start and the end.
- "On compact breakpoints, such as mobile, a full-screen modal date picker is recommended to increase readability and touch target size. It can cover the entire screen." "Mobile full-screen pickers also have an additional close affordance (x) icon button and Save confirmation."
- "Selection is indicated through color, drawing visual attention. In date ranges, start and end dates are selected, while dates in-between appear connected with a subtle highlight."
- Date pickers "can be embedded into":
  - "Dialogs on compact breakpoints like mobile"
  - "Text field drop-downs on medium and expanded breakpoints like tablet and desktop"
- "To exit a date picker, the input can either be confirmed (OK) or dismissed (Cancel). Interacting outside of the dialog will also dismiss" it. "Docked date pickers appear just below the input field."
- "The sizing of the docked and modal date picker components don't scale responsively to different breakpoints."

### Accessibility

- People should be able to "Enter dates manually by inputting text, without using the picker". "The calendar icon is the exclusive entry point for the date picker. This improves efficiency for a screen reader and other keyboard users."
- "Automatically format the date after the user hits 'Enter' or navigates out of the text field. Don't automatically format the date by adding slashes or other special characters while the user is typing (also known as input masks)." "Accept a range of formats including dashes, spaces, slashes, dots, and 0 to the left of a single digit month/day."
- "The helper text (below the text field) should specify the date format (for example, MM/DD/YYYY or YYYY/MM/DD) and act as a description for the text field."
- The month grid is a grid; the previous and next month and year buttons and the month and year dropdowns are buttons. Screen readers read the full date, as "Monday, August 17", not just the number.
- If the Clear button isn't needed, "remove the Clear button from the screen to reduce the number of tab stops for keyboard users".
- Targets are 48 × 48dp at least. Dates have 4.5:1 contrast with the background.

| Keys                   | Actions                                            |
| ---------------------- | -------------------------------------------------- |
| Enter                  | Closes the calendar and saves the selected date    |
| Page Up / Page Down    | Move to the same date on the previous / next month |
| Home / End             | Move to the first day of the month                 |
| Shift + Page Up / Down | Moves to the same date in the previous / next year |
| Shift + M              | Moves to the month list dropdown                   |
| Shift + Y              | Moves to the year list dropdown                    |

## Recommendations

- Use the docked picker on medium and expanded windows, and the modal one, or a full-screen one, on compact windows.
- Use a range for a start and an end, such as a flight or a hotel stay.
- For dates far away, start in the text input, or use the docked picker.
- Show keyboard shortcuts in the arrow buttons' tooltips.

## In Rio

### API

```vue
<RioDatePicker v-model="date" label="Departure" min="2026-01-01">
  <template #calendar-icon><CalendarIcon /></template>
  <template #previous-icon><ChevronLeftIcon /></template>
  <template #next-icon><ChevronRightIcon /></template>
  <template #dropdown-icon><ArrowDropDownIcon /></template>
</RioDatePicker>

<RioDatePickerDialog v-model="date" v-model:open="open" />
```

`RioDatePicker`:

| Prop                      | Type                                                                | Default        |
| ------------------------- | ------------------------------------------------------------------- | -------------- |
| `modelValue`              | `string`, `YYYY-MM-DD`, with `v-model`                              | —              |
| `open`                    | `boolean`, with `v-model:open`; the picker keeps it when not bound  | `false`        |
| `variant`                 | `'docked' \| 'modal'`                                               | `'docked'`     |
| `fieldVariant`            | `'filled' \| 'outlined'`: the text field's look                     | `'outlined'`   |
| `label`, `supportingText` | `string`; the supporting text defaults to the format, as MM/DD/YYYY | —              |
| `error`, `errorText`      | as on the text field                                                | —              |
| `required`, `disabled`    | `boolean`                                                           | `false`        |
| `name`                    | `string`: submits the date with a form, as `YYYY-MM-DD`             | —              |
| `min`, `max`              | `string`, `YYYY-MM-DD`                                              | —              |
| `isDateDisabled`          | `(date: string) => boolean`: more dates that can't be chosen        | —              |
| `locale`                  | `string`: the language, for this picker only (see Languages)        | —              |
| `firstDayOfWeek`          | `number`, 1 (Monday) to 7 (Sunday)                                  | the language's |
| `messages`                | replaces any of the picker's text                                   | —              |
| `clearable`               | `boolean`: a Clear button at the start of Cancel and OK             | `false`        |
| `initialMode`             | `'calendar' \| 'input'`: modal, what the dialog starts in           | `'calendar'`   |

`RioDatePickerDialog` takes `v-model`, `v-model:open`, `min`, `max`, `isDateDisabled`, `locale`, `firstDayOfWeek`, `messages`, `initialMode`, and `clearable`.

- **Values are ISO dates**, `YYYY-MM-DD`, as `<input type="date">` takes them, with no time and no time zone (Rio's choice). `Temporal.PlainDate.from(date)` reads one.
- **Slots are icons, which the app brings**: Rio ships no icons. `calendar-icon` is the field's button, and the dialog's switch back to the calendar; `edit-icon`, the dialog's switch to the text input; `previous-icon` and `next-icon`, the arrows; and `dropdown-icon`, the month and year buttons' arrow, which turns over while its list shows. A slot left empty takes the icon the app registered for it with `createRio`, by its alias (`calendar`, `edit`, `previous`, `next`, `dropdown`; see [Icons](../guide/icons.md)); without that, its button shows no icon, and its name for assistive technology stays.
- `class` and `style` go to the root; every other attribute and listener goes to the field's input.

### The field

- It is a text field (`RioTextField`), outlined by default as the docked picker's spec has it, with the calendar button as its trailing icon. Its placeholder and, by default, its supporting text are the format, such as MM/DD/YYYY or YYYY. MM. DD.
- **What was typed is read on Enter, and when the field loses the focus after a change**, then written back in the format. There is no input mask. Any separators and leading zeros are fine, and a four-digit year first reads as year, month, day in any language, as in 2026-11-27.
- Text that isn't a date that can be chosen shows an error under the field and leaves the date as it was: the format, the limit it passes, or that the date is unavailable.
- The Enter that reads a date also submits the form around it, with the new date, as Enter in a native date field does.

### Opening and closing

- **A press on the field opens the calendar, and the focus stays in the field**, so the person can type (Rio's choice: the guidelines open it on a tap, and the accessibility page keeps the calendar button as the only way in from the keyboard). **From the keyboard, the calendar button or Alt+Down opens it with the focus on the selected date**, or else today. Tab into the field doesn't open it.
- Docked: the calendar shows below the field, or above it without room there, 360px wide. A press outside, the focus leaving the field and the calendar, and Escape close it. The modal picker opens a dialog for either way in.
- **Clicks and presses in the calendar stay in it** (Rio's choice), in the docked calendar as in the dialog: choosing a day doesn't reach a card or a row around the picker with its own click. Keys go on. Code that listens for clicks on the document doesn't get them either, unless it listens while capturing, as VueUse's `onClickOutside` does.
- **Choosing a day doesn't change the date until OK** (the spec's text buttons); Cancel, Escape, and a press outside leave it. **Enter on a day chooses it and confirms**, as the keyboard table has it. Closing gives the focus back to the field.
- `clearable` adds Clear at the start of the buttons, where the M3 Design Kit's modal picker has it, in either picker. It empties the date and closes. It is off by default, as the accessibility page suggests when it isn't needed.

### The calendar

- **Keys**: arrows move by a day or a week, into the months around; Home and End go to the month's first and last day, as the spec's table has it (the WAI-ARIA practices' example goes to the week's); Page Up and Page Down by a month, and with Shift, by a year; Shift+M and Shift+Y move to the month and year buttons. One date at a time is in the tab order, the selected one or today.
- The grid is a `<table role="grid">` named by the month and year, with each weekday's full name in its heading's `abbr`. Each day is a button named by its full date, as "Friday, November 27, 2026", with `aria-current="date"` on today and `aria-selected` on the selected day's cell. Days outside `min` and `max` or made unavailable take the focus but can't be chosen.
- **Days and years are numbers** in the language's digits, without the words a date format adds: 27, not 27일. The month button keeps the language's short month name, such as Nov or 11월.
- The docked calendar shows the days of the months around at 38%, as the spec's anatomy has it; they can be chosen. The modal one leaves their cells empty.
- The month and year lists replace the days, scrolled to the one shown; the arrow keys move in them. Months and years outside `min` and `max` can't be chosen; without them, the years run from 1900 to 2100, as in Compose, and further to take in the date chosen or shown, such as one typed before 1900 (Rio's choice: the field takes any date without `min` and `max`).
- The modal headline is the date chosen so far, such as "Fri, Nov 27", announced as it changes, or "Selected date" while there is none.

### Date ranges

```vue
<RioDateRangePickerDialog v-model:start="depart" v-model:end="back" v-model:open="open">
  <template #edit-icon><EditIcon /></template>
  <template #calendar-icon><CalendarIcon /></template>
</RioDateRangePickerDialog>
```

| Prop          | Type                                                           | Default      |
| ------------- | -------------------------------------------------------------- | ------------ |
| `start`       | `string`, `YYYY-MM-DD`, with `v-model:start`; it changes on OK | —            |
| `end`         | `string`, `YYYY-MM-DD`, with `v-model:end`; it changes on OK   | —            |
| `open`        | `boolean`, with `v-model:open`                                 | `false`      |
| `initialMode` | `'calendar' \| 'input'`: what each opening starts in           | `'calendar'` |
| `clearable`   | `boolean`: a Clear button at the start of Cancel and OK        | `false`      |

It takes `min`, `max`, `isDateDisabled`, `locale`, `firstDayOfWeek`, and `messages` as the date picker's dialog does. `edit-icon` and `calendar-icon` are the mode button's icons, as in `RioDatePickerDialog`.

- **A dialog the app opens with its own button** (Rio's choice), as the spec's range picker is modal; there is no field and no docked range picker. The app shows the range wherever it likes.
- **Two values, each a date as the date picker's** (Rio's choice): `v-model:start` and `v-model:end`, which change together on OK. OK with only a start sets it, and leaves the end empty.
- **Choosing a range** (Rio's choice, as Compose's `DateRangePicker` does): a press starts the range; the next, on that day or a later one, ends it, and on an earlier one starts it there instead. With both ends chosen, a press starts a new range. The same day twice is a range of one day.
- **A basic dialog, 360 × 568px, in any window** (Rio's choice: the spec shows a full-screen picker, not built yet, as below; the 568px is Compose's height for the modal date picker). Its header is the date picker dialog's, with the title, the headline, and the mode button; Cancel and OK sit below the months, as in the spec's drawing.
- **The months lie one under another**, each under its name, and scroll; the weekdays stay above them. The dialog opens with the start's month at the top, or today's. It renders the three months before and the year after, and a year more as the months scroll near either end, as far as `min` and `max`, or 1900 to 2100 and further to take in the range (Rio's choice). Months added above leave those in view where they were.
- **Keys** work as in the date picker's calendar, from month to month: Page Up and Page Down go to the same date a month away, rendering more months on the way. **Enter chooses the day, and confirms the range when the day ends it** (Rio's choice: the spec's table has Enter close the calendar and save the date).
- Each month is a grid named by the month, as "August 2026", that takes more than one selection; the range's ends and the days between them are its selected cells (`aria-selected`; Rio's choice). The weekdays above are hidden from assistive technology, as each day's name says its weekday. The headline, announced as it changes, says the range so far, as "Aug 17 – Aug 23", with "Start date" or "End date" for an end not chosen yet, as Compose's headline does; the message table writes the range as each language does, such as 8월 17일 ~ 8월 23일.
- **The text input** has two text fields side by side, Start date and End date, each with the format under it. OK and Enter read both: each shows its own error, as in the date picker's dialog, and an end date before the start date, or without one, is an error too. Switching back, what doesn't read as a range is left behind.
- The range's ends are selected days, and the days between them sit on a band of `secondary-container` with `on-secondary-container` numbers, from the middle of the start to the middle of the end, and out to the container's edges where a row ends, as the spec's drawing has it.

### Languages

Every text, the format, the names of months and days, and the first day of the week come from the language: the picker's `locale`, or a `RioLocaleProvider` or `createRio`, or the document's `lang`, or the browser's language (see [Languages](../guide/languages.md)). Dates are always Gregorian, and the field reads and writes Latin digits.

### Values and their sources

- Sizes, shapes, colors, and type come from Material Web's component tokens (`_md-comp-date-picker-docked.scss`, `_md-comp-date-picker-modal.scss`, `_md-comp-date-input-modal.scss`, Material 3 v34.0.21), which the spec page's tables match: docked 360 × 456 with 16px corners, modal 360 wide with 28px corners, `surface-container-high`, 40px days.
- **Sources disagree on the modal height**: Compose's tokens have 568dp and Material Web's 524px. The date picker's dialog is as tall as its content; the range picker's is 568px, as its months scroll.
- The range picker's values come from the same tokens: its header 128px tall, its headline title large, and the band 40px tall. Each month's name is title small, `on-surface-variant`, 20px below the month before, 8px above its days, and 24px in from the grid (Rio's choice, from Compose's `DateRangePicker.kt`, not its public API; the spec's drawing puts the first one 16px below the weekdays and 12px above its days). A divider sits above the buttons, where the months scroll under them, as in the spec's drawing.
- The paddings come from the M3 Design Kit, as the tokens have none: 12px at the calendar's sides and none at the sides of the docked header; the modal title 16px from the top and 24px from the start, in a header at least 120px tall, and the headline 12px from the bottom and the end; the month and year row 56px tall in the modal picker and 64px in the docked one; and the buttons 12px from the sides, 8px apart, 4px below the calendar, and 8px (modal) or 4px (docked) from the bottom.

### Not yet

- The full-screen pickers for compact windows, for a date and for a range, as full-screen dialogs ([dialog.md](dialog.md)).
- Months the range picker scrolled far from stay rendered: a long scroll keeps hundreds of months of days in the page.
- A range picker on the page, as a field or docked: the spec has none.
- Swiping between months in the modal picker.
- Tooltips with the keyboard shortcuts on the arrow buttons.
- Calendars other than the Gregorian one, and typing digits other than Latin ones.

## Sources

- [M3 Date pickers – Overview](https://m3.material.io/components/date-pickers/overview)
- [M3 Date pickers – Specs](https://m3.material.io/components/date-pickers/specs)
- [M3 Date pickers – Guidelines](https://m3.material.io/components/date-pickers/guidelines)
- [M3 Date pickers – Accessibility](https://m3.material.io/components/date-pickers/accessibility)
- [Material Web component tokens @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass) (`_md-comp-date-picker-docked.scss`, `_md-comp-date-picker-modal.scss`, `_md-comp-date-input-modal.scss`)
- Implementation references, not spec: [Compose Material3 `DatePicker.kt` @ 807cd48](https://github.com/androidx/androidx/blob/807cd489d33d48421b3cb1f8469d93e72ab0ea81/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/DatePicker.kt) (`DatePicker`, `DatePickerDefaults.YearRange`; public interface only), and [`DatePickerModalTokens.kt`](https://github.com/androidx/androidx/blob/807cd489d33d48421b3cb1f8469d93e72ab0ea81/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/DatePickerModalTokens.kt)
- Compose Material3 @ 807cd48: [`DateRangePicker.kt`](https://github.com/androidx/androidx/blob/807cd489d33d48421b3cb1f8469d93e72ab0ea81/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/DateRangePicker.kt) (`DateRangePicker` and `DateRangePickerDefaults`' title and headline; under In Rio, how presses choose a range and the months' names' padding, from its implementation)
- The spec page's images of the modal date range picker (Specs: anatomy, measurements) and of the modal date input's configurations
- [M3 Design Kit (Figma)](https://www.figma.com/design/KUbK7eyq8eGvywjORqcJbt/Material-3-Design-Kit--Community-) (Date & time pickers page): the paddings
- [WAI-ARIA Authoring Practices: Date Picker Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)
