<script setup lang="ts">
import { mdiKeyboardOutline } from '@mdi/js';
import { RioIconButton, RioScrollField } from '@rio-m3e/vue';
import { ref } from 'vue';

const weight = ref(70);
const editing = ref(false);
const invalid = ref(false);
</script>

<template>
  <div class="column">
    <div class="row">
      <RioScrollField
        v-model="weight"
        v-model:editing="editing"
        v-model:invalid="invalid"
        :min="30"
        :max="200"
        label="Weight in kilograms"
      />
      <RioIconButton v-model:selected="editing" toggle label="Type the weight">
        <svg viewBox="0 0 24 24"><path :d="mdiKeyboardOutline" fill="currentColor" /></svg>
      </RioIconButton>
    </div>
    <p v-if="invalid" class="error" role="alert">Enter a weight from 30 to 200 kg</p>
  </div>
</template>

<style scoped>
.column {
  display: grid;
  justify-items: start;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error {
  margin: 0;
  color: var(--rio-color-error);
  font: var(--rio-typescale-body-small);
}
</style>
