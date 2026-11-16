<script setup lang="ts">
import {
  attachTooltip,
  createTooltip,
  type TooltipDomHandle,
  type TooltipProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/anchored-position.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/tooltip.css';
import { onBeforeUnmount, onMounted, onUpdated, useId, useTemplateRef, watch } from 'vue';

interface Props extends Omit<TooltipProps, 'open'> {
  /** The tooltip's text. The `content` slot takes richer content instead. */
  text?: string;
  /** A subhead above the text (rich only) */
  subhead?: string;
}

// No defaults here: core fills them in.
const { variant, persistent, side, align, offset, text, subhead } = defineProps<Props>();
/**
 * Whether the tooltip is shown, with `v-model:open`. Without it the tooltip keeps the state
 * itself; with it, the app can open a persistent tooltip as the page loads.
 */
const open = defineModel<boolean>('open', { default: false });
const slots = defineSlots<{
  /** The element the tooltip is for, such as a button. One element. */
  default?: () => unknown;
  /** The tooltip's text, in place of the `text` prop */
  content?: () => unknown;
  /** Up to two text buttons (rich only). They make the tooltip a non-modal dialog. */
  actions?: () => unknown;
}>();

const id = useId();
const tooltip = createTooltip({
  // `satisfies` fails the build if a prop added to TooltipProps is missing here.
  props: () =>
    ({
      variant,
      persistent,
      open: open.value,
      side,
      align,
      offset,
    }) satisfies Record<keyof TooltipProps, unknown>,
  content: () => ({ subhead: !!subhead, actions: !!slots.actions }),
  ids: { root: `${id}-tooltip`, subhead: `${id}-subhead`, supportingText: `${id}-text` },
});

const trigger = useTemplateRef<HTMLElement>('trigger');
const root = useTemplateRef<HTMLElement>('root');
let handle: TooltipDomHandle | undefined;
onMounted(() => {
  handle = attachTooltip(trigger.value!, root.value!, {
    placement: tooltip.placement,
    persistent: tooltip.persistent,
    interactive: tooltip.interactive,
    onOpenChange: (next) => (open.value = next),
  });
  handle.sync(open.value);
});
watch(open, (next) => handle?.sync(next), { flush: 'post' });
// The element or the text may have changed, and with them what the element says about it.
onUpdated(() => handle?.update());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <span ref="trigger" v-bind="tooltip.parts.trigger()">
    <slot />
    <!-- Clicks and presses stay in the tooltip, so a card or a row around its element doesn't take
         them. Keys go on, for Escape. -->
    <span
      ref="root"
      v-bind="tooltip.parts.root()"
      @click.stop
      @auxclick.stop
      @dblclick.stop
      @pointerdown.stop
      @pointerup.stop
      @mousedown.stop
      @mouseup.stop
      @contextmenu.stop
    >
      <span v-if="tooltip.showsSubhead()" v-bind="tooltip.parts.subhead()">{{ subhead }}</span>
      <span v-bind="tooltip.parts.supportingText()"><slot name="content">{{ text }}</slot></span>
      <span v-if="tooltip.showsActions()" v-bind="tooltip.parts.actions()">
        <slot name="actions" />
      </span>
    </span>
  </span>
</template>
