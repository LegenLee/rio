<script setup lang="ts">
import { mdiPencil, mdiSend } from '@mdi/js';
import { RioButton, RioIcon } from '@rio-m3e/vue';
</script>

<template>
  <RioButton>
    <template #icon>
      <RioIcon :icon="{ type: 'svg', path: mdiSend }" />
    </template>
    Send
  </RioButton>
  <RioButton variant="outlined">
    <template #icon>
      <RioIcon :icon="{ type: 'svg', path: mdiPencil }" />
    </template>
    Edit
  </RioButton>
</template>
