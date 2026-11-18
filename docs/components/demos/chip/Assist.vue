<script setup lang="ts">
import { mdiCalendarPlus, mdiMapMarker } from '@mdi/js';
import { RioAssistChip, RioChipSet } from '@rio-m3e/vue';
import { ref } from 'vue';

const added = ref(false);
</script>

<template>
  <RioChipSet aria-label="Actions">
    <RioAssistChip @click="added = !added">
      <template #icon>
        <svg viewBox="0 0 24 24"><path :d="mdiCalendarPlus" fill="currentColor" /></svg>
      </template>
      {{ added ? 'Added to calendar' : 'Add to calendar' }}
    </RioAssistChip>
    <RioAssistChip href="https://maps.google.com/?q=Seoul" target="_blank">
      <template #icon>
        <svg viewBox="0 0 24 24"><path :d="mdiMapMarker" fill="currentColor" /></svg>
      </template>
      Get directions
    </RioAssistChip>
    <RioAssistChip elevated>Elevated</RioAssistChip>
  </RioChipSet>
</template>
