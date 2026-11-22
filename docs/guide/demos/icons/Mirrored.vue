<script setup lang="ts">
import type { IconAlias } from '@rio-m3e/core';
import { RioIcon } from '@rio-m3e/vue';

const directions = [
  { dir: 'ltr', name: 'Left to right' },
  { dir: 'rtl', name: 'Right to left' },
] as const;
// Three that point along the line, and a clock, which doesn't
const aliases: IconAlias[] = ['previous', 'next', 'submenu', 'clock'];
</script>

<template>
  <div v-for="{ dir, name } in directions" :key="dir" :dir="dir" class="line">
    <span class="name">{{ name }}</span>
    <span v-for="alias in aliases" :key="alias" class="alias">
      <RioIcon :alias="alias" />
      <code>{{ alias }}</code>
    </span>
  </div>
</template>

<style scoped>
.line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 24px;
}

.name {
  inline-size: 8em;
}

.alias {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
