<script setup lang="ts">
import { attachRipple, type RippleHandle } from '@rio-m3e/core';
import {
  COLOR_ROLES,
  ELEVATION_LEVELS,
  applyTheme,
  colorVar,
  elevationVar,
  motionVar,
  SHAPE_CORNERS,
  TYPE_STYLES,
  shapeVar,
  typescaleVar,
  type MotionScheme,
  type MotionToken,
  type SchemeVariant,
} from '@rio-m3e/tokens';
import { RioSwitch } from '@rio-m3e/vue';
import { ref, watchEffect, type Directive } from 'vue';

// Playground-only directive: attach a ripple to any element, like an InkWell
const ripples = new WeakMap<HTMLElement, RippleHandle>();
const vRipple: Directive<HTMLElement> = {
  mounted: (el) => ripples.set(el, attachRipple(el)),
  unmounted: (el) => ripples.get(el)?.detach(),
};

const sourceColor = ref('#6750a4');
const variant = ref<SchemeVariant>('tonal-spot');
const contrast = ref(0);
const mode = ref<'light dark' | 'light' | 'dark'>('light dark');
const motion = ref<MotionScheme>('expressive');
const checked = ref(false);
const moved = ref(false);

const SPATIAL: MotionToken[] = ['fast-spatial', 'default-spatial', 'slow-spatial'];

watchEffect(() => {
  const root = document.documentElement;
  applyTheme(root, {
    sourceColor: sourceColor.value,
    variant: variant.value,
    contrast: contrast.value,
    motion: motion.value,
  });
  root.style.colorScheme = mode.value;
});
</script>

<template>
  <main>
    <h1>Rio Playground</h1>

    <section class="controls">
      <label>Source color <input v-model="sourceColor" type="color" /></label>
      <label>
        Variant
        <select v-model="variant">
          <option value="tonal-spot">Tonal Spot</option>
          <option value="neutral">Neutral</option>
          <option value="vibrant">Vibrant</option>
          <option value="expressive">Expressive</option>
        </select>
      </label>
      <label>
        Contrast
        <input v-model.number="contrast" type="range" min="-1" max="1" step="0.5" />
        {{ contrast }}
      </label>
      <label>
        Mode
        <select v-model="mode">
          <option value="light dark">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label>
        Motion
        <select v-model="motion">
          <option value="expressive">Expressive</option>
          <option value="standard">Standard</option>
        </select>
      </label>
    </section>

    <section class="motion">
      <button type="button" @click="moved = !moved">Move</button>
      <div v-for="token in SPATIAL" :key="token" class="track">
        <span
          class="dot"
          :class="{ moved }"
          :style="{ transition: `transform var(${motionVar(token)})` }"
        />
        <code>{{ token }}</code>
      </div>
    </section>

    <!-- Stand-ins for real buttons, to try the state layer and focus ring (Tab to see the ring) -->
    <section class="controls">
      <button v-ripple type="button" class="demo-button rio-state-layer rio-ripple rio-focus-ring">
        Filled
      </button>
      <button
        v-ripple
        type="button"
        class="demo-button tonal rio-state-layer rio-ripple rio-focus-ring"
      >
        Tonal
      </button>
      <button
        v-ripple
        type="button"
        class="demo-button rio-state-layer rio-ripple rio-focus-ring"
        disabled
      >
        Disabled
      </button>
      <div v-ripple class="demo-card rio-state-layer rio-ripple">Any element can ripple</div>
    </section>

    <section class="controls">
      <RioSwitch v-model:checked="checked" />
      <span>checked: {{ checked }}</span>
      <RioSwitch disabled />
    </section>

    <section class="type-scale">
      <div v-for="style in TYPE_STYLES" :key="style" class="type-row">
        <code>{{ style }}</code>
        <span
          v-for="emphasized in [false, true]"
          :key="String(emphasized)"
          :style="{
            font: `var(${typescaleVar(style, { emphasized })})`,
            letterSpacing: `var(${typescaleVar(style, { emphasized, part: 'tracking' })})`,
          }"
        >
          {{ emphasized ? 'Emphasized' : 'Baseline' }} type
        </span>
      </div>
    </section>

    <section class="shapes">
      <div
        v-for="corner in SHAPE_CORNERS"
        :key="corner"
        class="shape"
        :style="{ borderRadius: `var(${shapeVar(corner)})` }"
      >
        {{ corner }}
      </div>
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

.motion {
  display: grid;
  justify-items: start;
  gap: 8px;
}

.track {
  position: relative;
  display: flex;
  align-items: center;
  inline-size: 320px;
  block-size: 32px;
  border-radius: 16px;
  background: var(--rio-color-surface-container-high);
}

.track code {
  margin-inline-start: 40px;
  font-size: 12px;
}

.dot {
  position: absolute;
  inset-block-start: 4px;
  inset-inline-start: 4px;
  inline-size: 24px;
  block-size: 24px;
  border-radius: 50%;
  background: var(--rio-color-primary);
}

.dot.moved {
  transform: translateX(288px);
}

.demo-button {
  block-size: 40px;
  padding-inline: 16px;
  border: none;
  border-radius: var(--rio-shape-corner-full);
  background: var(--rio-color-primary);
  color: var(--rio-color-on-primary);
  font: var(--rio-typescale-label-large);
  letter-spacing: var(--rio-typescale-label-large-tracking);
  cursor: pointer;
}

.demo-card {
  display: grid;
  place-items: center;
  inline-size: 240px;
  block-size: 96px;
  border-radius: var(--rio-shape-corner-medium);
  background: var(--rio-color-surface-container-highest);
  color: var(--rio-color-on-surface);
  font: var(--rio-typescale-body-medium);
  cursor: pointer;
}

.demo-button.tonal {
  background: var(--rio-color-secondary-container);
  color: var(--rio-color-on-secondary-container);
}

.demo-button:disabled {
  background: color-mix(in srgb, var(--rio-color-on-surface) 10%, transparent);
  color: color-mix(
    in srgb,
    var(--rio-color-on-surface) calc(var(--rio-state-disabled-state-layer-opacity) * 100%),
    transparent
  );
  cursor: default;
}

.type-scale {
  display: grid;
  gap: 8px;
}

.type-row {
  display: grid;
  grid-template-columns: 9rem 1fr 1fr;
  align-items: baseline;
  gap: 16px;
}

.type-row code {
  font-size: 12px;
  color: var(--rio-color-on-surface-variant);
}

.shapes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.shape {
  display: grid;
  place-items: center;
  inline-size: 112px;
  block-size: 72px;
  background: var(--rio-color-primary-container);
  color: var(--rio-color-on-primary-container);
  font-size: 11px;
  text-align: center;
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
