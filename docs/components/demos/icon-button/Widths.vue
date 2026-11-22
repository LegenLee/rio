<script setup lang="ts">
import { mdiMagnify } from '@mdi/js';
import { RioIcon, RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <RioIconButton label="Search" size="medium" width="narrow">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" size="medium">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" size="medium" width="wide">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
</template>
