<script setup lang="ts">
import { RioCheckbox } from '@rio-m3e/vue';
import { ref } from 'vue';

const updates = ref(true);
const newsletter = ref(false);
</script>

<template>
  <!-- The app wraps each checkbox in its label, so a click on the text checks it too. -->
  <label class="row"><RioCheckbox v-model:selected="updates" />Product updates</label>
  <label class="row"><RioCheckbox v-model:selected="newsletter" />Newsletter</label>
</template>

<style scoped>
.row {
  display: inline-flex;
  align-items: center;
  padding-inline-end: 16px;
}
</style>
