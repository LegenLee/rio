<script setup lang="ts">
import { createFab, type FabProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/accent.css';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/fab.css';
import { vRipple } from '../ripple/ripple';

// No defaults here: core fills them in.
const { label, size, variant, color, extended, type, href } = defineProps<FabProps>();
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const slots = defineSlots<{
  /** The icon. Hidden from assistive technology; `label` names the FAB. */
  default?: () => unknown;
}>();

// `satisfies` fails the build if a prop added to FabProps is missing here.
const fab = createFab({
  props: () =>
    ({ label, size, variant, color, extended, type, href }) satisfies Record<
      keyof FabProps,
      unknown
    >,
  content: () => ({ icon: !!slots.default }),
  onClick: (event) => emit('click', event),
});
</script>

<template>
  <component
    :is="fab.isLink() ? 'a' : 'button'"
    v-ripple
    v-bind="fab.parts.root()"
    @click="fab.handleClick"
  >
    <span v-if="fab.showsIcon()" v-bind="fab.parts.icon()"><slot /></span>
    <span v-bind="fab.parts.label()">
      <span v-bind="fab.parts.text()">{{ label }}</span>
    </span>
  </component>
</template>
