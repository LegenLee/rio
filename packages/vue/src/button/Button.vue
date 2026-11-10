<script setup lang="ts">
import { buttonDefaults, createButton, type ButtonProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/button.css';
import { vRipple } from '../ripple/ripple';

const props = withDefaults(defineProps<ButtonProps>(), buttonDefaults);
const emit = defineEmits<{
  click: [event: MouseEvent];
  'update:selected': [selected: boolean];
}>();
defineSlots<{
  /** The label. */
  default?: () => unknown;
  /** A leading icon. It is hidden from assistive technology, so the label must stand alone. */
  icon?: () => unknown;
}>();

const button = createButton({
  props: () => props,
  onClick: (event) => emit('click', event),
  onSelectedChange: (selected) => emit('update:selected', selected),
});
</script>

<template>
  <button
    v-ripple
    class="rio-button rio-state-layer rio-focus-ring"
    v-bind="button.rootAttrs()"
    @click="button.handleClick"
  >
    <span class="rio-button__touch" aria-hidden="true" />
    <span v-if="$slots.icon" class="rio-button__icon" aria-hidden="true"><slot name="icon" /></span>
    <span class="rio-button__label"><slot /></span>
  </button>
</template>
