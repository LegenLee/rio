<script setup lang="ts">
import { RioButton, RioDialog } from '@rio-m3e/vue';
import { ref } from 'vue';

const TONES = [
  'None',
  'Callisto',
  'Ganymede',
  'Luna',
  'Oberon',
  'Phobos',
  'Dione',
  'Europa',
  'Io',
  'Rhea',
  'Titan',
  'Triton',
  'Umbriel',
];
const open = ref(false);
const tone = ref('Callisto');
const picked = ref('Callisto');
const show = () => {
  picked.value = tone.value;
  open.value = true;
};
</script>

<template>
  <RioButton variant="tonal" @click="show">Ringtone: {{ tone }}</RioButton>
  <!-- A list is no alert: role="dialog" -->
  <RioDialog v-model:open="open" role="dialog" headline="Phone ringtone">
    <label v-for="each in TONES" :key="each" class="tone">
      <input v-model="picked" type="radio" name="tone" :value="each" />
      {{ each }}
    </label>
    <template #actions>
      <RioButton variant="text" @click="open = false">Cancel</RioButton>
      <RioButton variant="text" @click="((tone = picked), (open = false))">OK</RioButton>
    </template>
  </RioDialog>
</template>

<style scoped>
.tone {
  display: flex;
  align-items: center;
  gap: 16px;
  block-size: 48px;
}
</style>
