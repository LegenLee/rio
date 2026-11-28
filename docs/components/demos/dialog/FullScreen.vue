<script setup lang="ts">
import type { DialogCancelEvent } from '@rio-m3e/core';
import { RioButton, RioDialog, RioTextField } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const confirming = ref(false);
const title = ref('');
const place = ref('');
const saved = ref('');
const show = () => {
  title.value = '';
  place.value = '';
  open.value = true;
};
// The close button, Escape, and the scrim ask to close; with something entered, ask first.
const onCancel = (event: DialogCancelEvent) => {
  if (!title.value && !place.value) return;
  event.preventDefault();
  confirming.value = true;
};
const discard = () => {
  confirming.value = false;
  open.value = false;
};
const save = () => {
  saved.value = title.value || 'Untitled event';
  open.value = false;
};
</script>

<template>
  <RioButton variant="tonal" @click="show">New event</RioButton>
  <RioDialog v-model:open="open" variant="full-screen" headline="New event" @cancel="onCancel">
    <div class="fields">
      <RioTextField v-model="title" label="Title" />
      <RioTextField v-model="place" label="Location" />
    </div>
    <!-- The confirming button only: the dialog draws its close button -->
    <template #actions>
      <RioButton variant="text" @click="save">Save</RioButton>
    </template>
    <!-- A basic dialog in front of it, opened from it -->
    <RioDialog v-model:open="confirming" headline="Discard event?">
      What you entered will be lost.
      <template #actions>
        <RioButton variant="text" @click="confirming = false">Keep editing</RioButton>
        <RioButton variant="text" @click="discard">Discard</RioButton>
      </template>
    </RioDialog>
  </RioDialog>
  <span v-if="saved">Saved “{{ saved }}”</span>
</template>

<style scoped>
.fields {
  display: grid;
  gap: 16px;
}
</style>
