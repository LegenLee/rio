<script setup lang="ts">
import { mdiCalendar, mdiChevronLeft, mdiChevronRight, mdiMenuDown, mdiPencil } from '@mdi/js';
import { RioDatePicker, RioIcon } from '@rio-m3e/vue';
import { ref } from 'vue';

const date = ref('2026-11-27');
const birthday = ref<string>();
</script>

<template>
  <RioDatePicker v-model="date" variant="modal" label="Event date">
    <template #calendar-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiCalendar }" />
    </template>
    <template #edit-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiPencil }" />
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
  <!-- A date far away: the dialog starts in the text input, as the spec suggests. -->
  <RioDatePicker
    v-model="birthday"
    variant="modal"
    initial-mode="input"
    label="Date of birth"
    max="2026-12-31"
  >
    <template #calendar-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiCalendar }" />
    </template>
    <template #edit-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiPencil }" />
    </template>
  </RioDatePicker>
</template>
