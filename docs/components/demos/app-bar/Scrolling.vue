<script setup lang="ts">
import { mdiArrowLeft } from '@mdi/js';
import { RioAppBar, RioIcon, RioIconButton } from '@rio-m3e/vue';
import { useTemplateRef } from 'vue';

// In an app the window scrolls, which the bar follows without a scroll target.
const page = useTemplateRef('page');
</script>

<template>
  <div ref="page" class="page">
    <RioAppBar headline="Notes" :heading-level="2" :scroll-target="page" class="bar">
      <template #leading>
        <RioIconButton label="Back" variant="standard">
          <RioIcon :icon="{ type: 'svg', path: mdiArrowLeft }" />
        </RioIconButton>
      </template>
    </RioAppBar>
    <p v-for="n in 12" :key="n" class="note">Note {{ n }}: scroll, and the bar fills.</p>
  </div>
</template>

<style scoped>
.page {
  inline-size: 100%;
  block-size: 240px;
  overflow: auto;
}

/* The bar stays at the top as the content scrolls under it, positioned content included */
.bar {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
}

.note {
  margin: 0;
  padding: 12px 16px;
}
</style>
