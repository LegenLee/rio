<script setup lang="ts">
import { mdiOpenInNew } from '@mdi/js';
import { RioIconButton } from '@rio-m3e/vue';

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
    <svg viewBox="0 0 24 24"><path :d="mdiOpenInNew" fill="currentColor" /></svg>
  </RioIconButton>
  <RioIconButton label="M3 icon buttons" variant="tonal" :href="spec" disabled>
    <svg viewBox="0 0 24 24"><path :d="mdiOpenInNew" fill="currentColor" /></svg>
  </RioIconButton>
</template>
