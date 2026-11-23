<script setup lang="ts">
import { mdiArchiveOutline, mdiDeleteOutline, mdiEmailOutline, mdiPencil } from '@mdi/js';
import { RioIcon, RioIconButton, RioToolbar } from '@rio-m3e/vue';
</script>

<template>
  <!-- Docked: as wide as it is given, at the bottom of the window in an app -->
  <RioToolbar aria-label="Message" class="docked">
    <RioIconButton label="Archive" variant="standard">
      <RioIcon :icon="{ type: 'svg', path: mdiArchiveOutline }" />
    </RioIconButton>
    <RioIconButton label="Delete" variant="standard">
      <RioIcon :icon="{ type: 'svg', path: mdiDeleteOutline }" />
    </RioIconButton>
    <RioIconButton label="Mark as unread" variant="standard">
      <RioIcon :icon="{ type: 'svg', path: mdiEmailOutline }" />
    </RioIconButton>
    <RioIconButton label="Reply">
      <RioIcon :icon="{ type: 'svg', path: mdiPencil }" />
    </RioIconButton>
  </RioToolbar>
</template>

<style scoped>
.docked {
  inline-size: 100%;
}
</style>
