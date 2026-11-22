<script setup lang="ts">
import { mdiCheck } from '@mdi/js';
import type { MenuSelected } from '@rio-m3e/core';
import { RioButton, RioIcon, RioMenu, RioMenuItem } from '@rio-m3e/vue';
import { ref, useTemplateRef } from 'vue';

const sortOpen = ref(false);
const sortBy = ref<MenuSelected>('date');
const sortButton = useTemplateRef('sortButton');

const filtersOpen = ref(false);
const filters = ref<MenuSelected>(['photos']);
const filtersButton = useTemplateRef('filtersButton');
</script>

<template>
  <RioButton
    ref="sortButton"
    variant="outlined"
    aria-haspopup="menu"
    :aria-expanded="sortOpen"
    @click="sortOpen = !sortOpen"
  >
    Sort by {{ sortBy }}
  </RioButton>
  <!-- One at a time: choosing closes the menu -->
  <RioMenu
    v-model:open="sortOpen"
    v-model="sortBy"
    :anchor="sortButton"
    selection="single"
    label="Sort by"
  >
    <RioMenuItem v-for="by in ['name', 'date', 'size']" :key="by" :value="by">
      <!-- A check mark next to the color and shape, as the spec recommends -->
      <template #icon="{ selected }">
        <RioIcon v-if="selected" :icon="{ type: 'svg', path: mdiCheck }" />
      </template>
      {{ by }}
    </RioMenuItem>
  </RioMenu>

  <RioButton
    ref="filtersButton"
    variant="outlined"
    aria-haspopup="menu"
    :aria-expanded="filtersOpen"
    @click="filtersOpen = !filtersOpen"
  >
    Filters
  </RioButton>
  <!-- Any number: the menu stays open until dismissed -->
  <RioMenu
    v-model:open="filtersOpen"
    v-model="filters"
    :anchor="filtersButton"
    selection="multiple"
    label="Filters"
  >
    <RioMenuItem v-for="kind in ['photos', 'videos', 'documents']" :key="kind" :value="kind">
      <template #icon="{ selected }">
        <RioIcon v-if="selected" :icon="{ type: 'svg', path: mdiCheck }" />
      </template>
      {{ kind }}
    </RioMenuItem>
  </RioMenu>
</template>
