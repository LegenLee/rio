<script setup lang="ts">
import { mdiCheck, mdiMenuDown } from '@mdi/js';
import { RioChipSet, RioFilterChip, RioIcon, RioMenu, RioMenuItem } from '@rio-m3e/vue';
import { ref, useTemplateRef } from 'vue';

const open = ref(false);
const size = ref<string>();
const chip = useTemplateRef('chip');
const inStock = ref(false);
</script>

<template>
  <RioChipSet aria-label="Filters">
    <RioFilterChip ref="chip" v-model:open="open" menu :selected="size !== undefined">
      {{ size ?? 'Size' }}
      <template #dropdown-icon>
        <RioIcon :icon="{ type: 'svg', path: mdiMenuDown }" />
      </template>
    </RioFilterChip>
    <RioFilterChip v-model:selected="inStock">
      <template #selected-icon>
        <RioIcon :icon="{ type: 'svg', path: mdiCheck }" />
      </template>
      In stock
    </RioFilterChip>
  </RioChipSet>
  <RioMenu v-model:open="open" v-model="size" :anchor="chip" selection="single" label="Size">
    <RioMenuItem v-for="option in ['Small', 'Medium', 'Large']" :key="option" :value="option">
      {{ option }}
    </RioMenuItem>
  </RioMenu>
</template>
