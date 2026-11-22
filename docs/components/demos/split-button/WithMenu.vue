<script setup lang="ts">
import { mdiChevronDown } from '@mdi/js';
import { RioIcon, RioMenu, RioMenuItem, RioSplitButton } from '@rio-m3e/vue';
import { ref, useTemplateRef } from 'vue';

const open = ref(false);
const split = useTemplateRef('split');
</script>

<template>
  <RioSplitButton ref="split" v-model:open="open" menu-label="More save options">
    Save
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
  <!-- 4px from the split button, lined up with the trailing button -->
  <RioMenu
    v-model:open="open"
    :anchor="split?.trailing"
    :offset="4"
    align="end"
    label="More save options"
  >
    <RioMenuItem>Save as…</RioMenuItem>
    <RioMenuItem>Save a copy</RioMenuItem>
  </RioMenu>
</template>
