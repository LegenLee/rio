import { resolveLocale, messagesFor, type MessageOptions, type RioMessages } from '@rio-m3e/core';
import { computed, inject, type ComputedRef, type InjectionKey, type Ref } from 'vue';

/** The language a `RioLocaleProvider` or `createRio` gives the components inside */
export const localeKey: InjectionKey<Ref<string | undefined>> = Symbol('RioLocale');

/** The app's message tables and fallback language, from `createRio` */
export const messagesKey: InjectionKey<Ref<MessageOptions>> = Symbol('RioMessages');

/**
 * The language a component uses: its own `locale`, or the nearest one provided, or the document's,
 * the browser's, or English (`resolveLocale`). Call it in `setup`.
 */
export function useLocale(own: () => string | undefined) {
  const provided = inject(localeKey, undefined);
  return computed(() => resolveLocale(own() ?? provided?.value));
}

/**
 * A component's messages in its language: Rio's tables and the app's (`createRio`), with the
 * component's own `messages` over them. Call it in `setup`.
 */
export function useMessages<Group extends keyof RioMessages>(
  group: Group,
  locale: Ref<string>,
  own: () => Partial<RioMessages[Group]> | undefined,
): ComputedRef<RioMessages[Group]> {
  const options = inject(messagesKey, undefined);
  return computed(() => ({ ...messagesFor(locale.value, options?.value)[group], ...own() }));
}
