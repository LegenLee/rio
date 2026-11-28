<script setup lang="ts">
import {
  attachSplitButtonMenuIcon,
  createSplitButton,
  type SplitButtonMenuIconHandle,
  type SplitButtonProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/accent.css';
import '@rio-m3e/styles/base/direction.css';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/state-layer.css';
import '@rio-m3e/styles/base/touch-target.css';
import '@rio-m3e/styles/button.css';
import '@rio-m3e/styles/split-button.css';
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { vRipple } from '../ripple/ripple';
import { vCornerMorph } from '../corner-morph/corner-morph';
import RioIcon from '../icon/Icon.vue';

// No defaults here: core fills them in.
const { menuLabel, label, variant, size, color, open, popup, disabled, softDisabled, type } =
  defineProps<SplitButtonProps>();
const emit = defineEmits<{
  /** A click on the leading button. */
  click: [event: MouseEvent];
  'update:open': [open: boolean];
}>();
const slots = defineSlots<{
  /** The leading button's label. Without it, give the split button a `label`. */
  default?: () => unknown;
  /** The leading button's icon. Hidden from assistive technology. */
  icon?: () => unknown;
  /**
   * The trailing button's icon: an expand icon pointing down, which turns when the menu opens.
   * Hidden from assistive technology; `menuLabel` names the button. Without one, the `menu` icon
   * registered with `createRio`.
   */
  'menu-icon'?: () => unknown;
}>();

const sb = createSplitButton({
  // `satisfies` fails the build if a prop added to SplitButtonProps is missing here.
  props: () =>
    ({
      menuLabel,
      label,
      variant,
      size,
      color,
      open,
      popup,
      disabled,
      softDisabled,
      type,
    }) satisfies Record<keyof SplitButtonProps, unknown>,
  content: () => ({ icon: !!slots.icon, label: !!slots.default }),
  onClick: (event) => emit('click', event),
  onChange: (next) => emit('update:open', next),
});

const leading = useTemplateRef<HTMLButtonElement>('leading');
const trailing = useTemplateRef<HTMLButtonElement>('trailing');
// For the app: the menu goes next to `trailing`, and focus goes back to it when the menu closes.
defineExpose({ leading, trailing });

let handle: SplitButtonMenuIconHandle | undefined;
onMounted(() => {
  handle = attachSplitButtonMenuIcon(trailing.value!);
});
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div v-bind="sb.parts.root()">
    <button
      ref="leading"
      v-ripple
      v-corner-morph
      v-bind="sb.parts.leading()"
      @click="sb.handleLeadingClick"
    >
      <span v-bind="sb.parts.touch()" />
      <span v-if="sb.showsIcon()" v-bind="sb.parts.icon()"><slot name="icon" /></span>
      <span v-if="sb.showsLabel()" v-bind="sb.parts.label()"><slot /></span>
    </button>
    <button
      ref="trailing"
      v-ripple
      v-corner-morph
      v-bind="sb.parts.trailing()"
      @click="sb.handleTrailingClick"
    >
      <span v-bind="sb.parts.touch()" />
      <span v-bind="sb.parts.menuIcon()"
        ><slot name="menu-icon"><RioIcon alias="menu" /></slot
      ></span>
    </button>
  </div>
</template>
