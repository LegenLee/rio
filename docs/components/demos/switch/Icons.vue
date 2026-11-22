<script setup lang="ts">
import { mdiCheck, mdiClose } from '@mdi/js';
import { RioIcon, RioSwitch } from '@rio-m3e/vue';
import { ref } from 'vue';

const sync = ref(true);
const location = ref(false);
</script>

<template>
  <label>
    <RioSwitch v-model:selected="sync">
      <template #selected-icon>
        <RioIcon :icon="{ type: 'svg', path: mdiCheck }" />
      </template>
    </RioSwitch>
    Sync
  </label>
  <label>
    <RioSwitch v-model:selected="location">
      <template #selected-icon>
        <RioIcon :icon="{ type: 'svg', path: mdiCheck }" />
      </template>
      <template #unselected-icon>
        <RioIcon :icon="{ type: 'svg', path: mdiClose }" />
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
