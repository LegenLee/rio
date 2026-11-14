<script setup lang="ts">
import { mdiPencil, mdiSend } from '@mdi/js';
import { RioButton } from '@rio-m3e/vue';
</script>

<template>
  <RioButton>
    <template #icon>
      <svg viewBox="0 0 24 24"><path :d="mdiSend" fill="currentColor" /></svg>
    </template>
    Send
  </RioButton>
  <RioButton variant="outlined">
    <template #icon>
      <svg viewBox="0 0 24 24"><path :d="mdiPencil" fill="currentColor" /></svg>
    </template>
    Edit
  </RioButton>
</template>
