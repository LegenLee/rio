<script setup lang="ts">
import { mdiCheck } from '@mdi/js';
import { RioChipSet, RioFilterChip } from '@rio-m3e/vue';
import { ref } from 'vue';

const kinds = ref(['vue']);
const TYPES = [
  { value: 'vue', label: 'Vue' },
  { value: 'react', label: 'React' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
];
</script>

<template>
  <p id="frameworks">Filter by framework</p>
  <RioChipSet v-model="kinds" selection="multiple" aria-labelledby="frameworks">
    <RioFilterChip v-for="type in TYPES" :key="type.value" :value="type.value">
      <template #selected-icon>
        <svg viewBox="0 0 24 24"><path :d="mdiCheck" fill="currentColor" /></svg>
      </template>
      {{ type.label }}
    </RioFilterChip>
  </RioChipSet>
  <p>Showing: {{ kinds.join(', ') || 'everything' }}</p>
</template>
