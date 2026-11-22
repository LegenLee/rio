<script setup lang="ts">
import { mdiCheck } from '@mdi/js';
import { RioChipSet, RioFilterChip, RioIcon } from '@rio-m3e/vue';
import { ref } from 'vue';

const sort = ref('newest');
</script>

<template>
  <p id="sort">Sort by</p>
  <RioChipSet v-model="sort" selection="single" required aria-labelledby="sort">
    <RioFilterChip v-for="option in ['newest', 'oldest', 'popular']" :key="option" :value="option">
      <template #selected-icon>
        <RioIcon :icon="{ type: 'svg', path: mdiCheck }" />
      </template>
      {{ option[0]!.toUpperCase() + option.slice(1) }}
    </RioFilterChip>
  </RioChipSet>
</template>
