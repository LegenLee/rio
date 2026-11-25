<script setup lang="ts">
import {
  attachDialog,
  createDialog,
  type DialogCancelEvent,
  type DialogMessages,
  type DialogOverflow,
  type DialogDomHandle,
  type DialogProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/dialog.css';
import { onBeforeUnmount, onMounted, onUpdated, ref, useId, useTemplateRef, watch } from 'vue';
import Button from '../button/Button.vue';
import IconButton from '../icon-button/IconButton.vue';
import RioIcon from '../icon/Icon.vue';
import { useLocale, useMessages } from '../locale/locale';
import { keepPresses } from '../overlay/presses';

interface Props extends Omit<DialogProps, 'open'> {
  /** States what the dialog is for, and names it. Without it, give the dialog an `aria-label`. */
  headline?: string;
  /** A language tag, for the close and Cancel buttons. Without it, the one provided, or the page's. */
  locale?: string;
  /** Replaces the close and Cancel buttons' names. */
  messages?: Partial<DialogMessages>;
}

// No defaults here: core fills them in.
const { variant, role, headline, locale, messages } = defineProps<Props>();
/** Whether the dialog is shown, with `v-model:open`. */
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{
  /**
   * Escape, a click on the scrim, or the close or Cancel button asks to close. `preventDefault()`
   * keeps the dialog open, as to ask first whether to discard what was entered.
   */
  cancel: [event: DialogCancelEvent];
}>();
const slots = defineSlots<{
  /** The supporting text, or a list or a form */
  default?: () => unknown;
  /** An icon above the headline, which centers both */
  icon?: () => unknown;
  /**
   * Up to two buttons: the dismissing one first, then the confirming one. A full-screen or adaptive
   * dialog draws its own close or Cancel button, so give it only the confirming one.
   */
  actions?: () => unknown;
  /** The full-screen dialog's close icon, in place of the one the app registered (`close`) */
  'close-icon'?: () => unknown;
}>();

const text = useMessages(
  'dialog',
  useLocale(() => locale),
  () => messages,
);

const id = useId();
const overflow = ref<DialogOverflow>({ top: false, bottom: false, focusable: false });
const compact = ref(false);
const dialog = createDialog({
  // `satisfies` fails the build if a prop added to DialogProps is missing here.
  props: () => ({ open: open.value, variant, role }) satisfies Record<keyof DialogProps, unknown>,
  content: () => ({ icon: !!slots.icon, headline: !!headline, actions: !!slots.actions }),
  overflow: () => overflow.value,
  ids: { headline: `${id}-headline`, content: `${id}-content` },
  compact: () => compact.value,
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
    onCompactChange: (next) => (compact.value = next),
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
      <div v-if="dialog.fullScreen()" v-bind="dialog.parts.header()">
        <div v-bind="dialog.parts.dismiss()">
          <IconButton :label="text.close" variant="standard" @click="handle?.dismiss()">
            <slot name="close-icon"><RioIcon alias="close" /></slot>
          </IconButton>
        </div>
        <h2 v-if="dialog.showsHeadline()" v-bind="dialog.parts.headline()">{{ headline }}</h2>
        <div v-if="dialog.showsActions()" v-bind="dialog.parts.actions()">
          <slot name="actions" />
        </div>
      </div>
      <template v-else>
        <div v-if="dialog.showsIcon()" v-bind="dialog.parts.icon()"><slot name="icon" /></div>
        <h2 v-if="dialog.showsHeadline()" v-bind="dialog.parts.headline()">{{ headline }}</h2>
      </template>
      <!-- In one place either way, so it stays mounted, with its focus, as an adaptive dialog switches -->
      <div v-bind="dialog.parts.content()"><slot /></div>
      <div v-if="!dialog.fullScreen() && dialog.showsActions()" v-bind="dialog.parts.actions()">
        <Button v-if="dialog.showsDismiss()" variant="text" @click="handle?.dismiss()">
          {{ text.cancel }}
        </Button>
        <slot name="actions" />
      </div>
    </template>
  </dialog>
</template>
