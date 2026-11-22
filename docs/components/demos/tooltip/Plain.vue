<script setup lang="ts">
import { mdiContentCopy, mdiContentCut, mdiContentPaste, mdiShareVariant } from '@mdi/js';
import { RioIcon, RioIconButton, RioTooltip } from '@rio-m3e/vue';

const actions = [
  { label: 'Cut', icon: mdiContentCut },
  { label: 'Copy', icon: mdiContentCopy },
  { label: 'Paste', icon: mdiContentPaste },
  { label: 'Share', icon: mdiShareVariant },
];
</script>

<template>
  <!-- The tooltip names an icon-only button. Once one shows, the next shows at once. -->
  <RioTooltip v-for="action in actions" :key="action.label" :text="action.label">
    <RioIconButton :label="action.label">
      <RioIcon :icon="{ type: 'svg', path: action.icon }" />
    </RioIconButton>
  </RioTooltip>
</template>
