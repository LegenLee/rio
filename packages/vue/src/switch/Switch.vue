<script setup lang="ts">
import { attachRipple, attachSwitchHandle, createSwitch, type SwitchProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/switch.css';
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';

const { selected, disabled, softDisabled } = defineProps<SwitchProps>();
const emit = defineEmits<{ 'update:selected': [selected: boolean] }>();
const slots = defineSlots<{
  /** Shown in the handle while the switch is on. Hidden from assistive technology. */
  'selected-icon'?: () => unknown;
  /** Shown in the handle while the switch is off. Hidden from assistive technology. */
  'unselected-icon'?: () => unknown;
}>();

const onSelectedChange = (next: boolean) => emit('update:selected', next);
const sw = createSwitch({
  // `satisfies` fails the build if a prop added to SwitchProps is missing here.
  props: () => ({ selected, disabled, softDisabled }) satisfies Record<keyof SwitchProps, unknown>,
  content: () => ({
    selectedIcon: !!slots['selected-icon'],
    unselectedIcon: !!slots['unselected-icon'],
  }),
  onSelectedChange,
});

const root = useTemplateRef<HTMLButtonElement>('root');
const state = useTemplateRef<HTMLSpanElement>('state');
let handles: { detach(): void }[] = [];

onMounted(() => {
  handles = [
    attachRipple(root.value!, { surface: state.value! }),
    attachSwitchHandle(root.value!, { selected: () => selected, onSelectedChange }),
  ];
});

onBeforeUnmount(() => handles.forEach((handle) => handle.detach()));
</script>

<template>
  <button ref="root" v-bind="sw.parts.root()" @click="sw.handleClick">
    <span v-bind="sw.parts.touch()" />
    <span ref="state" v-bind="sw.parts.state()" />
    <span v-bind="sw.parts.handle()">
      <span v-if="sw.showsIcon()" v-bind="sw.parts.icon()">
        <slot v-if="sw.showsSelectedIcon()" name="selected-icon" />
        <slot v-else name="unselected-icon" />
      </span>
    </span>
  </button>
</template>
