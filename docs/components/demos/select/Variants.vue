<script setup lang="ts">
import type { SelectSelected } from '@rio-m3e/core';
import { RioSelect, RioSelectOption } from '@rio-m3e/vue';
import { ref } from 'vue';

const size = ref<SelectSelected>();
const font = ref<SelectSelected>('roboto');
</script>

<template>
  <RioSelect v-model="size" label="Size">
    <RioSelectOption value="s">Small</RioSelectOption>
    <RioSelectOption value="m">Medium</RioSelectOption>
    <RioSelectOption value="l">Large</RioSelectOption>
  </RioSelect>
  <RioSelect v-model="font" variant="outlined" label="Font">
    <RioSelectOption value="roboto">Roboto</RioSelectOption>
    <RioSelectOption value="roboto-flex">Roboto Flex</RioSelectOption>
    <RioSelectOption value="roboto-serif">Roboto Serif</RioSelectOption>
    <RioSelectOption value="roboto-mono">Roboto Mono</RioSelectOption>
  </RioSelect>
</template>
