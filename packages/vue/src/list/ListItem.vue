<script setup lang="ts">
import {
  attachListItem,
  createListItem,
  type ListItemDomHandle,
  type ListItemProps,
  type ListValue,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/focus-ring.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/list.css';
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
} from 'vue';
import Checkbox from '../checkbox/Checkbox.vue';
import { vCornerMorph } from '../corner-morph/corner-morph';
import Radio from '../radio/Radio.vue';
import { useRipple } from '../ripple/ripple';
import Switch from '../switch/Switch.vue';
import { listKey, noList } from './context';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  /** Identifies the item in a list with `selection`. */
  value?: ListValue;
  /** Makes the item a link to this address. */
  href?: string;
  /** Disabled items stay focusable among the list's items, and nothing they do happens. */
  disabled?: boolean;
  /** Listening for clicks makes the item a button. */
  onClick?: (event: MouseEvent) => void;
}>();
const slots = defineSlots<{
  /** The label */
  default?: () => unknown;
  /** Above the label */
  overline?: () => unknown;
  /** Under the label */
  supporting?: () => unknown;
  /**
   * Before the text: an icon, an avatar, an image, or a selection control. In a list with
   * `selection`, it takes neither presses nor the focus, and in place of the list's control, when
   * `controlPosition` is `leading`: bind `selected` to a checkbox, a radio button, or a switch
   * there, to show the item's state.
   */
  leading?: (props: { selected: boolean; disabled: boolean }) => unknown;
  /**
   * After the text: trailing text, an icon, a selection control, or in an action item, buttons. In
   * a list with `selection`, as `leading`, in place of the list's control by default.
   */
  trailing?: (props: { selected: boolean; disabled: boolean }) => unknown;
}>();

// `class` and `style` go to the `<li>`; every other attribute and listener goes to the action,
// when the item has one, and to the `<li>` otherwise.
const attrs = useAttrs();
const rest = computed(() => {
  const { class: _class, style: _style, ...others } = attrs;
  return others;
});

const list = inject(listKey, noList);
const multiline = ref(false);
const item = createListItem({
  // `satisfies` fails the build if a prop added to ListItemProps is missing here.
  props: () =>
    ({
      value: props.value,
      href: props.href,
      action: !!props.onClick,
      disabled: props.disabled,
    }) satisfies Record<keyof ListItemProps, unknown>,
  list: () => list,
  key: useId(),
  content: () => ({
    leading: !!slots.leading,
    overline: !!slots.overline,
    supporting: !!slots.supporting,
    trailing: !!slots.trailing,
  }),
  multiline: () => multiline.value,
});

const slotProps = computed(() => ({ selected: item.selected(), disabled: !!props.disabled }));
// The list's selection control, where the app's slot leaves room for it
const controls = { checkbox: Checkbox, radio: Radio, switch: Switch };
const leadingControl = computed(() => item.controlIn('leading'));
const trailingControl = computed(() => item.controlIn('trailing'));
const onClick = (event: MouseEvent) => {
  if (item.handleClick(event)) props.onClick?.(event);
};

const root = useTemplateRef<HTMLElement>('root');
const action = useTemplateRef<HTMLElement>('action');
// Presses ripple across the whole item: on the option itself, or from the action.
const pressed = computed(() =>
  item.kind() === 'option' ? root.value : item.acts() ? action.value : null,
);
useRipple(pressed, root);

let handle: ListItemDomHandle | undefined;
onMounted(() => {
  handle = attachListItem(root.value!, {
    onMultilineChange: (next) => (multiline.value = next),
  });
});
onUpdated(() => handle?.sync());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <li
    ref="root"
    v-corner-morph="{ axis: 'block' }"
    v-bind="{ ...item.parts.root(), ...(item.acts() ? {} : rest) }"
    :class="attrs.class"
    :style="attrs.style"
    @click="item.kind() === 'option' ? onClick($event) : undefined"
  >
    <component
      :is="item.kind() === 'link' ? 'a' : 'button'"
      v-if="item.acts()"
      ref="action"
      v-bind="{ ...item.parts.action(), ...rest }"
      @click="onClick"
    >
      <span v-if="item.showsLeading()" v-bind="item.parts.leading()">
        <slot name="leading" v-bind="slotProps" />
      </span>
      <span v-bind="item.parts.text()">
        <span v-if="item.showsOverline()" v-bind="item.parts.overline()"
          ><slot name="overline"
        /></span>
        <span v-bind="item.parts.label()"><slot /></span>
        <span v-if="item.showsSupporting()" v-bind="item.parts.supporting()">
          <slot name="supporting" />
        </span>
      </span>
    </component>
    <template v-else>
      <span v-if="item.showsLeading()" v-bind="item.parts.leading()">
        <slot name="leading" v-bind="slotProps">
          <component :is="controls[leadingControl]" v-if="leadingControl" v-bind="slotProps" />
        </slot>
      </span>
      <span v-bind="item.parts.text()">
        <span v-if="item.showsOverline()" v-bind="item.parts.overline()"
          ><slot name="overline"
        /></span>
        <span v-bind="item.parts.label()"><slot /></span>
        <span v-if="item.showsSupporting()" v-bind="item.parts.supporting()">
          <slot name="supporting" />
        </span>
      </span>
    </template>
    <span v-if="item.showsTrailing()" v-bind="item.parts.trailing()">
      <slot name="trailing" v-bind="slotProps">
        <component :is="controls[trailingControl]" v-if="trailingControl" v-bind="slotProps" />
      </slot>
    </span>
  </li>
</template>
