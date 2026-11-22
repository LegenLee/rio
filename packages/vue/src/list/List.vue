<script setup lang="ts">
import {
  attachList,
  createList,
  type ListDomHandle,
  type ListProps,
  type ListSelected,
} from '@rio-m3e/core';
import '@rio-m3e/styles/list.css';
import { onBeforeUnmount, onMounted, onUpdated, provide, ref, useTemplateRef } from 'vue';
import { listKey } from './context';

// `v-model` without an argument binds `modelValue`; core calls the same thing `selected`.
interface Props extends Omit<ListProps, 'selected'> {
  /** The selected value (`single`) or values (`multiple`), with `v-model`. */
  modelValue?: ListSelected;
}

// No defaults here: core fills them in.
const { variant, selection, required, control, controlPosition, label, modelValue } =
  defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [selected: ListSelected] }>();
defineSlots<{
  /** The items (`RioListItem`). With `selection`, those with a `value` are chosen. */
  default?: () => unknown;
}>();

/** The key of the item the list's tab stop is on, as `attachList` reports it */
const tabStop = ref<string>();
const list = createList({
  // `satisfies` fails the build if a prop added to ListProps is missing here.
  props: () =>
    ({
      variant,
      selection,
      required,
      control,
      controlPosition,
      label,
      selected: modelValue,
    }) satisfies Record<keyof ListProps, unknown>,
  tabStop: () => tabStop.value,
  onChange: (selected) => emit('update:modelValue', selected),
});

provide(listKey, {
  selection: list.selection,
  control: list.control,
  controlPosition: list.controlPosition,
  isSelected: list.isSelected,
  toggle: list.toggle,
  isTabStop: list.isTabStop,
});

const root = useTemplateRef<HTMLElement>('root');
let handle: ListDomHandle | undefined;
onMounted(() => {
  handle = attachList(root.value!, {
    tabStop: () => tabStop.value,
    onTabStopChange: (key) => (tabStop.value = key),
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <ul ref="root" v-bind="list.parts.root()">
    <slot />
  </ul>
</template>
