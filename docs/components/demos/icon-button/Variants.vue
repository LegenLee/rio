<script setup lang="ts">
import { mdiMagnify } from '@mdi/js';
import { RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <RioIconButton label="Search">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
  <RioIconButton label="Search" variant="tonal">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
  <RioIconButton label="Search" variant="outlined">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
  <RioIconButton label="Search" variant="standard">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
</template>
