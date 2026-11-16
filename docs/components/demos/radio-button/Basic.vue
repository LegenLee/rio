<script setup lang="ts">
import { RioRadio, RioRadioGroup } from '@rio-m3e/vue';
import { ref } from 'vue';

const size = ref<string | number | undefined>('medium');
</script>

<template>
  <!-- One option selected from the start, as the guidelines recommend -->
  <RioRadioGroup v-model="size" label="Size">
    <label class="row"><RioRadio value="small" />Small</label>
    <label class="row"><RioRadio value="medium" />Medium</label>
    <label class="row"><RioRadio value="large" />Large</label>
    <label class="row"><RioRadio value="xlarge" disabled />Extra large (sold out)</label>
  </RioRadioGroup>
  <span>Size: {{ size }}</span>
</template>

<style scoped>
.row {
  display: inline-flex;
  align-items: center;
}
</style>
