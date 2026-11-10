<script setup lang="ts">
import {
  attachRipple,
  attachSwitchHandle,
  createSwitch,
  switchDefaults,
  type SwitchProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/switch.css';
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue';

const props = withDefaults(defineProps<SwitchProps>(), switchDefaults);
const emit = defineEmits<{ 'update:selected': [selected: boolean] }>();
const slots = defineSlots<{
  /** Shown in the handle while the switch is on. Hidden from assistive technology. */
  'selected-icon'?: () => unknown;
  /** Shown in the handle while the switch is off. Hidden from assistive technology. */
  'unselected-icon'?: () => unknown;
}>();

const onSelectedChange = (selected: boolean) => emit('update:selected', selected);
const sw = createSwitch({ props: () => props, onSelectedChange });

const showsIcon = computed(
  () => !!(props.selected ? slots['selected-icon'] : slots['unselected-icon']),
);

const root = useTemplateRef<HTMLButtonElement>('root');
const state = useTemplateRef<HTMLSpanElement>('state');
let handles: { detach(): void }[] = [];

onMounted(() => {
  handles = [
    attachRipple(root.value!, { surface: state.value! }),
    attachSwitchHandle(root.value!, { selected: () => props.selected, onSelectedChange }),
  ];
});

onBeforeUnmount(() => handles.forEach((handle) => handle.detach()));
</script>

<template>
  <button
    ref="root"
    class="rio-switch rio-focus-ring"
    v-bind="sw.rootAttrs()"
    :data-icon="showsIcon ? '' : undefined"
    @click="sw.handleClick"
  >
    <span class="rio-switch__touch" aria-hidden="true" />
    <span ref="state" class="rio-switch__state" aria-hidden="true" />
    <span class="rio-switch__handle" aria-hidden="true">
      <span v-if="showsIcon" class="rio-switch__icon">
        <slot v-if="props.selected" name="selected-icon" />
        <slot v-else name="unselected-icon" />
      </span>
    </span>
  </button>
</template>
