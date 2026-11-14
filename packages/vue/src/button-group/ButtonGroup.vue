<script setup lang="ts">
import {
  attachButtonGroup,
  createButtonGroup,
  type ButtonGroupHandle,
  type ButtonGroupProps,
  type ButtonGroupSelected,
} from '@rio-m3e/core';
import '@rio-m3e/styles/button-group.css';
import { onBeforeUnmount, onMounted, provide, useTemplateRef } from 'vue';
import { buttonGroupKey } from './context';

// `v-model` without an argument binds `modelValue`; core calls the same thing `selected`.
interface Props extends Omit<ButtonGroupProps, 'selected'> {
  /** The selected value (`single`) or values (`multiple`), with `v-model`. */
  modelValue?: ButtonGroupSelected;
}

// No defaults here: core fills them in.
const { variant, size, shape, selection, required, modelValue } = defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [selected: ButtonGroupSelected] }>();
defineSlots<{
  /** `RioButton`s and `RioIconButton`s. They take the group's size and shape unless they set their own. */
  default?: () => unknown;
}>();

const group = createButtonGroup({
  // `satisfies` fails the build if a prop added to ButtonGroupProps is missing here.
  props: () =>
    ({
      variant,
      size,
      shape,
      selection,
      required,
      selected: modelValue,
    }) satisfies Record<keyof ButtonGroupProps, unknown>,
  onChange: (selected) => emit('update:modelValue', selected),
});

provide(buttonGroupKey, {
  size: group.size,
  shape: group.shape,
  selection: group.selection,
  isSelected: group.isSelected,
  select: group.select,
});

const root = useTemplateRef<HTMLElement>('root');
let handle: ButtonGroupHandle | undefined;
onMounted(() => {
  handle = attachButtonGroup(root.value!);
});
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="group.parts.root()">
    <slot />
  </div>
</template>
