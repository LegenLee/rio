<script setup lang="ts">
import { mdiPause, mdiSkipNext, mdiSkipPrevious } from '@mdi/js';
import { RioButton, RioButtonGroup, RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <RioButtonGroup>
    <RioIconButton label="Previous" variant="tonal">
      <svg viewBox="0 0 24 24"><path :d="mdiSkipPrevious" fill="currentColor" /></svg>
    </RioIconButton>
    <RioIconButton label="Pause" width="wide">
      <svg viewBox="0 0 24 24"><path :d="mdiPause" fill="currentColor" /></svg>
    </RioIconButton>
    <RioIconButton label="Next" variant="tonal">
      <svg viewBox="0 0 24 24"><path :d="mdiSkipNext" fill="currentColor" /></svg>
    </RioIconButton>
  </RioButtonGroup>

  <RioButtonGroup size="medium">
    <RioButton variant="outlined">Cancel</RioButton>
    <RioButton variant="tonal">Save draft</RioButton>
    <RioButton>Send</RioButton>
  </RioButtonGroup>
</template>
