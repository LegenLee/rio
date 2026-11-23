<script setup lang="ts">
import { mdiFormatBold, mdiFormatItalic, mdiFormatUnderline, mdiRedo, mdiUndo } from '@mdi/js';
import { RioIcon, RioIconButton, RioToolbar } from '@rio-m3e/vue';
import { reactive } from 'vue';

const format = reactive({ bold: true, italic: false, underline: false });
</script>

<template>
  <RioToolbar
    v-for="color in ['standard', 'vibrant'] as const"
    :key="color"
    :aria-label="`Formatting, ${color}`"
    variant="floating"
    :color="color"
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
