<script setup lang="ts">
import { RioButton, RioCircularProgress } from '@rio-m3e/vue';
import { ref } from 'vue';

const saving = ref(false);
const save = () => {
  saving.value = true;
  setTimeout(() => (saving.value = false), 2000);
};
</script>

<template>
  <RioButton :soft-disabled="saving" @click="save">
    <template v-if="saving" #icon>
      <!-- In a button: the label's color, no track, and the flat shape at this size. The
           button's icon is hidden from assistive technology; its label says it is saving. -->
      <RioCircularProgress
        :size="20"
        :thickness="3"
        style="--rio-progress-color: currentColor; --rio-progress-track-color: transparent"
      />
    </template>
    {{ saving ? 'Saving' : 'Save' }}
  </RioButton>
</template>
