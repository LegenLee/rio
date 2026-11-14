<script setup lang="ts">
import { createIconButton, type IconButtonProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/button.css';
import '@rio-m3e/styles/icon-button.css';
import { useButtonGroupItem } from '../button-group/context';
import { vRipple } from '../ripple/ripple';
import { vShapeMorph } from '../shape-morph/shape-morph';

// No defaults here: core fills them in, after a surrounding button group has filled in its size
// and shape.
const {
  label,
  variant,
  size,
  width,
  shape,
  toggle,
  selected,
  disabled,
  softDisabled,
  type,
  value,
} = defineProps<IconButtonProps>();
const emit = defineEmits<{
  click: [event: MouseEvent];
  'update:selected': [selected: boolean];
}>();
const slots = defineSlots<{
  /** The icon. Hidden from assistive technology; `label` names the button. */
  default?: () => unknown;
  /**
   * The icon while a toggle button is on, typically the filled version of the default icon. The
   * spec asks for selection to show in more than color alone.
   */
  'selected-icon'?: () => unknown;
}>();

// `satisfies` fails the build if a prop added to IconButtonProps is missing here.
const item = useButtonGroupItem(
  () =>
    ({
      label,
      variant,
      size,
      width,
      shape,
      toggle,
      selected,
      disabled,
      softDisabled,
      type,
      value,
    }) satisfies Record<keyof IconButtonProps, unknown>,
  (next) => emit('update:selected', next),
);
const button = createIconButton({
  props: item.props,
  content: () => ({ selectedIcon: !!slots['selected-icon'] }),
  onClick: (event) => emit('click', event),
  onSelectedChange: item.onSelectedChange,
});
</script>

<template>
  <button v-ripple v-shape-morph v-bind="button.parts.root()" @click="button.handleClick">
    <span v-bind="button.parts.touch()" />
    <span v-bind="button.parts.icon()">
      <slot v-if="button.showsSelectedIcon()" name="selected-icon" />
      <slot v-else />
    </span>
  </button>
</template>
