<script setup lang="ts">
import { mdiCalendar, mdiChevronLeft, mdiChevronRight, mdiMenuDown } from '@mdi/js';
import { RioDatePicker, RioIcon } from '@rio-m3e/vue';
import { ref } from 'vue';

const departure = ref<string>();
</script>

<template>
  <!-- Rio ships no icons: the picker takes each from a slot. -->
  <RioDatePicker v-model="departure" label="Departure" clearable>
    <template #calendar-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiCalendar }" />
    </template>
    <template #previous-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronLeft }" />
    </template>
    <template #next-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronRight }" />
    </template>
    <template #dropdown-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiMenuDown }" />
    </template>
  </RioDatePicker>
  <output>{{ departure ?? 'No date' }}</output>
</template>
