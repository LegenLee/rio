<script setup lang="ts">
import {
  attachDialog,
  createDateRangePickerDialog,
  initialDateRangePickerState,
  type DatePickerMessages,
  type DateRangePickerDialogProps,
  type DateRangePickerState,
  type DialogDomHandle,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/date-picker.css';
import '@rio-m3e/styles/dialog.css';
import {
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
import { keepPresses } from '../overlay/presses';
import TextField from '../text-field/TextField.vue';
import DateRangeCalendar from './DateRangeCalendar.vue';
import RioIcon from '../icon/Icon.vue';

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
  /** What each opening starts in: the calendar, or the text input. Defaults to `'calendar'`. */
  initialMode?: 'calendar' | 'input';
  /** A Clear button at the start of Cancel and OK */
  clearable?: boolean;
}>();
/** The range's start, `YYYY-MM-DD`, with `v-model:start`. It changes on OK. */
const start = defineModel<string | undefined>('start');
/** The range's end, `YYYY-MM-DD`, with `v-model:end`. It changes on OK. */
const end = defineModel<string | undefined>('end');
/** Whether the dialog is shown, with `v-model:open`. */
const open = defineModel<boolean>('open', { default: false });
defineSlots<{
  /**
   * The mode button's icon in the calendar, which switches to the text input. Without one, the
   * `edit` icon registered with `createRio`.
   */
  'edit-icon'?: () => unknown;
  /**
   * The mode button's icon in the text input, which switches to the calendar. Without one, the
   * `calendar` icon registered with `createRio`.
   */
  'calendar-icon'?: () => unknown;
}>();

const locale = useLocale(() => props.locale);
const messages = useMessages('datePicker', locale, () => props.messages);
const state = reactive<DateRangePickerState>(
  initialDateRangePickerState(start.value, end.value, locale.value, props),
);
// The content renders from opening until the closing motion ends.
const rendered = ref(open.value);

const id = useId();
const dialog = createDateRangePickerDialog({
  // `satisfies` fails the build if a prop added to DateRangePickerDialogProps is missing here.
  props: () =>
    ({
      start: start.value,
      end: end.value,
      open: open.value,
      min: props.min,
      max: props.max,
      locale: locale.value,
      clearable: props.clearable,
      initialMode: props.initialMode,
      rendered: rendered.value,
    }) satisfies Record<keyof DateRangePickerDialogProps, unknown>,
  isDateDisabled: (date) => !!props.isDateDisabled?.(date),
  messages: () => messages.value,
  state: () => state,
  ids: { title: `${id}-title`, headline: `${id}-headline` },
  onChange: (nextStart, nextEnd) => {
    start.value = nextStart;
    end.value = nextEnd;
  },
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
const calendar = useTemplateRef<InstanceType<typeof DateRangeCalendar>>('calendar');
let handle: DialogDomHandle | undefined;
onMounted(() => {
  handle = attachDialog(root.value!, {
    onOpenChange: (next) => (open.value = next),
    onClosed: () => {
      if (!open.value) rendered.value = false;
    },
    // The date the calendar opens on, or the start field
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
  <dialog ref="root" v-bind="dialog.parts.root()" v-on="keepPresses">
    <template v-if="rendered">
      <div v-bind="dialog.parts.header()">
        <span v-bind="dialog.parts.title()">{{ messages.rangeTitle }}</span>
        <span v-bind="dialog.parts.headline()">{{ dialog.headline() }}</span>
        <IconButton variant="standard" :label="dialog.modeButtonLabel()" @click="dialog.switchMode">
          <slot v-if="state.mode === 'calendar'" name="edit-icon"><RioIcon alias="edit" /></slot>
          <slot v-else name="calendar-icon"><RioIcon alias="calendar" /></slot>
        </IconButton>
      </div>
      <div v-bind="dialog.parts.divider()" />
      <DateRangeCalendar
        v-if="dialog.calendarMode()"
        ref="calendar"
        v-model:focused="state.focused"
        v-model:first-month="state.firstMonth"
        v-model:last-month="state.lastMonth"
        :start="state.start"
        :end="state.end"
        :min
        :max
        :locale
        :first-day-of-week="firstDayOfWeek"
        :is-date-disabled="isDateDisabled"
        @select="dialog.select"
      />
      <div v-if="dialog.inputMode()" v-bind="dialog.parts.input()">
        <TextField
          v-bind="dialog.startField()"
          :model-value="state.startText"
          variant="outlined"
          :label="messages.startDate"
          autocomplete="off"
          @update:model-value="(text: string | number) => dialog.startInput(String(text))"
          @keydown="dialog.handleFieldKeydown"
        />
        <TextField
          v-bind="dialog.endField()"
          :model-value="state.endText"
          variant="outlined"
          :label="messages.endDate"
          autocomplete="off"
          @update:model-value="(text: string | number) => dialog.endInput(String(text))"
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
