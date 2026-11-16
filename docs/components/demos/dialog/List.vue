<script setup lang="ts">
import { RioButton, RioDialog, RioRadio, RioRadioGroup } from '@rio-m3e/vue';
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
const tone = ref<string | number | undefined>('Callisto');
const picked = ref<string | number | undefined>('Callisto');
const show = () => {
  picked.value = tone.value;
  open.value = true;
};
</script>

<template>
  <RioButton variant="tonal" @click="show">Ringtone: {{ tone }}</RioButton>
  <!-- A list is no alert: role="dialog" -->
  <RioDialog v-model:open="open" role="dialog" headline="Phone ringtone">
    <RioRadioGroup v-model="picked" label="Ringtone">
      <label v-for="each in TONES" :key="each" class="tone">
        <RioRadio :value="each" />{{ each }}
      </label>
    </RioRadioGroup>
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
  align-self: stretch;
  /* The radio button's 48px target starts at the content's edge; its ring sits 14px in. */
  margin-inline-start: -14px;
}
</style>
