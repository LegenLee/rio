# Tooltip

`RioTooltip` from `@rio-m3e/vue`, built on `createTooltip` and `attachTooltip` from `@rio-m3e/core` and `@rio-m3e/styles/tooltip.css`. The tooltip floats in the top layer next to its element (see "Overlays" in [conventions.md](../conventions.md)). Statements are labeled Spec, Recommendations, and In Rio, as in [foundations.md](../foundations.md).

> Last verified: 2026-11-16.

## Examples

<script setup>
import Persistent from './demos/tooltip/Persistent.vue';
import Plain from './demos/tooltip/Plain.vue';
import Rich from './demos/tooltip/Rich.vue';
</script>

### Plain

Rest the pointer on a button, or reach it with Tab. Once a tooltip shows, the next one shows at once.

<Demo><Plain /></Demo>

::: details Code
<<< ./demos/tooltip/Plain.vue
:::

### Rich

<Demo><Rich /></Demo>

::: details Code
<<< ./demos/tooltip/Rich.vue
:::

### Persistent

A click opens it, and it stays until you interact with something else.

<Demo><Persistent /></Demo>

::: details Code
<<< ./demos/tooltip/Persistent.vue
:::

## Spec

### Variants

| Variant | Use                                                                                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Plain   | "Plain tooltips briefly describe a UI element. They're best used for labelling UI elements with no text, like icon-only buttons and fields." |
| Rich    | "Rich tooltips provide additional context about a UI element. They can optionally contain a subhead, buttons, and hyperlinks."               |

- Anatomy: a plain tooltip is a container with supporting text. A rich one adds an optional subhead and "up to two text buttons".

### Measurements

| Token                     | Plain              | Rich                                |
| ------------------------- | ------------------ | ----------------------------------- |
| Container shape           | corner-extra-small | corner-medium                       |
| Container height, padding | 24, 8              | top 12, bottom 8, left and right 16 |
| Container elevation       | —                  | level 2                             |
| Subhead                   | —                  | title-small                         |
| Supporting text           | body-small         | body-medium                         |
| Text buttons              | —                  | label-large                         |

### Color

| Role            | Plain              | Rich               |
| --------------- | ------------------ | ------------------ |
| Container       | inverse-surface    | surface-container  |
| Supporting text | inverse-on-surface | on-surface-variant |
| Subhead         | —                  | on-surface-variant |
| Text buttons    | —                  | primary            |

### Behavior

- Placement: "By default, plain tooltips are positioned directly above the parent element." The distance is 4dp from an element with a visual boundary, such as a button, and 8dp from one without, such as text. "If the element is in an app bar, the plain tooltip appears below the element at the same distance."
- "By default, rich tooltips are positioned to the bottom right of the parent element. They adjust position to avoid going off screen. Tooltips shouldn't cover the parent element." The position adjusts "in increments of 8dp". "On desktop, tooltips may appear centered below the parent element and remain visible while moving within the target region."
- "To show a tooltip, hover on the parent element on desktop, or tap and hold the element on mobile. Persistent rich tooltips only appear when clicked or tapped."
- Transient by default: "Both plain and rich tooltips disappear 1.5 seconds after navigating away from the target region." "Triggering a new tooltip immediately closes any other open tooltip."
- Persistent rich tooltips appear when the parent element is clicked, or when "the page loads and a new feature is being explained". They "remain active even when leaving the target region. They only disappear once a person interacts with another UI element. Hovering doesn't trigger the tooltip."
- The spec sets no delay before a tooltip shows.

### Accessibility

- People should be able to "receive a tooltip message" and "activate a tooltip with a keyboard or switch input".
- "Tooltips can appear when an actionable element, like a button or navigation rail, is hovered or focused." "Rich tooltips can also appear by selecting an element instead of hovering or focusing on it."
- "Focus order within the rich tooltip moves top to bottom between interactive elements." Keyboard: Tab, "Focus lands on button, if available"; Space or Enter, "Activates the focused element".
- "Tooltips should have the Tooltip role, or similar." "Label all elements in the tooltip according to their own accessibility guidance."

## Recommendations

