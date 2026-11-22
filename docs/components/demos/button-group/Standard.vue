<script setup lang="ts">
import { mdiPause, mdiSkipNext, mdiSkipPrevious } from '@mdi/js';
import { RioButton, RioButtonGroup, RioIcon, RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <RioButtonGroup>
    <RioIconButton label="Previous" variant="tonal">
      <RioIcon :icon="{ type: 'svg', path: mdiSkipPrevious }" />
    </RioIconButton>
    <RioIconButton label="Pause" width="wide">
      <RioIcon :icon="{ type: 'svg', path: mdiPause }" />
    </RioIconButton>
    <RioIconButton label="Next" variant="tonal">
      <RioIcon :icon="{ type: 'svg', path: mdiSkipNext }" />
    </RioIconButton>
  </RioButtonGroup>

  <RioButtonGroup size="medium">
    <RioButton variant="outlined">Cancel</RioButton>
    <RioButton variant="tonal">Save draft</RioButton>
    <RioButton>Send</RioButton>
  </RioButtonGroup>
</template>
