<script setup lang="ts">
import { mdiClockOutline, mdiKeyboardOutline } from '@mdi/js';
import { RioButton, RioTimePickerDialog } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const start = ref('14:00');
</script>

<template>
  <!-- A 24-hour clock, with the dial beside the fields whatever the window's height -->
  <RioButton variant="tonal" @click="open = true">Starts {{ start }}</RioButton>
  <RioTimePickerDialog v-model="start" v-model:open="open" :hour-cycle="24" layout="horizontal">
    <template #keyboard-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiKeyboardOutline" fill="currentColor" /></svg>
    </template>
    <template #clock-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiClockOutline" fill="currentColor" /></svg>
    </template>
  </RioTimePickerDialog>
</template>
