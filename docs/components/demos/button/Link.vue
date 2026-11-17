<script setup lang="ts">
import { mdiOpenInNew } from '@mdi/js';
import { RioButton } from '@rio-m3e/vue';

const spec = 'https://m3.material.io/components/buttons/overview';
</script>

<template>
  <RioButton :href="spec" target="_blank" rel="noopener">
    <template #icon>
      <svg viewBox="0 0 24 24"><path :d="mdiOpenInNew" fill="currentColor" /></svg>
    </template>
    M3 buttons
  </RioButton>
  <RioButton variant="outlined" :href="spec" disabled>Disabled link</RioButton>
  <RioButton variant="outlined" :href="spec" soft-disabled>Soft-disabled link</RioButton>
</template>
