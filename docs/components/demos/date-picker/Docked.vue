<script setup lang="ts">
import { mdiCalendar, mdiChevronLeft, mdiChevronRight, mdiMenuDown } from '@mdi/js';
import { RioDatePicker } from '@rio-m3e/vue';
import { ref } from 'vue';

const departure = ref<string>();
</script>

<template>
  <!-- Rio ships no icons: the picker takes each from a slot. -->
  <RioDatePicker v-model="departure" label="Departure" clearable>
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
  <output>{{ departure ?? 'No date' }}</output>
</template>
