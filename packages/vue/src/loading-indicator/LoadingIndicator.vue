<script setup lang="ts">
import {
  attachLoadingIndicator,
  createLoadingIndicator,
  type LoadingIndicatorDomHandle,
  type LoadingIndicatorProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/loading-indicator.css';
import { onBeforeUnmount, onMounted, onUpdated, useTemplateRef } from 'vue';

// The app names the progress bar with `aria-label` or `aria-labelledby`, which go to the root.
const { value, max, contained, size, shapes } = defineProps<LoadingIndicatorProps>();

const indicator = createLoadingIndicator({
  // `satisfies` fails the build if a prop added to LoadingIndicatorProps is missing here.
  props: () =>
    ({ value, max, contained, size, shapes }) satisfies Record<
      keyof LoadingIndicatorProps,
      unknown
    >,
});

const root = useTemplateRef<HTMLElement>('root');
const path = useTemplateRef<SVGPathElement>('path');
let handle: LoadingIndicatorDomHandle | undefined;
onMounted(() => {
  handle = attachLoadingIndicator(root.value!, {
    indicator: () => path.value,
    indeterminate: indicator.indeterminate,
    drawing: indicator.drawing,
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="indicator.parts.root()">
    <svg v-bind="indicator.parts.svg()">
      <path ref="path" v-bind="indicator.parts.indicator()" />
    </svg>
  </div>
</template>
