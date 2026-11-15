<script setup lang="ts">
import { RioButton, RioTooltip } from '@rio-m3e/vue';
import { ref } from 'vue';

// The app may open it itself, as a page that introduces a new feature does.
const open = ref(false);
</script>

<template>
  <RioTooltip
    v-model:open="open"
    variant="rich"
    persistent
    subhead="New: shared albums"
    text="Invite people to add their photos to an album."
  >
    <RioButton variant="tonal">Albums</RioButton>
    <template #actions>
      <RioButton variant="text" @click="open = false">Got it</RioButton>
    </template>
  </RioTooltip>
  <RioButton variant="text" @click="open = true">Show the tip</RioButton>
</template>
