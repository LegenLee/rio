<script setup lang="ts">
import { RioLoadingIndicator } from '@rio-m3e/vue';
</script>

<template>
  <!-- From 24px to 240px; the shape keeps its share of the size. -->
  <div class="row">
    <RioLoadingIndicator :size="24" aria-label="Loading" />
    <RioLoadingIndicator aria-label="Loading" />
    <RioLoadingIndicator :size="96" contained aria-label="Loading" />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 32px;
}
</style>
