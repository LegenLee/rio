<script setup lang="ts">
// Sample for verifying the build pipeline. To be replaced with the real M3E switch.
import { createSwitch, switchDefaults, type SwitchProps } from '@rio-m3e/core';
import '@rio-m3e/styles/switch.css';

const props = withDefaults(defineProps<SwitchProps>(), switchDefaults);
const emit = defineEmits<{ 'update:checked': [checked: boolean] }>();

const sw = createSwitch({
  props: () => props,
  onCheckedChange: (v) => emit('update:checked', v),
});
</script>

<template>
  <button type="button" class="rio-switch" v-bind="sw.rootAttrs()" @click="sw.toggle()" />
</template>
