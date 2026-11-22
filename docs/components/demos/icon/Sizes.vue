<script setup lang="ts">
import { mdiStarOutline } from '@mdi/js';
import { RioIcon } from '@rio-m3e/vue';

const star = { type: 'svg', path: mdiStarOutline } as const;
// 24 by default, 20 for dense layouts, 40 and 48 beside display or headline type
const sizes = [20, 24, 40, 48];
</script>

<template>
  <figure v-for="size in sizes" :key="size" class="size">
    <RioIcon :icon="star" :style="{ '--rio-icon-size': `${size}px` }" />
    <figcaption>{{ size }}px</figcaption>
  </figure>
</template>

<style scoped>
/* On one line under the icons */
.size {
  display: grid;
  align-self: end;
  justify-items: center;
  gap: 4px;
  margin: 0;
  font: var(--rio-typescale-label-medium);
}
</style>
