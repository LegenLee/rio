<script setup lang="ts">
import { RioButton } from '@rio-m3e/vue';
import { withBase } from 'vitepress';

const github = 'https://github.com/LegenLee/rio';
</script>

<template>
  <!-- Outside .vp-raw, so VitePress's router turns clicks on the internal links into client-side
       navigation. The router leaves links with a target to the browser. -->
  <div class="hero-actions">
    <RioButton :href="withBase('/guide/getting-started')">Get started</RioButton>
    <RioButton variant="tonal" :href="withBase('/components/button')">Components</RioButton>
    <RioButton variant="tonal" :href="github" target="_blank" rel="noreferrer">GitHub</RioButton>
  </div>
</template>

<style scoped>
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 24px;
}

@media (min-width: 640px) {
  .hero-actions {
    padding-top: 32px;
  }
}
</style>
