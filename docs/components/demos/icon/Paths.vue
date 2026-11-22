<script setup lang="ts">
import { mdiBellOutline, mdiCogOutline, mdiHeartOutline, mdiHomeOutline } from '@mdi/js';
import { RioIcon } from '@rio-m3e/vue';
</script>

<template>
  <RioIcon :icon="{ type: 'svg', path: mdiHomeOutline }" />
  <RioIcon :icon="{ type: 'svg', path: mdiHeartOutline }" />
  <RioIcon :icon="{ type: 'svg', path: mdiBellOutline }" />
  <RioIcon :icon="{ type: 'svg', path: mdiCogOutline }" />
</template>
