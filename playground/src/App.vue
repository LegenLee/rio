<script setup lang="ts">
import {
  COLOR_ROLES,
  ELEVATION_LEVELS,
  colorVar,
  elevationVar,
  motionVar,
  SHAPE_CORNERS,
  TYPE_STYLES,
  shapeVar,
  typescaleVar,
  type MotionToken,
} from '@rio-m3e/tokens';
import {
  mdiArrowLeft,
  mdiBookmark,
  mdiBookmarkOutline,
  mdiCalendar,
  mdiCheck,
  mdiChevronRight,
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
  mdiMenu,
  mdiOpenInNew,
  mdiPause,
  mdiRestore,
  mdiShareVariant,
  mdiSkipNext,
  mdiSkipPrevious,
  mdiVolumeHigh,
  mdiVolumeOff,
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
  type SelectSelected,
} from '@rio-m3e/core';
import {
  RioAppBar,
  RioButton,
  RioButtonGroup,
  RioAssistChip,
  RioCheckbox,
  RioChipSet,
  RioCircularProgress,
  RioDatePicker,
  RioDatePickerDialog,
  RioDateRangePickerDialog,
  RioDialog,
  RioFilterChip,
  RioIcon,
  RioIconButton,
  RioInputChip,
  RioLinearProgress,
  RioList,
  RioListItem,
  RioLoadingIndicator,
  RioMenu,
  RioMenuDivider,
  RioMenuGroup,
  RioMenuItem,
  RioRadio,
  RioRadioGroup,
  RioRangeSlider,
  RioScrollField,
  RioSelect,
  RioSelectOption,
  RioSlider,
  RioSplitButton,
  RioSuggestionChip,
  RioSubMenu,
  RioSwitch,
  RioTextField,
  RioTimeInput,
  RioTimePickerDialog,
  RioTimeScroll,
  RioToolbar,
  RioTooltip,
  vRipple,
} from '@rio-m3e/vue';
import { computed, reactive, ref, useTemplateRef } from 'vue';
import { theme } from './theme';

// Right to left, the components lay out the other way, and their arrows point the other way.
const direction = ref<'ltr' | 'rtl'>('ltr');
const switches = reactive({ plain: false, selectedIcon: true, bothIcons: false });
const progress = ref(0.4);
const chips = reactive({
  filters: ['wifi'] as (string | number)[],
  people: ['Ada', 'Grace', 'Alan'],
  menuOpen: false,
  size: undefined as string | undefined,
  last: '',
});
const sizeChip = useTemplateRef('sizeChip');
const scrollFields = reactive({
  minutes: 15,
  year: 2026,
  unit: 'kg',
  editing: false,
  invalid: false,
});
const sliders = reactive({
  plain: 40,
  stops: 60,
  centered: -20,
  range: [20, 70] as [number, number],
  volume: 0,
  vertical: 30,
});
const buttonShape = ref<ButtonShape>('round');
// Text buttons can't toggle.
const TOGGLE_VARIANTS = BUTTON_VARIANTS.filter((v) => v !== 'text');
// Bound rather than written in the template: vue-tsc 3.3.14 misreads a `//` in a component's static
// attribute and reports errors further down the template (vuejs/language-tools#6240).
const M3_URL = 'https://m3.material.io';
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
const dialogs = reactive({
  discard: false,
  reset: false,
  ringtone: false,
  rename: false,
  event: false,
  discardEvent: false,
  contact: false,
});
const lastDialog = ref('');
const eventDraft = reactive({ title: '', place: '' });
const contact = reactive({ name: 'Ann Lee', email: 'ann@example.com' });
const contactDraft = reactive({ name: '', email: '' });
const openEvent = () => {
  Object.assign(eventDraft, { title: '', place: '' });
  dialogs.event = true;
};
const openContact = () => {
  Object.assign(contactDraft, contact);
  dialogs.contact = true;
};
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
const selects = reactive<{ size?: SelectSelected; font: SelectSelected; toppings: SelectSelected }>(
  {
    font: 'roboto',
    toppings: ['cheese', 'basil'],
  },
);
const PIZZA_TOPPINGS = { cheese: 'Cheese', mushroom: 'Mushroom', olive: 'Olive', basil: 'Basil' };
const selectSent = ref('');
const dates = reactive<{
  docked?: string;
  modal?: string;
  korean?: string;
  dialog?: string;
  depart?: string;
  return?: string;
}>({
  korean: '2026-11-27',
});
const dateDialogOpen = ref(false);
const listPicks = ref<(string | number)[] | string | number | undefined>(['heart']);
const listOpened = ref('');
const dateRangeOpen = ref(false);
const times = reactive<{
  inline?: string;
  german?: string;
  scroll?: string;
  scrollGerman?: string;
  dialog?: string;
  horizontal?: string;
  scrollDialog?: string;
}>({
  inline: '07:30',
  german: '19:05',
  scroll: '07:00',
  horizontal: '14:00',
});
const timeDialogOpen = ref(false);
const timeHorizontalOpen = ref(false);
const timeScrollOpen = ref(false);
const submitSelects = (event: SubmitEvent) => {
  const data = new FormData(event.target as HTMLFormElement);
  selectSent.value = [...data].map(([key, value]) => `${key}=${String(value)}`).join(' ');
};
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
</script>

