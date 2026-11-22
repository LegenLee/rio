<script setup lang="ts">
import { RioScrollField } from '@rio-m3e/vue';
import { ref } from 'vue';

const day = ref('Mon');
</script>

<template>
  <RioScrollField
    v-model="day"
    :options="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
    loop
    label="Day of the week"
  />
</template>
