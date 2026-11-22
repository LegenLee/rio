<script setup lang="ts">
import { mdiChevronDown } from '@mdi/js';
import { RioIcon, RioSplitButton } from '@rio-m3e/vue';
</script>

<template>
  <RioSplitButton menu-label="More options" disabled>
    Disabled
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
  <RioSplitButton menu-label="More options" variant="outlined" disabled>
    Disabled
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
  <RioSplitButton menu-label="More options" soft-disabled>
    Soft-disabled
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
</template>
