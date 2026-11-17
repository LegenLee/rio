<script setup lang="ts">
import { mdiClockOutline, mdiKeyboardOutline } from '@mdi/js';
import { RioButton, RioTimePickerDialog } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const alarm = ref<string>();
</script>

<template>
  <!-- The app's own button opens the dialog. -->
  <RioButton variant="tonal" @click="open = true">{{
    alarm ? `Alarm at ${alarm}` : 'Set alarm'
  }}</RioButton>
  <RioTimePickerDialog v-model="alarm" v-model:open="open">
    <template #keyboard-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiKeyboardOutline" fill="currentColor" /></svg>
    </template>
    <template #clock-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiClockOutline" fill="currentColor" /></svg>
    </template>
  </RioTimePickerDialog>
</template>
