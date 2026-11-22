<script setup lang="ts">
import { createAssistChip, type AssistChipProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/base/touch-target.css';
import '@rio-m3e/styles/chip.css';
import { useTemplateRef } from 'vue';
import { useRipple } from '../ripple/ripple';
import { useChipSetItem } from './context';

const { elevated, href, disabled, softDisabled } = defineProps<AssistChipProps>();
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const slots = defineSlots<{
  /** The label. */
  default?: () => unknown;
  /** A leading icon. It is hidden from assistive technology, so the label must stand alone. */
  icon?: () => unknown;
}>();

const item = useChipSetItem();
const chip = createAssistChip({
  // `satisfies` fails the build if a prop added to AssistChipProps is missing here.
  props: () =>
    ({ elevated, href, disabled, softDisabled }) satisfies Record<keyof AssistChipProps, unknown>,
  content: () => ({ icon: !!slots.icon }),
  key: item.key,
  tabStop: item.tabStop,
  onClick: (event) => emit('click', event),
});

useRipple(useTemplateRef<HTMLElement>('root'), useTemplateRef<HTMLElement>('state'));
</script>

<template>
  <component
    :is="chip.isLink() ? 'a' : 'button'"
    ref="root"
    v-bind="chip.parts.root()"
    @click="chip.handleClick"
  >
    <span v-bind="chip.parts.touch()" />
    <span ref="state" v-bind="chip.parts.state()" />
    <span v-if="chip.showsIcon()" v-bind="chip.parts.icon()"><slot name="icon" /></span>
    <span v-bind="chip.parts.label()"><slot /></span>
  </component>
</template>
