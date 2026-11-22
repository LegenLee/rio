<script setup lang="ts">
import { mdiChevronDown } from '@mdi/js';
import { RioIcon, RioSplitButton } from '@rio-m3e/vue';
import { ref } from 'vue';

const elevated = ref(false);
const filled = ref(false);
const tonal = ref(false);
const outlined = ref(false);
</script>

<template>
  <RioSplitButton v-model:open="elevated" variant="elevated" menu-label="More options">
    Elevated
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
  <RioSplitButton v-model:open="filled" menu-label="More options">
    Filled
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
  <RioSplitButton v-model:open="tonal" variant="tonal" menu-label="More options">
    Tonal
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
  <RioSplitButton v-model:open="outlined" variant="outlined" menu-label="More options">
    Outlined
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
</template>
