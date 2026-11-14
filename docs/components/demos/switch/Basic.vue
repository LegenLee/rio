<script setup lang="ts">
import { RioSwitch } from '@rio-m3e/vue';
import { ref } from 'vue';

const wifi = ref(true);
const bluetooth = ref(false);
</script>

<template>
  <label><RioSwitch v-model:selected="wifi" /> Wi-Fi</label>
  <label><RioSwitch v-model:selected="bluetooth" /> Bluetooth</label>
</template>

<style scoped>
label {
  display: inline-flex;
  align-items: center;
  gap: 16px;
}
</style>
