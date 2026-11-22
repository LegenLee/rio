<script setup lang="ts">
import { mdiCalendarPlus, mdiMapMarker } from '@mdi/js';
import { RioAssistChip, RioChipSet, RioIcon } from '@rio-m3e/vue';
import { ref } from 'vue';

const added = ref(false);
</script>

<template>
  <RioChipSet aria-label="Actions">
    <RioAssistChip @click="added = !added">
      <template #icon>
        <RioIcon :icon="{ type: 'svg', path: mdiCalendarPlus }" />
      </template>
      {{ added ? 'Added to calendar' : 'Add to calendar' }}
    </RioAssistChip>
    <RioAssistChip href="https://maps.google.com/?q=Seoul" target="_blank">
      <template #icon>
        <RioIcon :icon="{ type: 'svg', path: mdiMapMarker }" />
      </template>
      Get directions
    </RioAssistChip>
    <RioAssistChip elevated>Elevated</RioAssistChip>
  </RioChipSet>
</template>
