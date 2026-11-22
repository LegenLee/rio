<script setup lang="ts">
import { RioList, RioListItem } from '@rio-m3e/vue';
import { ref } from 'vue';

const size = ref('medium');
const toppings = ref<(string | number)[]>(['cheese']);
const settings = ref<(string | number)[]>(['wifi']);
</script>

<template>
  <!-- Option lists: a press, Space, or Enter chooses. Each option draws the selection's control,
       which only shows its state: radio buttons before the text here, checkboxes after it by
       default, or switches. -->
  <div style="display: grid; gap: 24px; inline-size: 360px">
    <RioList v-model="size" selection="single" control-position="leading" required label="Size">
      <RioListItem v-for="option in ['small', 'medium', 'large']" :key="option" :value="option">
        {{ option[0]!.toUpperCase() + option.slice(1) }}
      </RioListItem>
    </RioList>
    <RioList v-model="toppings" selection="multiple" variant="segmented" label="Toppings">
      <RioListItem v-for="option in ['cheese', 'olive', 'basil']" :key="option" :value="option">
        {{ option[0]!.toUpperCase() + option.slice(1) }}
      </RioListItem>
    </RioList>
    <RioList v-model="settings" selection="multiple" control="switch" label="Connections">
      <RioListItem value="wifi">Wi-Fi</RioListItem>
      <RioListItem value="bluetooth">
        Bluetooth
        <template #supporting>Off saves battery</template>
      </RioListItem>
    </RioList>
    <p>
      {{ size }} · {{ toppings.join(', ') || 'no toppings' }} ·
      {{ settings.join(', ') || 'offline' }}
    </p>
  </div>
</template>
