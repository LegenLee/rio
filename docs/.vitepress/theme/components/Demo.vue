<script setup lang="ts">
const { column = false } = defineProps<{
  /** Stacks the demo's elements, each as wide as the box, instead of wrapping them in a row. */
  column?: boolean;
}>();

defineSlots<{
  /** The live example. */
  default?: () => unknown;
}>();
</script>

<template>
  <!-- vp-raw keeps VitePress's content and reset styles out, so a demo looks the way it does in
       an app without a CSS reset (see postcss.config.mjs). -->
  <div class="demo vp-raw" :class="{ column }">
    <slot />
  </div>
</template>

<style scoped>
.demo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-block: 16px;
  padding: 24px;
  border: 1px solid var(--rio-color-outline-variant);
  border-radius: var(--rio-shape-corner-large);
  background: var(--rio-color-surface);
  color: var(--rio-color-on-surface);
  font: var(--rio-typescale-body-large);
  letter-spacing: var(--rio-typescale-body-large-tracking);
}

.column {
  display: grid;
}
</style>
