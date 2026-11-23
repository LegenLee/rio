<script setup lang="ts">
import { mdiArrowLeft, mdiPencil } from '@mdi/js';
import { RioAppBar, RioIcon, RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <!-- In the middle of this page, not at the top of an app: it doesn't follow the window's scroll -->
  <RioAppBar
    v-for="variant in ['medium-flexible', 'large-flexible'] as const"
    :key="variant"
    :variant="variant"
    headline="Trip to the coast"
    subtitle="4 photos"
    :heading-level="2"
    :scrolled="false"
    class="bar"
  >
    <template #leading>
      <RioIconButton label="Back" variant="standard">
        <RioIcon :icon="{ type: 'svg', path: mdiArrowLeft }" />
      </RioIconButton>
    </template>
    <!-- One emphasized action at most -->
    <template #trailing>
      <RioIconButton label="Edit" variant="tonal">
        <RioIcon :icon="{ type: 'svg', path: mdiPencil }" />
      </RioIconButton>
    </template>
  </RioAppBar>
</template>

<style scoped>
.bar {
  inline-size: 100%;
}
</style>
