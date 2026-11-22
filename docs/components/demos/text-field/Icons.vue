<script setup lang="ts">
import { mdiClose, mdiMagnify } from '@mdi/js';
import { RioIcon, RioIconButton, RioTextField } from '@rio-m3e/vue';
import { ref } from 'vue';

const query = ref('');
const amount = ref('');
</script>

<template>
  <RioTextField v-model="query" label="Search" placeholder="Songs, albums">
    <template #leading-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
    </template>
    <!-- A clear button shows only while there is text to clear. -->
    <template v-if="query" #trailing-icon>
      <RioIconButton label="Clear" variant="standard" @click="query = ''">
        <RioIcon :icon="{ type: 'svg', path: mdiClose }" />
      </RioIconButton>
    </template>
  </RioTextField>
  <RioTextField v-model="amount" variant="outlined" label="Amount" prefix="$" suffix="USD" />
</template>
