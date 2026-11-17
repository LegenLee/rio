<script setup lang="ts">
import { createButton, type ButtonProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/button.css';
import { useButtonGroupItem } from '../button-group/context';
import { vRipple } from '../ripple/ripple';
import { vShapeMorph } from '../shape-morph/shape-morph';

// No defaults here: core fills them in, after a surrounding button group has filled in its size
// and shape.
const { variant, size, shape, toggle, selected, disabled, softDisabled, type, value, href } =
  defineProps<ButtonProps>();
const emit = defineEmits<{
  click: [event: MouseEvent];
  'update:selected': [selected: boolean];
}>();
const slots = defineSlots<{
  /** The label. */
  default?: () => unknown;
  /** A leading icon. It is hidden from assistive technology, so the label must stand alone. */
  icon?: () => unknown;
}>();

// `satisfies` fails the build if a prop added to ButtonProps is missing here.
const item = useButtonGroupItem(
  () =>
    ({
      variant,
      size,
      shape,
      toggle,
      selected,
      disabled,
      softDisabled,
      type,
      value,
      href,
    }) satisfies Record<keyof ButtonProps, unknown>,
  (next) => emit('update:selected', next),
);
const button = createButton({
  props: item.props,
  content: () => ({ icon: !!slots.icon }),
  onClick: (event) => emit('click', event),
  onChange: item.onChange,
});
</script>

<template>
  <component
    :is="button.isLink() ? 'a' : 'button'"
    v-ripple
    v-shape-morph
    v-bind="button.parts.root()"
    @click="button.handleClick"
  >
    <span v-bind="button.parts.touch()" />
    <span v-if="button.showsIcon()" v-bind="button.parts.icon()"><slot name="icon" /></span>
    <span v-bind="button.parts.label()"><slot /></span>
  </component>
</template>
