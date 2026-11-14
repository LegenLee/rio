<script setup lang="ts">
import { createIconButton, iconButtonDefaults, type IconButtonProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/button.css';
import '@rio-m3e/styles/icon-button.css';
import { computed } from 'vue';
import { useButtonGroupItem } from '../button-group/context';
import { vRipple } from '../ripple/ripple';
import { vShapeMorph } from '../shape-morph/shape-morph';

// Size and shape stay undefined when not set, so a surrounding button group can fill them in.
const props = withDefaults(defineProps<IconButtonProps>(), {
  ...iconButtonDefaults,
  size: undefined,
  shape: undefined,
});
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

const item = useButtonGroupItem(props, (selected) => emit('update:selected', selected));
const button = createIconButton({
  props: item.props,
  onClick: (event) => emit('click', event),
  onSelectedChange: item.onSelectedChange,
});
const showsSelectedIcon = computed(() => {
  const p = item.props();
  return !!(p.toggle && p.selected && slots['selected-icon']);
});
</script>

<template>
  <button
    v-ripple
    v-shape-morph
    class="rio-button rio-icon-button rio-state-layer rio-focus-ring"
    v-bind="button.rootAttrs()"
    @click="button.handleClick"
  >
    <span class="rio-button__touch" aria-hidden="true" />
    <span class="rio-button__icon" aria-hidden="true">
      <slot v-if="showsSelectedIcon" name="selected-icon" />
      <slot v-else />
    </span>
  </button>
</template>
