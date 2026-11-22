<script setup lang="ts">
import { createSelectOption, type SelectOptionProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/direction.css';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/menu.css';
import { inject, onBeforeUnmount, onMounted, onUpdated, ref, useTemplateRef } from 'vue';
import { vRipple } from '../ripple/ripple';
import { selectKey } from './context';

// No defaults here: core fills them in.
const { value, disabled } = defineProps<SelectOptionProps>();
const slots = defineSlots<{
  /** The label, which the field shows while the option is selected */
  default?: () => unknown;
  /**
   * A leading icon, hidden from assistive technology. `selected` lets it show a check mark next to
   * the color and shape.
   */
  icon?: (props: { selected: boolean }) => unknown;
  /** Supporting text under the label */
  'supporting-text'?: () => unknown;
  /** Trailing text */
  'trailing-text'?: () => unknown;
  /** A trailing icon, hidden from assistive technology */
  'trailing-icon'?: () => unknown;
}>();

const select = inject(selectKey, undefined);
if (!select) throw new Error('RioSelectOption has to be inside a RioSelect.');

const option = createSelectOption({
  // `satisfies` fails the build if a prop added to SelectOptionProps is missing here.
  props: () => ({ value, disabled }) satisfies Record<keyof SelectOptionProps, unknown>,
  content: () => ({
    icon: !!slots.icon,
    supportingText: !!slots['supporting-text'],
    trailingText: !!slots['trailing-text'],
    trailingIcon: !!slots['trailing-icon'],
  }),
  select: () => select,
});

const root = useTemplateRef<HTMLElement>('root');
const labelElement = useTemplateRef<HTMLElement>('label');
// The label as text, read from the page, for the field and the native `<select>`.
const text = ref('');
const read = () => (text.value = labelElement.value?.textContent?.trim() ?? '');
const unregister = select.register({
  value: () => value,
  label: () => text.value,
  element: () => root.value,
});
onMounted(read);
onUpdated(read);
onBeforeUnmount(unregister);
</script>

<template>
  <button ref="root" v-ripple v-bind="option.parts.root()" @click="option.handleClick">
    <span v-bind="option.parts.touch()" />
    <span v-if="option.showsIcon()" v-bind="option.parts.icon()">
      <slot name="icon" :selected="option.selected()" />
    </span>
    <span v-bind="option.parts.text()">
      <span ref="label" v-bind="option.parts.label()"><slot /></span>
      <span v-if="option.showsSupportingText()" v-bind="option.parts.supportingText()">
        <slot name="supporting-text" />
      </span>
    </span>
    <span v-if="option.showsTrailingText()" v-bind="option.parts.trailingText()">
      <slot name="trailing-text" />
    </span>
    <span v-if="option.showsTrailingIcon()" v-bind="option.parts.trailingIcon()">
      <slot name="trailing-icon" />
    </span>
  </button>
</template>
