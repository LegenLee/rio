<script setup lang="ts">
import { RioRangeSlider } from '@rio-m3e/vue';
import { ref } from 'vue';

const price = ref<[number, number]>([100, 350]);
const dollars = (value: number) => `$${value}`;
</script>

<template>
  <div class="field">
    <span id="price">Price: {{ dollars(price[0]) }} to {{ dollars(price[1]) }}</span>
    <RioRangeSlider
      v-model="price"
      :max="500"
      :step="10"
      value-indicator
      :format="dollars"
      aria-labelledby="price"
    />
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 48px;
  inline-size: min(100%, 360px);
}
</style>
