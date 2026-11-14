<script setup lang="ts">
import { mdiCheck, mdiClose } from '@mdi/js';
import { RioSwitch } from '@rio-m3e/vue';
import { ref } from 'vue';

const sync = ref(true);
const location = ref(false);
</script>

<template>
  <label>
    <RioSwitch v-model:selected="sync">
      <template #selected-icon>
        <svg viewBox="0 0 24 24"><path :d="mdiCheck" fill="currentColor" /></svg>
      </template>
    </RioSwitch>
    Sync
  </label>
  <label>
    <RioSwitch v-model:selected="location">
      <template #selected-icon>
        <svg viewBox="0 0 24 24"><path :d="mdiCheck" fill="currentColor" /></svg>
      </template>
      <template #unselected-icon>
        <svg viewBox="0 0 24 24"><path :d="mdiClose" fill="currentColor" /></svg>
      </template>
    </RioSwitch>
    Location
  </label>
</template>

<style scoped>
label {
  display: inline-flex;
  align-items: center;
  gap: 16px;
}
</style>
