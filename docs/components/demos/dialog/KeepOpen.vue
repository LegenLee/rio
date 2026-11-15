<script setup lang="ts">
import type { DialogCancelEvent } from '@rio-m3e/core';
import { RioButton, RioDialog } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const name = ref('Summer');
const draft = ref('Summer');
const note = ref('');
const show = () => {
  draft.value = name.value;
  note.value = '';
  open.value = true;
};
// Escape and the scrim ask to close; with the name changed, the dialog stays.
const onCancel = (event: DialogCancelEvent) => {
  if (draft.value === name.value) return;
  event.preventDefault();
  note.value = 'Save or cancel the new name.';
};
</script>

<template>
  <RioButton variant="tonal" @click="show">Rename “{{ name }}”</RioButton>
  <RioDialog v-model:open="open" role="dialog" headline="Rename album" @cancel="onCancel">
    <input v-model="draft" aria-label="Album name" />
    <p v-if="note" role="status">{{ note }}</p>
    <template #actions>
      <RioButton variant="text" @click="open = false">Cancel</RioButton>
      <RioButton variant="text" @click="((name = draft), (open = false))">Save</RioButton>
    </template>
  </RioDialog>
</template>
