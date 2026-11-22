<script setup lang="ts">
import { mdiBookmarkOutline, mdiChevronRight, mdiInboxOutline, mdiSendOutline } from '@mdi/js';
import { RioIconButton, RioList, RioListItem } from '@rio-m3e/vue';
import { ref } from 'vue';

const opened = ref('');
const saved = ref(false);
</script>

<template>
  <!-- Links and buttons. Tab enters at the first item; the arrow keys go through every action,
       the bookmark included. -->
  <RioList variant="segmented" style="inline-size: 360px">
    <RioListItem @click="opened = 'Inbox'">
      <template #leading>
        <svg viewBox="0 0 24 24"><path :d="mdiInboxOutline" fill="currentColor" /></svg>
      </template>
      Inbox
      <template #supporting>Two new messages</template>
      <template #trailing>
        <RioIconButton
          v-model:selected="saved"
          toggle
          variant="standard"
          label="Bookmark the inbox"
        >
          <svg viewBox="0 0 24 24"><path :d="mdiBookmarkOutline" fill="currentColor" /></svg>
        </RioIconButton>
      </template>
    </RioListItem>
    <RioListItem href="#actions" @click="opened = 'Sent'">
      <template #leading>
        <svg viewBox="0 0 24 24"><path :d="mdiSendOutline" fill="currentColor" /></svg>
      </template>
      Sent
      <template #trailing>
        <svg viewBox="0 0 24 24"><path :d="mdiChevronRight" fill="currentColor" /></svg>
      </template>
    </RioListItem>
  </RioList>
  <p>{{ opened ? `Opened ${opened}` : 'Nothing opened yet' }}</p>
</template>
