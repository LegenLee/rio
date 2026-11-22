<script setup lang="ts">
import { mdiClose } from '@mdi/js';
import { RioChipSet, RioIcon, RioInputChip } from '@rio-m3e/vue';
import { ref } from 'vue';

const people = ref([
  { name: 'Ada Lovelace', color: '#8e4585' },
  { name: 'Grace Hopper', color: '#3b6ea5' },
  { name: 'Alan Turing', color: '#4f7f4a' },
]);
const opened = ref('');
const remove = (name: string) => (people.value = people.value.filter((p) => p.name !== name));
</script>

<template>
  <RioChipSet aria-label="Recipients">
    <RioInputChip
      v-for="person in people"
      :key="person.name"
      @click="opened = person.name"
      @remove="remove(person.name)"
    >
      <template #avatar>
        <svg viewBox="0 0 24 24"><rect width="24" height="24" :fill="person.color" /></svg>
      </template>
      {{ person.name }}
      <template #remove-icon>
        <RioIcon :icon="{ type: 'svg', path: mdiClose }" />
      </template>
    </RioInputChip>
  </RioChipSet>
  <p v-if="opened">Opened {{ opened }}</p>
</template>
