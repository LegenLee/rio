<script setup lang="ts">
import { mdiBrushOutline, mdiEraser, mdiSelection, mdiTextBoxOutline } from '@mdi/js';
import { RioIcon, RioIconButton, RioToolbar } from '@rio-m3e/vue';
import { ref } from 'vue';

const tool = ref('brush');
const tools = [
  { value: 'brush', label: 'Brush', path: mdiBrushOutline },
  { value: 'eraser', label: 'Eraser', path: mdiEraser },
  { value: 'select', label: 'Select', path: mdiSelection },
  { value: 'text', label: 'Text', path: mdiTextBoxOutline },
];
</script>

<template>
  <!-- Up and down move along a vertical toolbar -->
  <RioToolbar aria-label="Tools" type="floating" orientation="vertical" variant="vibrant">
    <RioIconButton
      v-for="item in tools"
      :key="item.value"
      :selected="tool === item.value"
      :label="item.label"
      variant="tonal"
      toggle
      @update:selected="tool = item.value"
    >
      <RioIcon :icon="{ type: 'svg', path: item.path }" />
    </RioIconButton>
  </RioToolbar>
</template>
