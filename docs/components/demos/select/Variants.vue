<script setup lang="ts">
import { mdiMenuDown } from '@mdi/js';
import type { SelectSelected } from '@rio-m3e/core';
import { RioIcon, RioSelect, RioSelectOption } from '@rio-m3e/vue';
import { ref } from 'vue';

const size = ref<SelectSelected>();
const font = ref<SelectSelected>('roboto');
</script>

<template>
  <RioSelect v-model="size" label="Size">
    <template #dropdown-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiMenuDown }" />
    </template>
    <RioSelectOption value="s">Small</RioSelectOption>
    <RioSelectOption value="m">Medium</RioSelectOption>
    <RioSelectOption value="l">Large</RioSelectOption>
  </RioSelect>
  <RioSelect v-model="font" variant="outlined" label="Font">
    <template #dropdown-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiMenuDown }" />
    </template>
    <RioSelectOption value="roboto">Roboto</RioSelectOption>
    <RioSelectOption value="roboto-flex">Roboto Flex</RioSelectOption>
    <RioSelectOption value="roboto-serif">Roboto Serif</RioSelectOption>
    <RioSelectOption value="roboto-mono">Roboto Mono</RioSelectOption>
  </RioSelect>
</template>
