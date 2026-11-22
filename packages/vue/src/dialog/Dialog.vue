<script setup lang="ts">
import {
  attachDialog,
  createDialog,
  type DialogCancelEvent,
  type DialogOverflow,
  type DialogDomHandle,
  type DialogProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/dialog.css';
import { onBeforeUnmount, onMounted, onUpdated, ref, useId, useTemplateRef, watch } from 'vue';
import { keepPresses } from '../overlay/presses';

interface Props extends Omit<DialogProps, 'open'> {
  /** States what the dialog is for, and names it. Without it, give the dialog an `aria-label`. */
  headline?: string;
}

// No defaults here: core fills them in.
const { role, headline } = defineProps<Props>();
/** Whether the dialog is shown, with `v-model:open`. */
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{
  /** Escape or a click on the scrim asks to close. `preventDefault()` keeps the dialog open. */
  cancel: [event: DialogCancelEvent];
}>();
const slots = defineSlots<{
  /** The supporting text, or a list or a form */
  default?: () => unknown;
  /** An icon above the headline, which centers both */
  icon?: () => unknown;
  /** Up to two buttons: the dismissing one first, then the confirming one. */
  actions?: () => unknown;
}>();

const id = useId();
const overflow = ref<DialogOverflow>({ top: false, bottom: false, focusable: false });
const dialog = createDialog({
  // `satisfies` fails the build if a prop added to DialogProps is missing here.
  props: () => ({ open: open.value, role }) satisfies Record<keyof DialogProps, unknown>,
  content: () => ({ icon: !!slots.icon, headline: !!headline, actions: !!slots.actions }),
  overflow: () => overflow.value,
  ids: { headline: `${id}-headline`, content: `${id}-content` },
});

// The content renders from opening until the closing motion ends.
const rendered = ref(open.value);
watch(open, (next) => {
  if (next) rendered.value = true;
});

const root = useTemplateRef<HTMLDialogElement>('root');
let handle: DialogDomHandle | undefined;
onMounted(() => {
  handle = attachDialog(root.value!, {
    onCancel: (event) => emit('cancel', event),
    onOpenChange: (next) => (open.value = next),
    onOverflowChange: (next) => (overflow.value = next),
    onClosed: () => {
      if (!open.value) rendered.value = false;
    },
  });
  handle.sync(open.value);
});
// After the render, so the content is there when the dialog opens.
watch(open, (next) => handle?.sync(next), { flush: 'post' });
// The content may have changed, and with it whether it scrolls.
onUpdated(() => handle?.update());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <dialog ref="root" v-bind="dialog.parts.root()" v-on="keepPresses">
    <template v-if="rendered">
      <div v-if="dialog.showsIcon()" v-bind="dialog.parts.icon()"><slot name="icon" /></div>
      <h2 v-if="dialog.showsHeadline()" v-bind="dialog.parts.headline()">{{ headline }}</h2>
      <div v-bind="dialog.parts.content()"><slot /></div>
      <div v-if="dialog.showsActions()" v-bind="dialog.parts.actions()">
        <slot name="actions" />
      </div>
    </template>
  </dialog>
</template>
