<script setup lang="ts">
// The fields, AM and PM, and the dial, which `RioTimeInput` and `RioTimePickerDialog` share. Not
// exported: the pickers pass their core API in.
import type { TimePickerApi } from '@rio-m3e/core';
import { vRipple } from '../ripple/ripple';
import { vCornerMorph } from '../corner-morph/corner-morph';

defineProps<{ picker: TimePickerApi }>();
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
