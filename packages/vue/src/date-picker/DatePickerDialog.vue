<script setup lang="ts">
import {
  attachDialog,
  createDatePickerDialog,
  initialDatePickerState,
  type DatePickerDialogProps,
  type DatePickerMessages,
  type DialogDomHandle,
  type DatePickerState,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/date-picker.css';
import '@rio-m3e/styles/dialog.css';
import {
  computed,
  nextTick,
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
import TextField from '../text-field/TextField.vue';
import DatePickerCalendar from './DatePickerCalendar.vue';

const props = defineProps<{
  /** The earliest date that can be chosen, `YYYY-MM-DD` */
  min?: string;
  /** The latest date that can be chosen, `YYYY-MM-DD` */
  max?: string;
  /** Makes dates unavailable, besides those outside `min` and `max`. */
  isDateDisabled?: (date: string) => boolean;
  /** A language tag. Without it, the one provided, or the document's, or the browser's. */
  locale?: string;
  /** Overrides the language's first day of the week: 1 (Monday) to 7 (Sunday). */
  firstDayOfWeek?: number;
  /** Replaces any of the text the dialog shows. */
  messages?: Partial<DatePickerMessages>;
  /**
   * What each opening starts in: the calendar, or the text input, for dates far away, such as a
   * date of birth. Defaults to `'calendar'`.
   */
  initialMode?: 'calendar' | 'input';
  /** A Clear button at the start of Cancel and OK */
  clearable?: boolean;
}>();
/** The chosen date, `YYYY-MM-DD`, with `v-model`. It changes on OK. */
const model = defineModel<string | undefined>();
/** Whether the dialog is shown, with `v-model:open`. */
const open = defineModel<boolean>('open', { default: false });
defineSlots<{
  'previous-icon'?: () => unknown;
  'next-icon'?: () => unknown;
  'dropdown-icon'?: () => unknown;
  /** The mode button's icon in the calendar, which switches to the text input */
  'edit-icon'?: () => unknown;
  /** The mode button's icon in the text input, which switches to the calendar */
  'calendar-icon'?: () => unknown;
}>();

const locale = useLocale(() => props.locale);
const messages = useMessages('datePicker', locale, () => props.messages);
const state = reactive<DatePickerState>(initialDatePickerState(model.value, locale.value, props));
// The content renders from opening until the closing motion ends.
const rendered = ref(open.value);

const id = useId();
const dialog = createDatePickerDialog({
  // `satisfies` fails the build if a prop added to DatePickerDialogProps is missing here.
  props: () =>
    ({
      value: model.value,
      open: open.value,
      min: props.min,
      max: props.max,
      locale: locale.value,
      clearable: props.clearable,
      initialMode: props.initialMode,
      rendered: rendered.value,
    }) satisfies Record<keyof DatePickerDialogProps, unknown>,
  isDateDisabled: (date) => !!props.isDateDisabled?.(date),
  messages: () => messages.value,
  state: () => state,
  ids: { title: `${id}-title`, headline: `${id}-headline` },
  onChange: (next) => (model.value = next),
  onOpenChange: (next) => (open.value = next),
  onStateChange: (next) => Object.assign(state, next),
});
if (open.value) dialog.opened();
watch(open, (next) => {
  if (!next) return;
  dialog.opened();
  rendered.value = true;
});

const root = useTemplateRef<HTMLDialogElement>('root');
const calendar = useTemplateRef<InstanceType<typeof DatePickerCalendar>>('calendar');
let handle: DialogDomHandle | undefined;
onMounted(() => {
  handle = attachDialog(root.value!, {
    onOpenChange: (next) => (open.value = next),
    onClosed: () => {
      if (!open.value) rendered.value = false;
    },
    // The date the calendar opens on, or the text field
    initialFocus: () =>
      root.value?.querySelector<HTMLElement>(
        state.mode === 'calendar' ? '[data-date][tabindex="0"]' : 'input',
      ),
  });
  handle.sync(open.value);
});
watch(open, (next) => handle?.sync(next), { flush: 'post' });
// Switching modes moves the focus into the new one.
watch(
  () => state.mode,
  async (next) => {
    await nextTick();
    if (!open.value) return;
    if (next === 'calendar') calendar.value?.focus();
    else root.value?.querySelector<HTMLElement>('input')?.focus();
  },
);
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <!-- Clicks and presses stay in the dialog, as in RioDialog. -->
  <dialog
    ref="root"
    v-bind="dialog.parts.root()"
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
      <div v-bind="dialog.parts.header()">
        <span v-bind="dialog.parts.title()">{{ messages.title }}</span>
        <span v-bind="dialog.parts.headline()">{{ dialog.headline() }}</span>
        <IconButton variant="standard" :label="dialog.modeButtonLabel()" @click="dialog.switchMode">
          <slot v-if="state.mode === 'calendar'" name="edit-icon" />
          <slot v-else name="calendar-icon" />
        </IconButton>
      </div>
      <div v-bind="dialog.parts.divider()" />
      <DatePickerCalendar
        v-if="dialog.calendarMode()"
        ref="calendar"
        v-model:month="state.month"
        v-model:focused="state.focused"
        v-model:view="state.view"
        variant="modal"
        :selected="state.draft"
        :min
        :max
        :locale
        :first-day-of-week="firstDayOfWeek"
        :is-date-disabled="isDateDisabled"
        :messages
        @select="dialog.select"
      >
        <template #previous-icon><slot name="previous-icon" /></template>
        <template #next-icon><slot name="next-icon" /></template>
        <template #dropdown-icon><slot name="dropdown-icon" /></template>
      </DatePickerCalendar>
      <div v-if="dialog.inputMode()" v-bind="dialog.parts.input()">
        <TextField
          v-bind="dialog.field()"
          :model-value="state.text"
          variant="outlined"
          :label="messages.fieldLabel"
          autocomplete="off"
          @update:model-value="(text: string | number) => dialog.textInput(String(text))"
          @keydown="dialog.handleFieldKeydown"
        />
      </div>
      <div v-bind="dialog.parts.actions()">
        <Button v-if="dialog.showsClear()" variant="text" @click="dialog.clear">
          {{ messages.clear }}
        </Button>
        <Button variant="text" @click="dialog.cancel">{{ messages.cancel }}</Button>
        <Button variant="text" @click="dialog.confirm">{{ messages.ok }}</Button>
      </div>
    </template>
  </dialog>
</template>
