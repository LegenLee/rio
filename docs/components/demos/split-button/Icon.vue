<script setup lang="ts">
import { mdiChevronDown, mdiClockOutline, mdiPlus } from '@mdi/js';
import { RioSplitButton } from '@rio-m3e/vue';
import { ref } from 'vue';

const watchOpen = ref(false);
const addOpen = ref(false);
</script>

<template>
  <RioSplitButton v-model:open="watchOpen" menu-label="More watch options">
    <template #icon>
      <svg viewBox="0 0 24 24"><path :d="mdiClockOutline" fill="currentColor" /></svg>
    </template>
    Watch later
    <template #menu-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiChevronDown" fill="currentColor" /></svg>
    </template>
  </RioSplitButton>

  <!-- With only an icon, `label` names the leading button -->
  <RioSplitButton v-model:open="addOpen" label="Add" menu-label="More ways to add" variant="tonal">
    <template #icon>
      <svg viewBox="0 0 24 24"><path :d="mdiPlus" fill="currentColor" /></svg>
    </template>
    <template #menu-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiChevronDown" fill="currentColor" /></svg>
    </template>
  </RioSplitButton>
</template>
