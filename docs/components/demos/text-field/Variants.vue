<script setup lang="ts">
import { RioTextField } from '@rio-m3e/vue';
import { ref } from 'vue';

const name = ref('');
const email = ref('');
</script>

<template>
  <RioTextField v-model="name" label="Name" supporting-text="As on your card" />
  <RioTextField v-model="email" variant="outlined" label="Email" type="email" required />
</template>
