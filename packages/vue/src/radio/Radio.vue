<script setup lang="ts">
import {
  attachCheckable,
  createRadio,
  mergePartAttrs,
  type CheckableHandle,
  type RadioProps,
  type RadioValue,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/radio.css';
import { inject, onBeforeUnmount, onMounted, onUpdated, useTemplateRef } from 'vue';
import { useRipple } from '../ripple/ripple';
import { radioGroupKey } from './context';

// `class` and `style` dress the whole radio button; every other attribute, such as `id` or
// `aria-label`, and every listener belongs to the input.
defineOptions({ inheritAttrs: false });

interface Props extends RadioProps {
  /** The group's `v-model` takes this value when the radio button is selected. */
  value?: RadioValue;
}

// `selected` is for a radio button outside a group, which only shows it, as in a list item.
const { value, selected, disabled, softDisabled } = defineProps<Props>();

const group = inject(radioGroupKey, null);
if (group && value === undefined) throw new Error('RioRadio in a RioRadioGroup needs a value.');
const isSelected = () => (group ? group.isSelected(value!) : !!selected);

const radio = createRadio({
  // `satisfies` fails the build if a prop added to RadioProps is missing here.
  props: () =>
    ({ selected: isSelected(), disabled, softDisabled }) satisfies Record<
      keyof RadioProps,
      unknown
    >,
  name: () => group?.name() ?? '',
  value: () => String(value ?? ''),
});

const input = useTemplateRef<HTMLInputElement>('input');
const state = useTemplateRef<HTMLSpanElement>('state');
useRipple(input, state);
let checkable: CheckableHandle | undefined;
let unregister: (() => void) | undefined;
onMounted(() => {
  checkable = attachCheckable(input.value!, {
    checked: isSelected,
    blocked: radio.blocked,
    // Outside a group nothing changes the state, so the input goes back to it.
    onChange: (checked) => (group ? checked && group.select(value!) : checkable?.sync()),
  });
  unregister = group?.register(checkable);
});
onUpdated(() => checkable?.sync());
onBeforeUnmount(() => {
  unregister?.();
  checkable?.detach();
});
</script>

<template>
  <span v-bind="radio.parts.root()" :class="$attrs.class" :style="$attrs.style">
    <input
      ref="input"
      v-bind="
        mergePartAttrs({ ...$attrs, class: undefined, style: undefined }, radio.parts.input())
      "
    />
    <span ref="state" v-bind="radio.parts.state()" />
    <span v-bind="radio.parts.icon()" />
  </span>
</template>
