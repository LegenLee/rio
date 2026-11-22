<script setup lang="ts">
import { mdiMagnify } from '@mdi/js';
import { RioIcon, RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <RioIconButton label="Search" size="xsmall">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" size="small">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" size="medium">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" size="large">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
  <RioIconButton label="Search" size="xlarge">
    <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
  </RioIconButton>
</template>
