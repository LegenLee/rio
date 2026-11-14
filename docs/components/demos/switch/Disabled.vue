<script setup lang="ts">
import { RioSwitch } from '@rio-m3e/vue';
</script>

<template>
  <label><RioSwitch disabled /> Disabled, off</label>
  <label><RioSwitch disabled selected /> Disabled, on</label>
  <label><RioSwitch soft-disabled /> Soft-disabled</label>
</template>

<style scoped>
label {
  display: inline-flex;
  align-items: center;
  gap: 16px;
}
</style>
