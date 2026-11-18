<script setup lang="ts">
import {
  attachMenu,
  createMenu,
  type MenuAnchorPoint,
  type MenuDomHandle,
  type MenuProps,
  type MenuSelected,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/anchored-position.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/menu.css';
import { onBeforeUnmount, onMounted, provide, ref, useTemplateRef, watch } from 'vue';
import { menuContextOf, menuKey } from './context';

// `v-model` without an argument binds `modelValue`; core calls the same thing `selected`.
interface Props extends Omit<MenuProps, 'selected'> {
  /**
   * What the menu opens from: an element or a component, such as the button that opens it (its
   * template ref), or a point in viewport coordinates, for a context menu. Give the point the
   * `element` it is on, and the menu keeps to that spot on it as it scrolls.
   */
  anchor?: HTMLElement | { readonly $el: unknown } | MenuAnchorPoint | null;
  /** The selected value (`single`) or values (`multiple`), with `v-model`. */
  modelValue?: MenuSelected;
}

// No defaults here: core fills them in.
const { open, variant, selection, label, side, align, offset, instant, anchor, modelValue } =
  defineProps<Props>();
const emit = defineEmits<{
  'update:open': [open: boolean];
  'update:modelValue': [selected: MenuSelected];
}>();
defineSlots<{
  /** `RioMenuItem`s, `RioMenuDivider`s, and `RioMenuGroup`s */
  default?: () => unknown;
}>();

/** The inactive shape, with another open menu of its tree active */
const inactive = ref(false);
const menu = createMenu({
  // `satisfies` fails the build if a prop added to MenuProps is missing here.
  props: () =>
    ({
      open,
      variant,
      selection,
      selected: modelValue,
      label,
      side,
      align,
      offset,
      instant,
    }) satisfies Record<keyof MenuProps, unknown>,
  onChange: (selected) => emit('update:modelValue', selected),
  onOpenChange: (next) => emit('update:open', next),
  inactive: () => inactive.value,
});

provide(menuKey, menuContextOf(menu));

/** A component's root element, or the element or point itself */
const anchorTarget = () =>
  anchor && '$el' in anchor ? (anchor.$el as HTMLElement) : (anchor ?? undefined);

const root = useTemplateRef<HTMLElement>('root');
let handle: MenuDomHandle | undefined;
onMounted(() => {
  handle = attachMenu(root.value!, {
    anchor: anchorTarget,
    props: () => ({ side, align, offset }),
    onClose: () => emit('update:open', false),
    onInactiveChange: (next) => (inactive.value = next),
  });
  handle.sync(!!open);
});
// After the render, so items that came with the change can take the focus.
watch(
  () => open,
  (next) => handle?.sync(!!next),
  { flush: 'post' },
);
// A template ref is still empty when the menu first renders, and a context menu's point moves. A
// point is compared by value: an inline `{ x, y }` is a new object on every render.
const pointOf = () => {
  const target = anchorTarget();
  return target && 'x' in target && 'y' in target && !('getBoundingClientRect' in target)
    ? target
    : undefined;
};
const anchorKey = () => {
  const point = pointOf();
  return point ? `${point.x},${point.y}` : anchorTarget();
};
watch([anchorKey, () => pointOf()?.element], () => handle?.update(), { flush: 'post' });
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div ref="root" v-bind="menu.parts.root()">
    <slot />
  </div>
</template>
