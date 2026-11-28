<script setup lang="ts">
import { mdiFormatBold, mdiFormatItalic, mdiFormatUnderline, mdiRedo, mdiUndo } from '@mdi/js';
import { RioIcon, RioIconButton, RioToolbar } from '@rio-m3e/vue';
import { reactive } from 'vue';

const format = reactive({ bold: true, italic: false, underline: false });
</script>

<template>
  <RioToolbar
    v-for="variant in ['standard', 'vibrant'] as const"
    :key="variant"
    :aria-label="`Formatting, ${variant}`"
    type="floating"
    :variant="variant"
  >
    <RioIconButton label="Undo" variant="standard">
      <RioIcon :icon="{ type: 'svg', path: mdiUndo }" />
    </RioIconButton>
    <RioIconButton label="Redo" variant="standard">
      <RioIcon :icon="{ type: 'svg', path: mdiRedo }" />
    </RioIconButton>
    <RioIconButton v-model:selected="format.bold" label="Bold" variant="tonal" toggle>
      <RioIcon :icon="{ type: 'svg', path: mdiFormatBold }" />
    </RioIconButton>
    <RioIconButton v-model:selected="format.italic" label="Italic" variant="tonal" toggle>
      <RioIcon :icon="{ type: 'svg', path: mdiFormatItalic }" />
    </RioIconButton>
    <RioIconButton v-model:selected="format.underline" label="Underline" variant="tonal" toggle>
      <RioIcon :icon="{ type: 'svg', path: mdiFormatUnderline }" />
    </RioIconButton>
  </RioToolbar>
</template>
