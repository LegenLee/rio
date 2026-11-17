<script setup lang="ts">
import { mdiCheck, mdiMenuDown } from '@mdi/js';
import type { SelectSelected } from '@rio-m3e/core';
import { RioSelect, RioSelectOption } from '@rio-m3e/vue';
import { ref } from 'vue';

const toppings = ref<SelectSelected>(['cheese', 'basil']);
const TOPPINGS = { cheese: 'Cheese', mushroom: 'Mushroom', olive: 'Olive', basil: 'Basil' };
</script>

<template>
  <!--
    The list stays open while choosing. The field lists the choices, separated by commas, so it
    gets more room than its widest option.
  -->
  <RioSelect v-model="toppings" label="Toppings" multiple style="inline-size: 280px">
    <template #dropdown-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiMenuDown" fill="currentColor" /></svg>
    </template>
    <RioSelectOption v-for="(name, value) in TOPPINGS" :key="value" :value="value">
      {{ name }}
      <!-- A check mark next to the color and shape, as the spec recommends -->
      <template #icon="{ selected }">
        <svg v-if="selected" viewBox="0 0 24 24"><path :d="mdiCheck" fill="currentColor" /></svg>
      </template>
    </RioSelectOption>
  </RioSelect>
</template>
