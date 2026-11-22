<script setup lang="ts">
import {
  attachChipSet,
  createChipSet,
  type ChipSetDomHandle,
  type ChipSetProps,
  type ChipSetSelected,
} from '@rio-m3e/core';
import '@rio-m3e/styles/chip.css';
import { onBeforeUnmount, onMounted, onUpdated, provide, ref, useTemplateRef } from 'vue';
import { chipSetKey } from './context';

// `v-model` without an argument binds `modelValue`; core calls the same thing `selected`.
interface Props extends Omit<ChipSetProps, 'selected'> {
  /** The selected value (`single`) or values (`multiple`), with `v-model`. */
  modelValue?: ChipSetSelected;
}

// No defaults here: core fills them in.
const { selection, required, scroll, modelValue } = defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [selected: ChipSetSelected] }>();
defineSlots<{
  /** The chips. Filter chips with a `value` take their selection from the set, with `selection`. */
  default?: () => unknown;
}>();

/** The key of the chip the set's tab stop is on, as `attachChipSet` reports it */
const tabStop = ref<string>();
const set = createChipSet({
  // `satisfies` fails the build if a prop added to ChipSetProps is missing here.
  props: () =>
    ({ selection, required, scroll, selected: modelValue }) satisfies Record<
      keyof ChipSetProps,
      unknown
    >,
  tabStop: () => tabStop.value,
  onChange: (selected) => emit('update:modelValue', selected),
});

provide(chipSetKey, {
  selection: set.selection,
  isSelected: set.isSelected,
  select: set.select,
  isTabStop: set.isTabStop,
});

const root = useTemplateRef<HTMLElement>('root');
let handle: ChipSetDomHandle | undefined;
onMounted(() => {
  handle = attachChipSet(root.value!, {
    tabStop: () => tabStop.value,
    onTabStopChange: (key) => (tabStop.value = key),
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="set.parts.root()">
    <slot />
  </div>
</template>
