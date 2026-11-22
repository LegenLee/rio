<script setup lang="ts">
import { mdiPlus, mdiStar } from '@mdi/js';
import { RioButton, RioIcon, RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <!-- In the text's color -->
  <span class="starred"><RioIcon :icon="{ type: 'svg', path: mdiStar }" /> Starred</span>
  <!-- Sized by the slot it sits in -->
  <RioButton variant="tonal">
    <template #icon><RioIcon :icon="{ type: 'svg', path: mdiPlus }" /></template>
    Add
  </RioButton>
  <!-- The icons the app registered for the date picker's months, mirrored right to left -->
  <RioIconButton label="Previous page" variant="outlined">
    <RioIcon alias="previous" />
  </RioIconButton>
  <RioIconButton label="Next page" variant="outlined">
    <RioIcon alias="next" />
  </RioIconButton>
</template>

<style scoped>
.starred {
  color: var(--rio-color-primary);
}
</style>
