<script setup lang="ts">
import { mdiFormatBold, mdiFormatItalic, mdiFormatUnderline } from '@mdi/js';
import { RioButtonGroup, RioIconButton } from '@rio-m3e/vue';
import { ref } from 'vue';

const styles = ref(['bold']);
</script>

<template>
  <RioButtonGroup v-model="styles" selection="multiple">
    <RioIconButton label="Bold" value="bold" variant="tonal">
      <svg viewBox="0 0 24 24"><path :d="mdiFormatBold" fill="currentColor" /></svg>
    </RioIconButton>
    <RioIconButton label="Italic" value="italic" variant="tonal">
      <svg viewBox="0 0 24 24"><path :d="mdiFormatItalic" fill="currentColor" /></svg>
    </RioIconButton>
    <RioIconButton label="Underline" value="underline" variant="tonal">
      <svg viewBox="0 0 24 24"><path :d="mdiFormatUnderline" fill="currentColor" /></svg>
    </RioIconButton>
  </RioButtonGroup>
  <code>{{ styles }}</code>
</template>
