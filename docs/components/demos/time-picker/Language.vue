<script setup lang="ts">
import { RioLocaleProvider, RioTimeInput } from '@rio-m3e/vue';
import { ref } from 'vue';

const time = ref('19:05');
</script>

<template>
  <!-- Korean text, with 오전 and 오후 -->
  <RioLocaleProvider locale="ko-KR">
    <RioTimeInput v-model="time" />
  </RioLocaleProvider>
  <!-- German, for this picker only: a 24-hour clock -->
  <RioTimeInput v-model="time" locale="de-DE" />
</template>
