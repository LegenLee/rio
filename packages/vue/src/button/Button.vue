<script setup lang="ts">
import { buttonDefaults, createButton, type ButtonProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/button.css';
import { useButtonGroupItem } from '../button-group/context';
import { vRipple } from '../ripple/ripple';
import { vShapeMorph } from '../shape-morph/shape-morph';

// Size and shape stay undefined when not set, so a surrounding button group can fill them in.
const props = withDefaults(defineProps<ButtonProps>(), {
  ...buttonDefaults,
  size: undefined,
  shape: undefined,
});
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

const item = useButtonGroupItem(props, (selected) => emit('update:selected', selected));
const button = createButton({
  props: item.props,
  onClick: (event) => emit('click', event),
  onSelectedChange: item.onSelectedChange,
});
</script>

<template>
  <button
    v-ripple
    v-shape-morph
    class="rio-button rio-state-layer rio-focus-ring"
    v-bind="button.rootAttrs()"
    @click="button.handleClick"
  >
    <span class="rio-button__touch" aria-hidden="true" />
    <span v-if="$slots.icon" class="rio-button__icon" aria-hidden="true"><slot name="icon" /></span>
    <span class="rio-button__label"><slot /></span>
  </button>
</template>
