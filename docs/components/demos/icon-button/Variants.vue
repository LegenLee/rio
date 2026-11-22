<script setup lang="ts">
import { mdiMagnify } from '@mdi/js';
import { RioIcon, RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <RioIconButton label="Search">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" variant="tonal">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" variant="outlined">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" variant="standard">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
</template>
