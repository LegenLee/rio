<script setup lang="ts">
import { RioCheckbox, RioList, RioListItem, RioRadio, RioSwitch } from '@rio-m3e/vue';
import { ref } from 'vue';

const size = ref('medium');
const toppings = ref<(string | number)[]>(['cheese']);
const settings = ref<(string | number)[]>(['wifi']);
</script>

<template>
  <!-- Option lists: a press, Space, or Enter chooses. The controls in the slots only show the
       item's state, through the `selected` the slots get. -->
  <div style="display: grid; gap: 24px; inline-size: 360px">
    <RioList v-model="size" selection="single" required label="Size">
      <RioListItem v-for="option in ['small', 'medium', 'large']" :key="option" :value="option">
        <template #leading="{ selected }"><RioRadio :selected /></template>
        {{ option[0]!.toUpperCase() + option.slice(1) }}
      </RioListItem>
    </RioList>
    <RioList v-model="toppings" selection="multiple" variant="segmented" label="Toppings">
      <RioListItem v-for="option in ['cheese', 'olive', 'basil']" :key="option" :value="option">
        <template #leading="{ selected }"><RioCheckbox :selected /></template>
        {{ option[0]!.toUpperCase() + option.slice(1) }}
      </RioListItem>
    </RioList>
    <RioList v-model="settings" selection="multiple" label="Connections">
      <RioListItem value="wifi">
        Wi-Fi
        <template #trailing="{ selected }"><RioSwitch :selected /></template>
      </RioListItem>
      <RioListItem value="bluetooth">
        Bluetooth
        <template #supporting>Off saves battery</template>
        <template #trailing="{ selected }"><RioSwitch :selected /></template>
      </RioListItem>
    </RioList>
    <p>
      {{ size }} · {{ toppings.join(', ') || 'no toppings' }} ·
      {{ settings.join(', ') || 'offline' }}
    </p>
  </div>
</template>
