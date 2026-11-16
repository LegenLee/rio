<script setup lang="ts">
import {
  attachRadioGroup,
  createRadioGroup,
  type CheckableHandle,
  type RadioGroupDomHandle,
  type RadioGroupProps,
  type RadioValue,
} from '@rio-m3e/core';
import '@rio-m3e/styles/radio.css';
import { nextTick, onBeforeUnmount, onMounted, provide, useId, useTemplateRef, watch } from 'vue';
import { radioGroupKey } from './context';

interface Props extends RadioGroupProps {
  /** The `name` the radio buttons submit their value under. Defaults to a unique one. */
  name?: string;
}

const { label, name } = defineProps<Props>();
/** The selected radio button's value, with `v-model`. */
const model = defineModel<RadioValue | undefined>();
defineSlots<{
  /** `RioRadio`s, each in a `<label>` with its text */
  default?: () => unknown;
}>();

const group = createRadioGroup({
  // `satisfies` fails the build if a prop added to RadioGroupProps is missing here.
  props: () => ({ label }) satisfies Record<keyof RadioGroupProps, unknown>,
});

const id = useId();
const inputs = new Set<CheckableHandle>();
// A change unchecks one input and checks another, and the app may not follow, or the radio button
// may be blocked: every input shows the selection again once the change has been handled.
const resync = () => void nextTick(() => inputs.forEach((input) => input.sync()));
// The app may change the selection itself.
watch(model, resync);

provide(radioGroupKey, {
  name: () => name ?? `${id}-radio`,
  isSelected: (value) => model.value === value,
  select: (value) => (model.value = value),
  register(input) {
    inputs.add(input);
    return () => inputs.delete(input);
  },
});

const root = useTemplateRef<HTMLElement>('root');
let handle: RadioGroupDomHandle | undefined;
onMounted(() => (handle = attachRadioGroup(root.value!)));
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="group.parts.root()" @change="resync">
    <slot />
  </div>
</template>
