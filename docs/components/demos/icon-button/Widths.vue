<script setup lang="ts">
import { mdiMagnify } from '@mdi/js';
import { RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <RioIconButton label="Search" size="medium" width="narrow">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
  <RioIconButton label="Search" size="medium">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
  <RioIconButton label="Search" size="medium" width="wide">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
</template>
