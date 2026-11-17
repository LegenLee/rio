# Languages

Some of Rio's components show text of their own or write dates, as the date picker's Cancel and OK, its month names, and its format, such as MM/DD/YYYY. They take all of it from one language.

## Which language

A component uses the first of these it finds:

1. Its own `locale` prop.
2. The nearest `RioLocaleProvider` around it.
3. The `rioLocale` plugin, for the whole app.
4. The document's `lang` (`<html lang="ko">`).
5. The browser's language.
6. English.

```ts
// main.ts: the whole app
import { rioLocale } from '@rio-m3e/vue';

app.use(rioLocale, { locale: 'ko' });
// A ref changes it later: app.use(rioLocale, { locale: languageRef })
```

```vue
<!-- Part of a page -->
<RioLocaleProvider locale="en-GB">
  <BookingForm />
</RioLocaleProvider>
```

Other adapters provide the language their framework's way, as a React adapter would with a context.

**With server rendering, give the language**, the same as `<html lang>`, with the plugin or a provider. On the server Rio can't see the visitor's language, so without one it renders in English, which the browser then has to match.

## What the language decides

- **Text**: from Rio's message tables in `@rio-m3e/core`, which are English and Korean so far. A language without a table gets English. A component's `messages` prop replaces any of its text:

  ```vue
  <RioDatePicker v-model="date" :messages="{ openCalendar: 'Pick a day' }" />
  ```

- **Dates**: through `Intl`, how dates are written (11/27/2026, 27.11.2026, 2026. 11. 27.), the names of months and days, and the first day of the week, which a component's `firstDayOfWeek` can override. Dates are always Gregorian, and fields read and write Latin digits.
- Where a browser lacks `Intl.Locale.prototype.getWeekInfo`, the first day of the week comes from the older `weekInfo` getter, or else from CLDR's table for the language's likely region.

## Adding a language

A table is a file in `packages/core/src/locale/messages/`, named after the language's first subtag (`ko.ts`), with every message the English one has; a test checks that none is missing. Add it to the tables in `messages.ts`.
