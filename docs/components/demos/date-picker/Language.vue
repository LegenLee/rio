<script setup lang="ts">
import { mdiCalendar, mdiChevronLeft, mdiChevronRight, mdiMenuDown } from '@mdi/js';
import { RioDatePicker, RioIcon, RioLocaleProvider } from '@rio-m3e/vue';
import { ref } from 'vue';

const date = ref('2026-11-27');
</script>

<template>
  <!-- Korean text, dates written the Korean way, and a week that starts on Sunday -->
  <RioLocaleProvider locale="ko-KR">
    <RioDatePicker v-model="date" label="출발일">
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
  </RioLocaleProvider>
  <!-- German, for this field only -->
  <RioDatePicker v-model="date" label="Abreise" locale="de-DE">
    <template #calendar-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiCalendar }" />
    </template>
  </RioDatePicker>
</template>
