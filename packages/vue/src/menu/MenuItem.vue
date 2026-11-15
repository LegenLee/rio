<script setup lang="ts">
import { createMenuItem, type MenuItemProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/menu.css';
import { inject } from 'vue';
import { vRipple } from '../ripple/ripple';
import { menuKey } from './context';

// No defaults here: core fills them in.
const { value, disabled } = defineProps<MenuItemProps>();
const emit = defineEmits<{
  /** The item was chosen. A disabled item emits nothing. */
  click: [event: MouseEvent];
}>();
const slots = defineSlots<{
  /** The label */
  default?: () => unknown;
  /**
   * A leading icon, hidden from assistive technology. In a selecting menu, `selected` lets it show
   * a check mark, which the spec recommends next to the color and shape.
   */
  icon?: (props: { selected: boolean }) => unknown;
  /** Supporting text under the label */
  'supporting-text'?: () => unknown;
  /** Trailing text, such as a keyboard shortcut */
  'trailing-text'?: () => unknown;
  /** A trailing icon, hidden from assistive technology */
  'trailing-icon'?: () => unknown;
}>();

const menu = inject(menuKey, undefined);
const item = createMenuItem({
  // `satisfies` fails the build if a prop added to MenuItemProps is missing here.
  props: () => ({ value, disabled }) satisfies Record<keyof MenuItemProps, unknown>,
  content: () => ({
    icon: !!slots.icon,
    supportingText: !!slots['supporting-text'],
    trailingText: !!slots['trailing-text'],
    trailingIcon: !!slots['trailing-icon'],
  }),
  menu: () => menu,
  onClick: (event) => emit('click', event),
});
</script>

<template>
  <button v-ripple v-bind="item.parts.root()" @click="item.handleClick">
    <span v-bind="item.parts.touch()" />
    <span v-if="item.showsIcon()" v-bind="item.parts.icon()">
      <slot name="icon" :selected="item.selected()" />
    </span>
    <span v-bind="item.parts.text()">
      <span v-bind="item.parts.label()"><slot /></span>
      <span v-if="item.showsSupportingText()" v-bind="item.parts.supportingText()">
        <slot name="supporting-text" />
      </span>
    </span>
    <span v-if="item.showsTrailingText()" v-bind="item.parts.trailingText()">
      <slot name="trailing-text" />
    </span>
    <span v-if="item.showsTrailingIcon()" v-bind="item.parts.trailingIcon()">
      <slot name="trailing-icon" />
    </span>
  </button>
</template>
