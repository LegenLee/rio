<script setup lang="ts">
import { mdiGestureSwipeVertical, mdiKeyboardOutline } from '@mdi/js';
import { RioIcon, RioTimeScroll } from '@rio-m3e/vue';
import { ref } from 'vue';

const time = ref('07:00');
</script>

<template>
  <!-- Scroll the hours and the minutes; the keyboard button switches to typing them. -->
  <RioTimeScroll v-model="time">
    <template #keyboard-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiKeyboardOutline }" />
    </template>
    <template #swipe-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiGestureSwipeVertical }" />
    </template>
  </RioTimeScroll>
  <p>{{ time ?? 'No time' }}</p>
</template>
