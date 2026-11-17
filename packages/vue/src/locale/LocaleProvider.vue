<script setup lang="ts">
import { provide, toRef } from 'vue';
import { localeKey } from './locale';

const { locale } = defineProps<{
  /** A language tag, such as `ko` or `en-GB`, for Rio's components inside */
  locale?: string;
}>();
defineSlots<{ default?: () => unknown }>();

provide(
  localeKey,
  toRef(() => locale),
);
</script>

<template>
  <slot />
</template>
