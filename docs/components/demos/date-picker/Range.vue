<script setup lang="ts">
import { mdiCalendar, mdiPencil } from '@mdi/js';
import { RioButton, RioDateRangePickerDialog } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const depart = ref<string>();
const back = ref<string>();
</script>

<template>
  <!-- The app's own button opens the dialog. -->
  <RioButton variant="tonal" @click="open = true">{{
    depart ? `${depart} – ${back ?? '…'}` : 'Choose trip dates'
  }}</RioButton>
  <RioDateRangePickerDialog
    v-model:start="depart"
    v-model:end="back"
    v-model:open="open"
    :messages="{ rangeTitle: 'Depart – Return dates' }"
  >
    <template #edit-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiPencil" fill="currentColor" /></svg>
    </template>
    <template #calendar-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiCalendar" fill="currentColor" /></svg>
    </template>
  </RioDateRangePickerDialog>
</template>
