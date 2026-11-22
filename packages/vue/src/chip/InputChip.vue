<script setup lang="ts">
import {
  createInputChip,
  mergePartAttrs,
  type ChipMessages,
  type InputChipProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/base/ripple.css';
import '@rio-m3e/styles/base/touch-target.css';
import '@rio-m3e/styles/chip.css';
import { computed, useAttrs, useId, useTemplateRef } from 'vue';
import { useLocale, useMessages } from '../locale/locale';
import { useRipple } from '../ripple/ripple';
import { useChipSetItem } from './context';
import RioIcon from '../icon/Icon.vue';

// `class` and `style` dress the whole chip; every other attribute, such as `aria-describedby`,
// and every listener belongs to the chip's action, or to the chip on a `removeOnly` one.
defineOptions({ inheritAttrs: false });

const props = defineProps<
  InputChipProps & {
    /** A language tag, for the remove button's name. Without it, the one provided, or the page's. */
    locale?: string;
    /** Replaces the remove button's name. */
    messages?: Partial<ChipMessages>;
  }
>();
const emit = defineEmits<{
  click: [event: MouseEvent];
  /** The person asked to remove the chip: its remove button, or Backspace or Delete. */
  remove: [];
}>();
const slots = defineSlots<{
  /** The label, which names the chip and its remove button. */
  default?: () => unknown;
  /** A leading icon. Hidden from assistive technology. */
  icon?: () => unknown;
  /** A leading image, such as a person's avatar, in a 24px circle. It wins over the icon. */
  avatar?: () => unknown;
  /**
   * The remove button's icon, such as an X. Hidden from assistive technology. Without one, the
   * `remove` icon registered with `createRio`.
   */
  'remove-icon'?: () => unknown;
}>();

const attrs = useAttrs();
const rest = computed(() => ({ ...attrs, class: undefined, style: undefined }));
const locale = useLocale(() => props.locale);
const messages = useMessages('chip', locale, () => props.messages);
const id = useId();
const item = useChipSetItem();
const chip = createInputChip({
  // `satisfies` fails the build if a prop added to InputChipProps is missing here.
  props: () =>
    ({
      removeOnly: props.removeOnly,
      disabled: props.disabled,
      softDisabled: props.softDisabled,
    }) satisfies Record<keyof InputChipProps, unknown>,
  content: () => ({ icon: !!slots.icon, avatar: !!slots.avatar }),
  messages: () => messages.value,
  ids: {
    label: `${id}-label`,
    removeBefore: `${id}-remove-before`,
    removeAfter: `${id}-remove-after`,
  },
  key: item.key,
  tabStop: item.tabStop,
  onClick: (event) => emit('click', event),
  onRemove: () => emit('remove'),
});

useRipple(useTemplateRef<HTMLElement>('action'), useTemplateRef<HTMLElement>('state'));
</script>

<template>
  <span
    v-bind="chip.isAction() ? chip.parts.root() : mergePartAttrs(rest, chip.parts.root())"
    :class="$attrs.class"
    :style="$attrs.style"
    @keydown="chip.handleKeydown"
  >
    <span ref="state" v-bind="chip.parts.state()" />
    <component
      :is="chip.isAction() ? 'button' : 'span'"
      ref="action"
      v-bind="chip.isAction() ? mergePartAttrs(rest, chip.parts.action()) : chip.parts.action()"
      @click="chip.handleClick"
    >
      <span v-bind="chip.parts.touch()" />
      <span v-if="chip.showsAvatar()" v-bind="chip.parts.avatar()"><slot name="avatar" /></span>
      <span v-if="chip.showsIcon()" v-bind="chip.parts.icon()"><slot name="icon" /></span>
      <span v-bind="chip.parts.label()"><slot /></span>
    </component>
    <button v-bind="chip.parts.remove()" @click="chip.handleRemoveClick">
      <span v-bind="chip.parts.removeTouch()" />
      <span v-bind="chip.parts.removeIcon()"
        ><slot name="remove-icon"><RioIcon alias="remove" /></slot
      ></span>
    </button>
    <span v-if="chip.showsRemoveBefore()" v-bind="chip.parts.removeBefore()">{{
      chip.removeText().before
    }}</span>
    <span v-if="chip.showsRemoveAfter()" v-bind="chip.parts.removeAfter()">{{
      chip.removeText().after
    }}</span>
  </span>
</template>
