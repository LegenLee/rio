<script setup lang="ts">
import { RioChipSet, RioSuggestionChip } from '@rio-m3e/vue';
import { ref } from 'vue';

const reply = ref('');
</script>

<template>
  <RioChipSet aria-label="Suggested replies">
    <RioSuggestionChip
      v-for="text in ['Sounds good', 'See you then', 'Can we move it?']"
      :key="text"
      @click="reply = text"
    >
      {{ text }}
    </RioSuggestionChip>
  </RioChipSet>
  <p v-if="reply">Reply: {{ reply }}</p>
</template>
