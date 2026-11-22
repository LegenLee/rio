<script setup lang="ts">
import { mdiVolumeHigh, mdiVolumeOff } from '@mdi/js';
import { RioIcon, RioSlider } from '@rio-m3e/vue';
import { ref } from 'vue';

const values = ref({ xsmall: 30, small: 40, medium: 50, large: 60, xlarge: 0 });
</script>

<template>
  <div class="sizes">
    <RioSlider v-model="values.xsmall" size="xsmall" aria-label="Extra small" />
    <RioSlider v-model="values.small" size="small" aria-label="Small" />
    <RioSlider
      v-for="size in ['medium', 'large', 'xlarge'] as const"
      :key="size"
      v-model="values[size]"
      :size="size"
      :aria-label="`Volume, ${size}`"
    >
      <!-- The icon shows what the slider controls; at zero, the muted one. -->
      <template #icon>
        <RioIcon :icon="{ type: 'svg', path: values[size] === 0 ? mdiVolumeOff : mdiVolumeHigh }" />
      </template>
    </RioSlider>
  </div>
</template>

<style scoped>
.sizes {
  display: grid;
  gap: 16px;
  inline-size: min(100%, 360px);
}
</style>
