<script setup lang="ts">
import { mdiPencilOutline } from '@mdi/js';
import { RioFab, RioIcon } from '@rio-m3e/vue';
import { ref } from 'vue';

// Extended at the top and at the end of the content, and only its icon in between.
const extended = ref(true);
const onScroll = (event: Event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement;
  extended.value = scrollTop < 8 || scrollTop + clientHeight > scrollHeight - 8;
};
</script>

<template>
  <div class="screen">
    <div class="page" @scroll="onScroll">
      <p v-for="n in 16" :key="n" class="message">Message {{ n }}: scroll, and the FAB shrinks.</p>
    </div>
    <RioFab label="Compose" :extended="extended" class="fab">
      <RioIcon :icon="{ type: 'svg', path: mdiPencilOutline }" />
    </RioFab>
  </div>
</template>

<style scoped>
.screen {
  position: relative;
  inline-size: 100%;
}

.page {
  block-size: 280px;
  overflow: auto;
}

.message {
  margin: 0;
  padding: 12px 16px;
}

/* In the lower trailing corner, 16px in, as the guidelines place it */
.fab {
  position: absolute;
  inset-block-end: 16px;
  inset-inline-end: 16px;
}
</style>
