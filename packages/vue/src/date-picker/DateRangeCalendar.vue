<script setup lang="ts">
// The calendar `RioDateRangePickerDialog` renders: the months one under another. Not exported: the
// dialog owns its state and passes it in.
import { attachRangeCalendar, createRangeCalendar, type CalendarDomHandle } from '@rio-m3e/core';
import { onBeforeUnmount, onMounted, onUpdated, useTemplateRef } from 'vue';
import { vRipple } from '../ripple/ripple';

const props = defineProps<{
  start?: string;
  end?: string;
  min?: string;
  max?: string;
  locale: string;
  firstDayOfWeek?: number;
  isDateDisabled?: (date: string) => boolean;
}>();
const focused = defineModel<string>('focused', { required: true });
const firstMonth = defineModel<string>('firstMonth', { required: true });
const lastMonth = defineModel<string>('lastMonth', { required: true });
const emit = defineEmits<{
  /** A date was chosen; with `confirm`, by Enter, which also confirms the range it ends. */
  select: [date: string, confirm: boolean];
}>();

const calendar = createRangeCalendar({
  props: () => ({
    start: props.start,
    end: props.end,
    focused: focused.value,
    firstMonth: firstMonth.value,
    lastMonth: lastMonth.value,
    min: props.min,
    max: props.max,
    locale: props.locale,
    firstDayOfWeek: props.firstDayOfWeek,
  }),
  isDateDisabled: (date) => !!props.isDateDisabled?.(date),
  onSelect: (date, confirm) => emit('select', date, confirm),
  onFocusChange: (next) => (focused.value = next),
  onMonthsChange: (first, last) => {
    firstMonth.value = first;
    lastMonth.value = last;
  },
});

const root = useTemplateRef<HTMLElement>('root');
let handle: CalendarDomHandle | undefined;
onMounted(() => {
  handle = attachRangeCalendar(root.value!, {
    calendar: () => calendar,
    focused: () => focused.value,
    onConfirm: (date) => emit('select', date, true),
    onEdge: calendar.extend,
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());

defineExpose({
  /** Focuses the date that takes the focus. */
  focus: () => handle?.focus(),
});
</script>

<template>
  <div ref="root" v-bind="calendar.parts.root()">
    <div v-bind="calendar.parts.weekdays()">
      <span v-for="day in calendar.weekdays()" :key="day" v-bind="calendar.parts.weekday(day)">
        {{ calendar.weekdayText(day) }}
      </span>
    </div>
    <div v-bind="calendar.parts.months()">
      <div v-for="month in calendar.months()" :key="month" v-bind="calendar.parts.month(month)">
        <div v-bind="calendar.parts.subhead(month)">{{ calendar.monthText(month) }}</div>
        <table v-bind="calendar.parts.grid(month)">
          <tbody>
            <tr v-for="week in calendar.weeks(month)" :key="week[0]">
              <td v-for="date in week" :key="date" v-bind="calendar.parts.cell(date, month)">
                <button
                  v-if="calendar.showsDay(date, month)"
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
      </div>
    </div>
  </div>
</template>
