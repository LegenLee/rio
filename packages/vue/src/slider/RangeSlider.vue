<script setup lang="ts">
import {
  attachSlider,
  createRangeSlider,
  type RangeSliderProps,
  type SliderDomHandle,
  type SliderMessages,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/slider.css';
import { nextTick, onBeforeUnmount, onMounted, onUpdated, useModel, useTemplateRef } from 'vue';
import { useLocale, useMessages } from '../locale/locale';

// The app's attributes, such as `aria-label` or `aria-labelledby`, which name the group, go to the
// root, as Vue passes them on.
const props = defineProps<
  Omit<RangeSliderProps, 'value'> & {
    /** The start and the end of the range, with `v-model`. */
    modelValue?: [number, number];
    /** Replaces the inputs' names for assistive technology. */
    messages?: Partial<SliderMessages>;
  }
>();
defineEmits<{ 'update:modelValue': [value: [number, number]] }>();
const model = useModel(props, 'modelValue');

const locale = useLocale(() => props.locale);
const messages = useMessages('slider', locale, () => props.messages);
const slider = createRangeSlider({
  // `satisfies` fails the build if a prop added to RangeSliderProps is missing here.
  props: () =>
    ({
      value: model.value,
      min: props.min,
      max: props.max,
      step: props.step,
      stops: props.stops,
      size: props.size,
      vertical: props.vertical,
      valueIndicator: props.valueIndicator,
      format: props.format,
      locale: locale.value,
      disabled: props.disabled,
      softDisabled: props.softDisabled,
      name: props.name,
    }) satisfies Record<keyof RangeSliderProps, unknown>,
  messages: () => messages.value,
  onChange(next) {
    model.value = next;
    // The inputs show the app's values again, whether or not it followed.
    void nextTick(() => handle?.sync());
  },
});

const root = useTemplateRef<HTMLSpanElement>('root');
const start = useTemplateRef<HTMLInputElement>('start');
const end = useTemplateRef<HTMLInputElement>('end');
let handle: SliderDomHandle | undefined;

onMounted(() => {
  handle = attachSlider(root.value!, {
    inputs: [start.value!, end.value!],
    values: slider.value,
    range: slider.range,
    vertical: slider.vertical,
    blocked: slider.blocked,
    onMove: slider.moveHandle,
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <span ref="root" v-bind="slider.parts.root()">
    <span v-bind="slider.parts.trackLower()" />
    <span v-bind="slider.parts.trackActive()" />
    <span v-bind="slider.parts.trackUpper()" />
    <input ref="start" v-bind="slider.parts.startInput()" />
    <input ref="end" v-bind="slider.parts.endInput()" />
    <span v-bind="slider.parts.startHandle()">
      <span v-if="slider.showsValueIndicator()" v-bind="slider.parts.startValueIndicator()">{{
        slider.valueText(0)
      }}</span>
    </span>
    <span v-bind="slider.parts.endHandle()">
      <span v-if="slider.showsValueIndicator()" v-bind="slider.parts.endValueIndicator()">{{
        slider.valueText(1)
      }}</span>
    </span>
  </span>
</template>
