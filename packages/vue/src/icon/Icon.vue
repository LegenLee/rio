<script setup lang="ts">
import { createIcon, iconOf, isIconSource, type IconAlias } from '@rio-m3e/core';
import '@rio-m3e/styles/icon.css';
import { computed } from 'vue';
import { useIcons, type RioIconValue } from './icons';

const props = defineProps<{
  /** The icon, or a name the app's `resolve` turns into one (`createRio`'s `icons`) */
  icon?: RioIconValue | string;
  /** One of the icons the app gave for what Rio's components draw on their own, in its place */
  alias?: IconAlias;
}>();

const icons = useIcons();
const value = computed(() => iconOf(icons?.value, { icon: props.icon, alias: props.alias }));
const source = computed(() => (isIconSource(value.value) ? value.value : undefined));
const drawn = createIcon({ source: () => source.value, alias: () => props.alias });
</script>

<template>
  <svg v-if="source?.type === 'svg'" v-bind="drawn.parts.root()">
    <path v-bind="drawn.parts.path()" />
  </svg>
  <span v-else-if="source" v-bind="drawn.parts.root()">
    <span v-bind="drawn.parts.glyph()" />
  </span>
  <component :is="value" v-else-if="value" v-bind="drawn.parts.root()" />
</template>
