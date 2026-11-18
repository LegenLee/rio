<script setup lang="ts">
import { RioSlider } from '@rio-m3e/vue';
import { ref } from 'vue';

const volume = ref(40);
</script>

<template>
  <div class="field">
    <label for="volume">Volume: {{ volume }}</label>
    <RioSlider id="volume" v-model="volume" />
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 8px;
  max-inline-size: 360px;
}
</style>
