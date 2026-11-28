<script setup lang="ts">
import { attachToolbar, createToolbar, type ToolbarHandle, type ToolbarProps } from '@rio-m3e/core';
import '@rio-m3e/styles/toolbar.css';
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';

// No defaults here: core fills them in.
const { type, variant, orientation, flat } = defineProps<ToolbarProps>();
defineSlots<{
  /** The items: buttons, icon buttons, text fields, or anything else. */
  default?: () => unknown;
}>();

const toolbar = createToolbar({
  // `satisfies` fails the build if a prop added to ToolbarProps is missing here.
  props: () => ({ type, variant, orientation, flat }) satisfies Record<keyof ToolbarProps, unknown>,
});

const root = useTemplateRef<HTMLElement>('root');
let handle: ToolbarHandle | undefined;
onMounted(() => {
  handle = attachToolbar(root.value!);
});
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="toolbar.parts.root()">
    <slot />
  </div>
</template>
