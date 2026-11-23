<script setup lang="ts">
import { attachAppBar, createAppBar, type AppBarHandle, type AppBarProps } from '@rio-m3e/core';
import '@rio-m3e/styles/app-bar.css';
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';

interface Props extends AppBarProps {
  /** The headline's text. The `headline` slot takes its place, as for a logo. */
  headline?: string;
  /** The subtitle's text. The `subtitle` slot takes its place. */
  subtitle?: string;
  /** The element whose scrolling fills the bar. Defaults to the window. */
  scrollTarget?: HTMLElement | null;
}

// No defaults here: core fills them in. `scrolled` stays undefined when absent, which means the
// scroll target decides.
const {
  variant,
  align,
  headingLevel,
  scrolled = undefined,
  headline,
  subtitle,
  scrollTarget,
} = defineProps<Props>();
const slots = defineSlots<{
  /** A leading button, such as Back or a menu */
  leading?: () => unknown;
  /** The headline, in place of `headline`, as an image or a logo */
  headline?: () => unknown;
  /** The subtitle, in place of `subtitle` */
  subtitle?: () => unknown;
  /** Trailing buttons, up to two, or an avatar */
  trailing?: () => unknown;
}>();

const targetScrolled = ref(false);
const bar = createAppBar({
  // `satisfies` fails the build if a prop added to AppBarProps is missing here.
  props: () =>
    ({ variant, align, headingLevel, scrolled }) satisfies Record<keyof AppBarProps, unknown>,
  content: () => ({
    leading: !!slots.leading,
    headline: !!slots.headline || !!headline,
    subtitle: !!slots.subtitle || !!subtitle,
    trailing: !!slots.trailing,
  }),
  scrolled: () => targetScrolled.value,
});

const root = useTemplateRef<HTMLElement>('root');
let handle: AppBarHandle | undefined;
onMounted(() => {
  handle = attachAppBar(root.value!, {
    target: () => scrollTarget ?? undefined,
    onScrolledChange: (next) => (targetScrolled.value = next),
  });
});
watch(
  () => scrollTarget,
  () => handle?.update(),
);
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <header ref="root" v-bind="bar.parts.root()">
    <div v-if="bar.showsLeading()" v-bind="bar.parts.leading()">
      <slot name="leading" />
    </div>
    <div v-if="bar.showsText()" v-bind="bar.parts.text()">
      <component :is="bar.headingTag()" v-if="bar.showsHeadline()" v-bind="bar.parts.headline()">
        <slot name="headline">{{ headline }}</slot>
      </component>
      <p v-if="bar.showsSubtitle()" v-bind="bar.parts.subtitle()">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </div>
    <div v-if="bar.showsTrailing()" v-bind="bar.parts.trailing()">
      <slot name="trailing" />
    </div>
  </header>
</template>
