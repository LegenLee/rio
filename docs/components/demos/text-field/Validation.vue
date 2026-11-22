<script setup lang="ts">
import { mdiAlertCircle } from '@mdi/js';
import { RioIcon, RioTextField } from '@rio-m3e/vue';
import { computed, ref } from 'vue';

const code = ref('');
const wrong = computed(() => code.value.length > 0 && code.value.length < 6);
</script>

<template>
  <RioTextField
    v-model="code"
    label="Code"
    :maxlength="6"
    supporting-text="From the email we sent"
    :error="wrong"
    error-text="The code has six characters"
  >
    <!-- The error icon is the app's: Rio ships no icons. -->
    <template v-if="wrong" #trailing-icon>
      <RioIcon :icon="{ type: 'svg', path: mdiAlertCircle }" />
    </template>
  </RioTextField>
  <RioTextField variant="outlined" label="Account" model-value="ada@example.com" readonly />
  <RioTextField label="Disabled" model-value="Fixed" disabled />
</template>
