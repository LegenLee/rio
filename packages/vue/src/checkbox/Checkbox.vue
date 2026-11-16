<script setup lang="ts">
import {
  attachCheckable,
  attachRipple,
  createCheckbox,
  type CheckableHandle,
  type CheckboxProps,
  type RippleHandle,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/checkbox.css';
import { nextTick, onBeforeUnmount, onMounted, onUpdated, useTemplateRef } from 'vue';

// `class` and `style` dress the whole checkbox; every other attribute, such as `id`, `name`,
// `value`, or `aria-label`, and every listener belongs to the input.
defineOptions({ inheritAttrs: false });

const { selected, indeterminate, error, disabled, softDisabled } = defineProps<CheckboxProps>();
const emit = defineEmits<{ 'update:selected': [selected: boolean] }>();

const checkbox = createCheckbox({
  // `satisfies` fails the build if a prop added to CheckboxProps is missing here.
  props: () =>
    ({ selected, indeterminate, error, disabled, softDisabled }) satisfies Record<
      keyof CheckboxProps,
      unknown
    >,
});

const input = useTemplateRef<HTMLInputElement>('input');
const state = useTemplateRef<HTMLSpanElement>('state');
let checkable: CheckableHandle | undefined;
let ripple: RippleHandle | undefined;
onMounted(() => {
  checkable = attachCheckable(input.value!, {
    checked: () => !!selected,
    indeterminate: () => !!indeterminate,
    blocked: checkbox.blocked,
    onChange(checked) {
      emit('update:selected', checkbox.next(checked));
      // The input shows the app's state again, whether or not it followed.
      void nextTick(() => checkable?.sync());
    },
  });
  ripple = attachRipple(input.value!, { surface: state.value! });
});
onUpdated(() => checkable?.sync());
onBeforeUnmount(() => {
  checkable?.detach();
  ripple?.detach();
});
</script>

<template>
  <span v-bind="checkbox.parts.root()" :class="$attrs.class" :style="$attrs.style">
    <input
      ref="input"
      v-bind="{ ...$attrs, class: undefined, style: undefined, ...checkbox.parts.input() }"
    />
    <span ref="state" v-bind="checkbox.parts.state()" />
    <span v-bind="checkbox.parts.container()">
      <span v-bind="checkbox.parts.icon()" />
    </span>
  </span>
</template>
