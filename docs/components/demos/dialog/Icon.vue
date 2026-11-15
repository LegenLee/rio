<script setup lang="ts">
import { mdiRestore } from '@mdi/js';
import { RioButton, RioDialog } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <RioButton variant="tonal" @click="open = true">Reset settings</RioButton>
  <RioDialog v-model:open="open" headline="Reset settings?">
    <template #icon>
      <svg viewBox="0 0 24 24"><path :d="mdiRestore" fill="currentColor" /></svg>
    </template>
    This will reset your app preferences back to their default settings. The following accounts will
    also be signed out.
    <template #actions>
      <RioButton variant="text" @click="open = false">Cancel</RioButton>
      <RioButton variant="text" @click="open = false">Reset</RioButton>
    </template>
  </RioDialog>
</template>
