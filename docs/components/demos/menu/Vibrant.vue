<script setup lang="ts">
import { mdiDotsVertical } from '@mdi/js';
import { RioIcon, RioIconButton, RioMenu, RioMenuItem } from '@rio-m3e/vue';
import { ref, useTemplateRef } from 'vue';

const open = ref(false);
const button = useTemplateRef('button');
</script>

<template>
  <RioIconButton
    ref="button"
    label="More options"
    aria-haspopup="menu"
    :aria-expanded="open"
    @click="open = !open"
  >
    <RioIcon :icon="{ type: 'svg', path: mdiDotsVertical }" />
  </RioIconButton>
  <!-- Lined up with the button's end edge -->
  <RioMenu v-model:open="open" :anchor="button" variant="vibrant" align="end" label="More options">
    <RioMenuItem>Rename</RioMenuItem>
    <RioMenuItem>Duplicate</RioMenuItem>
    <RioMenuItem>Delete</RioMenuItem>
  </RioMenu>
</template>
