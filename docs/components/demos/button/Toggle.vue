<script setup lang="ts">
import { RioButton } from '@rio-m3e/vue';
import { ref } from 'vue';

const elevated = ref(false);
const filled = ref(true);
const tonal = ref(false);
const outlined = ref(false);
</script>

<template>
  <RioButton v-model:selected="elevated" toggle variant="elevated">Elevated</RioButton>
  <RioButton v-model:selected="filled" toggle>Filled</RioButton>
  <RioButton v-model:selected="tonal" toggle variant="tonal">Tonal</RioButton>
  <RioButton v-model:selected="outlined" toggle variant="outlined">Outlined</RioButton>
</template>
