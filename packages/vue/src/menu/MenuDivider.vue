<script setup lang="ts">
import { createMenuDivider } from '@rio-m3e/core';
import '@rio-m3e/styles/menu.css';

const divider = createMenuDivider();
</script>

<template>
  <div v-bind="divider.parts.root()" />
</template>
