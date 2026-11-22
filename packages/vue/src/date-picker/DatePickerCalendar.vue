<script setup lang="ts">
// The calendar `RioDatePicker` and `RioDatePickerDialog` share. Not exported: the pickers own its
// state and pass it in.
import {
  attachCalendar,
  createCalendar,
  type CalendarDomHandle,
  type CalendarView,
  type DatePickerMessages,
  type DatePickerVariant,
} from '@rio-m3e/core';
import { onBeforeUnmount, onMounted, onUpdated, useTemplateRef } from 'vue';
import IconButton from '../icon-button/IconButton.vue';
import { vRipple } from '../ripple/ripple';
import RioIcon from '../icon/Icon.vue';

const props = defineProps<{
  variant: DatePickerVariant;
  selected?: string;
  min?: string;
  max?: string;
  locale: string;
  firstDayOfWeek?: number;
  isDateDisabled?: (date: string) => boolean;
  messages: DatePickerMessages;
}>();
const month = defineModel<string>('month', { required: true });
const focused = defineModel<string>('focused', { required: true });
const view = defineModel<CalendarView>('view', { required: true });
const emit = defineEmits<{
  /** A date was chosen; with `confirm`, by Enter, which also confirms it. */
  select: [date: string, confirm: boolean];
}>();
defineSlots<{
  /** Without one, the `previous` icon registered with `createRio`. */
  'previous-icon'?: () => unknown;
  /** Without one, the `next` icon registered with `createRio`. */
  'next-icon'?: () => unknown;
  /** Without one, the `dropdown` icon registered with `createRio`. */
  'dropdown-icon'?: () => unknown;
}>();

const calendar = createCalendar({
  props: () => ({
    selected: props.selected,
    month: month.value,
    focused: focused.value,
    view: view.value,
    min: props.min,
    max: props.max,
    locale: props.locale,
    firstDayOfWeek: props.firstDayOfWeek,
    variant: props.variant,
  }),
  messages: () => props.messages,
  isDateDisabled: (date) => !!props.isDateDisabled?.(date),
  onSelect: (date, confirm) => emit('select', date, confirm),
  onMonthChange: (next) => (month.value = next),
  onFocusChange: (next) => (focused.value = next),
  onViewChange: (next) => (view.value = next),
});

/** An arrow button's label and whether it can be used, from its part */
const nav = (part: Record<string, string | undefined>) => ({
  label: part['aria-label']!,
  disabled: part.disabled !== undefined,
  class: part.class,
});

const root = useTemplateRef<HTMLElement>('root');
let handle: CalendarDomHandle | undefined;
onMounted(() => {
  handle = attachCalendar(root.value!, {
    calendar: () => calendar,
    focused: () => focused.value,
    onConfirm: (date) => emit('select', date, true),
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());

defineExpose({
  /** Focuses the date that takes the focus, or the option shown in a list. */
  focus: () => handle?.focus(),
});
</script>

<template>
  <div ref="root" v-bind="calendar.parts.root()">
    <div v-bind="calendar.parts.header()">
      <template v-if="variant === 'docked'">
        <span class="rio-date-picker__menu-group">
          <IconButton
            v-bind="nav(calendar.parts.previousMonth())"
            variant="standard"
            @click="calendar.goMonths(-1)"
          >
            <slot name="previous-icon"><RioIcon alias="previous" /></slot>
          </IconButton>
          <button
            v-ripple
            v-bind="calendar.parts.monthButton()"
            @click="calendar.toggleView('months')"
          >
            {{ calendar.monthText() }}
            <span v-bind="calendar.parts.dropdownIcon()"
              ><slot name="dropdown-icon"><RioIcon alias="dropdown" /></slot
            ></span>
          </button>
          <IconButton
            v-bind="nav(calendar.parts.nextMonth())"
            variant="standard"
            @click="calendar.goMonths(1)"
          >
            <slot name="next-icon"><RioIcon alias="next" /></slot>
          </IconButton>
        </span>
        <span class="rio-date-picker__menu-group">
          <IconButton
            v-bind="nav(calendar.parts.previousYear())"
            variant="standard"
            @click="calendar.goMonths(-12)"
          >
            <slot name="previous-icon"><RioIcon alias="previous" /></slot>
          </IconButton>
          <button
            v-ripple
            v-bind="calendar.parts.yearButton()"
            @click="calendar.toggleView('years')"
          >
            {{ calendar.yearText() }}
            <span v-bind="calendar.parts.dropdownIcon()"
              ><slot name="dropdown-icon"><RioIcon alias="dropdown" /></slot
            ></span>
          </button>
          <IconButton
            v-bind="nav(calendar.parts.nextYear())"
            variant="standard"
            @click="calendar.goMonths(12)"
          >
            <slot name="next-icon"><RioIcon alias="next" /></slot>
          </IconButton>
        </span>
      </template>
      <template v-else>
        <button v-ripple v-bind="calendar.parts.yearButton()" @click="calendar.toggleView('years')">
          {{ calendar.yearText() }}
          <span v-bind="calendar.parts.dropdownIcon()"
            ><slot name="dropdown-icon"><RioIcon alias="dropdown" /></slot
          ></span>
        </button>
        <span class="rio-date-picker__menu-group">
          <IconButton
            v-bind="nav(calendar.parts.previousMonth())"
            variant="standard"
            @click="calendar.goMonths(-1)"
          >
            <slot name="previous-icon"><RioIcon alias="previous" /></slot>
          </IconButton>
          <IconButton
            v-bind="nav(calendar.parts.nextMonth())"
            variant="standard"
            @click="calendar.goMonths(1)"
          >
            <slot name="next-icon"><RioIcon alias="next" /></slot>
          </IconButton>
        </span>
      </template>
    </div>
    <table v-if="calendar.view() === 'days'" v-bind="calendar.parts.grid()">
      <thead>
        <tr>
          <th v-for="day in calendar.weekdays()" :key="day" v-bind="calendar.parts.weekday(day)">
            {{ calendar.weekdayText(day) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="week in calendar.weeks()" :key="week[0]">
          <td v-for="date in week" :key="date" v-bind="calendar.parts.cell(date)">
            <button
              v-if="calendar.showsDay(date)"
              v-ripple
              v-bind="calendar.parts.day(date)"
              @click="calendar.handleDayClick(date)"
            >
              {{ calendar.dayText(date) }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else v-bind="calendar.parts.list()">
      <template v-if="calendar.view() === 'months'">
        <button
          v-for="option in calendar.months()"
          :key="option"
          v-ripple
          v-bind="calendar.parts.monthOption(option)"
          @click="calendar.chooseMonth(option)"
        >
          {{ calendar.monthName(option) }}
        </button>
      </template>
      <template v-else>
        <button
          v-for="option in calendar.years()"
          :key="option"
          v-ripple
          v-bind="calendar.parts.yearOption(option)"
          @click="calendar.chooseYear(option)"
        >
          {{ calendar.yearOptionText(option) }}
        </button>
      </template>
    </div>
  </div>
</template>
