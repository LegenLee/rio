<script setup lang="ts">
import { mdiPencilOutline } from '@mdi/js';
import { RioFab, RioIcon } from '@rio-m3e/vue';
</script>

<template>
  <RioFab label="Compose">
    <RioIcon :icon="{ type: 'svg', path: mdiPencilOutline }" />
  </RioFab>
  <RioFab label="Compose" size="medium">
    <RioIcon :icon="{ type: 'svg', path: mdiPencilOutline }" />
  </RioFab>
  <RioFab label="Compose" size="large">
    <RioIcon :icon="{ type: 'svg', path: mdiPencilOutline }" />
  </RioFab>
</template>
