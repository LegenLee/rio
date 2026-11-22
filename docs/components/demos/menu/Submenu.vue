<script setup lang="ts">
import type { MenuSelected } from '@rio-m3e/core';
import { mdiCheck, mdiMenuRight, mdiShareVariant } from '@mdi/js';
import { RioButton, RioIcon, RioMenu, RioMenuDivider, RioMenuItem, RioSubMenu } from '@rio-m3e/vue';
import { ref, useTemplateRef } from 'vue';

const open = ref(false);
const button = useTemplateRef('button');
const layout = ref<MenuSelected>('grid');
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
    View
  </RioButton>
  <RioMenu v-model:open="open" :anchor="button" label="View">
    <RioMenuItem @click="last = 'Refresh'">Refresh</RioMenuItem>
    <!-- A submenu keeps a selection of its own -->
    <RioSubMenu v-model="layout" label="Layout" selection="single">
      <template #trailing-icon>
        <RioIcon :icon="{ type: 'svg', path: mdiMenuRight }" />
      </template>
      <RioMenuItem v-for="kind in ['grid', 'list', 'columns']" :key="kind" :value="kind">
        <template #icon="{ selected }">
          <RioIcon v-if="selected" :icon="{ type: 'svg', path: mdiCheck }" />
        </template>
        {{ kind }}
      </RioMenuItem>
    </RioSubMenu>
    <RioSubMenu label="Share">
      <template #icon>
        <RioIcon :icon="{ type: 'svg', path: mdiShareVariant }" />
      </template>
      <template #trailing-icon>
        <RioIcon :icon="{ type: 'svg', path: mdiMenuRight }" />
      </template>
      <RioMenuItem @click="last = 'Email'">Email</RioMenuItem>
      <RioMenuItem @click="last = 'Copy link'">Copy link</RioMenuItem>
      <!-- Submenus nest -->
      <RioSubMenu label="More apps">
        <template #trailing-icon>
          <RioIcon :icon="{ type: 'svg', path: mdiMenuRight }" />
        </template>
        <RioMenuItem @click="last = 'Chat'">Chat</RioMenuItem>
        <RioMenuItem @click="last = 'Notes'">Notes</RioMenuItem>
      </RioSubMenu>
    </RioSubMenu>
    <RioMenuDivider />
    <RioMenuItem @click="last = 'Settings'">Settings</RioMenuItem>
  </RioMenu>
  <span>Layout: {{ layout }}<template v-if="last">, chose {{ last }}</template></span>
</template>
