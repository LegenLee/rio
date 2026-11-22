<script setup lang="ts">
import { RioScrollField } from '@rio-m3e/vue';
import { ref } from 'vue';

const minutes = ref(15);
</script>

<template>
  <div class="column">
    <RioScrollField v-model="minutes" :min="0" :max="59" label="Minutes" />
    <p>Remind me in {{ minutes }} minutes</p>
  </div>
</template>

<style scoped>
.column {
  display: grid;
  justify-items: start;
  gap: 12px;
}

p {
  margin: 0;
}
</style>
