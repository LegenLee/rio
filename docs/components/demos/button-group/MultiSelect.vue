<script setup lang="ts">
import { mdiFormatBold, mdiFormatItalic, mdiFormatUnderline } from '@mdi/js';
import { RioButtonGroup, RioIcon, RioIconButton } from '@rio-m3e/vue';
import { ref } from 'vue';

const styles = ref(['bold']);
</script>

<template>
  <RioButtonGroup v-model="styles" selection="multiple">
    <RioIconButton label="Bold" value="bold" variant="tonal">
      <RioIcon :icon="{ type: 'svg', path: mdiFormatBold }" />
    </RioIconButton>
    <RioIconButton label="Italic" value="italic" variant="tonal">
      <RioIcon :icon="{ type: 'svg', path: mdiFormatItalic }" />
    </RioIconButton>
    <RioIconButton label="Underline" value="underline" variant="tonal">
      <RioIcon :icon="{ type: 'svg', path: mdiFormatUnderline }" />
    </RioIconButton>
  </RioButtonGroup>
  <code>{{ styles }}</code>
</template>
