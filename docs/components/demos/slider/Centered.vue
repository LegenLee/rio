<script setup lang="ts">
import { RioSlider } from '@rio-m3e/vue';
import { ref } from 'vue';

const balance = ref(-20);
</script>

<template>
  <div class="field">
    <RioSlider
      v-model="balance"
      centered
      :min="-50"
      :max="50"
      value-indicator
      aria-label="Balance"
    />
  </div>
</template>

<style scoped>
.field {
  max-inline-size: 360px;
  padding-block-start: 48px;
}
</style>
