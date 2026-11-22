<script setup lang="ts">
import { mdiCalendar, mdiChevronLeft, mdiChevronRight, mdiMenuDown } from '@mdi/js';
import { RioDatePicker, RioIcon } from '@rio-m3e/vue';
import { ref } from 'vue';

const delivery = ref<string>();
// Weekends are unavailable. 2026-11-16 is a Monday.
const weekend = (date: string) => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
};
</script>

<template>
  <RioDatePicker
    v-model="delivery"
    label="Delivery"
    min="2026-11-16"
    max="2027-02-28"
    :is-date-disabled="weekend"
    supporting-text="Weekdays, until February"
  >
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
</template>
