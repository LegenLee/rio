<script setup lang="ts">
import { RioScrollField } from '@rio-m3e/vue';
import { ref } from 'vue';

// Values that set a photo together, side by side, each labeled
const iso = ref(400);
const shutter = ref('1/125');
const aperture = ref('f/4');
</script>

<template>
  <div class="settings">
    <div class="setting">
      <span aria-hidden="true">ISO</span>
      <RioScrollField v-model="iso" :options="[100, 200, 400, 800, 1600, 3200]" label="ISO" />
    </div>
    <div class="setting">
      <span aria-hidden="true">Shutter</span>
      <RioScrollField
        v-model="shutter"
        :options="['1/30', '1/60', '1/125', '1/250', '1/500']"
        label="Shutter speed"
      />
    </div>
    <div class="setting">
      <span aria-hidden="true">Aperture</span>
      <RioScrollField
        v-model="aperture"
        :options="['f/1.8', 'f/2.8', 'f/4', 'f/5.6', 'f/8']"
        label="Aperture"
      />
    </div>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.setting {
  display: grid;
  justify-items: center;
  gap: 8px;
  font: var(--rio-typescale-label-large);
}
</style>
