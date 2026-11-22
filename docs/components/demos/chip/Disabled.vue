<script setup lang="ts">
import { mdiClose } from '@mdi/js';
import { RioAssistChip, RioChipSet, RioFilterChip, RioInputChip } from '@rio-m3e/vue';
</script>

<template>
  <RioChipSet aria-label="Disabled chips">
    <RioAssistChip disabled>Disabled</RioAssistChip>
    <RioFilterChip soft-disabled selected>Soft-disabled</RioFilterChip>
    <RioInputChip disabled>
      Disabled
      <template #remove-icon>
        <svg viewBox="0 0 24 24"><path :d="mdiClose" fill="currentColor" /></svg>
      </template>
    </RioInputChip>
  </RioChipSet>
</template>
