<script setup lang="ts">
import { mdiClose } from '@mdi/js';
import { RioAssistChip, RioChipSet, RioFilterChip, RioIcon, RioInputChip } from '@rio-m3e/vue';
</script>

<template>
  <RioChipSet aria-label="Disabled chips">
    <RioAssistChip disabled>Disabled</RioAssistChip>
    <RioFilterChip soft-disabled selected>Soft-disabled</RioFilterChip>
    <RioInputChip disabled>
      Disabled
      <template #remove-icon>
        <RioIcon :icon="{ type: 'svg', path: mdiClose }" />
      </template>
    </RioInputChip>
  </RioChipSet>
</template>
