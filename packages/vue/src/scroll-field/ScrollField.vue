<script setup lang="ts">
import {
  attachScrollField,
  createScrollField,
  type ScrollFieldDomHandle,
  type ScrollFieldProps,
  type ScrollFieldValue,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/scroll-field.css';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useId,
  useModel,
  useTemplateRef,
} from 'vue';
import { useLocale } from '../locale/locale';

const props = defineProps<
  Omit<ScrollFieldProps, 'value'> & {
    /** The value in the middle, with `v-model`. */
    modelValue?: ScrollFieldValue;
  }
>();
defineEmits<{
  'update:modelValue': [value: ScrollFieldValue];
  'update:editing': [editing: boolean];
  'update:invalid': [invalid: boolean];
}>();
const model = useModel(props, 'modelValue');
const editing = useModel(props, 'editing');
const invalid = useModel(props, 'invalid');

const locale = useLocale(() => props.locale);
// What attachScrollField reports: the item in the middle, and whether a scroll at once put it there
const center = ref<number>();
const centerAtOnce = ref(false);
const id = useId();
const field = createScrollField({
  // `satisfies` fails the build if a prop added to ScrollFieldProps is missing here.
  props: () =>
    ({
      value: model.value,
      min: props.min,
      max: props.max,
      step: props.step,
      options: props.options,
      format: props.format,
      label: props.label,
      loop: props.loop,
      size: props.size,
      editing: editing.value,
      invalid: invalid.value,
      locale: locale.value,
      name: props.name,
      disabled: props.disabled,
      softDisabled: props.softDisabled,
    }) satisfies Record<keyof ScrollFieldProps, unknown>,
  ids: { options: `${id}-option` },
  center: () => center.value,
  centerAtOnce: () => centerAtOnce.value,
  onChange: (next) => (model.value = next),
  onEditingChange: (next) => (editing.value = next),
});
// What each item is made from, once for a render
const depsOf = computed(() => field.itemDeps());

const root = useTemplateRef<HTMLDivElement>('root');
const viewport = useTemplateRef<HTMLDivElement>('viewport');
const input = useTemplateRef<HTMLInputElement>('input');
let handle: ScrollFieldDomHandle | undefined;

onMounted(() => {
  handle = attachScrollField(root.value!, {
    viewport: () => viewport.value,
    input: () => input.value,
    targetIndex: field.targetIndex,
    readText: field.readText,
    completeText: field.completeText,
    onCenterChange(index, byPerson, atOnce) {
      center.value = index;
      centerAtOnce.value = atOnce;
      if (byPerson) field.selectItem(index);
    },
    onChange: (next) => (model.value = next),
    value: field.value,
    valueText: field.valueText,
    onEditingChange: (next) => (editing.value = next),
    onInvalidChange: (next) => (invalid.value = next),
    onStep: field.step,
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="field.parts.root()" @keydown="field.handleKeydown">
    <div ref="viewport" v-bind="field.parts.viewport()">
      <!-- An item renders again only when what it is made from changes. -->
      <div
        v-for="item in field.items()"
        :key="item"
        v-memo="depsOf(item)"
        v-bind="field.parts.item(item)"
        @click="field.selectItem(item)"
      >
        {{ field.itemText(item) }}
      </div>
    </div>
    <input v-if="field.showsInput()" ref="input" v-bind="field.parts.input()" />
    <input v-if="field.showsHiddenInput()" v-bind="field.parts.hiddenInput()" />
  </div>
</template>
