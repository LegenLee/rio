import type { ChipSetSelection, ChipValue } from '@rio-m3e/core';
import { inject, useId, type InjectionKey } from 'vue';

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
