<script setup lang="ts">
import { mdiCalendar, mdiChevronLeft, mdiChevronRight, mdiMenuDown, mdiPencil } from '@mdi/js';
import { RioDatePicker } from '@rio-m3e/vue';
import { ref } from 'vue';

const date = ref('2026-11-27');
const birthday = ref<string>();
</script>

<template>
  <RioDatePicker v-model="date" variant="modal" label="Event date">
    <template #calendar-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiCalendar" fill="currentColor" /></svg>
    </template>
    <template #edit-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiPencil" fill="currentColor" /></svg>
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
  <!-- A date far away: the dialog starts in the text input, as the spec suggests. -->
  <RioDatePicker
    v-model="birthday"
    variant="modal"
    initial-mode="input"
    label="Date of birth"
    max="2026-12-31"
  >
    <template #calendar-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiCalendar" fill="currentColor" /></svg>
    </template>
    <template #edit-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiPencil" fill="currentColor" /></svg>
    </template>
  </RioDatePicker>
</template>
