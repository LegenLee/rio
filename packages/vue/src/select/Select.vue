<script setup lang="ts">
import {
  attachSelect,
  createSelect,
  mergePartAttrs,
  type SelectDomHandle,
  type SelectProps,
  type SelectSelected,
  type SelectValue,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/anchored-position.css';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/menu.css';
import '@rio-m3e/styles/select.css';
import '@rio-m3e/styles/text-field.css';
import {
  onBeforeUnmount,
  onMounted,
  onUpdated,
  provide,
  shallowReactive,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
} from 'vue';
import { keepPresses } from '../overlay/presses';
import { selectKey, type SelectOptionEntry } from './context';
import RioIcon from '../icon/Icon.vue';

// `class` and `style` dress the whole select; every other attribute, such as `id` or
// `aria-label`, and every listener belongs to the field, the `combobox`.
defineOptions({ inheritAttrs: false });

type Props = Omit<SelectProps, 'selected' | 'open'>;

// No defaults here: core fills them in.
const {
  variant,
  label,
  multiple,
  supportingText,
  error,
  errorText,
  required,
  disabled,
  name,
  autocomplete,
  menuVariant,
  instant,
} = defineProps<Props>();
/** The selected value, or with `multiple`, the selected values, with `v-model`. */
const model = defineModel<SelectSelected>();
/** Whether the list is open, with `v-model:open`. The select keeps it when it isn't bound. */
const open = defineModel<boolean>('open', { default: false });
const slots = defineSlots<{
  /** `RioSelectOption`s */
  default?: () => unknown;
  /** An icon before the selection */
  'leading-icon'?: () => unknown;
  /**
   * The dropdown arrow, such as arrow_drop_down. It turns over while the list is open. Without one,
   * the `dropdown` icon registered with `createRio`.
   */
  'dropdown-icon'?: () => unknown;
  /**
   * The selection as the field shows it, in place of the selected options' labels separated by
   * commas. `labels` are in the order of the options.
   */
  value?: (props: { selected: SelectValue[]; labels: string[] }) => unknown;
}>();

const entries = shallowReactive<SelectOptionEntry[]>([]);
/** The options, in the order they appear once rendered */
const options = () => {
  const sorted = [...entries];
  if (sorted.every((entry) => entry.element())) {
    sorted.sort((a, b) =>
      a.element()!.compareDocumentPosition(b.element()!) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    );
  }
  return sorted.map((entry) => ({ value: entry.value(), label: entry.label() }));
};

const id = useId();
const attrs = useAttrs();
const select = createSelect({
  // `satisfies` fails the build if a prop added to SelectProps is missing here.
  props: () =>
    ({
      variant,
      label,
      multiple,
      selected: model.value,
      open: open.value,
      supportingText,
      error,
      errorText,
      required,
      disabled,
      name,
      autocomplete,
      menuVariant,
      instant,
    }) satisfies Record<keyof SelectProps, unknown>,
  options,
  content: () => ({ leadingIcon: !!slots['leading-icon'] }),
  ids: {
    // The app's own id stays the field's, for an aria-labelledby of its own.
    get field() {
      return typeof attrs.id === 'string' && attrs.id ? attrs.id : `${id}-field`;
    },
    label: `${id}-label`,
    listbox: `${id}-listbox`,
    supportingText: `${id}-supporting`,
  },
  appName: () => ({
    label: typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : undefined,
    labelledBy: typeof attrs['aria-labelledby'] === 'string' ? attrs['aria-labelledby'] : undefined,
  }),
  onChange: (next) => (model.value = next),
  onOpenChange: (next) => (open.value = next),
});

provide(selectKey, {
  isSelected: select.isSelected,
  choose: select.choose,
  register(entry) {
    entries.push(entry);
    return () => {
      const index = entries.indexOf(entry);
      if (index >= 0) entries.splice(index, 1);
    };
  },
});

const container = useTemplateRef<HTMLElement>('container');
const field = useTemplateRef<HTMLElement>('field');
const listbox = useTemplateRef<HTMLElement>('listbox');
const native = useTemplateRef<HTMLSelectElement>('native');
let handle: SelectDomHandle | undefined;
onMounted(() => {
  handle = attachSelect(
    {
      container: container.value!,
      field: field.value!,
      listbox: listbox.value!,
      native: native.value!,
    },
    {
      disabled: () => !!disabled,
      selected: () => select.selectedValues().map(select.nativeValue),
      onOpenChange: select.setOpen,
      onNativeChange: select.nativeChanged,
    },
  );
  handle.sync(open.value);
});
// After the render, so options that came with the change can take the focus.
watch(
  () => open.value,
  (next) => handle?.sync(next),
  { flush: 'post' },
);
watch(
  () => disabled,
  (next) => next && select.setOpen(false),
);
onUpdated(() => handle?.update());
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div v-bind="select.parts.root()" :class="$attrs.class" :style="$attrs.style">
    <div v-bind="select.parts.frame()">
      <span v-if="select.showsOutline()" v-bind="select.parts.outline()">
        <span v-bind="select.parts.outlineStart()" />
        <span v-bind="select.parts.outlineNotch()">{{ select.labelText() }}</span>
        <span v-bind="select.parts.outlineEnd()" />
      </span>
      <span v-if="select.showsLabel()" v-bind="select.parts.label()">{{ select.labelText() }}</span>
      <div ref="container" v-bind="select.parts.container()">
        <span v-if="select.showsLeadingIcon()" v-bind="select.parts.leadingIcon()">
          <slot name="leading-icon" />
        </span>
        <div v-bind="select.parts.content()">
          <div
            ref="field"
            v-bind="
              mergePartAttrs(
                { ...$attrs, class: undefined, style: undefined },
                select.parts.field(),
              )
            "
          >
            <span v-bind="select.parts.value()">
              <slot
                name="value"
                :selected="select.selectedValues()"
                :labels="select.selectedLabels()"
                >{{ select.valueText() }}</slot
              >
            </span>
            <span v-bind="select.parts.sizer()">
              <span v-for="(text, index) in select.sizerTexts()" :key="index">{{ text }}</span>
            </span>
          </div>
        </div>
        <span v-bind="select.parts.arrow()"
          ><slot name="dropdown-icon"><RioIcon alias="dropdown" /></slot
        ></span>
        <select ref="native" v-bind="select.parts.native()">
          <option v-if="!select.multiple()" value="" />
          <option
            v-for="option in options()"
            :key="select.nativeValue(option.value)"
            :value="select.nativeValue(option.value)"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>
    <div v-if="select.showsSupporting()" v-bind="select.parts.supporting()">
      <!-- A new element for the error text, so it arrives with its alert role. -->
      <span
        :key="select.showsErrorText() ? 'error' : 'supporting'"
        v-bind="select.parts.supportingText()"
        >{{ select.supportingTextNow() }}</span
      >
    </div>
    <div ref="listbox" v-bind="select.parts.listbox()" v-on="keepPresses">
      <slot />
    </div>
  </div>
</template>
