<script setup lang="ts">
import { mdiPencilOutline } from '@mdi/js';
import { FAB_VARIANTS } from '@rio-m3e/core';
import { RioFab, RioIcon } from '@rio-m3e/vue';

const COLORS = ['primary', 'secondary', 'tertiary'] as const;
</script>

<template>
  <!-- Tonal: on the color's container. Filled: on the color itself. -->
  <div v-for="variant in FAB_VARIANTS" :key="variant" class="row">
    <RioFab
      v-for="color in COLORS"
      :key="color"
      :label="`Compose, ${variant} ${color}`"
      :variant="variant"
      :color="color"
    >
      <RioIcon :icon="{ type: 'svg', path: mdiPencilOutline }" />
    </RioFab>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 16px;
}
</style>
