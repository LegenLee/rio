<script setup lang="ts">
import { mdiGestureSwipeVertical, mdiKeyboardOutline } from '@mdi/js';
import { RioButton, RioTimePickerDialog } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const reminder = ref<string>();
</script>

<template>
  <RioButton variant="tonal" @click="open = true">{{
    reminder ? `Remind me at ${reminder}` : 'Set reminder'
  }}</RioButton>
  <!-- Scroll fields in place of the dial -->
  <RioTimePickerDialog v-model="reminder" v-model:open="open" picker="scroll">
    <template #keyboard-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiKeyboardOutline" fill="currentColor" /></svg>
    </template>
    <template #swipe-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiGestureSwipeVertical" fill="currentColor" /></svg>
    </template>
  </RioTimePickerDialog>
</template>
