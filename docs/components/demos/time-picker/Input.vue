<script setup lang="ts">
import { RioTimeInput } from '@rio-m3e/vue';
import { ref } from 'vue';

const time = ref('07:30');
</script>

<template>
  <!-- Type an hour and a minute; Enter, or leaving a field, reads them. -->
  <RioTimeInput v-model="time" />
  <p>{{ time ?? 'No time' }}</p>
</template>
