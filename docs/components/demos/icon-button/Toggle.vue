<script setup lang="ts">
import { mdiBookmark, mdiBookmarkOutline, mdiHeart, mdiHeartOutline } from '@mdi/js';
import { RioIconButton } from '@rio-m3e/vue';
import { ref } from 'vue';

const favorite = ref(true);
const bookmarked = ref(false);
</script>

<template>
  <RioIconButton v-model:selected="favorite" label="Add to favorites" toggle variant="standard">
    <svg viewBox="0 0 24 24"><path :d="mdiHeartOutline" fill="currentColor" /></svg>
    <template #selected-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiHeart" fill="currentColor" /></svg>
    </template>
  </RioIconButton>
  <RioIconButton v-model:selected="bookmarked" label="Bookmark" toggle variant="tonal">
    <svg viewBox="0 0 24 24"><path :d="mdiBookmarkOutline" fill="currentColor" /></svg>
    <template #selected-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiBookmark" fill="currentColor" /></svg>
    </template>
  </RioIconButton>
</template>
