<script setup lang="ts">
import { mdiChevronDown } from '@mdi/js';
import { RioIcon, RioSplitButton } from '@rio-m3e/vue';
import { reactive } from 'vue';

const open = reactive({ xsmall: false, small: false, medium: false, large: false, xlarge: false });
</script>

<template>
  <RioSplitButton
    v-model:open="open.xsmall"
    size="xsmall"
    variant="tonal"
    menu-label="More options"
  >
    Extra small
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
  <RioSplitButton v-model:open="open.small" size="small" variant="tonal" menu-label="More options">
    Small
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
  <RioSplitButton
    v-model:open="open.medium"
    size="medium"
    variant="tonal"
    menu-label="More options"
  >
    Medium
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
  <RioSplitButton v-model:open="open.large" size="large" variant="tonal" menu-label="More options">
    Large
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
  <RioSplitButton
    v-model:open="open.xlarge"
    size="xlarge"
    variant="tonal"
    menu-label="More options"
  >
    Extra large
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
</template>
