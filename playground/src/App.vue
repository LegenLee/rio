<script setup lang="ts">
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
import {
  mdiBookmark,
  mdiBookmarkOutline,
  mdiCheck,
  mdiClose,
  mdiFormatAlignCenter,
  mdiFormatAlignLeft,
  mdiFormatAlignRight,
  mdiFormatBold,
  mdiFormatItalic,
  mdiFormatUnderline,
  mdiHeart,
  mdiHeartOutline,
  mdiMagnify,
  mdiPause,
  mdiSkipNext,
  mdiSkipPrevious,
} from '@mdi/js';
import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  ICON_BUTTON_VARIANTS,
  ICON_BUTTON_WIDTHS,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
  type IconButtonVariant,
} from '@rio-m3e/core';
import { RioButton, RioButtonGroup, RioIconButton, RioSwitch, vRipple } from '@rio-m3e/vue';
import { reactive, ref, watchEffect } from 'vue';

const sourceColor = ref('#6750a4');
const variant = ref<SchemeVariant>('tonal-spot');
const contrast = ref(0);
const mode = ref<'light dark' | 'light' | 'dark'>('light dark');
const motion = ref<MotionScheme>('expressive');
const switches = reactive({ plain: false, selectedIcon: true, bothIcons: false });
const buttonShape = ref<ButtonShape>('round');
// Text buttons can't toggle.
const TOGGLE_VARIANTS = BUTTON_VARIANTS.filter((v) => v !== 'text');
const toggles = reactive<Partial<Record<ButtonVariant, boolean>>>({});
const iconShape = ref<ButtonShape>('round');
const favorites = reactive<Partial<Record<IconButtonVariant, boolean>>>({ standard: true });
const bookmarked = ref(false);
const groupSize = ref<ButtonSize>('small');
const groupShape = ref<ButtonShape>('round');
const view = ref<string>('week');
const align = ref<string>('left');
const textStyles = ref<string[]>(['bold']);
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

    <section class="buttons">
      <div class="controls">
        <label>
          Shape
          <select v-model="buttonShape">
            <option value="round">Round</option>
            <option value="square">Square</option>
          </select>
        </label>
      </div>
      <div v-for="variant in BUTTON_VARIANTS" :key="variant" class="controls">
        <RioButton
          v-for="size in BUTTON_SIZES"
          :key="size"
          :variant="variant"
          :size="size"
          :shape="buttonShape"
        >
          <template v-if="size === 'small'" #icon>★</template>
          {{ variant }} {{ size }}
        </RioButton>
      </div>
      <div class="controls">
        <RioButton
          v-for="variant in TOGGLE_VARIANTS"
          :key="variant"
          v-model:selected="toggles[variant]"
          toggle
          :variant="variant"
          :shape="buttonShape"
        >
          {{ variant }} toggle: {{ toggles[variant] ? 'on' : 'off' }}
        </RioButton>
      </div>
      <div class="controls">
        <RioButton disabled>Disabled</RioButton>
        <RioButton variant="outlined" disabled>Disabled outlined</RioButton>
        <RioButton soft-disabled>Soft-disabled (Tab to it)</RioButton>
        <div v-ripple class="demo-card rio-state-layer">Any element can ripple</div>
      </div>
    </section>

    <section class="buttons">
      <div class="controls">
        <label>
          Shape
          <select v-model="iconShape">
            <option value="round">Round</option>
            <option value="square">Square</option>
          </select>
        </label>
      </div>
      <div v-for="variant in ICON_BUTTON_VARIANTS" :key="variant" class="controls">
        <code class="row-label">{{ variant }}</code>
        <RioIconButton
          v-for="size in BUTTON_SIZES"
          :key="size"
          :label="`Search (${variant} ${size})`"
          :variant="variant"
          :size="size"
          :shape="iconShape"
        >
          <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
        </RioIconButton>
      </div>
      <div v-for="size in ['small', 'medium'] as const" :key="size" class="controls">
        <code class="row-label">{{ size }} widths</code>
        <RioIconButton
          v-for="width in ICON_BUTTON_WIDTHS"
          :key="width"
          :label="`Search (${width})`"
          :size="size"
          :width="width"
          :shape="iconShape"
        >
          <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
        </RioIconButton>
      </div>
      <div class="controls">
        <code class="row-label">toggles</code>
        <RioIconButton
          v-for="variant in ICON_BUTTON_VARIANTS"
          :key="variant"
          v-model:selected="favorites[variant]"
          toggle
          :label="`Add to favorites (${variant})`"
          :variant="variant"
          :shape="iconShape"
        >
          <svg viewBox="0 0 24 24"><path :d="mdiHeartOutline" fill="currentColor" /></svg>
          <template #selected-icon>
            <svg viewBox="0 0 24 24"><path :d="mdiHeart" fill="currentColor" /></svg>
          </template>
        </RioIconButton>
        <RioIconButton
          v-model:selected="bookmarked"
          toggle
          label="Bookmark"
          variant="tonal"
          size="medium"
          width="wide"
          :shape="iconShape"
        >
          <svg viewBox="0 0 24 24"><path :d="mdiBookmarkOutline" fill="currentColor" /></svg>
          <template #selected-icon>
            <svg viewBox="0 0 24 24"><path :d="mdiBookmark" fill="currentColor" /></svg>
          </template>
        </RioIconButton>
      </div>
      <div class="controls">
        <code class="row-label">disabled</code>
        <RioIconButton
          v-for="variant in ICON_BUTTON_VARIANTS"
          :key="variant"
          :label="`Search (${variant}, disabled)`"
          :variant="variant"
          disabled
        >
          <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
        </RioIconButton>
        <RioIconButton label="Search (soft-disabled)" soft-disabled>
          <svg viewBox="0 0 24 24"><path :d="mdiMagnify" fill="currentColor" /></svg>
        </RioIconButton>
      </div>
    </section>

    <section class="buttons">
      <div class="controls">
        <label>
          Size
          <select v-model="groupSize">
            <option v-for="size in BUTTON_SIZES" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
        <label>
          Shape
          <select v-model="groupShape">
            <option value="round">Round</option>
            <option value="square">Square</option>
          </select>
        </label>
      </div>
      <div class="controls">
        <code class="row-label">standard</code>
        <RioButtonGroup :size="groupSize" :shape="groupShape">
          <RioIconButton label="Previous" variant="tonal">
            <svg viewBox="0 0 24 24"><path :d="mdiSkipPrevious" fill="currentColor" /></svg>
          </RioIconButton>
          <RioIconButton label="Pause" width="wide">
            <svg viewBox="0 0 24 24"><path :d="mdiPause" fill="currentColor" /></svg>
          </RioIconButton>
          <RioIconButton label="Next" variant="tonal">
            <svg viewBox="0 0 24 24"><path :d="mdiSkipNext" fill="currentColor" /></svg>
          </RioIconButton>
        </RioButtonGroup>
      </div>
      <div class="controls">
        <code class="row-label">standard, labels</code>
        <RioButtonGroup :size="groupSize" :shape="groupShape">
          <RioButton variant="outlined">Cancel</RioButton>
          <RioButton variant="tonal">Save draft</RioButton>
          <RioButton>Send</RioButton>
        </RioButtonGroup>
      </div>
      <div class="controls">
        <code class="row-label">standard, multiple</code>
        <RioButtonGroup
          v-model="textStyles"
          :size="groupSize"
          :shape="groupShape"
          selection="multiple"
        >
          <RioIconButton label="Bold" value="bold" variant="tonal">
            <svg viewBox="0 0 24 24"><path :d="mdiFormatBold" fill="currentColor" /></svg>
          </RioIconButton>
          <RioIconButton label="Italic" value="italic" variant="tonal">
            <svg viewBox="0 0 24 24"><path :d="mdiFormatItalic" fill="currentColor" /></svg>
          </RioIconButton>
          <RioIconButton label="Underline" value="underline" variant="tonal">
            <svg viewBox="0 0 24 24"><path :d="mdiFormatUnderline" fill="currentColor" /></svg>
          </RioIconButton>
        </RioButtonGroup>
        <code>{{ textStyles }}</code>
      </div>
      <div class="group-demo">
        <code class="row-label">connected, single, required</code>
        <RioButtonGroup
          v-model="view"
          variant="connected"
          :size="groupSize"
          :shape="groupShape"
          selection="single"
          required
        >
          <RioButton value="day">Day</RioButton>
          <RioButton value="week">Week</RioButton>
          <RioButton value="month">Month</RioButton>
          <RioButton value="year">Year</RioButton>
        </RioButtonGroup>
      </div>
      <div class="group-demo">
        <code class="row-label">connected, icons</code>
        <RioButtonGroup
          v-model="align"
          variant="connected"
          :size="groupSize"
          :shape="groupShape"
          selection="single"
        >
          <RioIconButton label="Align left" value="left" variant="tonal">
            <svg viewBox="0 0 24 24"><path :d="mdiFormatAlignLeft" fill="currentColor" /></svg>
          </RioIconButton>
          <RioIconButton label="Align center" value="center" variant="tonal">
            <svg viewBox="0 0 24 24"><path :d="mdiFormatAlignCenter" fill="currentColor" /></svg>
          </RioIconButton>
          <RioIconButton label="Align right" value="right" variant="tonal">
            <svg viewBox="0 0 24 24"><path :d="mdiFormatAlignRight" fill="currentColor" /></svg>
          </RioIconButton>
        </RioButtonGroup>
      </div>
    </section>

    <section class="switches">
      <label class="switch-row">
        <RioSwitch v-model:selected="switches.plain" />
        Plain: {{ switches.plain ? 'on' : 'off' }}
      </label>
      <label class="switch-row">
        <RioSwitch v-model:selected="switches.selectedIcon">
          <template #selected-icon>
            <svg viewBox="0 0 24 24"><path :d="mdiCheck" fill="currentColor" /></svg>
          </template>
        </RioSwitch>
        Icon when on
      </label>
      <label class="switch-row">
        <RioSwitch v-model:selected="switches.bothIcons">
          <template #selected-icon>
            <svg viewBox="0 0 24 24"><path :d="mdiCheck" fill="currentColor" /></svg>
          </template>
          <template #unselected-icon>
            <svg viewBox="0 0 24 24"><path :d="mdiClose" fill="currentColor" /></svg>
          </template>
        </RioSwitch>
        Icons on and off
      </label>
      <label class="switch-row"><RioSwitch disabled /> Disabled, off</label>
      <label class="switch-row"><RioSwitch disabled selected /> Disabled, on</label>
      <label class="switch-row"><RioSwitch soft-disabled /> Soft-disabled (Tab to it)</label>
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

.switches {
  display: grid;
  justify-items: start;
  gap: 12px;
}

.switch-row {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  font: var(--rio-typescale-body-large);
  letter-spacing: var(--rio-typescale-body-large-tracking);
}

.buttons {
  display: grid;
  gap: 16px;
}

.group-demo {
  display: grid;
  gap: 8px;
  max-inline-size: 480px;
}

.row-label {
  inline-size: 7rem;
  font-size: 12px;
  color: var(--rio-color-on-surface-variant);
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
