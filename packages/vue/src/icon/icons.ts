import { iconOfAlias, type IconAlias, type IconRegistry, type IconSource } from '@rio-m3e/core';
import {
  computed,
  inject,
  type Component,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue';

/** An icon: SVG paths, an icon font's ligature or class (`IconSource`), or a Vue component */
export type RioIconValue = IconSource | Component;

/**
 * The app's icons, given to `createRio`: the icons for what Rio's components draw on their own
 * (`aliases`), and `resolve`, which turns a name into an icon.
 */
export type RioIcons = IconRegistry<RioIconValue>;

export const iconsKey: InjectionKey<Ref<RioIcons | undefined>> = Symbol('RioIcons');

/** The app's icons, as `createRio` provides them */
export const useIcons = () => inject(iconsKey, undefined);

/** The icon the app gave for an alias, or none */
export function useIconOfAlias(alias: IconAlias): ComputedRef<RioIconValue | undefined> {
  const icons = useIcons();
  return computed(() => iconOfAlias(icons?.value, alias));
}
