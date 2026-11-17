import { resolveLocale } from '@rio-m3e/core';
import {
  computed,
  inject,
  toRef,
  type InjectionKey,
  type MaybeRef,
  type Plugin,
  type Ref,
} from 'vue';

/** The language a `RioLocaleProvider` or the `rioLocale` plugin gives the components inside */
export const localeKey: InjectionKey<Ref<string | undefined>> = Symbol('RioLocale');

export interface RioLocaleOptions {
  /** A language tag, such as `ko` or `en-GB`, or a ref to one, to change it later. */
  locale?: MaybeRef<string | undefined>;
}

/**
 * Sets the language of Rio's components for the whole app: `app.use(rioLocale, { locale: 'ko' })`.
 * A `RioLocaleProvider` inside, or a component's own `locale`, takes over from it.
 */
export const rioLocale: Plugin<[RioLocaleOptions?]> = {
  install(app, options = {}) {
    app.provide(localeKey, toRef(options.locale));
  },
};

/**
 * The language a component uses: its own `locale`, or the nearest one provided, or the document's,
 * the browser's, or English (`resolveLocale`). Call it in `setup`.
 */
export function useLocale(own: () => string | undefined) {
  const provided = inject(localeKey, undefined);
  return computed(() => resolveLocale(own() ?? provided?.value));
}
