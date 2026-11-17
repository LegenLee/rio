<script setup lang="ts">
import {
  attachDialog,
  attachTimePicker,
  createTimePicker,
  initialTimeState,
  type DialogDomHandle,
  type HourCycle,
  type TimePickerDomHandle,
  type TimePickerLayout,
  type TimePickerMessages,
  type TimePickerMode,
  type TimePickerProps,
  type TimePickerState,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/dialog.css';
import '@rio-m3e/styles/time-picker.css';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue';
import Button from '../button/Button.vue';
import IconButton from '../icon-button/IconButton.vue';
import { useLocale, useMessages } from '../locale/locale';
import TimePickerBody from './TimePickerBody.vue';

const props = defineProps<{
  /** A language tag. Without it, the one provided, or the document's, or the browser's. */
  locale?: string;
  /** Overrides the language's clock: 12 hours with AM and PM, or 24. */
  hourCycle?: HourCycle;
  /** The dial beside the fields, or below them. Defaults to `'auto'`, from the window's height. */
  layout?: TimePickerLayout;
  /** What each opening starts in: the dial, or the text input. Defaults to `'dial'`. */
  initialMode?: TimePickerMode;
  /** Replaces any of the text the dialog shows. */
  messages?: Partial<TimePickerMessages>;
}>();
/** The time, `HH:MM` on a 24-hour clock, with `v-model`. It changes on OK. */
const model = defineModel<string | undefined>();
/** Whether the dialog is shown, with `v-model:open`. */
const open = defineModel<boolean>('open', { default: false });
defineSlots<{
  /** The mode button's icon on the dial, which switches to the text input */
  'keyboard-icon'?: () => unknown;
  /** The mode button's icon in the text input, which switches to the dial */
  'clock-icon'?: () => unknown;
}>();

const locale = useLocale(() => props.locale);
const messages = useMessages('timePicker', locale, () => props.messages);
const state = reactive<TimePickerState>(initialTimeState(model.value));
// The content renders from opening until the closing motion ends.
const rendered = ref(open.value);
const id = useId();
const picker = createTimePicker({
  variant: 'dialog',
  // `satisfies` fails the build if a prop added to TimePickerProps is missing here.
  props: () =>
    ({
      value: model.value,
      open: open.value,
      locale: locale.value,
      hourCycle: props.hourCycle,
      layout: props.layout,
      initialMode: props.initialMode,
      rendered: rendered.value,
    }) satisfies Record<keyof TimePickerProps, unknown>,
  messages: () => messages.value,
  state: () => state,
  ids: { error: `${id}-error` },
  onChange: (next) => (model.value = next),
  onOpenChange: (next) => (open.value = next),
  onStateChange: (next) => Object.assign(state, next),
});
if (open.value) picker.opened();
watch(open, (next) => {
  if (!next) return;
  picker.opened();
  rendered.value = true;
});

const root = useTemplateRef<HTMLDialogElement>('root');
let dialogHandle: DialogDomHandle | undefined;
let handle: TimePickerDomHandle | undefined;
onMounted(() => {
  dialogHandle = attachDialog(root.value!, {
    onOpenChange: (next) => (open.value = next),
    onClosed: () => {
      if (!open.value) rendered.value = false;
    },
    // The hour field
    initialFocus: () => root.value?.querySelector<HTMLElement>('.rio-time-picker__field'),
  });
  dialogHandle.sync(open.value);
  handle = attachTimePicker(root.value!, {
    selection: () => state.selection,
    hourCycle: picker.hourCycle,
    onPick: picker.dialPick,
    onPeriod: picker.selectPeriod,
  });
});
watch(open, (next) => dialogHandle?.sync(next), { flush: 'post' });
// The dial renders in TimePickerBody, so this follows the state, not this component's updates.
watch(state, () => handle?.sync(), { flush: 'post' });
onBeforeUnmount(() => {
  dialogHandle?.detach();
  handle?.detach();
});

// Enter in the text input confirms, as OK does.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || state.mode !== 'input') return;
  if (!(event.target as Element).matches('input')) return;
  event.preventDefault();
  picker.confirm();
};
</script>

<template>
  <!-- Clicks and presses stay in the dialog, as in RioDialog. -->
  <dialog
    ref="root"
    v-bind="picker.parts.root()"
    @keydown="onKeydown"
    @click.stop
    @auxclick.stop
    @dblclick.stop
    @pointerdown.stop
    @pointerup.stop
    @mousedown.stop
    @mouseup.stop
    @contextmenu.stop
  >
    <template v-if="rendered">
      <TimePickerBody :picker />
      <div v-if="picker.showsError()" v-bind="picker.parts.error()">{{ picker.error() }}</div>
      <div v-bind="picker.parts.actions()">
        <IconButton variant="standard" :label="picker.modeButtonLabel()" @click="picker.switchMode">
          <slot v-if="state.mode === 'dial'" name="keyboard-icon" />
          <slot v-else name="clock-icon" />
        </IconButton>
        <Button variant="text" @click="picker.cancel">{{ messages.cancel }}</Button>
        <Button variant="text" @click="picker.confirm">{{ messages.ok }}</Button>
      </div>
    </template>
  </dialog>
</template>