- "Plain tooltips aren't needed when the UI element already has label text."
- "Don't hide critical information within tooltips as it's easy to miss. Use an interruptive dialog instead."
- Plain: "Avoid wrapping text to multiple lines or including many pieces of information."
- Rich: "Keep subheads brief, ideally to one line." "Subheads are important to include when the rich tooltip appears automatically, like when the page loads." "Keep buttons short so they can be side by side. Avoid stacking them when possible."
- "Only display one tooltip at a time."
- "Avoid using persistent rich tooltips on icon buttons."
- "Plain and rich tooltips without required actions should remain on screen long enough for people to receive the information without disrupting their existing flow or task." "Tooltip containers should not block important information or prevent a person from completing an action." "Avoid trapping screen reader and keyboard focus on rich tooltips."

## In Rio

### API

`RioTooltip` wraps the element it is for:

```vue
<RioTooltip text="Copy">
  <RioIconButton label="Copy"><CopyIcon /></RioIconButton>
</RioTooltip>

<RioTooltip variant="rich" subhead="Backups">
  <RioButton>Backups</RioButton>
  <template #content>Photos back up every night.</template>
  <template #actions>
    <RioButton variant="text">Learn more</RioButton>
  </template>
</RioTooltip>
```

| Prop         | Type                                                                                    | Default                          |
| ------------ | --------------------------------------------------------------------------------------- | -------------------------------- |
| `text`       | `string`: the tooltip's text, or use the `content` slot                                 | —                                |
| `variant`    | `'plain' \| 'rich'`                                                                     | `'plain'`                        |
| `subhead`    | `string` (rich only)                                                                    | —                                |
| `persistent` | `boolean` (rich only): opens on a click and stays                                       | `false`                          |
| `open`       | `boolean`, with `v-model:open`; optional, the tooltip keeps the state itself without it | `false`                          |
| `side`       | `'top' \| 'bottom' \| 'start' \| 'end'`                                                 | `'top'` plain, `'bottom'` rich   |
| `align`      | `'start' \| 'center' \| 'end'`                                                          | `'center'` plain, `'start'` rich |
| `offset`     | `number`, in px, between the element and the tooltip                                    | `4`                              |

- Slots: `default` (the element, one element), `content` (the text, in place of `text`), and `actions` (up to two text buttons, rich only).
- **Both variants are in**, with transient and persistent rich tooltips.
- Markup: the element and the tooltip sit in a `<span class="rio-tooltip-trigger">` with `display: contents`, so the element lays out as if unwrapped. The tooltip comes right after the element, shown as a popover; its parts are spans, so a tooltip may sit inside a paragraph.
- **The wrapper is still in the DOM**: a parent that styles or counts its children (`> button`, `:first-child`, `.children`) meets the wrapper instead of the element. Rio's button group looks through it. An app's own child selectors need the wrapper too, as in `.toolbar > .rio-tooltip-trigger > button`. Keeping it puts the tooltip right after its element in the focus order, in every engine.
- **Clicks and presses in the tooltip stay in it**: they don't reach the app's markup around the element, such as a card with its own click. Keys go on, for Escape. Code that listens for clicks on the document doesn't get them either, so a dropdown of the app's own that closes on a click outside stays open on a click in the tooltip; code that listens while capturing, as VueUse's `onClickOutside` does, still gets them.
- Don't put a `RioTooltip` inside a link or a button: a tooltip with actions would then be an interactive element inside another.

### Showing and hiding

