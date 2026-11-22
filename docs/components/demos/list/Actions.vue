<script setup lang="ts">
import { mdiBookmarkOutline, mdiChevronRight, mdiInboxOutline, mdiSendOutline } from '@mdi/js';
import { RioIcon, RioIconButton, RioList, RioListItem } from '@rio-m3e/vue';
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
        <RioIcon :icon="{ type: 'svg', path: mdiInboxOutline }" />
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
          <RioIcon :icon="{ type: 'svg', path: mdiBookmarkOutline }" />
        </RioIconButton>
      </template>
    </RioListItem>
    <RioListItem href="#actions" @click="opened = 'Sent'">
      <template #leading>
        <RioIcon :icon="{ type: 'svg', path: mdiSendOutline }" />
      </template>
      Sent
      <template #trailing>
        <RioIcon :icon="{ type: 'svg', path: mdiChevronRight }" />
      </template>
    </RioListItem>
  </RioList>
  <p>{{ opened ? `Opened ${opened}` : 'Nothing opened yet' }}</p>
</template>
