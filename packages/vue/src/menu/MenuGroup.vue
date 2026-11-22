<script setup lang="ts">
import { createMenuGroup, type MenuGroupProps } from '@rio-m3e/core';
import '@rio-m3e/styles/base/direction.css';
import '@rio-m3e/styles/menu.css';

const { label } = defineProps<MenuGroupProps>();
defineSlots<{
  /** The group's `RioMenuItem`s */
  default?: () => unknown;
}>();

const group = createMenuGroup({
  props: () => ({ label }) satisfies Record<keyof MenuGroupProps, unknown>,
});
</script>

<template>
  <div v-bind="group.parts.root()">
    <div v-if="group.showsLabel()" v-bind="group.parts.label()">{{ label }}</div>
    <div v-bind="group.parts.items()"><slot /></div>
  </div>
</template>
