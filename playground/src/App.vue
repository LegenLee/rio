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
  mdiChevronDown,
  mdiClockOutline,
  mdiClose,
  mdiContentCopy,
  mdiContentCut,
  mdiContentPaste,
  mdiDotsVertical,
  mdiFormatAlignCenter,
  mdiFormatAlignLeft,
  mdiFormatAlignRight,
  mdiFormatBold,
  mdiFormatItalic,
  mdiFormatUnderline,
  mdiHeart,
  mdiHeartOutline,
  mdiMagnify,
  mdiMenuRight,
  mdiPause,
  mdiRestore,
  mdiShareVariant,
  mdiSkipNext,
  mdiSkipPrevious,
} from '@mdi/js';
import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  ICON_BUTTON_VARIANTS,
  ICON_BUTTON_WIDTHS,
  SPLIT_BUTTON_VARIANTS,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
  type IconButtonVariant,
  type MenuAnchorPoint,
} from '@rio-m3e/core';
import {
  RioButton,
  RioButtonGroup,
  RioCheckbox,
  RioDialog,
  RioIconButton,
  RioMenu,
  RioMenuDivider,
  RioMenuGroup,
  RioMenuItem,
  RioRadio,
  RioRadioGroup,
  RioSplitButton,
  RioSubMenu,
  RioSwitch,
  RioTextField,
  RioTooltip,
  vRipple,
} from '@rio-m3e/vue';
import { computed, reactive, ref, useTemplateRef, watchEffect } from 'vue';

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
const splitSize = ref<ButtonSize>('small');
const splitOpen = reactive<Record<string, boolean>>({});
const moved = ref(false);
const menus = reactive({
  edit: false,
  more: false,
  sort: false,
  filters: false,
  split: false,
  context: false,
  long: false,
  view: false,
});
const viewButton = useTemplateRef('viewButton');
const persistentTip = ref(false);
const dialogs = reactive({ discard: false, reset: false, ringtone: false, rename: false });
const lastDialog = ref('');
const RINGTONES = [
  'None',
  'Callisto',
  'Ganymede',
  'Luna',
  'Oberon',
  'Phobos',
  'Dione',
  'Europa',
  'Io',
  'Rhea',
  'Titan',
  'Triton',
  'Umbriel',
  'Miranda',
  'Ariel',
  'Charon',
];
const ringtone = ref<string | number | undefined>('Callisto');
const TOPPINGS = ['Cheese', 'Olives', 'Basil'] as const;
const toppings = reactive<Record<(typeof TOPPINGS)[number], boolean>>({
  Cheese: true,
  Olives: false,
  Basil: true,
});
const allToppings = computed(() => TOPPINGS.every((name) => toppings[name]));
const someToppings = computed(() => TOPPINGS.some((name) => toppings[name]));
const setToppings = (next: boolean) => TOPPINGS.forEach((name) => (toppings[name] = next));
const terms = ref(false);
const SIZES = ['S', 'M', 'L', 'XL'];
const size = ref<string | number | undefined>('M');
const fields = reactive({
  name: '',
  email: '',
  search: '',
  amount: '',
  code: '',
  notes: '',
  bio: '',
});
const albumName = ref('Summer');
const toolbar = [
  { action: 'Cut', icon: mdiContentCut },
  { action: 'Copy', icon: mdiContentCopy },
  { action: 'Paste', icon: mdiContentPaste },
  { action: 'Share', icon: mdiShareVariant },
];
const layout = ref<string | number | undefined>('grid');
const sortBy = ref<string | number | undefined>('date');
const filters = ref<(string | number)[] | string | number | undefined>(['photos']);
const lastAction = ref('');
const contextPoint = ref<MenuAnchorPoint | null>(null);
const editButton = useTemplateRef('editButton');
const moreButton = useTemplateRef('moreButton');
const sortButton = useTemplateRef('sortButton');
const filtersButton = useTemplateRef('filtersButton');
const longButton = useTemplateRef('longButton');
const saveSplit = useTemplateRef('saveSplit');
const openContext = (event: MouseEvent) => {
  contextPoint.value = {
    x: event.clientX,
    y: event.clientY,
    element: event.currentTarget as Element,
  };
  menus.context = true;
};

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

    <section class="buttons">
      <div class="controls">
        <label>
          Size
          <select v-model="splitSize">
            <option v-for="size in BUTTON_SIZES" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
      </div>
      <div class="controls">
        <code class="row-label">split</code>
        <RioSplitButton
          v-for="variant in SPLIT_BUTTON_VARIANTS"
          :key="variant"
          v-model:open="splitOpen[variant]"
          :variant="variant"
          :size="splitSize"
          menu-label="More watch options"
        >
          <template #icon>
            <svg viewBox="0 0 24 24"><path :d="mdiClockOutline" fill="currentColor" /></svg>
          </template>
          Watch later
          <template #menu-icon>
            <svg viewBox="0 0 24 24"><path :d="mdiChevronDown" fill="currentColor" /></svg>
          </template>
        </RioSplitButton>
      </div>
      <div class="controls">
        <code class="row-label">split, sizes</code>
        <RioSplitButton
          v-for="size in BUTTON_SIZES"
          :key="size"
          v-model:open="splitOpen[size]"
          variant="tonal"
          :size="size"
          menu-label="More options"
        >
          Label
          <template #menu-icon>
            <svg viewBox="0 0 24 24"><path :d="mdiChevronDown" fill="currentColor" /></svg>
          </template>
        </RioSplitButton>
      </div>
      <div class="controls">
        <code class="row-label">split, disabled</code>
        <RioSplitButton menu-label="More options" disabled>
          Disabled
          <template #menu-icon>
            <svg viewBox="0 0 24 24"><path :d="mdiChevronDown" fill="currentColor" /></svg>
          </template>
        </RioSplitButton>
        <code>{{ splitOpen }}</code>
      </div>
    </section>

    <section class="buttons menus">
      <div class="controls">
        <code class="row-label">menu</code>
        <RioButton
          ref="editButton"
          variant="tonal"
          aria-haspopup="menu"
          :aria-expanded="menus.edit"
          @click="menus.edit = !menus.edit"
        >
          Edit
        </RioButton>
        <RioMenu v-model:open="menus.edit" :anchor="editButton" label="Edit">
          <RioMenuItem @click="lastAction = 'cut'">
            <template #icon
              ><svg viewBox="0 0 24 24"><path :d="mdiContentCut" fill="currentColor" /></svg
            ></template>
            Cut
            <template #trailing-text>Ctrl+X</template>
          </RioMenuItem>
          <RioMenuItem @click="lastAction = 'copy'">
            <template #icon
              ><svg viewBox="0 0 24 24"><path :d="mdiContentCopy" fill="currentColor" /></svg
            ></template>
            Copy
            <template #trailing-text>Ctrl+C</template>
          </RioMenuItem>
          <RioMenuItem disabled>
            <template #icon
              ><svg viewBox="0 0 24 24"><path :d="mdiContentPaste" fill="currentColor" /></svg
            ></template>
            Paste
            <template #trailing-text>Ctrl+V</template>
          </RioMenuItem>
          <RioMenuDivider />
          <RioMenuGroup label="Share">
            <RioMenuItem @click="lastAction = 'email'">Email</RioMenuItem>
            <RioMenuItem @click="lastAction = 'link'">
              Copy link
              <template #supporting-text>Anyone with the link can view</template>
            </RioMenuItem>
          </RioMenuGroup>
        </RioMenu>

        <RioIconButton
          ref="moreButton"
          label="More"
          aria-haspopup="menu"
          :aria-expanded="menus.more"
          @click="menus.more = !menus.more"
        >
          <svg viewBox="0 0 24 24"><path :d="mdiDotsVertical" fill="currentColor" /></svg>
        </RioIconButton>
        <RioMenu
          v-model:open="menus.more"
          :anchor="moreButton"
          variant="vibrant"
          align="end"
          label="More"
        >
          <RioMenuItem @click="lastAction = 'rename'">Rename</RioMenuItem>
          <RioMenuItem @click="lastAction = 'duplicate'">Duplicate</RioMenuItem>
          <RioMenuItem @click="lastAction = 'delete'">Delete</RioMenuItem>
        </RioMenu>

        <RioButton
          ref="sortButton"
          variant="outlined"
          aria-haspopup="menu"
          :aria-expanded="menus.sort"
          @click="menus.sort = !menus.sort"
        >
          Sort
        </RioButton>
        <RioMenu
          v-model:open="menus.sort"
          v-model="sortBy"
          :anchor="sortButton"
          selection="single"
          label="Sort by"
        >
          <RioMenuItem v-for="by in ['name', 'date', 'size']" :key="by" :value="by">
            <template #icon="{ selected }">
              <svg v-if="selected" viewBox="0 0 24 24">
                <path :d="mdiCheck" fill="currentColor" />
              </svg>
            </template>
            {{ by }}
          </RioMenuItem>
        </RioMenu>

        <RioButton
          ref="filtersButton"
          variant="outlined"
          aria-haspopup="menu"
          :aria-expanded="menus.filters"
          @click="menus.filters = !menus.filters"
        >
          Filters
        </RioButton>
        <RioMenu
          v-model:open="menus.filters"
          v-model="filters"
          :anchor="filtersButton"
          selection="multiple"
          label="Filters"
        >
          <RioMenuItem v-for="kind in ['photos', 'videos', 'documents']" :key="kind" :value="kind">
            <template #icon="{ selected }">
              <svg v-if="selected" viewBox="0 0 24 24">
                <path :d="mdiCheck" fill="currentColor" />
              </svg>
            </template>
            {{ kind }}
          </RioMenuItem>
        </RioMenu>

        <RioSplitButton ref="saveSplit" v-model:open="menus.split" menu-label="More save options">
          Save
          <template #menu-icon
            ><svg viewBox="0 0 24 24"><path :d="mdiChevronDown" fill="currentColor" /></svg
          ></template>
        </RioSplitButton>
        <RioMenu
          v-model:open="menus.split"
          :anchor="saveSplit?.trailing"
          :offset="4"
          align="end"
          label="More save options"
        >
          <RioMenuItem @click="lastAction = 'save as'">Save as…</RioMenuItem>
          <RioMenuItem @click="lastAction = 'save copy'">Save a copy</RioMenuItem>
        </RioMenu>

        <RioButton
          ref="longButton"
          variant="text"
          aria-haspopup="menu"
          :aria-expanded="menus.long"
          @click="menus.long = !menus.long"
        >
          Long
        </RioButton>
        <RioMenu v-model:open="menus.long" :anchor="longButton" label="Long">
          <RioMenuItem v-for="n in 30" :key="n">Item {{ n }}</RioMenuItem>
        </RioMenu>

        <RioButton
          ref="viewButton"
          variant="tonal"
          aria-haspopup="menu"
          :aria-expanded="menus.view"
          @click="menus.view = !menus.view"
        >
          Submenus
        </RioButton>
        <RioMenu v-model:open="menus.view" :anchor="viewButton" label="View">
          <RioMenuItem @click="lastAction = 'refresh'">Refresh</RioMenuItem>
          <RioSubMenu v-model="layout" label="Layout" selection="single">
            <template #trailing-icon
              ><svg viewBox="0 0 24 24"><path :d="mdiMenuRight" fill="currentColor" /></svg
            ></template>
            <RioMenuItem v-for="kind in ['grid', 'list', 'columns']" :key="kind" :value="kind">
              <template #icon="{ selected }">
                <svg v-if="selected" viewBox="0 0 24 24">
                  <path :d="mdiCheck" fill="currentColor" />
                </svg>
              </template>
              {{ kind }}
            </RioMenuItem>
          </RioSubMenu>
          <RioSubMenu label="Share">
            <template #icon
              ><svg viewBox="0 0 24 24"><path :d="mdiShareVariant" fill="currentColor" /></svg
            ></template>
            <template #trailing-icon
              ><svg viewBox="0 0 24 24"><path :d="mdiMenuRight" fill="currentColor" /></svg
            ></template>
            <RioMenuItem @click="lastAction = 'email'">Email</RioMenuItem>
            <RioMenuItem @click="lastAction = 'link'">Copy link</RioMenuItem>
            <RioSubMenu label="More apps">
              <template #trailing-icon
                ><svg viewBox="0 0 24 24"><path :d="mdiMenuRight" fill="currentColor" /></svg
              ></template>
              <RioMenuItem @click="lastAction = 'chat'">Chat</RioMenuItem>
              <RioMenuItem @click="lastAction = 'notes'">Notes</RioMenuItem>
            </RioSubMenu>
          </RioSubMenu>
          <RioSubMenu label="Export" disabled>
            <template #trailing-icon
              ><svg viewBox="0 0 24 24"><path :d="mdiMenuRight" fill="currentColor" /></svg
            ></template>
            <RioMenuItem>PDF</RioMenuItem>
          </RioSubMenu>
          <RioMenuDivider />
          <RioMenuItem @click="lastAction = 'settings'">Settings</RioMenuItem>
        </RioMenu>
      </div>
      <div class="controls">
        <div class="context-area" @contextmenu.prevent="openContext">Right-click here</div>
        <RioMenu v-model:open="menus.context" :anchor="contextPoint" label="Context">
          <RioMenuItem @click="lastAction = 'open'">Open</RioMenuItem>
          <RioMenuItem @click="lastAction = 'download'">Download</RioMenuItem>
          <RioSubMenu label="Open with">
            <template #trailing-icon
              ><svg viewBox="0 0 24 24"><path :d="mdiMenuRight" fill="currentColor" /></svg
            ></template>
            <RioMenuItem @click="lastAction = 'viewer'">Viewer</RioMenuItem>
            <RioMenuItem @click="lastAction = 'editor'">Editor</RioMenuItem>
          </RioSubMenu>
        </RioMenu>
        <code
          >sort={{ sortBy }} filters={{ filters }} layout={{ layout }} action={{ lastAction }}</code
        >
      </div>
    </section>

    <section class="buttons tooltips">
      <div class="controls">
        <code class="row-label">plain</code>
        <RioTooltip v-for="{ action, icon } in toolbar" :key="action" :text="action">
          <RioIconButton :label="action" @click="lastAction = action.toLowerCase()">
            <svg viewBox="0 0 24 24"><path :d="icon" fill="currentColor" /></svg>
          </RioIconButton>
        </RioTooltip>
        <span
          >Text with a
          <RioTooltip text="Shown 8px off text, which has no visible edge" :offset="8">
            <abbr tabindex="0">tooltip</abbr>
          </RioTooltip></span
        >
      </div>
      <div class="controls">
        <code class="row-label">rich</code>
        <RioTooltip variant="rich" subhead="Storage" text="You have 2 GB of 15 GB left.">
          <RioButton variant="outlined">Storage</RioButton>
        </RioTooltip>
        <RioTooltip variant="rich" subhead="Backups">
          <RioButton variant="outlined">Backups</RioButton>
          <template #content>Photos back up every night while your phone charges.</template>
          <template #actions>
            <RioButton variant="text" @click="lastAction = 'learn more'">Learn more</RioButton>
            <RioButton variant="text" @click="lastAction = 'settings'">Settings</RioButton>
          </template>
        </RioTooltip>
        <RioTooltip
          v-model:open="persistentTip"
          variant="rich"
          persistent
          subhead="New: shared albums"
          text="Invite people to add their photos to an album."
        >
          <RioButton variant="tonal">Albums</RioButton>
          <template #actions>
            <RioButton variant="text" @click="persistentTip = false">Got it</RioButton>
          </template>
        </RioTooltip>
        <code>persistent={{ persistentTip }}</code>
      </div>
    </section>

    <section class="buttons dialogs">
      <div class="controls">
        <RioButton variant="tonal" @click="dialogs.discard = true">Discard draft</RioButton>
        <RioButton variant="tonal" @click="dialogs.reset = true">Reset settings</RioButton>
        <RioButton variant="tonal" @click="dialogs.ringtone = true">Ringtone</RioButton>
        <RioButton variant="tonal" @click="dialogs.rename = true">Rename</RioButton>
        <code>dialog={{ lastDialog }} ringtone={{ ringtone }}</code>
      </div>
      <RioDialog
        v-model:open="dialogs.discard"
        headline="Discard draft?"
        @cancel="(event) => (lastDialog = `cancel: ${event.reason}`)"
      >
        Your draft and its two attachments will be lost.
        <template #actions>
          <RioButton variant="text" @click="dialogs.discard = false">Cancel</RioButton>
          <RioButton variant="text" @click="((dialogs.discard = false), (lastDialog = 'discarded'))"
            >Discard</RioButton
          >
        </template>
      </RioDialog>
      <RioDialog v-model:open="dialogs.reset" headline="Reset settings?">
        <template #icon>
          <svg viewBox="0 0 24 24"><path :d="mdiRestore" fill="currentColor" /></svg>
        </template>
        This will reset your app preferences back to their default settings. The following accounts
        will also be signed out:
        <template #actions>
          <RioButton variant="text" @click="dialogs.reset = false">Cancel</RioButton>
          <RioButton variant="text" @click="((dialogs.reset = false), (lastDialog = 'reset'))"
            >Reset</RioButton
          >
        </template>
      </RioDialog>
      <RioDialog v-model:open="dialogs.ringtone" role="dialog" headline="Phone ringtone">
        <RioRadioGroup v-model="ringtone" label="Ringtone">
          <label v-for="tone in RINGTONES" :key="tone" class="dialog-option">
            <RioRadio :value="tone" />{{ tone }}
          </label>
        </RioRadioGroup>
        <template #actions>
          <RioButton variant="text" @click="dialogs.ringtone = false">Cancel</RioButton>
          <RioButton variant="text" @click="dialogs.ringtone = false">OK</RioButton>
        </template>
      </RioDialog>
      <RioDialog
        v-model:open="dialogs.rename"
        role="dialog"
        headline="Rename album"
        @cancel="
          (event) => {
            if (albumName !== 'Summer') {
              event.preventDefault();
              lastDialog = `kept open: ${event.reason}`;
            }
          }
        "
      >
        <p>Escape and the scrim keep the dialog open once the name changes.</p>
        <input v-model="albumName" aria-label="Album name" />
        <template #actions>
          <RioButton variant="text" @click="((dialogs.rename = false), (albumName = 'Summer'))"
            >Cancel</RioButton
          >
          <RioButton variant="text" @click="((dialogs.rename = false), (lastDialog = albumName))"
            >Save</RioButton
          >
        </template>
      </RioDialog>
    </section>

    <section class="text-fields">
      <div class="controls">
        <RioTextField v-model="fields.name" label="Name" supporting-text="As on your card" />
        <RioTextField
          v-model="fields.email"
          variant="outlined"
          label="Email"
          type="email"
          required
        />
        <RioTextField v-model="fields.search" label="Search" placeholder="Songs, albums">
          <template #leading-icon>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path :d="mdiMagnify" fill="currentColor" />
            </svg>
          </template>
          <template v-if="fields.search" #trailing-icon>
            <RioIconButton label="Clear" variant="standard" @click="fields.search = ''">
              <svg viewBox="0 0 24 24"><path :d="mdiClose" fill="currentColor" /></svg>
            </RioIconButton>
          </template>
        </RioTextField>
      </div>
      <div class="controls">
        <RioTextField
          v-model="fields.amount"
          variant="outlined"
          label="Amount"
          prefix="$"
          suffix="USD"
        />
        <RioTextField
          v-model="fields.code"
          label="Code"
          :maxlength="6"
          :error="fields.code.length > 0 && fields.code.length < 6"
          error-text="Six characters"
          supporting-text="From your email"
        />
        <RioTextField variant="outlined" label="Disabled" model-value="Can't change" disabled />
      </div>
      <div class="controls">
        <RioTextField v-model="fields.notes" label="Notes" multiline :rows="3" />
        <RioTextField
          v-model="fields.bio"
          variant="outlined"
          label="Bio"
          multiline
          :maxlength="120"
        />
      </div>
      <code>{{ fields }}</code>
    </section>

    <section class="selection">
      <div class="selection-column">
        <label class="selection-row">
          <RioCheckbox
            :selected="allToppings"
            :indeterminate="someToppings && !allToppings"
            @update:selected="setToppings"
          />All toppings
        </label>
        <label v-for="name in TOPPINGS" :key="name" class="selection-row selection-child">
          <RioCheckbox v-model:selected="toppings[name]" />{{ name }}
        </label>
      </div>
      <div class="selection-column">
        <label class="selection-row">
          <RioCheckbox v-model:selected="terms" :error="!terms" />Accept the terms
        </label>
        <label class="selection-row"><RioCheckbox disabled />Disabled</label>
        <label class="selection-row"><RioCheckbox selected disabled />Disabled, checked</label>
        <label class="selection-row"><RioCheckbox soft-disabled />Soft-disabled</label>
      </div>
      <RioRadioGroup v-model="size" label="Size">
        <label v-for="each in SIZES" :key="each" class="selection-row">
          <RioRadio :value="each" :disabled="each === 'XL'" />{{ each }}
        </label>
      </RioRadioGroup>
      <code>toppings={{ toppings }} terms={{ terms }} size={{ size }}</code>
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

.dialog-option {
  display: flex;
  align-items: center;
  margin-inline-start: -14px;
}

.selection {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 32px;
}

.selection-column {
  display: flex;
  flex-direction: column;
}

.selection-row {
  display: inline-flex;
  align-items: center;
}

.selection-child {
  padding-inline-start: 32px;
}

.context-area {
  display: grid;
  place-items: center;
  inline-size: 240px;
  block-size: 96px;
  border: 1px dashed var(--rio-color-outline);
  border-radius: 12px;
  user-select: none;
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
