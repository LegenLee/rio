<script setup lang="ts">
import { RioRangeSlider, RioSlider } from '@rio-m3e/vue';
</script>

<template>
  <div class="field">
    <RioSlider :model-value="40" disabled aria-label="Disabled" />
    <RioSlider :model-value="60" :step="20" stops soft-disabled aria-label="Soft-disabled" />
    <RioRangeSlider :model-value="[20, 70]" disabled aria-label="Disabled range" />
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 16px;
  inline-size: min(100%, 360px);
}
</style>
