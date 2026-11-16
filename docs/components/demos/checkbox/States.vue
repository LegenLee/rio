<script setup lang="ts">
import { RioCheckbox } from '@rio-m3e/vue';
import { ref } from 'vue';

const terms = ref(false);
</script>

<template>
  <label class="row">
    <RioCheckbox v-model:selected="terms" :error="!terms" />I accept the terms
  </label>
  <label class="row"><RioCheckbox disabled />Disabled</label>
  <label class="row"><RioCheckbox selected disabled />Disabled, checked</label>
  <label class="row"><RioCheckbox soft-disabled />Soft-disabled (Tab to it)</label>
</template>

<style scoped>
.row {
  display: inline-flex;
  align-items: center;
  padding-inline-end: 16px;
}
</style>
