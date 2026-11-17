<script setup lang="ts">
import type { SelectSelected } from '@rio-m3e/core';
import { RioButton, RioSelect, RioSelectOption } from '@rio-m3e/vue';
import { ref } from 'vue';

const shipping = ref<SelectSelected>();
const sent = ref('');
const submit = (event: SubmitEvent) => {
  const data = new FormData(event.target as HTMLFormElement);
  sent.value = `shipping=${data.get('shipping')}`;
};
</script>

<template>
  <!-- The browser checks `required` and submits the value, as with a native <select>. -->
  <form class="form" @submit.prevent="submit">
    <RioSelect v-model="shipping" label="Shipping" name="shipping" required>
      <RioSelectOption value="standard">Standard</RioSelectOption>
      <RioSelectOption value="express">Express</RioSelectOption>
    </RioSelect>
    <RioButton type="submit">Order</RioButton>
    <output>{{ sent }}</output>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
</style>
