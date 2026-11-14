<script setup lang="ts">
import { mdiMagnify } from '@mdi/js';
import { RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <RioIconButton label="Search" size="xsmall">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
  <RioIconButton label="Search" size="small">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
  <RioIconButton label="Search" size="medium">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
  <RioIconButton label="Search" size="large">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
  <RioIconButton label="Search" size="xlarge">
    <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
  </RioIconButton>
</template>
