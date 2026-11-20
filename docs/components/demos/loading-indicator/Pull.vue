<script setup lang="ts">
import { RioLoadingIndicator, RioSlider } from '@rio-m3e/vue';
import { ref } from 'vue';

// How far a pull-to-refresh gesture has gone toward its threshold
const pulled = ref(40);
</script>

<template>
  <div class="field">
    <RioLoadingIndicator :value="pulled" :max="100" contained aria-label="Pull to refresh" />
    <label for="pulled">Pulled: {{ pulled }}%</label>
    <RioSlider id="pulled" v-model="pulled" />
  </div>
</template>

<style scoped>
.field {
  display: grid;
  justify-items: start;
  gap: 8px;
  inline-size: min(100%, 360px);
}
.field > :last-child {
  justify-self: stretch;
}
</style>
