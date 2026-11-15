<script setup lang="ts">
import {
  attachSubMenu,
  createSubMenu,
  type MenuSelected,
  type SubMenuDomHandle,
  type SubMenuProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/anchored-position.css';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/menu.css';
import {
  inject,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { vRipple } from '../ripple/ripple';
import { menuContextOf, menuKey } from './context';

// The item and the submenu render side by side, so attributes given to the component go to the item.
defineOptions({ inheritAttrs: false });

// `v-model` without an argument binds `modelValue`; core calls the same thing `selected`.
interface Props extends Omit<SubMenuProps, 'selected'> {
  /** The selected value (`single`) or values (`multiple`), with `v-model`. */
  modelValue?: MenuSelected;
}

// No defaults here: core fills them in.
const { label, disabled, selection, modelValue } = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [selected: MenuSelected];
}>();
const slots = defineSlots<{
  /** The submenu's `RioMenuItem`s, `RioMenuDivider`s, `RioMenuGroup`s, and `RioSubMenu`s */
  default?: () => unknown;
  /** A leading icon on the item, hidden from assistive technology */
  icon?: () => unknown;
  /** Supporting text under the item's label */
  'supporting-text'?: () => unknown;
  /** Trailing text on the item */
  'trailing-text'?: () => unknown;
  /**
   * A trailing icon on the item, hidden from assistive technology, such as an arrow pointing to the
   * submenu. Rio ships no icons.
   */
  'trailing-icon'?: () => unknown;
}>();

const parent = inject(menuKey, undefined);
const open = ref(false);
const sub = createSubMenu({
  // `satisfies` fails the build if a prop added to SubMenuProps is missing here.
  props: () =>
    ({ label, disabled, selection, selected: modelValue }) satisfies Record<
      keyof SubMenuProps,
      unknown
    >,
  content: () => ({
    icon: !!slots.icon,
    supportingText: !!slots['supporting-text'],
    trailingText: !!slots['trailing-text'],
    trailingIcon: !!slots['trailing-icon'],
  }),
  menu: () => parent,
  open: () => open.value,
  onChange: (selected) => emit('update:modelValue', selected),
  onOpenChange: (next) => (open.value = next),
});
const { item } = sub;
provide(menuKey, menuContextOf(sub.menu));

const itemElement = useTemplateRef<HTMLElement>('item');
const root = useTemplateRef<HTMLElement>('root');
let handle: SubMenuDomHandle | undefined;
onMounted(() => {
  handle = attachSubMenu(itemElement.value!, root.value!, {
    onOpenChange: (next) => (open.value = next),
  });
  handle.sync(open.value);
});
// After the render, so items that came with the change can take the focus.
watch(open, (next) => handle?.sync(next), { flush: 'post' });
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <button
    ref="item"
    v-ripple
    v-bind="mergeProps($attrs, item.parts.root())"
    @click="item.handleClick"
  >
    <span v-bind="item.parts.touch()" />
    <span v-if="item.showsIcon()" v-bind="item.parts.icon()">
      <slot name="icon" />
    </span>
    <span v-bind="item.parts.text()">
      <span v-bind="item.parts.label()">{{ label }}</span>
      <span v-if="item.showsSupportingText()" v-bind="item.parts.supportingText()">
        <slot name="supporting-text" />
      </span>
    </span>
    <span v-if="item.showsTrailingText()" v-bind="item.parts.trailingText()">
      <slot name="trailing-text" />
    </span>
    <span v-if="item.showsTrailingIcon()" v-bind="item.parts.trailingIcon()">
      <slot name="trailing-icon" />
    </span>
  </button>
  <div ref="root" v-bind="sub.menu.parts.root()">
    <slot />
  </div>
</template>
