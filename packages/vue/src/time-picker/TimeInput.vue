<script setup lang="ts">
import {
  attachTimePicker,
  createTimePicker,
  initialTimePickerState,
  type HourCycle,
  type TimePickerDomHandle,
  type TimePickerMessages,
  type TimePickerState,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/time-picker.css';
import { computed, onBeforeUnmount, onMounted, reactive, useId, useTemplateRef, watch } from 'vue';
import { useLocale, useMessages } from '../locale/locale';
import TimePickerBody from './TimePickerBody.vue';

const props = defineProps<{
  /** A language tag. Without it, the one provided, or the document's, or the browser's. */
  locale?: string;
  /** Overrides the language's clock: 12 hours with AM and PM, or 24. */
  hourCycle?: HourCycle;
  /** Replaces any of the text the picker shows. */
  messages?: Partial<TimePickerMessages>;
}>();
/** The time, `HH:MM` on a 24-hour clock, with `v-model`. */
const model = defineModel<string | undefined>();

const locale = useLocale(() => props.locale);
const messages = useMessages('timePicker', locale, () => props.messages);
const state = reactive<TimePickerState>({ ...initialTimePickerState(model.value), mode: 'input' });
const id = useId();
const picker = createTimePicker({
  variant: 'inline',
  props: () => ({ value: model.value, locale: locale.value, hourCycle: props.hourCycle }),
  messages: () => messages.value,
  state: () => state,
  ids: { error: `${id}-error` },
  onChange: (next) => (model.value = next),
  onStateChange: (next) => Object.assign(state, next),
});
picker.valueChanged();
watch([model, locale, () => props.hourCycle], () => picker.valueChanged());

const root = useTemplateRef<HTMLElement>('root');
let handle: TimePickerDomHandle | undefined;
onMounted(() => {
  handle = attachTimePicker(root.value!, {
    selection: () => state.selection,
    hourCycle: picker.hourCycle,
    onPick: picker.dialPick,
    onPeriod: picker.selectPeriod,
    onHover: picker.hover,
  });
});
// The dial renders in TimePickerBody, so this follows the state, not this component's updates.
watch(state, () => handle?.sync(), { flush: 'post' });
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="picker.parts.root()">
    <TimePickerBody :picker />
    <div v-if="picker.showsError()" v-bind="picker.parts.error()">{{ picker.error() }}</div>
  </div>
</template>
