<script setup lang="ts">
import { mdiEarth, mdiMenuDown } from '@mdi/js';
import type { SelectSelected } from '@rio-m3e/core';
import { RioSelect, RioSelectOption } from '@rio-m3e/vue';
import { ref, watch } from 'vue';

const region = ref<SelectSelected>();
const open = ref(false);
// In error once the list has closed without a choice
const touched = ref(false);
watch(open, (now) => {
  if (!now) touched.value = true;
});
const plan = ref<SelectSelected>('free');
</script>

<template>
  <RioSelect
    v-model="region"
    v-model:open="open"
    label="Region"
    required
    :error="touched && !region"
    error-text="Choose where your data is kept"
  >
    <template #dropdown-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiMenuDown" fill="currentColor" /></svg>
    </template>
    <template #leading-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiEarth" fill="currentColor" /></svg>
    </template>
    <RioSelectOption value="eu">Europe</RioSelectOption>
    <RioSelectOption value="us">United States</RioSelectOption>
    <RioSelectOption value="asia">Asia Pacific</RioSelectOption>
  </RioSelect>
  <RioSelect v-model="plan" variant="outlined" label="Plan" supporting-text="Change it at any time">
    <template #dropdown-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiMenuDown" fill="currentColor" /></svg>
    </template>
    <RioSelectOption value="free">Free</RioSelectOption>
    <RioSelectOption value="team">
      Team
      <template #supporting-text>Up to 20 people</template>
    </RioSelectOption>
    <RioSelectOption value="enterprise" disabled>
      Enterprise
      <template #supporting-text>Contact sales</template>
    </RioSelectOption>
  </RioSelect>
  <RioSelect label="Disabled" model-value="a" disabled>
    <template #dropdown-icon>
      <svg viewBox="0 0 24 24"><path :d="mdiMenuDown" fill="currentColor" /></svg>
    </template>
    <RioSelectOption value="a">Fixed</RioSelectOption>
  </RioSelect>
</template>
