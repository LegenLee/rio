<script setup lang="ts">
import { mdiChevronLeft, mdiChevronRight, mdiMenuDown, mdiPencil } from '@mdi/js';
import { RioButton, RioDatePickerDialog, RioIcon } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const due = ref<string>();
</script>

<template>
  <!-- The app's own button opens the dialog. -->
  <RioButton variant="tonal" @click="open = true">{{
    due ? `Due ${due}` : 'Set due date'
  }}</RioButton>
  <RioDatePickerDialog v-model="due" v-model:open="open">
    <template #edit-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiPencil }" />
    </template>
    <template #previous-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronLeft }" />
    </template>
    <template #next-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiChevronRight }" />
    </template>
    <template #dropdown-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiMenuDown }" />
    </template>
  </RioDatePickerDialog>
</template>
