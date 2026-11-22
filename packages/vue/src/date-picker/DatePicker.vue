<script setup lang="ts">
import {
  attachDatePickerMenu,
  createDatePicker,
  initialDatePickerState,
  type DatePickerMenuDomHandle,
  type DatePickerMessages,
  type DatePickerProps,
  type DatePickerVariant,
  type DatePickerState,
  type TextFieldVariant,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/anchored-position.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/date-picker.css';
import { computed, onBeforeUnmount, onMounted, reactive, useTemplateRef, watch } from 'vue';
import Button from '../button/Button.vue';
import IconButton from '../icon-button/IconButton.vue';
import { useLocale, useMessages } from '../locale/locale';
import { keepPresses } from '../overlay/presses';
import TextField from '../text-field/TextField.vue';
import DatePickerCalendar from './DatePickerCalendar.vue';
import DatePickerDialog from './DatePickerDialog.vue';
import RioIcon from '../icon/Icon.vue';

// `class` and `style` dress the whole picker; every other attribute, such as `id` or
// `autocomplete`, and every listener belongs to the field's input.
defineOptions({ inheritAttrs: false });

const props = defineProps<{
  /** `'docked'` shows the calendar below the field; `'modal'`, in a dialog. Defaults to docked. */
  variant?: DatePickerVariant;
  /** The field's look. Defaults to `'outlined'`, as the docked picker's spec has it. */
  fieldVariant?: TextFieldVariant;
  label?: string;
  /** Text below the field. Defaults to the date format, such as MM/DD/YYYY. */
  supportingText?: string;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  /** Submits the date with a form under this name, as `YYYY-MM-DD`. */
  name?: string;
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
  /** Replaces any of the text the picker shows. */
  messages?: Partial<DatePickerMessages>;
  /** A Clear button at the start of Cancel and OK */
  clearable?: boolean;
  /** Modal: what the dialog starts in, the calendar or the text input. */
  initialMode?: 'calendar' | 'input';
}>();
/** The date, `YYYY-MM-DD`, with `v-model`. */
const model = defineModel<string | undefined>();
/** Whether the calendar is shown, with `v-model:open`. The picker keeps it when not bound. */
const open = defineModel<boolean>('open', { default: false });
defineSlots<{
  /**
   * The field's button that opens the calendar, and the dialog's switch back to it. Without one,
   * the `calendar` icon registered with `createRio`.
   */
  'calendar-icon'?: () => unknown;
  /** Without one, the `previous` icon registered with `createRio`. */
  'previous-icon'?: () => unknown;
  /** Without one, the `next` icon registered with `createRio`. */
  'next-icon'?: () => unknown;
  /**
   * The month and year buttons' arrow. Without one, the `dropdown` icon registered with
   * `createRio`.
   */
  'dropdown-icon'?: () => unknown;
  /**
   * Modal: the switch to the text input. Without one, the `edit` icon registered with `createRio`.
   */
  'edit-icon'?: () => unknown;
}>();

const locale = useLocale(() => props.locale);
const messages = useMessages('datePicker', locale, () => props.messages);
const state = reactive<DatePickerState>(initialDatePickerState(model.value, locale.value, props));
const picker = createDatePicker({
  // `satisfies` fails the build if a prop added to DatePickerProps is missing here.
  props: () =>
    ({
      variant: props.variant,
      name: props.name,
      disabled: props.disabled,
      supportingText: props.supportingText,
      error: props.error,
      errorText: props.errorText,
      value: model.value,
      open: open.value,
      min: props.min,
      max: props.max,
      locale: locale.value,
      clearable: props.clearable,
    }) satisfies Record<keyof DatePickerProps, unknown>,
  isDateDisabled: (date) => !!props.isDateDisabled?.(date),
  messages: () => messages.value,
  state: () => state,
  onChange: (next) => (model.value = next),
  onOpenChange: (next) => (open.value = next),
  onStateChange: (next) => Object.assign(state, next),
});
watch([model, locale], () => picker.valueChanged());

const root = useTemplateRef<HTMLElement>('root');
const menu = useTemplateRef<HTMLElement>('menu');
let handle: DatePickerMenuDomHandle | undefined;
onMounted(() => {
  if (!menu.value) return;
  handle = attachDatePickerMenu(root.value!, menu.value, {
    anchor: () => root.value?.querySelector<HTMLElement>('.rio-text-field__frame'),
    field: () => root.value?.querySelector<HTMLElement>('.rio-text-field__input'),
    focusOnOpen: picker.focusOnOpen,
    onClose: picker.cancel,
  });
  handle.sync(open.value);
});
watch(open, (next) => {
  if (next) picker.opened();
});
// After the render, so the calendar is there to take the focus.
watch(open, (next) => handle?.sync(next), { flush: 'post' });
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="picker.parts.root()" :class="$attrs.class" :style="$attrs.style">
    <div v-bind="picker.parts.field()" @click="picker.handleFieldClick">
      <TextField
        v-bind="{ ...$attrs, class: undefined, style: undefined, ...picker.field() }"
        :model-value="state.text"
        :variant="fieldVariant ?? 'outlined'"
        :label
        :required
        :disabled
        autocomplete="off"
        @update:model-value="(text: string | number) => picker.textInput(String(text))"
        @change="picker.commitText"
        @keydown="picker.handleFieldKeydown"
      >
        <template #trailing-icon>
          <IconButton
            v-bind="picker.parts.calendarButton()"
            variant="standard"
            :label="picker.calendarButtonLabel()"
            :disabled
            @click="picker.toggle"
          >
            <slot name="calendar-icon"><RioIcon alias="calendar" /></slot>
          </IconButton>
        </template>
      </TextField>
    </div>
    <input v-if="picker.submits()" v-bind="picker.parts.formValue()" />
    <div v-if="picker.docked()" ref="menu" v-bind="picker.parts.menu()" v-on="keepPresses">
      <template v-if="open">
        <DatePickerCalendar
          v-model:month="state.month"
          v-model:focused="state.focused"
          v-model:view="state.view"
          variant="docked"
          :selected="state.draft"
          :min
          :max
          :locale
          :first-day-of-week="firstDayOfWeek"
          :is-date-disabled="isDateDisabled"
          :messages
          @select="picker.select"
        >
          <template #previous-icon><slot name="previous-icon" /></template>
          <template #next-icon><slot name="next-icon" /></template>
          <template #dropdown-icon><slot name="dropdown-icon" /></template>
        </DatePickerCalendar>
        <div v-if="state.view === 'days'" v-bind="picker.parts.actions()">
          <Button v-if="picker.showsClear()" variant="text" @click="picker.clear">
            {{ messages.clear }}
          </Button>
          <Button variant="text" @click="picker.cancel">{{ messages.cancel }}</Button>
          <Button variant="text" @click="picker.confirm">{{ messages.ok }}</Button>
        </div>
      </template>
    </div>
    <div v-else v-bind="picker.parts.modal()">
      <DatePickerDialog
        v-model="model"
        v-model:open="open"
        :min
        :max
        :is-date-disabled="isDateDisabled"
        :locale
        :first-day-of-week="firstDayOfWeek"
        :messages
        :initial-mode="initialMode"
        :clearable
      >
        <template #previous-icon><slot name="previous-icon" /></template>
        <template #next-icon><slot name="next-icon" /></template>
        <template #dropdown-icon><slot name="dropdown-icon" /></template>
        <template #edit-icon><slot name="edit-icon" /></template>
        <template #calendar-icon><slot name="calendar-icon" /></template>
      </DatePickerDialog>
    </div>
  </div>
</template>
