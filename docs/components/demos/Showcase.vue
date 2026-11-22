<script setup lang="ts">
import { mdiHeart, mdiHeartOutline } from '@mdi/js';
import { RioButton, RioButtonGroup, RioIcon, RioIconButton, RioSwitch } from '@rio-m3e/vue';
import { ref } from 'vue';

const favorite = ref(true);
const wifi = ref(true);
const view = ref('week');
</script>

<template>
  <RioButton>Filled</RioButton>
  <RioButton variant="tonal">Tonal</RioButton>
  <RioButton variant="outlined">Outlined</RioButton>
  <RioIconButton v-model:selected="favorite" label="Add to favorites" toggle variant="standard">
    <RioIcon :icon="{ type: 'svg', path: mdiHeartOutline }" />
    <template #selected-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiHeart }" />
    </template>
  </RioIconButton>
  <label class="switch"><RioSwitch v-model:selected="wifi" /> Wi-Fi</label>
  <RioButtonGroup v-model="view" variant="connected" selection="single" required class="group">
    <RioButton value="day">Day</RioButton>
    <RioButton value="week">Week</RioButton>
    <RioButton value="month">Month</RioButton>
  </RioButtonGroup>
</template>

<style scoped>
.switch {
  display: inline-flex;
  align-items: center;
  gap: 16px;
}

.group {
  flex: 1 1 320px;
}
</style>
