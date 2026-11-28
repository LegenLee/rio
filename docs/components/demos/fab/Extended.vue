<script setup lang="ts">
import { mdiPencilOutline } from '@mdi/js';
import { RioFab, RioIcon } from '@rio-m3e/vue';
</script>

<template>
  <RioFab label="Compose" extended>
    <RioIcon :icon="{ type: 'svg', path: mdiPencilOutline }" />
  </RioFab>
  <RioFab label="Compose" size="medium" extended>
    <RioIcon :icon="{ type: 'svg', path: mdiPencilOutline }" />
  </RioFab>
  <RioFab label="Compose" size="large" extended>
    <RioIcon :icon="{ type: 'svg', path: mdiPencilOutline }" />
  </RioFab>
  <!-- Without an icon, the label always shows. -->
  <RioFab label="Compose" />
</template>
