<script setup lang="ts">
import type { MenuAnchorPoint } from '@rio-m3e/core';
import { RioMenu, RioMenuItem } from '@rio-m3e/vue';
import { ref } from 'vue';

const open = ref(false);
const point = ref<MenuAnchorPoint>();

// A context menu opens where the secondary click was. With the element clicked, it keeps to that
// spot as the page scrolls.
const openAt = (event: MouseEvent) => {
  point.value = { x: event.clientX, y: event.clientY, element: event.currentTarget as Element };
  open.value = true;
};
</script>

<template>
  <div class="area" @contextmenu.prevent="openAt">Right-click here</div>
  <RioMenu v-model:open="open" :anchor="point" label="Image">
    <RioMenuItem>Open</RioMenuItem>
    <RioMenuItem>Download</RioMenuItem>
    <RioMenuItem>Copy image</RioMenuItem>
  </RioMenu>
</template>

<style scoped>
.area {
  display: grid;
  place-items: center;
  inline-size: 240px;
  block-size: 96px;
  border: 1px dashed var(--rio-color-outline);
  border-radius: var(--rio-shape-corner-medium);
  user-select: none;
}
</style>
