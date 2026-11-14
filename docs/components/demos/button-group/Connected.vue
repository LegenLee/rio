<script setup lang="ts">
import { mdiFormatAlignCenter, mdiFormatAlignLeft, mdiFormatAlignRight } from '@mdi/js';
import { RioButton, RioButtonGroup, RioIconButton } from '@rio-m3e/vue';
import { ref } from 'vue';

const view = ref('week');
const align = ref('left');
</script>

<template>
  <RioButtonGroup v-model="view" variant="connected" selection="single" required>
    <RioButton value="day">Day</RioButton>
    <RioButton value="week">Week</RioButton>
    <RioButton value="month">Month</RioButton>
    <RioButton value="year">Year</RioButton>
  </RioButtonGroup>

  <RioButtonGroup v-model="align" variant="connected" selection="single">
    <RioIconButton label="Align left" value="left" variant="tonal">
      <svg viewBox="0 0 24 24"><path :d="mdiFormatAlignLeft" fill="currentColor" /></svg>
    </RioIconButton>
    <RioIconButton label="Align center" value="center" variant="tonal">
      <svg viewBox="0 0 24 24"><path :d="mdiFormatAlignCenter" fill="currentColor" /></svg>
    </RioIconButton>
    <RioIconButton label="Align right" value="right" variant="tonal">
      <svg viewBox="0 0 24 24"><path :d="mdiFormatAlignRight" fill="currentColor" /></svg>
    </RioIconButton>
  </RioButtonGroup>
</template>
