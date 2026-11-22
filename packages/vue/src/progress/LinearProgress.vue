<script setup lang="ts">
import {
  attachLinearProgress,
  createLinearProgress,
  type LinearProgressProps,
  type ProgressDomHandle,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/direction.css';
import '@rio-m3e/styles/progress.css';
import { onBeforeUnmount, onMounted, onUpdated, useTemplateRef } from 'vue';

// The app names the progress bar with `aria-label` or `aria-labelledby`, which go to the root.
const { value, max, wavy, thickness } = defineProps<LinearProgressProps>();

const progress = createLinearProgress({
  // `satisfies` fails the build if a prop added to LinearProgressProps is missing here.
  props: () =>
    ({ value, max, wavy, thickness }) satisfies Record<keyof LinearProgressProps, unknown>,
});

const root = useTemplateRef<HTMLElement>('root');
const indicator = useTemplateRef<HTMLElement>('indicator');
const indicatorLower = useTemplateRef<HTMLElement>('indicatorLower');
const wave = useTemplateRef<SVGPathElement>('wave');
const waveLower = useTemplateRef<SVGPathElement>('waveLower');
let handle: ProgressDomHandle | undefined;
onMounted(() => {
  handle = attachLinearProgress(root.value!, {
    wavy: progress.showsWave,
    indicators: () => [indicator.value, indicatorLower.value],
    waves: () => [wave.value, waveLower.value],
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="progress.parts.root()">
    <span v-bind="progress.parts.trackLower()" />
    <span ref="indicatorLower" v-bind="progress.parts.indicatorLower()" />
    <span v-bind="progress.parts.trackMiddle()" />
    <span ref="indicator" v-bind="progress.parts.indicator()" />
    <span v-bind="progress.parts.trackUpper()" />
    <svg v-if="progress.showsWave()" v-bind="progress.parts.wave()">
      <path ref="waveLower" v-bind="progress.parts.indicatorLowerWave()" />
      <path ref="wave" v-bind="progress.parts.indicatorWave()" />
    </svg>
  </div>
</template>
