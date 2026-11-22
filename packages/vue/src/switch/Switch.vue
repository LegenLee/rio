<script setup lang="ts">
import {
  attachCheckable,
  attachSwitchHandle,
  createSwitch,
  mergePartAttrs,
  type CheckableHandle,
  type SwitchProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/switch.css';
import { nextTick, onBeforeUnmount, onMounted, onUpdated, useTemplateRef } from 'vue';
import { useRipple } from '../ripple/ripple';

// `class` and `style` dress the whole switch; every other attribute, such as `id`, `name`,
// `value`, `required`, or `aria-label`, and every listener belongs to the input.
defineOptions({ inheritAttrs: false });

const { selected, disabled, softDisabled } = defineProps<SwitchProps>();
const emit = defineEmits<{ 'update:selected': [selected: boolean] }>();
const slots = defineSlots<{
  /** Shown in the handle while the switch is on. Hidden from assistive technology. */
  'selected-icon'?: () => unknown;
  /** Shown in the handle while the switch is off. Hidden from assistive technology. */
  'unselected-icon'?: () => unknown;
}>();

const onChange = (next: boolean) => {
  emit('update:selected', next);
  // The input shows the app's state again, whether or not it followed.
  void nextTick(() => checkable?.sync());
};
const sw = createSwitch({
  // `satisfies` fails the build if a prop added to SwitchProps is missing here.
  props: () => ({ selected, disabled, softDisabled }) satisfies Record<keyof SwitchProps, unknown>,
  content: () => ({
    selectedIcon: !!slots['selected-icon'],
    unselectedIcon: !!slots['unselected-icon'],
  }),
  onChange,
});

const root = useTemplateRef<HTMLSpanElement>('root');
const input = useTemplateRef<HTMLInputElement>('input');
const state = useTemplateRef<HTMLSpanElement>('state');
useRipple(input, state);
let checkable: CheckableHandle | undefined;
let handles: { detach(): void }[] = [];

onMounted(() => {
  checkable = attachCheckable(input.value!, {
    checked: () => !!selected,
    blocked: sw.blocked,
    onChange,
  });
  handles = [
    checkable,
    attachSwitchHandle(root.value!, { input: input.value!, selected: () => !!selected, onChange }),
  ];
});
onUpdated(() => checkable?.sync());
onBeforeUnmount(() => handles.forEach((handle) => handle.detach()));
</script>

<template>
  <span ref="root" v-bind="sw.parts.root()" :class="$attrs.class" :style="$attrs.style">
    <input
      ref="input"
      v-bind="mergePartAttrs({ ...$attrs, class: undefined, style: undefined }, sw.parts.input())"
      @keydown="sw.handleKeydown"
    />
    <span ref="state" v-bind="sw.parts.state()" />
    <span v-bind="sw.parts.handle()">
      <span v-if="sw.showsIcon()" v-bind="sw.parts.icon()">
        <slot v-if="sw.showsSelectedIcon()" name="selected-icon" />
        <slot v-else name="unselected-icon" />
      </span>
    </span>
  </span>
</template>
