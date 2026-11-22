<script setup lang="ts">
import { mdiBrightness6 } from '@mdi/js';
import { RioIcon, RioSlider } from '@rio-m3e/vue';
import { ref } from 'vue';

const brightness = ref(70);
const bass = ref(40);
const treble = ref(60);
</script>

<template>
  <div class="row">
    <RioSlider v-model="brightness" vertical size="medium" aria-label="Brightness">
      <template #icon>
        <RioIcon :icon="{ type: 'svg', path: mdiBrightness6 }" />
      </template>
    </RioSlider>
    <RioSlider v-model="bass" vertical :step="10" stops value-indicator aria-label="Bass" />
    <RioSlider v-model="treble" vertical :step="10" stops value-indicator aria-label="Treble" />
  </div>
</template>

<style scoped>
/* Room for the value indicators, which show beside the handles */
.row {
  display: flex;
  gap: 48px;
  padding-inline-start: 56px;
}
</style>