<template>
  <main :dir="direction">
    <!-- Fills as the window scrolls -->
    <RioAppBar headline="Rio Playground" class="playground-bar">
      <template #leading>
        <RioIconButton label="Menu" variant="standard">
          <RioIcon :icon="{ type: 'svg', path: mdiMenu }" />
        </RioIconButton>
      </template>
      <template #trailing>
        <RioIconButton label="Search" variant="standard">
          <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
        </RioIconButton>
      </template>
    </RioAppBar>

    <section class="controls">
      <label>Source color <input v-model="theme.sourceColor" type="color" /></label>
      <RioSelect v-model="theme.variant" label="Variant">
        <RioSelectOption value="tonal-spot">Tonal Spot</RioSelectOption>
        <RioSelectOption value="neutral">Neutral</RioSelectOption>
        <RioSelectOption value="vibrant">Vibrant</RioSelectOption>
        <RioSelectOption value="expressive">Expressive</RioSelectOption>
      </RioSelect>
      <div class="contrast">
        <label for="contrast">Contrast</label>
        <RioSlider
          id="contrast"
          v-model="theme.contrast"
          class="contrast-slider"
          :min="-1"
          :max="1"
          :step="0.5"
          centered
          stops
          value-indicator
        />
        <code>{{ theme.contrast }}</code>
      </div>
      <RioSelect v-model="theme.colorScheme" label="Mode">
        <RioSelectOption value="light dark">System</RioSelectOption>
        <RioSelectOption value="light">Light</RioSelectOption>
        <RioSelectOption value="dark">Dark</RioSelectOption>
      </RioSelect>
      <RioSelect v-model="direction" label="Direction">
        <RioSelectOption value="ltr">Left to right</RioSelectOption>
        <RioSelectOption value="rtl">Right to left</RioSelectOption>
      </RioSelect>
      <RioSelect v-model="theme.motion" label="Motion">
        <RioSelectOption value="expressive">Expressive</RioSelectOption>
        <RioSelectOption value="standard">Standard</RioSelectOption>
      </RioSelect>
    </section>

    <section class="motion">
      <RioButton variant="tonal" @click="moved = !moved">Move</RioButton>
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
        <RioSelect v-model="buttonShape" label="Shape">
          <RioSelectOption value="round">Round</RioSelectOption>
          <RioSelectOption value="square">Square</RioSelectOption>
        </RioSelect>
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
      <div class="controls">
        <RioButton :href="M3_URL" target="_blank" rel="noopener">
          <template #icon>
            <RioIcon :icon="{ type: 'svg', path: mdiOpenInNew }" />
          </template>
          Link (new tab)
        </RioButton>
        <RioButton :href="M3_URL" variant="outlined" disabled> Disabled link </RioButton>
        <RioButton :href="M3_URL" variant="outlined" soft-disabled>
          Soft-disabled link (Tab to it)
        </RioButton>
        <RioIconButton
          label="Material 3 (link)"
          :href="M3_URL"
          target="_blank"
          rel="noopener"
          variant="tonal"
        >
          <RioIcon :icon="{ type: 'svg', path: mdiOpenInNew }" />
        </RioIconButton>
      </div>
    </section>

    <section class="buttons">
      <div class="controls">
        <RioSelect v-model="iconShape" label="Shape">
          <RioSelectOption value="round">Round</RioSelectOption>
          <RioSelectOption value="square">Square</RioSelectOption>
        </RioSelect>
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
          <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
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
          <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
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
          <RioIcon :icon="{ type: 'svg', path: mdiHeartOutline }" />
          <template #selected-icon>
            <RioIcon :icon="{ type: 'svg', path: mdiHeart }" />
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
          <RioIcon :icon="{ type: 'svg', path: mdiBookmarkOutline }" />
          <template #selected-icon>
            <RioIcon :icon="{ type: 'svg', path: mdiBookmark }" />
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
          <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
        </RioIconButton>
        <RioIconButton label="Search (soft-disabled)" soft-disabled>
          <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
        </RioIconButton>
      </div>
    </section>

    <section class="buttons">
      <div class="controls">
        <RioSelect v-model="groupSize" label="Size">
          <RioSelectOption v-for="size in BUTTON_SIZES" :key="size" :value="size">{{
            size
          }}</RioSelectOption>
        </RioSelect>
        <RioSelect v-model="groupShape" label="Shape">
          <RioSelectOption value="round">Round</RioSelectOption>
          <RioSelectOption value="square">Square</RioSelectOption>
        </RioSelect>
      </div>
      <div class="controls">
        <code class="row-label">standard</code>
        <RioButtonGroup :size="groupSize" :shape="groupShape">
          <RioIconButton label="Previous" variant="tonal">
            <RioIcon :icon="{ type: 'svg', path: mdiSkipPrevious }" />
          </RioIconButton>
          <RioIconButton label="Pause" width="wide">
            <RioIcon :icon="{ type: 'svg', path: mdiPause }" />
          </RioIconButton>
          <RioIconButton label="Next" variant="tonal">
            <RioIcon :icon="{ type: 'svg', path: mdiSkipNext }" />
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
            <RioIcon :icon="{ type: 'svg', path: mdiFormatBold }" />
          </RioIconButton>
          <RioIconButton label="Italic" value="italic" variant="tonal">
            <RioIcon :icon="{ type: 'svg', path: mdiFormatItalic }" />
          </RioIconButton>
          <RioIconButton label="Underline" value="underline" variant="tonal">
            <RioIcon :icon="{ type: 'svg', path: mdiFormatUnderline }" />
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
            <RioIcon :icon="{ type: 'svg', path: mdiFormatAlignLeft }" />
          </RioIconButton>
          <RioIconButton label="Align center" value="center" variant="tonal">
            <RioIcon :icon="{ type: 'svg', path: mdiFormatAlignCenter }" />
          </RioIconButton>
          <RioIconButton label="Align right" value="right" variant="tonal">
            <RioIcon :icon="{ type: 'svg', path: mdiFormatAlignRight }" />
          </RioIconButton>
        </RioButtonGroup>
      </div>
    </section>

    <section class="buttons">
      <div class="controls">
        <RioSelect v-model="splitSize" label="Size">
          <RioSelectOption v-for="size in BUTTON_SIZES" :key="size" :value="size">{{
            size
          }}</RioSelectOption>
        </RioSelect>
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
            <RioIcon :icon="{ type: 'svg', path: mdiClockOutline }" />
          </template>
          Watch later
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
        </RioSplitButton>
      </div>
      <div class="controls">
        <code class="row-label">split, disabled</code>
        <RioSplitButton menu-label="More options" disabled> Disabled </RioSplitButton>
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
            <template #icon><RioIcon :icon="{ type: 'svg', path: mdiContentCut }" /></template>
            Cut
            <template #trailing-text>Ctrl+X</template>
          </RioMenuItem>
          <RioMenuItem @click="lastAction = 'copy'">
            <template #icon><RioIcon :icon="{ type: 'svg', path: mdiContentCopy }" /></template>
            Copy
            <template #trailing-text>Ctrl+C</template>
          </RioMenuItem>
          <RioMenuItem disabled>
            <template #icon><RioIcon :icon="{ type: 'svg', path: mdiContentPaste }" /></template>
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
          <RioIcon :icon="{ type: 'svg', path: mdiDotsVertical }" />
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
              <RioIcon v-if="selected" :icon="{ type: 'svg', path: mdiCheck }" />
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
              <RioIcon v-if="selected" :icon="{ type: 'svg', path: mdiCheck }" />
            </template>
            {{ kind }}
          </RioMenuItem>
        </RioMenu>

        <RioSplitButton ref="saveSplit" v-model:open="menus.split" menu-label="More save options">
          Save
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
            <RioMenuItem v-for="kind in ['grid', 'list', 'columns']" :key="kind" :value="kind">
              <template #icon="{ selected }">
                <RioIcon v-if="selected" :icon="{ type: 'svg', path: mdiCheck }" />
              </template>
              {{ kind }}
            </RioMenuItem>
          </RioSubMenu>
          <RioSubMenu label="Share">
            <template #icon><RioIcon :icon="{ type: 'svg', path: mdiShareVariant }" /></template>
            <RioMenuItem @click="lastAction = 'email'">Email</RioMenuItem>
            <RioMenuItem @click="lastAction = 'link'">Copy link</RioMenuItem>
            <RioSubMenu label="More apps">
              <RioMenuItem @click="lastAction = 'chat'">Chat</RioMenuItem>
              <RioMenuItem @click="lastAction = 'notes'">Notes</RioMenuItem>
            </RioSubMenu>
          </RioSubMenu>
          <RioSubMenu label="Export" disabled>
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
            <RioMenuItem @click="lastAction = 'viewer'">Viewer</RioMenuItem>
            <RioMenuItem @click="lastAction = 'editor'">Editor</RioMenuItem>
          </RioSubMenu>
        </RioMenu>
        <code
          >sort={{ sortBy }} filters={{ filters }} layout={{ layout }} action={{ lastAction }}</code
        >
      </div>
    </section>

    <section class="app-bars">
      <RioAppBar
        v-for="variant in ['medium-flexible', 'large-flexible'] as const"
        :key="variant"
        :variant="variant"
        headline="Trip to the coast"
        subtitle="4 photos"
        :heading-level="2"
        :scrolled="false"
      >
        <template #leading>
          <RioIconButton label="Back" variant="standard">
            <RioIcon :icon="{ type: 'svg', path: mdiArrowLeft }" />
          </RioIconButton>
        </template>
      </RioAppBar>
    </section>

    <section class="buttons toolbars">
      <div v-for="color in ['standard', 'vibrant'] as const" :key="color" class="controls">
        <code class="row-label">{{ color }}</code>
        <RioToolbar :aria-label="`Formatting, ${color}`" variant="floating" :color="color">
          <RioIconButton label="Bold" variant="tonal" toggle :selected="true">
            <RioIcon :icon="{ type: 'svg', path: mdiFormatBold }" />
          </RioIconButton>
          <RioIconButton label="Italic" variant="tonal" toggle>
            <RioIcon :icon="{ type: 'svg', path: mdiFormatItalic }" />
          </RioIconButton>
          <RioIconButton label="Underline" variant="standard">
            <RioIcon :icon="{ type: 'svg', path: mdiFormatUnderline }" />
          </RioIconButton>
        </RioToolbar>
        <RioToolbar
          :aria-label="`Alignment, ${color}`"
          variant="floating"
          orientation="vertical"
          :color="color"
        >
          <RioIconButton label="Left" variant="standard">
            <RioIcon :icon="{ type: 'svg', path: mdiFormatAlignLeft }" />
          </RioIconButton>
          <RioIconButton label="Center" variant="standard">
            <RioIcon :icon="{ type: 'svg', path: mdiFormatAlignCenter }" />
          </RioIconButton>
          <RioIconButton label="Right" variant="standard">
            <RioIcon :icon="{ type: 'svg', path: mdiFormatAlignRight }" />
          </RioIconButton>
        </RioToolbar>
      </div>
      <RioToolbar aria-label="Docked" style="inline-size: 100%">
        <RioIconButton label="Bold" variant="standard">
          <RioIcon :icon="{ type: 'svg', path: mdiFormatBold }" />
        </RioIconButton>
        <RioIconButton label="Italic" variant="standard">
          <RioIcon :icon="{ type: 'svg', path: mdiFormatItalic }" />
        </RioIconButton>
        <RioIconButton label="Underline">
          <RioIcon :icon="{ type: 'svg', path: mdiFormatUnderline }" />
        </RioIconButton>
      </RioToolbar>
    </section>

    <section class="buttons tooltips">
      <div class="controls">
        <code class="row-label">plain</code>
        <RioTooltip v-for="{ action, icon } in toolbar" :key="action" :text="action">
          <RioIconButton :label="action" @click="lastAction = action.toLowerCase()">
            <RioIcon :icon="{ type: 'svg', path: icon }" />
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
        <RioButton variant="tonal" @click="openEvent">New event (full-screen)</RioButton>
        <RioButton variant="tonal" @click="openContact">Edit contact (adaptive)</RioButton>
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
          <RioIcon :icon="{ type: 'svg', path: mdiRestore }" />
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
        <RioTextField v-model="albumName" label="Album name" />
        <template #actions>
          <RioButton variant="text" @click="((dialogs.rename = false), (albumName = 'Summer'))"
            >Cancel</RioButton
          >
          <RioButton variant="text" @click="((dialogs.rename = false), (lastDialog = albumName))"
            >Save</RioButton
          >
        </template>
      </RioDialog>
      <RioDialog
        v-model:open="dialogs.event"
        variant="full-screen"
        headline="New event"
        @cancel="
          (event) => {
            lastDialog = `cancel: ${event.reason}`;
            if (eventDraft.title || eventDraft.place) {
              event.preventDefault();
              dialogs.discardEvent = true;
            }
          }
        "
      >
        <div class="dialog-fields">
          <p>
            The close button, Escape, and the scrim ask to close; with something typed, a basic
            dialog asks first. Scroll down: the header fills.
          </p>
          <RioTextField v-model="eventDraft.title" label="Title" />
          <RioTextField v-model="eventDraft.place" label="Location" />
          <p v-for="guest in 20" :key="guest">Guest {{ guest }}</p>
        </div>
        <template #actions>
          <RioButton
            variant="text"
            @click="((dialogs.event = false), (lastDialog = `saved: ${eventDraft.title}`))"
            >Save</RioButton
          >
        </template>
        <RioDialog v-model:open="dialogs.discardEvent" headline="Discard event?">
          What you entered will be lost.
          <template #actions>
            <RioButton variant="text" @click="dialogs.discardEvent = false">Keep editing</RioButton>
            <RioButton
              variant="text"
              @click="((dialogs.discardEvent = false), (dialogs.event = false))"
              >Discard</RioButton
            >
          </template>
        </RioDialog>
      </RioDialog>
      <RioDialog
        v-model:open="dialogs.contact"
        variant="adaptive"
        headline="Edit contact"
        @cancel="(event) => (lastDialog = `cancel: ${event.reason}`)"
      >
        <div class="dialog-fields">
          <p>Full-screen below 600px, basic with Cancel from there up. Resize the window.</p>
          <RioTextField v-model="contactDraft.name" label="Name" />
          <RioTextField v-model="contactDraft.email" label="Email" type="email" />
        </div>
        <template #actions>
          <RioButton
            variant="text"
            @click="
              (Object.assign(contact, contactDraft),
              (dialogs.contact = false),
              (lastDialog = `saved: ${contact.name}`))
            "
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
            <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
          </template>
          <template v-if="fields.search" #trailing-icon>
            <RioIconButton label="Clear" variant="standard" @click="fields.search = ''">
              <RioIcon :icon="{ type: 'svg', path: mdiClose }" />
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

    <section class="text-fields">
      <form class="controls" @submit.prevent="submitSelects">
        <RioSelect v-model="selects.size" label="Size" name="size" required>
          <RioSelectOption value="s">Small</RioSelectOption>
          <RioSelectOption value="m">Medium</RioSelectOption>
          <RioSelectOption value="l" disabled>Large</RioSelectOption>
          <RioSelectOption value="xl">Extra large</RioSelectOption>
        </RioSelect>
        <RioSelect v-model="selects.font" variant="outlined" label="Font" name="font">
          <RioSelectOption value="roboto">Roboto</RioSelectOption>
          <RioSelectOption value="roboto-flex">Roboto Flex</RioSelectOption>
          <RioSelectOption value="roboto-serif">
            Roboto Serif
            <template #supporting-text>With serifs</template>
          </RioSelectOption>
        </RioSelect>
        <RioSelect
          v-model="selects.toppings"
          label="Toppings"
          name="toppings"
          multiple
          menu-variant="vibrant"
        >
          <RioSelectOption v-for="(name, value) in PIZZA_TOPPINGS" :key="value" :value="value">
            {{ name }}
            <template #icon="{ selected }">
              <RioIcon v-if="selected" :icon="{ type: 'svg', path: mdiCheck }" />
            </template>
          </RioSelectOption>
        </RioSelect>
        <RioSelect label="Disabled" model-value="a" disabled>
          <RioSelectOption value="a">Fixed</RioSelectOption>
        </RioSelect>
        <RioButton type="submit">Submit</RioButton>
        <RioButton type="reset" variant="text">Reset</RioButton>
      </form>
      <code>{{ selects }} {{ selectSent }}</code>
    </section>

    <section class="text-fields">
      <div class="controls">
        <RioDatePicker v-model="dates.docked" label="Departure" clearable min="2026-01-01">
        </RioDatePicker>
        <RioDatePicker v-model="dates.modal" variant="modal" label="Event date"> </RioDatePicker>
        <RioDatePicker v-model="dates.korean" label="출발일" locale="ko-KR"> </RioDatePicker>
        <RioButton variant="tonal" @click="dateDialogOpen = true">Due date</RioButton>
        <RioDatePickerDialog v-model="dates.dialog" v-model:open="dateDialogOpen" />
        <RioButton variant="tonal" @click="dateRangeOpen = true">Trip dates</RioButton>
        <RioDateRangePickerDialog
          v-model:start="dates.depart"
          v-model:end="dates.return"
          v-model:open="dateRangeOpen"
          clearable
          :messages="{ rangeTitle: 'Depart – Return dates' }"
        >
        </RioDateRangePickerDialog>
      </div>
      <code>{{ dates }}</code>
    </section>

    <section class="text-fields">
      <div class="controls">
        <RioTimeInput v-model="times.inline" />
        <RioTimeInput v-model="times.german" locale="de-DE" />
        <RioButton variant="tonal" @click="timeDialogOpen = true">Alarm</RioButton>
        <RioTimePickerDialog v-model="times.dialog" v-model:open="timeDialogOpen">
        </RioTimePickerDialog>
        <RioButton variant="tonal" @click="timeHorizontalOpen = true">Start, 24 hours</RioButton>
        <RioTimePickerDialog
          v-model="times.horizontal"
          v-model:open="timeHorizontalOpen"
          :hour-cycle="24"
          layout="horizontal"
        >
        </RioTimePickerDialog>
        <RioButton variant="tonal" @click="timeScrollOpen = true">Reminder, scroll</RioButton>
        <RioTimePickerDialog
          v-model="times.scrollDialog"
          v-model:open="timeScrollOpen"
          picker="scroll"
        >
        </RioTimePickerDialog>
      </div>
      <div class="controls">
        <RioTimeScroll
          v-for="(key, i) in ['scroll', 'scrollGerman'] as const"
          :key
          v-model="times[key]"
          :locale="i ? 'de-DE' : undefined"
        >
        </RioTimeScroll>
      </div>
      <code>{{ times }}</code>
    </section>

    <section class="lists">
      <RioList variant="segmented" style="inline-size: 320px">
        <RioListItem @click="listOpened = 'Search'">
          <template #leading>
            <RioIcon :icon="{ type: 'svg', path: mdiMagnify }" />
          </template>
          Search
          <template #supporting>Across every note</template>
          <template #trailing>
            <RioIconButton variant="standard" label="More">
              <RioIcon :icon="{ type: 'svg', path: mdiDotsVertical }" />
            </RioIconButton>
          </template>
        </RioListItem>
        <RioListItem href="#lists" @click="listOpened = 'Share'">
          <template #leading>
            <RioIcon :icon="{ type: 'svg', path: mdiShareVariant }" />
          </template>
          Share
          <template #trailing>
            <RioIcon :icon="{ type: 'svg', path: mdiChevronRight }" />
          </template>
        </RioListItem>
        <RioListItem disabled @click="listOpened = 'Restore'">Restore</RioListItem>
      </RioList>
      <RioList
        v-model="listPicks"
        selection="multiple"
        label="Favorites"
        style="inline-size: 320px"
      >
        <RioListItem v-for="name in ['heart', 'bookmark', 'check']" :key="name" :value="name">
          <template #leading="{ selected }"><RioCheckbox :selected /></template>
          {{ name }}
          <template #overline>Favorite</template>
          <template #supporting>Chosen with a press, Space, or Enter</template>
        </RioListItem>
      </RioList>
      <code>{{ listOpened || 'nothing opened' }} · {{ listPicks }}</code>
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

    <section class="progress">
      <RioLinearProgress :value="progress" aria-label="Determinate" />
      <RioLinearProgress aria-label="Indeterminate" />
      <RioLinearProgress :value="progress" wavy aria-label="Wavy" />
      <RioLinearProgress wavy :thickness="8" aria-label="Wavy, indeterminate, thick" />
      <div class="progress-row">
        <RioCircularProgress :value="progress" aria-label="Determinate" />
        <RioCircularProgress aria-label="Indeterminate" />
        <RioCircularProgress :value="progress" wavy aria-label="Wavy" />
        <RioCircularProgress wavy :thickness="8" aria-label="Wavy, indeterminate, thick" />
      </div>
      <div class="progress-row">
        <RioLoadingIndicator aria-label="Loading" />
        <RioLoadingIndicator contained aria-label="Loading, contained" />
        <RioLoadingIndicator :value="progress" contained aria-label="Loading, determinate" />
        <RioLoadingIndicator :size="96" aria-label="Loading, large" />
      </div>
      <RioButton variant="tonal" @click="progress = progress >= 1 ? 0 : progress + 0.2">
        Progress {{ Math.round(progress * 100) }}%
      </RioButton>
    </section>

    <section class="chips">
      <RioChipSet aria-label="Assist and suggestion chips">
        <RioAssistChip @click="chips.last = 'Add to calendar'">
          <template #icon>
            <RioIcon :icon="{ type: 'svg', path: mdiCalendar }" />
          </template>
          Add to calendar
        </RioAssistChip>
        <RioAssistChip elevated @click="chips.last = 'Elevated'">Elevated</RioAssistChip>
        <RioAssistChip disabled>Disabled</RioAssistChip>
        <RioSuggestionChip @click="chips.last = 'Sounds good'">Sounds good</RioSuggestionChip>
        <RioSuggestionChip soft-disabled>Soft-disabled</RioSuggestionChip>
      </RioChipSet>
      <RioChipSet v-model="chips.filters" selection="multiple" aria-label="Filter chips">
        <RioFilterChip v-for="name in ['wifi', 'bluetooth', 'nfc']" :key="name" :value="name">
          {{ name }}
        </RioFilterChip>
        <RioFilterChip
          ref="sizeChip"
          v-model:open="chips.menuOpen"
          menu
          :selected="chips.size !== undefined"
        >
          {{ chips.size ?? 'Size' }}
        </RioFilterChip>
      </RioChipSet>
      <RioMenu
        v-model:open="chips.menuOpen"
        v-model="chips.size"
        :anchor="sizeChip"
        selection="single"
        label="Size"
      >
        <RioMenuItem v-for="size in ['Small', 'Large']" :key="size" :value="size">
          {{ size }}
        </RioMenuItem>
      </RioMenu>
      <RioChipSet scroll aria-label="Input chips">
        <RioInputChip
          v-for="person in chips.people"
          :key="person"
          @click="chips.last = person"
          @remove="chips.people = chips.people.filter((p) => p !== person)"
        >
          {{ person }}
        </RioInputChip>
      </RioChipSet>
      <code>chips={{ chips }}</code>
    </section>

    <section class="switches">
      <label class="switch-row">
        <RioSwitch v-model:selected="switches.plain" />
        Plain: {{ switches.plain ? 'on' : 'off' }}
      </label>
      <label class="switch-row">
        <RioSwitch v-model:selected="switches.selectedIcon">
          <template #selected-icon>
            <RioIcon :icon="{ type: 'svg', path: mdiCheck }" />
          </template>
        </RioSwitch>
        Icon when on
      </label>
      <label class="switch-row">
        <RioSwitch v-model:selected="switches.bothIcons">
          <template #selected-icon>
            <RioIcon :icon="{ type: 'svg', path: mdiCheck }" />
          </template>
          <template #unselected-icon>
            <RioIcon :icon="{ type: 'svg', path: mdiClose }" />
          </template>
        </RioSwitch>
        Icons on and off
      </label>
      <label class="switch-row"><RioSwitch disabled /> Disabled, off</label>
      <label class="switch-row"><RioSwitch disabled selected /> Disabled, on</label>
      <label class="switch-row"><RioSwitch soft-disabled /> Soft-disabled (Tab to it)</label>
    </section>

    <section class="sliders">
      <RioSlider v-model="sliders.plain" aria-label="Plain" />
      <RioSlider
        v-model="sliders.stops"
        :step="10"
        stops
        value-indicator
        aria-label="Stops and the value indicator"
      />
      <RioSlider
        v-model="sliders.centered"
        centered
        :min="-50"
        :max="50"
        value-indicator
        aria-label="Centered"
      />
      <RioRangeSlider v-model="sliders.range" value-indicator aria-label="Range" />
      <RioSlider v-model="sliders.volume" size="large" aria-label="Volume">
        <template #icon>
          <RioIcon
            :icon="{ type: 'svg', path: sliders.volume === 0 ? mdiVolumeOff : mdiVolumeHigh }"
          />
        </template>
      </RioSlider>
      <div class="slider-row">
        <RioSlider v-model="sliders.vertical" vertical size="medium" aria-label="Vertical">
          <template #icon>
            <RioIcon :icon="{ type: 'svg', path: mdiVolumeHigh }" />
          </template>
        </RioSlider>
        <RioSlider :model-value="50" disabled vertical aria-label="Disabled" />
        <RioSlider :model-value="50" soft-disabled vertical aria-label="Soft-disabled" />
      </div>
      <code>sliders={{ sliders }}</code>
    </section>

    <section class="scroll-fields">
      <RioScrollField v-model="scrollFields.minutes" :min="0" :max="59" label="Minutes" />
      <RioScrollField v-model="scrollFields.year" :min="1900" :max="2100" label="Year" />
      <RioScrollField
        v-model="scrollFields.unit"
        :options="['g', 'kg', 'lb', 'oz']"
        loop
        label="Unit"
      />
      <RioScrollField
        v-model="scrollFields.minutes"
        v-model:editing="scrollFields.editing"
        v-model:invalid="scrollFields.invalid"
        :min="0"
        :max="59"
        label="Minutes, typed"
      />
      <RioButton variant="tonal" @click="scrollFields.editing = !scrollFields.editing">
        Type
      </RioButton>
      <RioScrollField :model-value="7" disabled label="Disabled" />
      <code>scrollFields={{ scrollFields }}</code>
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

.playground-bar {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
  margin: -24px -24px 0;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.contrast {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contrast-slider {
  inline-size: 160px;
}

.motion {
  display: grid;
  justify-items: start;
  gap: 8px;
}

.dialog-fields {
  display: grid;
  gap: 16px;
}

.dialog-fields > p {
  margin: 0;
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

.progress {
  display: grid;
  justify-items: start;
  gap: 24px;
  max-inline-size: 480px;
}

.progress > .rio-linear-progress {
  inline-size: 100%;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 24px;
}

.chips {
  display: grid;
  gap: 16px;
}

.switches {
  display: grid;
  justify-items: start;
  gap: 12px;
}

.scroll-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.sliders {
  display: grid;
  gap: 24px;
  max-inline-size: 480px;
  padding-block-start: 48px;
}

.slider-row {
  display: flex;
  gap: 48px;
  padding-inline-start: 56px;
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
