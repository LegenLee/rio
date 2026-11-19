<script setup lang="ts">
import {
  attachCheckable,
  createCheckbox,
  mergePartAttrs,
  type CheckableHandle,
  type CheckboxProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/checkbox.css';
import { nextTick, onBeforeUnmount, onMounted, onUpdated, useTemplateRef } from 'vue';
import { useRipple } from '../ripple/ripple';

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
useRipple(input, state);
let checkable: CheckableHandle | undefined;
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
});
onUpdated(() => checkable?.sync());
onBeforeUnmount(() => checkable?.detach());
</script>

<template>
  <span v-bind="checkbox.parts.root()" :class="$attrs.class" :style="$attrs.style">
    <input
      ref="input"
      v-bind="
        mergePartAttrs({ ...$attrs, class: undefined, style: undefined }, checkbox.parts.input())
      "
    />
    <span ref="state" v-bind="checkbox.parts.state()" />
    <span v-bind="checkbox.parts.container()">
      <span v-bind="checkbox.parts.icon()" />
    </span>
  </span>
</template>
