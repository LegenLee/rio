<script setup lang="ts">
// The fields, AM and PM, and the dial, which `RioTimeInput`, `RioTimeScroll`, and
// `RioTimePickerDialog` share. Not exported: the pickers pass their core API in.
import type { TimePickerApi, TimeSelection } from '@rio-m3e/core';
import { vRipple } from '../ripple/ripple';
import { vCornerMorph } from '../corner-morph/corner-morph';
import ScrollField from '../scroll-field/ScrollField.vue';

const props = defineProps<{ picker: TimePickerApi }>();
defineSlots<{
  /** The scroll fields' mode button, under AM and PM */
  toggle?: () => unknown;
}>();

/** A scroll field's props, its value as `v-model`'s, and its root's attributes */
const scrollField = (field: TimeSelection) => {
  const { value, ...rest } = props.picker.scrollField(field);
  const { parts } = props.picker;
  return {
    ...(field === 'hour' ? parts.hourField() : parts.minuteField()),
    ...rest,
    modelValue: value,
  };
};
</script>

<template>
  <div v-bind="picker.parts.body()">
    <div v-bind="picker.parts.fields()">
      <template v-if="picker.textInput()">
        <span v-bind="picker.parts.unit()">
          <input
            v-bind="picker.parts.hourField()"
            :value="picker.hourText()"
            @input="picker.hourInput(($event.target as HTMLInputElement).value)"
            @change="picker.commitText"
            @keydown.enter="picker.commitText"
          />
          <span v-bind="picker.parts.hourLabel()">{{ picker.fieldNames()[0] }}</span>
        </span>
        <span v-bind="picker.parts.separator()">:</span>
        <span v-bind="picker.parts.unit()">
          <input
            v-bind="picker.parts.minuteField()"
            :value="picker.minuteText()"
            @input="picker.minuteInput(($event.target as HTMLInputElement).value)"
            @change="picker.commitText"
            @keydown.enter="picker.commitText"
          />
          <span v-bind="picker.parts.minuteLabel()">{{ picker.fieldNames()[1] }}</span>
        </span>
      </template>
      <!-- The fields don't take typed text: Space and Enter switch to the text input. -->
      <template v-else-if="picker.showsScroll()">
        <ScrollField
          v-bind="scrollField('hour')"
          :editing="false"
          @update:model-value="picker.scrollPick('hour', $event)"
          @update:editing="picker.handleScrollEditing"
        />
        <span v-bind="picker.parts.separator()">:</span>
        <ScrollField
          v-bind="scrollField('minute')"
          :editing="false"
          @update:model-value="picker.scrollPick('minute', $event)"
          @update:editing="picker.handleScrollEditing"
        />
      </template>
      <template v-else>
        <button v-ripple v-bind="picker.parts.hourField()" @click="picker.selectField('hour')">
          {{ picker.hourText() }}
        </button>
        <span v-bind="picker.parts.separator()">:</span>
        <button v-ripple v-bind="picker.parts.minuteField()" @click="picker.selectField('minute')">
          {{ picker.minuteText() }}
        </button>
      </template>
    </div>
    <div v-if="picker.showsPeriod()" v-bind="picker.parts.period()">
      <button
        v-ripple
        v-corner-morph
        v-bind="picker.parts.am()"
        @click="picker.selectPeriod(false)"
      >
        {{ picker.periodNames()[0] }}
        <span v-bind="picker.parts.periodTouch()" />
      </button>
      <button v-ripple v-corner-morph v-bind="picker.parts.pm()" @click="picker.selectPeriod(true)">
        {{ picker.periodNames()[1] }}
        <span v-bind="picker.parts.periodTouch()" />
      </button>
    </div>
    <div v-if="picker.showsToggle()" v-bind="picker.parts.toggle()">
      <slot name="toggle" />
    </div>
    <div v-if="picker.showsDial()" v-bind="picker.parts.dial()">
      <span v-bind="picker.parts.dialTrack()" />
      <span v-bind="picker.parts.dialHandle()" />
      <span v-bind="picker.parts.dialCenter()" />
      <button
        v-for="item in picker.dialItems()"
        :key="`${item.value}`"
        v-bind="picker.parts.dialItem(item)"
        @click="picker.handleNumberClick($event, item.value)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
