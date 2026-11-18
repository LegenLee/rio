<script setup lang="ts">
import {
  attachSlider,
  createSlider,
  mergePartAttrs,
  type SliderDomHandle,
  type SliderProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/slider.css';
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useModel,
  useTemplateRef,
} from 'vue';
import { useLocale } from '../locale/locale';

// `class` and `style` dress the whole slider; every other attribute, such as `id`, `name`,
// `form`, or `aria-label`, and every listener belongs to the input.
defineOptions({ inheritAttrs: false });

const props = defineProps<
  Omit<SliderProps, 'value'> & {
    /** The value, with `v-model`. */
    modelValue?: number;
  }
>();
defineEmits<{ 'update:modelValue': [value: number] }>();
const model = useModel(props, 'modelValue');
const slots = defineSlots<{
  /** An icon inside the track, at its start. Hidden from assistive technology. */
  icon?: () => unknown;
}>();

const locale = useLocale(() => props.locale);
const iconInactive = ref(false);
const slider = createSlider({
  // `satisfies` fails the build if a prop added to SliderProps is missing here.
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
      centered: props.centered,
    }) satisfies Record<keyof SliderProps, unknown>,
  content: () => ({ icon: !!slots.icon }),
  iconInactive: () => iconInactive.value,
  onChange(next) {
    model.value = next;
    // The input shows the app's value again, whether or not it followed.
    void nextTick(() => handle?.sync());
  },
});

const root = useTemplateRef<HTMLSpanElement>('root');
const input = useTemplateRef<HTMLInputElement>('input');
const active = useTemplateRef<HTMLSpanElement>('active');
let handle: SliderDomHandle | undefined;

onMounted(() => {
  handle = attachSlider(root.value!, {
    inputs: [input.value!],
    values: () => [slider.value()],
    range: slider.range,
    vertical: slider.vertical,
    blocked: slider.blocked,
    onMove: slider.moveHandle,
    activeTrack: () => (slider.showsIcon() ? active.value : undefined),
    onIconInactiveChange: (next) => (iconInactive.value = next),
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <span ref="root" v-bind="slider.parts.root()" :class="$attrs.class" :style="$attrs.style">
    <span v-if="slider.showsLowerTrack()" v-bind="slider.parts.trackLower()" />
    <span ref="active" v-bind="slider.parts.trackActive()" />
    <span v-bind="slider.parts.trackUpper()" />
    <span v-if="slider.showsIcon()" v-bind="slider.parts.icon()">
      <slot name="icon" />
    </span>
    <input
      ref="input"
      v-bind="
        mergePartAttrs({ ...$attrs, class: undefined, style: undefined }, slider.parts.input())
      "
    />
    <span v-bind="slider.parts.handle()">
      <span v-if="slider.showsValueIndicator()" v-bind="slider.parts.valueIndicator()">{{
        slider.valueText()
      }}</span>
    </span>
  </span>
</template>
