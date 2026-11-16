<script setup lang="ts">
import { RioTextField } from '@rio-m3e/vue';
import { ref } from 'vue';

const notes = ref('');
const bio = ref('');
</script>

<template>
  <RioTextField v-model="notes" label="Notes" multiline />
  <RioTextField v-model="bio" variant="outlined" label="Bio" multiline :rows="4" :maxlength="160" />
</template>
