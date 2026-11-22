<script setup lang="ts">
import { RioLoadingIndicator } from '@rio-m3e/vue';
</script>

<template>
  <div class="row">
    <RioLoadingIndicator aria-label="Loading news" />
    <!-- Contained: for over other content -->
    <RioLoadingIndicator contained aria-label="Refreshing page" />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 32px;
}
</style>
