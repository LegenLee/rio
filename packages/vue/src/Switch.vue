<script setup lang="ts">
// 빌드 파이프라인 검증용 샘플. 실제 M3E 스위치 구현으로 갈아엎을 것.
import { createSwitch, switchDefaults, type SwitchProps } from '@rio-m3e/core'
import '@rio-m3e/styles/switch.css'

const props = withDefaults(defineProps<SwitchProps>(), switchDefaults)
const emit = defineEmits<{ 'update:checked': [checked: boolean] }>()

const sw = createSwitch({
  props: () => props,
  onCheckedChange: (v) => emit('update:checked', v),
})
</script>

<template>
  <button type="button" class="rio-switch" v-bind="sw.rootAttrs()" @click="sw.toggle()" />
</template>
