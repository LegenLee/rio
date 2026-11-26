<script setup lang="ts">
import { mdiPencilOutline } from '@mdi/js';
import { FAB_COLORS } from '@rio-m3e/core';
import { RioFab, RioIcon } from '@rio-m3e/vue';
</script>

<template>
  <RioFab v-for="color in FAB_COLORS" :key="color" :label="`Compose, ${color}`" :color="color">
    <RioIcon :icon="{ type: 'svg', path: mdiPencilOutline }" />
  </RioFab>
</template>
