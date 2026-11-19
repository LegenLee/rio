<script setup lang="ts">
import { RioButton, RioLinearProgress } from '@rio-m3e/vue';
import { onBeforeUnmount, ref } from 'vue';

const progress = ref(0.3);
let timer: ReturnType<typeof setInterval> | undefined;
const run = () => {
  clearInterval(timer);
  progress.value = 0;
  timer = setInterval(() => {
    progress.value = Math.min(1, progress.value + 0.1);
    if (progress.value >= 1) clearInterval(timer);
  }, 600);
};
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="column">
    <RioLinearProgress :value="progress" aria-label="Uploading photos" />
    <RioLinearProgress aria-label="Loading messages" />
    <RioButton variant="tonal" @click="run">Upload again</RioButton>
  </div>
</template>

<style scoped>
.column {
  display: grid;
  justify-items: start;
  gap: 24px;
  max-inline-size: 360px;
}

.column > :not(button) {
  inline-size: 100%;
}
</style>
