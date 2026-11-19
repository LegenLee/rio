<script setup lang="ts">
import { RioButton, RioLinearProgress } from '@rio-m3e/vue';
import { onBeforeUnmount, ref } from 'vue';

// The size of the download is unknown at first, so the progress is too.
const progress = ref<number | undefined>(undefined);
let timers: ReturnType<typeof setTimeout>[] = [];
const start = () => {
  timers.forEach(clearTimeout);
  progress.value = undefined;
  timers = [1, 2, 3, 4, 5].map((step) =>
    setTimeout(() => (progress.value = (step - 1) / 4), 1200 + step * 700),
  );
};
onBeforeUnmount(() => timers.forEach(clearTimeout));
</script>

<template>
  <div class="column">
    <RioLinearProgress :value="progress" wavy aria-label="Downloading the update" />
    <RioButton variant="tonal" @click="start">Download</RioButton>
  </div>
</template>

<style scoped>
.column {
  display: grid;
  justify-items: start;
  gap: 24px;
  max-inline-size: 360px;
}

.column > :first-child {
  inline-size: 100%;
}
</style>
