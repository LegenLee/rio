<script setup lang="ts">
import { RioCheckbox } from '@rio-m3e/vue';
import { computed, reactive } from 'vue';

const toppings = reactive({ Cheese: true, Olives: false, Basil: true });
const names = Object.keys(toppings) as (keyof typeof toppings)[];
const all = computed(() => names.every((name) => toppings[name]));
const some = computed(() => names.some((name) => toppings[name]));
// Checking the parent, from indeterminate or unchecked, checks every child.
const setAll = (next: boolean) => names.forEach((name) => (toppings[name] = next));
</script>

<template>
  <div class="list">
    <label class="row">
      <RioCheckbox
        :selected="all"
        :indeterminate="some && !all"
        aria-controls="toppings"
        @update:selected="setAll"
      />All toppings
    </label>
    <div id="toppings" class="children">
      <label v-for="name in names" :key="name" class="row">
        <RioCheckbox v-model:selected="toppings[name]" />{{ name }}
      </label>
    </div>
  </div>
</template>

<style scoped>
.list,
.children {
  display: flex;
  flex-direction: column;
}

.children {
  padding-inline-start: 32px;
}

.row {
  display: inline-flex;
  align-items: center;
}
</style>