- **The pointer resting on the element for 500ms shows the tooltip, and once a tooltip shows, the next one shows at once**, as the pointer moves along a toolbar: while one is shown, or within 300ms after it closed (the values are Rio's choice). A pointer passing over shows nothing. The spec sets no delay; Radix waits 700ms, and Compose none.
- **It closes 1.5s after the pointer and the focus leave both the element and the tooltip**, as the spec says. The pointer may move onto the tooltip without it closing, as WCAG 1.4.13 asks.
- It closes at once when the element is pressed, on Escape, and when another tooltip shows (Rio's choice for the press).
- **Focus from the keyboard shows it at once** (`:focus-visible`); focus from a click shows nothing.
- **Touch: a touch held for 500ms shows it, and the click it ends with is swallowed**, so a person checking what a button does doesn't press it. A touch that moves more than 10px isn't held. While the touch is held, the browser's own menu for it, such as a link's, stays away. Checked with synthetic touch events only.
- **Persistent**: a click on the element opens it, and another closes it. A click or the focus elsewhere, and Escape, close it too. The pointer doesn't open it. `v-model:open` opens it from the app, as when the page introduces a new feature.
- Only one tooltip shows at a time: a transient tooltip gives way to any other overlay that opens (`attachOverlay`'s `transient`).
- Checked with real input in Chromium, WebKit, and Firefox 160. The keyboard's focus only in Chromium and WebKit: headless Firefox fires no focus events.

### Assistive technology

- A plain tooltip, or a rich one without actions, has the role `tooltip`, and **the element is described by it** (`aria-describedby`), as in the WAI-ARIA tooltip pattern. **When the element's name already says the same, as an icon button labeled with the tooltip's text does, the description is left out**, so a screen reader doesn't read it twice.
- **A rich tooltip with actions is a non-modal dialog**, named by its subhead, or else its text, and the element is described by its text. The WAI-ARIA tooltip pattern says "Tooltip widgets do not receive focus" and "A hover that contains focusable elements can be made using a non-modal dialog"; the spec asks for the role "Tooltip, or similar". Tab moves from the element to the tooltip's buttons, the spec's "Focus lands on button", and the keyboard's focus in the tooltip keeps it open. Focus a click left on one of its buttons doesn't.
- A persistent tooltip's element has `aria-expanded`.
- Rio adds these attributes to the app's element, and takes away only what it added. Whether the element's name repeats the text is checked when the tooltip renders; an element that changes its own name in between keeps the old answer until then.

### Placement and shape

- **Plain shows 4px above the element, centered; rich shows 4px below it, start edges lined up** (Rio's reading of "bottom right": below, extending toward the end). Without room it flips to the other side, and it stays 8px inside the window. `offset` takes 8 for an element without a visible edge, such as text, and `side="bottom"` puts a plain tooltip below, as in an app bar.
- Sizes the tokens leave out come from the M3 Design Kit: a plain tooltip is at most 200px wide, and a rich one at most 312px, with 4px between subhead and text and 12px from the text to the actions. The actions sit 4px in from the container's edge, as the kit draws them; Rio's text button has 16px of padding where the kit's has 12, so their labels sit 4px further in than the text.

### Motion

- The tooltip fades in and out on `fast-effects` (Rio's choice; the spec gives tooltips no motion). Where the browser can't animate leaving the top layer, it closes at once.

### Not yet

- Putting a plain tooltip below its element on its own when it is in an app bar; for now, `side="bottom"`.
- Adjusting the position in 8dp increments, and the desktop's "centered below" option.

## Sources

- [M3 Tooltips – Overview](https://m3.material.io/components/tooltips/overview)
- [M3 Tooltips – Specs](https://m3.material.io/components/tooltips/specs)
- [M3 Tooltips – Guidelines](https://m3.material.io/components/tooltips/guidelines)
- [M3 Tooltips – Accessibility](https://m3.material.io/components/tooltips/accessibility)
- [Material Web component tokens @ 37aa14b](https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass) (`_md-comp-plain-tooltip.scss`, `_md-comp-rich-tooltip.scss`)
- M3 Design Kit (Figma), Tooltips page: the widths of plain and rich tooltips, and the rich tooltip's layout
- [WAI-ARIA Authoring Practices: Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
- [WCAG 2.2: 1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)
- [Radix Tooltip `tooltip.tsx` @ eb3a2b7](https://github.com/radix-ui/primitives/blob/eb3a2b7091293e27df8f9ba906632d8daa3d81a3/packages/react/tooltip/src/tooltip.tsx#L31-L73): the 700ms delay and the 300ms skip
- Compose Multiplatform `BasicTooltipDefaults.TooltipDuration` (public, 1500ms) @ [42a67cb](https://github.com/JetBrains/compose-multiplatform-core/blob/42a67cbc7f13dce0b57956f7bf38ebadd7c35889/compose/foundation/foundation/src/commonMain/kotlin/androidx/compose/foundation/BasicTooltip.kt#L407-L416)
