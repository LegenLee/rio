<script setup lang="ts">
import { mdiDotsVertical, mdiDownload, mdiShareVariantOutline, mdiStarOutline } from '@mdi/js';
import { RioIcon, RioIconButton, RioMenu, RioMenuItem, RioToolbar } from '@rio-m3e/vue';
import { ref, useTemplateRef } from 'vue';

const open = ref(false);
const more = useTemplateRef('more');
const last = ref('');
</script>

<template>
  <RioToolbar aria-label="Photo" type="floating">
    <RioIconButton label="Share" variant="standard" @click="last = 'Share'">
      <RioIcon :icon="{ type: 'svg', path: mdiShareVariantOutline }" />
    </RioIconButton>
    <RioIconButton label="Favorite" variant="standard" @click="last = 'Favorite'">
      <RioIcon :icon="{ type: 'svg', path: mdiStarOutline }" />
    </RioIconButton>
    <RioIconButton label="Download" variant="standard" @click="last = 'Download'">
      <RioIcon :icon="{ type: 'svg', path: mdiDownload }" />
    </RioIconButton>
    <!-- The actions that don't fit go in a menu -->
    <RioIconButton
      ref="more"
      label="More"
      variant="standard"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <RioIcon :icon="{ type: 'svg', path: mdiDotsVertical }" />
    </RioIconButton>
    <RioMenu v-model:open="open" :anchor="more" label="More">
      <RioMenuItem @click="last = 'Rename'">Rename</RioMenuItem>
      <RioMenuItem @click="last = 'Move to album'">Move to album</RioMenuItem>
      <RioMenuItem @click="last = 'Delete'">Delete</RioMenuItem>
    </RioMenu>
  </RioToolbar>
  <output>{{ last || 'Nothing yet' }}</output>
</template>
