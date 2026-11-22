<script setup lang="ts">
import {
  attachCircularProgress,
  createCircularProgress,
  type CircularProgressProps,
  type ProgressDomHandle,
} from '@rio-m3e/core';
import '@rio-m3e/styles/progress.css';
import { onBeforeUnmount, onMounted, onUpdated, useTemplateRef } from 'vue';

// The app names the progress bar with `aria-label` or `aria-labelledby`, which go to the root.
const { value, max, wavy, thickness, size } = defineProps<CircularProgressProps>();

const progress = createCircularProgress({
  // `satisfies` fails the build if a prop added to CircularProgressProps is missing here.
  props: () =>
    ({ value, max, wavy, thickness, size }) satisfies Record<keyof CircularProgressProps, unknown>,
});

const root = useTemplateRef<HTMLElement>('root');
const indicator = useTemplateRef<SVGCircleElement>('indicator');
const wave = useTemplateRef<SVGPathElement>('wave');
let handle: ProgressDomHandle | undefined;
onMounted(() => {
  handle = attachCircularProgress(root.value!, {
    wavy: progress.showsWave,
    indicator: () => indicator.value,
    wave: () => wave.value,
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="progress.parts.root()">
    <svg v-bind="progress.parts.svg()">
      <circle v-bind="progress.parts.track()" />
      <circle ref="indicator" v-bind="progress.parts.indicator()" />
      <path v-if="progress.showsWave()" ref="wave" v-bind="progress.parts.indicatorWave()" />
    </svg>
  </div>
</template>
