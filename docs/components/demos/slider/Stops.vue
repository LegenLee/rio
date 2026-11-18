<script setup lang="ts">
import { RioSlider } from '@rio-m3e/vue';
import { ref } from 'vue';

const brightness = ref(60);
</script>

<template>
  <div class="field">
    <RioSlider v-model="brightness" :step="10" stops value-indicator aria-label="Brightness" />
  </div>
</template>

<style scoped>
/* Room for the value indicator, which shows over the handle */
.field {
  max-inline-size: 360px;
  padding-block-start: 48px;
}
</style>
