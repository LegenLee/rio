<script setup lang="ts">
import { mdiGestureSwipeVertical, mdiKeyboardOutline } from '@mdi/js';
import { RioTimeScroll } from '@rio-m3e/vue';
import { ref } from 'vue';

const time = ref('07:00');
</script>

<template>
  <!-- Scroll the hours and the minutes; the keyboard button switches to typing them. -->
  <RioTimeScroll v-model="time">
    <template #keyboard-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiKeyboardOutline" fill="currentColor" /></svg>
    </template>
    <template #swipe-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiGestureSwipeVertical" fill="currentColor" /></svg>
    </template>
  </RioTimeScroll>
  <p>{{ time ?? 'No time' }}</p>
</template>
