<script setup lang="ts">
import { createFilterChip, type FilterChipProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/chip.css';
import { useTemplateRef } from 'vue';
import { useChipRipple, useChipSetItem } from './context';

const { selected, elevated, value, menu, open, disabled, softDisabled } =
  defineProps<FilterChipProps>();
const emit = defineEmits<{
  click: [event: MouseEvent];
  'update:selected': [selected: boolean];
  'update:open': [open: boolean];
}>();
const slots = defineSlots<{
  /** The label. */
  default?: () => unknown;
  /** A leading icon, shown while the chip isn't selected. Hidden from assistive technology. */
  icon?: () => unknown;
  /** The icon while the chip is selected, such as a checkmark. Hidden from assistive technology. */
  'selected-icon'?: () => unknown;
  /** A `menu` chip's trailing icon, such as a dropdown arrow, which turns over while open. */
  'dropdown-icon'?: () => unknown;
}>();

const item = useChipSetItem();
// In a chip set that keeps a selection, a chip with a `value` is selected as the set says.
const grouped = () => !!item.set && item.set.selection() !== 'none' && value !== undefined && !menu;
const chip = createFilterChip({
  // `satisfies` fails the build if a prop added to FilterChipProps is missing here.
  props: () =>
    ({
      selected: grouped() ? item.set!.isSelected(value!) : selected,
      elevated,
      value,
      menu,
      open,
      disabled,
      softDisabled,
    }) satisfies Record<keyof FilterChipProps, unknown>,
  content: () => ({
    icon: !!slots.icon,
    selectedIcon: !!slots['selected-icon'],
    dropdownIcon: !!slots['dropdown-icon'],
  }),
  key: item.key,
  tabStop: item.tabStop,
  onClick: (event) => emit('click', event),
  onChange(next) {
    if (grouped()) item.set!.select(value!, next);
    else emit('update:selected', next);
  },
  onOpenChange: (next) => emit('update:open', next),
});

useChipRipple(useTemplateRef<HTMLElement>('root'), useTemplateRef<HTMLElement>('state'));
</script>

<template>
  <button ref="root" v-bind="chip.parts.root()" @click="chip.handleClick">
    <span v-bind="chip.parts.touch()" />
    <span ref="state" v-bind="chip.parts.state()" />
    <span v-if="chip.showsIcon()" v-bind="chip.parts.icon()">
      <slot v-if="chip.showsSelectedIcon()" name="selected-icon" />
      <slot v-else name="icon" />
    </span>
    <span v-bind="chip.parts.label()"><slot /></span>
    <span v-if="chip.showsTrailing()" v-bind="chip.parts.trailing()">
      <slot name="dropdown-icon" />
    </span>
  </button>
</template>
