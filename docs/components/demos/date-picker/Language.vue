<script setup lang="ts">
import { mdiCalendar, mdiChevronLeft, mdiChevronRight, mdiMenuDown } from '@mdi/js';
import { RioDatePicker, RioLocaleProvider } from '@rio-m3e/vue';
import { ref } from 'vue';

const date = ref('2026-11-27');
</script>

<template>
  <!-- Korean text, dates written the Korean way, and a week that starts on Sunday -->
  <RioLocaleProvider locale="ko-KR">
    <RioDatePicker v-model="date" label="출발일">
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
  </RioLocaleProvider>
  <!-- German, for this field only -->
  <RioDatePicker v-model="date" label="Abreise" locale="de-DE">
    <template #calendar-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiCalendar" fill="currentColor" /></svg>
    </template>
  </RioDatePicker>
</template>
