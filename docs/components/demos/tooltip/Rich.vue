<script setup lang="ts">
import { RioButton, RioTooltip } from '@rio-m3e/vue';
import { ref } from 'vue';

const last = ref('');
</script>

<template>
  <RioTooltip variant="rich" subhead="Storage" text="You have 2 GB of 15 GB left.">
    <RioButton variant="outlined">Storage</RioButton>
  </RioTooltip>
  <!-- With actions, the tooltip is a non-modal dialog: Tab moves on to its buttons. -->
  <RioTooltip variant="rich" subhead="Backups">
    <RioButton variant="outlined">Backups</RioButton>
    <template #content>Photos back up every night while your phone charges.</template>
    <template #actions>
      <RioButton variant="text" @click="last = 'Learn more'">Learn more</RioButton>
      <RioButton variant="text" @click="last = 'Settings'">Settings</RioButton>
    </template>
  </RioTooltip>
  <span v-if="last">Chose {{ last }}</span>
</template>
