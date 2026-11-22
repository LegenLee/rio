<script setup lang="ts">
import { mdiOpenInNew } from '@mdi/js';
import { RioIcon, RioIconButton } from '@rio-m3e/vue';

const spec = 'https://m3.material.io/components/icon-buttons/overview';
</script>

<template>
  <RioIconButton
    label="M3 icon buttons"
    variant="tonal"
    :href="spec"
    target="_blank"
    rel="noopener"
  >
    <RioIcon :icon="{ type: 'svg', path: mdiOpenInNew }" />
  </RioIconButton>
  <RioIconButton label="M3 icon buttons" variant="tonal" :href="spec" disabled>
    <RioIcon :icon="{ type: 'svg', path: mdiOpenInNew }" />
  </RioIconButton>
</template>
