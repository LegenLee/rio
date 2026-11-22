<script setup lang="ts">
import { mdiBookmark, mdiBookmarkOutline, mdiHeart, mdiHeartOutline } from '@mdi/js';
import { RioIcon, RioIconButton } from '@rio-m3e/vue';
import { ref } from 'vue';

const favorite = ref(true);
const bookmarked = ref(false);
</script>

<template>
  <RioIconButton v-model:selected="favorite" label="Add to favorites" toggle variant="standard">
    <RioIcon :icon="{ type: 'svg', path: mdiHeartOutline }" />
    <template #selected-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiHeart }" />
    </template>
  </RioIconButton>
  <RioIconButton v-model:selected="bookmarked" label="Bookmark" toggle variant="tonal">
    <RioIcon :icon="{ type: 'svg', path: mdiBookmarkOutline }" />
    <template #selected-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiBookmark }" />
    </template>
  </RioIconButton>
</template>
