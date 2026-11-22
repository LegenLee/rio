<script setup lang="ts">
import { mdiClockOutline, mdiKeyboardOutline } from '@mdi/js';
import { RioButton, RioIcon, RioTimePickerDialog } from '@rio-m3e/vue';
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
      <RioIcon :icon="{ type: 'svg', path: mdiKeyboardOutline }" />
    </template>
    <template #clock-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiClockOutline }" />
    </template>
  </RioTimePickerDialog>
</template>
