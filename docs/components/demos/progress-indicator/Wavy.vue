<script setup lang="ts">
import { RioCircularProgress, RioLinearProgress } from '@rio-m3e/vue';
</script>

<template>
  <div class="column">
    <RioLinearProgress :value="0.6" wavy aria-label="Downloading episode" />
    <RioLinearProgress :value="0.6" wavy :thickness="8" aria-label="Downloading episode" />
    <RioLinearProgress wavy aria-label="Loading episodes" />
    <div class="row">
      <RioCircularProgress :value="0.6" wavy aria-label="Downloading episode" />
      <RioCircularProgress wavy aria-label="Loading episodes" />
      <RioCircularProgress :value="0.6" wavy :thickness="8" :size="96" aria-label="Downloading" />
    </div>
  </div>
</template>

<style scoped>
.column {
  display: grid;
  gap: 24px;
  max-inline-size: 360px;
}

.row {
  display: flex;
  align-items: center;
  gap: 32px;
}
</style>
