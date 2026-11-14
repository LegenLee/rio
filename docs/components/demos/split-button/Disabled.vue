<script setup lang="ts">
import { mdiChevronDown } from '@mdi/js';
import { RioSplitButton } from '@rio-m3e/vue';
</script>

<template>
  <RioSplitButton menu-label="More options" disabled>
    Disabled
    <template #menu-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiChevronDown" fill="currentColor" /></svg>
    </template>
  </RioSplitButton>
  <RioSplitButton menu-label="More options" variant="outlined" disabled>
    Disabled
    <template #menu-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiChevronDown" fill="currentColor" /></svg>
    </template>
  </RioSplitButton>
  <RioSplitButton menu-label="More options" soft-disabled>
    Soft-disabled
    <template #menu-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiChevronDown" fill="currentColor" /></svg>
    </template>
  </RioSplitButton>
</template>
