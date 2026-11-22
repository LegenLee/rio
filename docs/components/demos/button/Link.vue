<script setup lang="ts">
import { mdiOpenInNew } from '@mdi/js';
import { RioButton, RioIcon } from '@rio-m3e/vue';

const spec = 'https://m3.material.io/components/buttons/overview';
</script>

<template>
  <RioButton :href="spec" target="_blank" rel="noopener">
    <template #icon>
      <RioIcon :icon="{ type: 'svg', path: mdiOpenInNew }" />
    </template>
    M3 buttons
  </RioButton>
  <RioButton variant="outlined" :href="spec" disabled>Disabled link</RioButton>
  <RioButton variant="outlined" :href="spec" soft-disabled>Soft-disabled link</RioButton>
</template>
