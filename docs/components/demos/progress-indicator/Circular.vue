<script setup lang="ts">
import { RioCircularProgress } from '@rio-m3e/vue';
</script>

<template>
  <div class="row">
    <RioCircularProgress :value="0.65" aria-label="Syncing contacts" />
    <RioCircularProgress aria-label="Loading" />
    <RioCircularProgress :value="0.65" :thickness="8" aria-label="Syncing contacts" />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 32px;
}
</style>
