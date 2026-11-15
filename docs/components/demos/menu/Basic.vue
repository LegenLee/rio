<script setup lang="ts">
import { mdiContentCopy, mdiContentCut, mdiContentPaste } from '@mdi/js';
import { RioButton, RioMenu, RioMenuDivider, RioMenuGroup, RioMenuItem } from '@rio-m3e/vue';
import { ref, useTemplateRef } from 'vue';

const open = ref(false);
const button = useTemplateRef('button');
const last = ref('');
</script>

<template>
  <RioButton
    ref="button"
    variant="tonal"
    aria-haspopup="menu"
    :aria-expanded="open"
    @click="open = !open"
  >
    Edit
  </RioButton>
  <RioMenu v-model:open="open" :anchor="button" label="Edit">
    <RioMenuItem @click="last = 'Cut'">
      <template #icon>
        <svg viewBox="0 0 24 24"><path :d="mdiContentCut" fill="currentColor" /></svg>
      </template>
      Cut
      <template #trailing-text>Ctrl+X</template>
    </RioMenuItem>
    <RioMenuItem @click="last = 'Copy'">
      <template #icon>
        <svg viewBox="0 0 24 24"><path :d="mdiContentCopy" fill="currentColor" /></svg>
      </template>
      Copy
      <template #trailing-text>Ctrl+C</template>
    </RioMenuItem>
    <!-- Disabled items stay in the menu, and keep the focus order -->
    <RioMenuItem disabled>
      <template #icon>
        <svg viewBox="0 0 24 24"><path :d="mdiContentPaste" fill="currentColor" /></svg>
      </template>
      Paste
      <template #trailing-text>Ctrl+V</template>
    </RioMenuItem>
    <RioMenuDivider />
    <RioMenuGroup label="Share">
      <RioMenuItem @click="last = 'Email'">Email</RioMenuItem>
      <RioMenuItem @click="last = 'Copy link'">
        Copy link
        <template #supporting-text>Anyone with the link can view</template>
      </RioMenuItem>
    </RioMenuGroup>
  </RioMenu>
  <span v-if="last">Chose {{ last }}</span>
</template>
