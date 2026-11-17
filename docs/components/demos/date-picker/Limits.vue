<script setup lang="ts">
import { mdiCalendar, mdiChevronLeft, mdiChevronRight, mdiMenuDown } from '@mdi/js';
import { RioDatePicker } from '@rio-m3e/vue';
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
      <svg viewBox="0 0 24 24"><path :d="mdiCalendar" fill="currentColor" /></svg>
    </template>
    <template #previous-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiChevronLeft" fill="currentColor" /></svg>
    </template>
    <template #next-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiChevronRight" fill="currentColor" /></svg>
    </template>
    <template #dropdown-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiMenuDown" fill="currentColor" /></svg>
    </template>
  </RioDatePicker>
</template>
