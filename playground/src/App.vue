<script setup lang="ts">
import { RioSwitch } from '@rio-m3e/vue'
import { ref } from 'vue'

const checked = ref(false)
</script>

<template>
  <main>
    <h1>Rio Playground</h1>
    <RioSwitch v-model:checked="checked" />
    <p>checked: {{ checked }}</p>
    <RioSwitch disabled />
  </main>
</template>
