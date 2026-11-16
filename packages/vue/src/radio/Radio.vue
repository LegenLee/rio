<script setup lang="ts">
import {
  attachCheckable,
  attachRipple,
  createRadio,
  type CheckableHandle,
  type RadioProps,
  type RadioValue,
  type RippleHandle,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/radio.css';
import { inject, onBeforeUnmount, onMounted, onUpdated, useTemplateRef } from 'vue';
import { radioGroupKey } from './context';

// `class` and `style` dress the whole radio button; every other attribute, such as `id` or
// `aria-label`, and every listener belongs to the input.
defineOptions({ inheritAttrs: false });

interface Props extends Omit<RadioProps, 'selected'> {
  /** The group's `v-model` takes this value when the radio button is selected. */
  value: RadioValue;
}

const { value, disabled, softDisabled } = defineProps<Props>();

const group = inject(radioGroupKey);
if (!group) throw new Error('RioRadio has to be inside a RioRadioGroup.');

const radio = createRadio({
  // `satisfies` fails the build if a prop added to RadioProps is missing here.
  props: () =>
    ({ selected: group.isSelected(value), disabled, softDisabled }) satisfies Record<
      keyof RadioProps,
      unknown
    >,
  name: group.name,
  value: () => String(value),
});

const input = useTemplateRef<HTMLInputElement>('input');
const state = useTemplateRef<HTMLSpanElement>('state');
let checkable: CheckableHandle | undefined;
let ripple: RippleHandle | undefined;
let unregister: (() => void) | undefined;
onMounted(() => {
  checkable = attachCheckable(input.value!, {
    checked: () => group.isSelected(value),
    blocked: radio.blocked,
    onChange: (checked) => checked && group.select(value),
  });
  unregister = group.register(checkable);
  ripple = attachRipple(input.value!, { surface: state.value! });
});
onUpdated(() => checkable?.sync());
onBeforeUnmount(() => {
  unregister?.();
  checkable?.detach();
  ripple?.detach();
});
</script>

<template>
  <span v-bind="radio.parts.root()" :class="$attrs.class" :style="$attrs.style">
    <input
      ref="input"
      v-bind="{ ...$attrs, class: undefined, style: undefined, ...radio.parts.input() }"
    />
    <span ref="state" v-bind="radio.parts.state()" />
    <span v-bind="radio.parts.icon()" />
  </span>
</template>
