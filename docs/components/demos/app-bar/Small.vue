<script setup lang="ts">
import { mdiArrowLeft, mdiCalendar, mdiMagnify, mdiMenu } from '@mdi/js';
import { RioAppBar, RioIcon, RioIconButton } from '@rio-m3e/vue';
</script>

<template>
  <!-- In the middle of this page, not at the top of an app: it doesn't follow the window's scroll -->
  <RioAppBar headline="Inbox" :heading-level="2" :scrolled="false" class="bar">
    <template #leading>
      <RioIconButton label="Menu" variant="standard">
        <RioIcon :icon="{ type: 'svg', path: mdiMenu }" />
      </RioIconButton>
    </template>
    <template #trailing>
      <RioIconButton label="Search" variant="standard">
        <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
      </RioIconButton>
    </template>
  </RioAppBar>
  <RioAppBar
    headline="Meeting"
    subtitle="Tomorrow, 10:00"
    align="center"
    :heading-level="2"
    :scrolled="false"
    class="bar"
  >
    <template #leading>
      <RioIconButton label="Back" variant="standard">
        <RioIcon :icon="{ type: 'svg', path: mdiArrowLeft }" />
      </RioIconButton>
    </template>
    <template #trailing>
      <RioIconButton label="Add to calendar" variant="standard">
        <RioIcon :icon="{ type: 'svg', path: mdiCalendar }" />
      </RioIconButton>
    </template>
  </RioAppBar>
</template>

<style scoped>
.bar {
  inline-size: 100%;
}
</style>
