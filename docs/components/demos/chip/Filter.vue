<script setup lang="ts">
import { mdiCheck } from '@mdi/js';
import { RioChipSet, RioFilterChip, RioIcon } from '@rio-m3e/vue';
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
        <RioIcon :icon="{ type: 'svg', path: mdiCheck }" />
      </template>
      {{ type.label }}
    </RioFilterChip>
  </RioChipSet>
  <p>Showing: {{ kinds.join(', ') || 'everything' }}</p>
</template>
