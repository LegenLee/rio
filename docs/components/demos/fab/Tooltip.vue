<script setup lang="ts">
import { mdiPencilOutline } from '@mdi/js';
import { RioFab, RioIcon, RioTooltip } from '@rio-m3e/vue';
</script>

<template>
  <!-- The tooltip shows the label on hover and focus; the FAB keeps it as its name. -->
  <RioTooltip text="Compose">
    <RioFab label="Compose">
      <RioIcon :icon="{ type: 'svg', path: mdiPencilOutline }" />
    </RioFab>
  </RioTooltip>
</template>
