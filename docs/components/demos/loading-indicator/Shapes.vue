<script setup lang="ts">
import { starPolygon } from '@rio-m3e/core';
import { RioLoadingIndicator } from '@rio-m3e/vue';

// Names from the Material shape library, or polygons of your own
const star = starPolygon({ numVerticesPerRadius: 5, innerRadius: 0.5, rounding: { radius: 0.1 } });
</script>

<template>
  <div class="row">
    <RioLoadingIndicator :shapes="['heart', 'flower', 'clover-4-leaf']" aria-label="Loading" />
    <RioLoadingIndicator :shapes="['circle', star]" aria-label="Loading" />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 32px;
}
</style>
