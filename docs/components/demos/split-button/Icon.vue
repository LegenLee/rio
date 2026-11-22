<script setup lang="ts">
import { mdiChevronDown, mdiClockOutline, mdiPlus } from '@mdi/js';
import { RioIcon, RioSplitButton } from '@rio-m3e/vue';
import { ref } from 'vue';

const watchOpen = ref(false);
const addOpen = ref(false);
</script>

<template>
  <RioSplitButton v-model:open="watchOpen" menu-label="More watch options">
    <template #icon>
      <RioIcon :icon="{ type: 'svg', path: mdiClockOutline }" />
    </template>
    Watch later
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>

  <!-- With only an icon, `label` names the leading button -->
  <RioSplitButton v-model:open="addOpen" label="Add" menu-label="More ways to add" variant="tonal">
    <template #icon>
      <RioIcon :icon="{ type: 'svg', path: mdiPlus }" />
    </template>
    <template #menu-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronDown }" />
    </template>
  </RioSplitButton>
</template>
