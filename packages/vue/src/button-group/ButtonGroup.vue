<script setup lang="ts">
import {
  attachButtonGroup,
  buttonGroupDefaults,
  createButtonGroup,
  type ButtonGroupHandle,
  type ButtonGroupProps,
  type ButtonGroupSelected,
} from '@rio-m3e/core';
import '@rio-m3e/styles/button-group.css';
import { onBeforeUnmount, onMounted, provide, useTemplateRef } from 'vue';
import { buttonGroupKey } from './context';

interface Props extends Omit<ButtonGroupProps, 'value'> {
  modelValue?: ButtonGroupSelected;
}

const props = withDefaults(defineProps<Props>(), buttonGroupDefaults);
const emit = defineEmits<{ 'update:modelValue': [value: ButtonGroupSelected] }>();
defineSlots<{
  /** `RioButton`s and `RioIconButton`s. They take the group's size and shape unless they set their own. */
  default?: () => unknown;
}>();

const group = createButtonGroup({
  props: () => ({ ...props, value: props.modelValue }),
  onChange: (value) => emit('update:modelValue', value),
});

provide(buttonGroupKey, {
  size: () => props.size,
  shape: () => props.shape,
  selection: () => props.selection,
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
  <div ref="root" class="rio-button-group" v-bind="group.rootAttrs()">
    <slot />
  </div>
</template>
