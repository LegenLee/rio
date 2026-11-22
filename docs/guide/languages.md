# Languages

Some of Rio's components show text of their own or write dates, as the date picker's Cancel and OK, its month names, and its format, such as MM/DD/YYYY. They take all of it from one language.

## Which language

A component uses the first of these it finds:

1. Its own `locale` prop.
2. The nearest `RioLocaleProvider` around it.
3. `createRio`'s `locale`, for the whole app.
4. The document's `lang` (`<html lang="ko">`).
5. The browser's language.
6. English.

```ts
// main.ts: the whole app
import { createRio } from '@rio-m3e/vue';

app.use(createRio({ locale: 'ko' }));
// A ref or a getter changes it later: createRio({ locale: languageRef })
```

An app on vue-i18n can hand Rio the same language: `createRio({ locale: () => i18n.global.locale.value })` with `legacy: false`, or `() => i18n.global.locale` in legacy mode, vue-i18n's default, where `locale` is a string.

```vue
<!-- Part of a page -->
<RioLocaleProvider locale="en-GB">
  <BookingForm />
</RioLocaleProvider>
```

Other adapters provide the language their framework's way, as a React adapter would with a context.

**With server rendering, give the language**, the same as `<html lang>`, with `createRio` or a provider. On the server Rio can't see the visitor's language, so without one it renders in English, which the browser then has to match.

## What the language decides

- **Text**: from Rio's message tables in `@rio-m3e/core`, which are English and Korean so far, and the app's (below). A component's `messages` prop replaces any of its text:

  ```vue
  <RioDatePicker v-model="date" :messages="{ openCalendar: 'Pick a day' }" />
  ```

- **Dates**: through `Intl`, how dates are written (11/27/2026, 27.11.2026, 2026. 11. 27.), the names of months and days, and the first day of the week, which a component's `firstDayOfWeek` can override. Dates are always Gregorian, and fields read and write Latin digits.
- **Line heights**: `createRio`'s theme takes the line heights for the script of the app's language, taller for Korean, Chinese, Japanese, Arabic, Thai, and most scripts other than Latin, Greek, Cyrillic, and Hebrew, unless the theme gives its own `languageHeight`. They follow `createRio`'s `locale`, the document's `lang`, or the browser's language; a `RioLocaleProvider` or a component's `locale` leaves them as they are. For part of a page in a script of another height, write the theme on it again with its own: `attachTheme(element, { ...theme, languageHeight: languageHeightOf('my') })`, from `@rio-m3e/tokens`.
- Where a browser lacks `Intl.Locale.prototype.getWeekInfo`, the first day of the week comes from the older `weekInfo` getter, or else from CLDR's table for the language's likely region.

## The app's messages

`createRio`'s `messages` adds tables, by language tag, for languages Rio has none for, or replaces any of Rio's text for the whole app. A table can leave messages out. A tag with a region, such as `en-GB`, goes over its language's table.

```ts
createRio({
  locale: 'ja',
  messages: {
    ja: { datePicker: { cancel: 'キャンセル', ok: 'OK' } },
    en: { timePicker: { switchToInput: 'Type the time' } },
  },
  fallbackLocale: 'en',
});
```

For a language Rio has no table for, what the app's tables leave out comes from `fallbackLocale`'s messages, English by default, and from English after that, so every message has a text. A language Rio has a table for takes what is missing from Rio's own.

`messages` and `fallbackLocale` take refs or getters too.

## Adding a language to Rio

A table in Rio is a file in `packages/core/src/locale/messages/`, named after the language's first subtag (`ko.ts`), with every message the English one has; a test checks that none is missing. Add it to the tables in `messages.ts`.
