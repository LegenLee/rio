<script setup lang="ts">
import { mdiMagnify } from '@mdi/js';
import { RioIcon, RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <RioIconButton label="Search" disabled>
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" variant="outlined" disabled>
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" soft-disabled>
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
</template>
