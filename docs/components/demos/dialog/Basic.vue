<script setup lang="ts">
import { RioButton, RioDialog } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const last = ref('');
</script>

<template>
  <RioButton variant="tonal" @click="open = true">Discard draft</RioButton>
  <RioDialog v-model:open="open" headline="Discard draft?">
    Your draft and its two attachments will be lost.
    <!-- The dismissing button first, then the confirming one, nearest the edge -->
    <template #actions>
      <RioButton variant="text" @click="open = false">Cancel</RioButton>
      <RioButton variant="text" @click="((open = false), (last = 'Discarded'))">Discard</RioButton>
    </template>
  </RioDialog>
  <span v-if="last">{{ last }}</span>
</template>
