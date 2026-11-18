import { attachRipple, type ChipSetSelection, type ChipValue } from '@rio-m3e/core';
import { inject, useId, watch, type InjectionKey, type Ref } from 'vue';

/** What `RioChipSet` provides to the chips inside it. */
export interface ChipSetContext {
  selection: () => ChipSetSelection;
  isSelected: (value: ChipValue) => boolean;
  select: (value: ChipValue, selected: boolean) => void;
  isTabStop: (key: string) => boolean | undefined;
}

export const chipSetKey: InjectionKey<ChipSetContext> = Symbol('RioChipSet');

/**
 * For the chips: the chip set around the chip, if any, the chip's key in it, and whether the chip
 * is the set's tab stop. Outside a set, the chip has no key and no tab stop.
 */
export function useChipSetItem() {
  const set = inject(chipSetKey, null);
  const key = useId();
  return {
    set,
    key: () => (set ? key : undefined),
    tabStop: () => set?.isTabStop(key),
  };
}

/**
 * Presses on `element` ripple on `surface`, the chip's state part. Attaches again when either
 * element is replaced, as when a chip turns into a link.
 */
export function useChipRipple(
  element: Readonly<Ref<HTMLElement | null>>,
  surface: Readonly<Ref<HTMLElement | null>>,
) {
  watch(
    [element, surface],
    ([el, state], _, onCleanup) => {
      if (!el || !state) return;
      const ripple = attachRipple(el, { surface: state });
      onCleanup(() => ripple.detach());
    },
    { flush: 'post' },
  );
}
