<script setup lang="ts">
import { mdiChevronLeft, mdiChevronRight, mdiMenuDown, mdiPencil } from '@mdi/js';
import { RioButton, RioDatePickerDialog } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const due = ref<string>();
</script>

<template>
  <!-- The app's own button opens the dialog. -->
  <RioButton variant="tonal" @click="open = true">{{
    due ? `Due ${due}` : 'Set due date'
  }}</RioButton>
  <RioDatePickerDialog v-model="due" v-model:open="open">
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
  </RioDatePickerDialog>
</template>
