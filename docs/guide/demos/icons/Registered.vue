<script setup lang="ts">
import type { SelectSelected } from '@rio-m3e/core';
import {
  RioChipSet,
  RioDatePicker,
  RioFilterChip,
  RioInputChip,
  RioSelect,
  RioSelectOption,
  RioSplitButton,
} from '@rio-m3e/vue';
import { ref } from 'vue';

const size = ref<SelectSelected>('m');
const departure = ref<string>();
const inStock = ref(true);
const people = ref(['Ada Lovelace', 'Grace Hopper']);
</script>

<template>
  <!-- No icon slots: each component draws the icon the app registered for its place. -->
  <RioSelect v-model="size" label="Size">
    <RioSelectOption value="s">Small</RioSelectOption>
    <RioSelectOption value="m">Medium</RioSelectOption>
    <RioSelectOption value="l">Large</RioSelectOption>
  </RioSelect>
  <RioDatePicker v-model="departure" label="Departure" />
  <RioSplitButton menu-label="More save options">Save</RioSplitButton>
  <RioChipSet aria-label="Filters and recipients">
    <RioFilterChip v-model:selected="inStock">In stock</RioFilterChip>
    <RioInputChip
      v-for="person in people"
      :key="person"
      @remove="people = people.filter((p) => p !== person)"
    >
      {{ person }}
    </RioInputChip>
  </RioChipSet>
</template>
