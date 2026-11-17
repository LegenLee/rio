import type { PartialMessages } from '@rio-m3e/core';
import {
  createThemeCss,
  createThemeVariables,
  type ThemeColorScheme,
  type ThemeOptions,
} from '@rio-m3e/tokens';
import {
  computed,
  effectScope,
  toRef,
  toValue,
  watchEffect,
  type App,
  type MaybeRefOrGetter,
} from 'vue';
import { localeKey, messagesKey } from '../locale/locale';

export interface RioThemeOptions extends ThemeOptions {
  /**
   * The root's `color-scheme`, which picks each color's light or dark value. `false` leaves it to
   * the app. Defaults to `'light dark'`, which follows the system.
   */
  colorScheme?: ThemeColorScheme;
}

export interface RioOptions {
  /**
   * The theme, written as `--rio-*` variables on the document's root as the app installs Rio,
   * before it mounts. A ref or a getter writes it again when it changes.
   */
  theme?: MaybeRefOrGetter<RioThemeOptions | undefined>;
  /**
   * The app's language, such as `ko` or `en-GB`. A ref or a getter changes it later. Without one,
   * the document's, then the browser's, then English.
   */
  locale?: MaybeRefOrGetter<string | undefined>;
  /** For a language Rio has no table for, the language whose messages fill in. Defaults to `'en'`. */
  fallbackLocale?: MaybeRefOrGetter<string | undefined>;
  /** Message tables by language tag: languages Rio has no table for, or messages that replace Rio's. */
  messages?: MaybeRefOrGetter<Record<string, PartialMessages> | undefined>;
}

/** A Vue plugin, for `app.use` */
export interface RioPlugin {
  install(app: App): void;
  /** The theme as a stylesheet, for server rendering: put it in the page's `<head>`. Empty without a theme. */
  readonly css: string;
}

/**
 * Rio for a whole app: `app.use(createRio({ theme: { sourceColor: '#6750a4' }, locale: 'ko' }))`.
 * A `RioLocaleProvider` inside, or a component's own `locale`, takes over the language from it.
 */
export function createRio(options: RioOptions = {}): RioPlugin {
  return {
    get css() {
      const theme = toValue(options.theme);
      return theme ? createThemeCss(theme) : '';
    },
    install(app) {
      app.provide(localeKey, toRef(options.locale));
      app.provide(
        messagesKey,
        computed(() => ({
          messages: toValue(options.messages),
          fallbackLocale: toValue(options.fallbackLocale),
        })),
      );
      // On a server there is no document: the page takes `css` instead.
      if (options.theme === undefined || typeof document === 'undefined') return;
      const root = document.documentElement;
      let written = new Set<string>();
      const scope = effectScope(true);
      scope.run(() =>
        watchEffect(() => {
          const theme = toValue(options.theme);
          const next = new Map<string, string>();
          if (theme) {
            const { colorScheme = 'light dark', ...rest } = theme;
            for (const [name, value] of Object.entries(createThemeVariables(rest))) {
              next.set(name, value);
            }
            if (colorScheme) next.set('color-scheme', colorScheme);
          }
          for (const name of written) if (!next.has(name)) root.style.removeProperty(name);
          for (const [name, value] of next) root.style.setProperty(name, value);
          written = new Set(next.keys());
        }),
      );
      app.onUnmount(() => {
        scope.stop();
        for (const name of written) root.style.removeProperty(name);
      });
    },
  };
}
