<script setup lang="ts">
import {
  COLOR_ROLES,
  ELEVATION_LEVELS,
  applyTheme,
  colorVar,
  elevationVar,
  type SchemeVariant,
} from '@rio-m3e/tokens'
import { RioSwitch } from '@rio-m3e/vue'
import { ref, watchEffect } from 'vue'

const sourceColor = ref('#6750a4')
const variant = ref<SchemeVariant>('tonal-spot')
const contrast = ref(0)
const mode = ref<'light dark' | 'light' | 'dark'>('light dark')
const checked = ref(false)

watchEffect(() => {
  const root = document.documentElement
  applyTheme(root, { sourceColor: sourceColor.value, variant: variant.value, contrast: contrast.value })
  root.style.colorScheme = mode.value
})
</script>

<template>
  <main>
    <h1>Rio Playground</h1>

    <section class="controls">
      <label>시드 색상 <input v-model="sourceColor" type="color" /></label>
      <label>
        변형
        <select v-model="variant">
          <option value="tonal-spot">Tonal Spot</option>
          <option value="neutral">Neutral</option>
          <option value="vibrant">Vibrant</option>
          <option value="expressive">Expressive</option>
        </select>
      </label>
      <label>
        대비
        <input v-model.number="contrast" type="range" min="-1" max="1" step="0.5" />
        {{ contrast }}
      </label>
      <label>
        모드
        <select v-model="mode">
          <option value="light dark">시스템</option>
          <option value="light">라이트</option>
          <option value="dark">다크</option>
        </select>
      </label>
    </section>

    <section class="controls">
      <RioSwitch v-model:checked="checked" />
      <span>checked: {{ checked }}</span>
      <RioSwitch disabled />
    </section>

    <section class="elevations">
      <div
        v-for="level in ELEVATION_LEVELS"
        :key="level"
        class="elevation"
        :style="{ boxShadow: `var(${elevationVar(level)})` }"
      >
        level {{ level }}
      </div>
    </section>

    <section class="swatches">
      <div
        v-for="role in COLOR_ROLES"
        :key="role"
        class="swatch"
        :style="{ background: `var(${colorVar(role)})` }"
      >
        <span>{{ role }}</span>
      </div>
    </section>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: var(--rio-color-surface);
  color: var(--rio-color-on-surface);
}

main {
  display: grid;
  gap: 24px;
  padding: 24px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.elevations {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 24px;
  border-radius: 16px;
  background: var(--rio-color-surface-container-low);
}

.elevation {
  display: grid;
  place-items: center;
  inline-size: 96px;
  block-size: 96px;
  border-radius: 12px;
  background: var(--rio-color-surface-container-low);
  font-size: 12px;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}

.swatch {
  block-size: 64px;
  padding: 8px;
  border-radius: 12px;
  outline: 1px solid var(--rio-color-outline-variant);
  font-size: 12px;
}

.swatch span {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--rio-color-surface);
  color: var(--rio-color-on-surface);
}
</style>
