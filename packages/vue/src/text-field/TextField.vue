<script setup lang="ts">
import {
  attachTextField,
  createTextField,
  mergePartAttrs,
  type TextFieldDomHandle,
  type TextFieldProps,
} from '@rio-m3e/core';
import '@rio-m3e/styles/base/reduced-motion.css';
import '@rio-m3e/styles/text-field.css';
import { onBeforeUnmount, onMounted, useAttrs, useId, useTemplateRef } from 'vue';

// `class` and `style` dress the whole field; every other attribute, such as `type`, `name`,
// `placeholder`, or `autocomplete`, and every listener belongs to the input.
defineOptions({ inheritAttrs: false });

type Props = Omit<TextFieldProps, 'value'>;

// No defaults here: core fills them in.
const {
  variant,
  label,
  multiline,
  rows,
  prefix,
  suffix,
  supportingText,
  error,
  errorText,
  maxlength,
  required,
  disabled,
  readonly,
} = defineProps<Props>();
/**
 * The text in the field, with `v-model`. With `type="number"` it is a number, as Vue's `v-model`
 * on an input makes it.
 */
const model = defineModel<string | number>({ default: '' });
const slots = defineSlots<{
  /** An icon before the text, such as a search icon */
  'leading-icon'?: () => unknown;
  /** An icon or an icon button after the text, such as a clear button or an error icon */
  'trailing-icon'?: () => unknown;
}>();

const id = useId();
const attrs = useAttrs();
const field = createTextField({
  // `satisfies` fails the build if a prop added to TextFieldProps is missing here.
  props: () =>
    ({
      variant,
      label,
      value: String(model.value),
      multiline,
      rows,
      prefix,
      suffix,
      supportingText,
      error,
      errorText,
      maxlength,
      required,
      disabled,
      readonly,
    }) satisfies Record<keyof TextFieldProps, unknown>,
  content: () => ({ leadingIcon: !!slots['leading-icon'], trailingIcon: !!slots['trailing-icon'] }),
  ids: {
    // The app's own id stays the input's, for a <label for> or aria-labelledby of its own.
    get input() {
      return typeof attrs.id === 'string' && attrs.id ? attrs.id : `${id}-input`;
    },
    prefix: `${id}-prefix`,
    suffix: `${id}-suffix`,
    supportingText: `${id}-supporting`,
    counter: `${id}-counter`,
  },
});

const container = useTemplateRef<HTMLElement>('container');
const input = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>('input');
let handle: TextFieldDomHandle | undefined;
onMounted(() => (handle = attachTextField(container.value!, () => input.value)));
onBeforeUnmount(() => handle?.detach());
</script>

<template>
  <div v-bind="field.parts.root()" :class="$attrs.class" :style="$attrs.style">
    <div v-bind="field.parts.frame()">
      <span v-if="field.showsOutline()" v-bind="field.parts.outline()">
        <span v-bind="field.parts.outlineStart()" />
        <span v-bind="field.parts.outlineNotch()">{{ field.labelText() }}</span>
        <span v-bind="field.parts.outlineEnd()" />
      </span>
      <label v-if="field.showsLabel()" v-bind="field.parts.label()">{{ field.labelText() }}</label>
      <div ref="container" v-bind="field.parts.container()">
        <span v-if="field.showsLeadingIcon()" v-bind="field.parts.leadingIcon()">
          <slot name="leading-icon" />
        </span>
        <div v-bind="field.parts.content()">
          <span v-if="field.showsPrefix()" v-bind="field.parts.prefix()">{{ prefix }}</span>
          <!-- v-model, not :value and @input: it waits for an IME to finish composing. -->
          <input
            v-if="field.singleLine()"
            ref="input"
            v-model="model"
            v-bind="
              mergePartAttrs({ ...$attrs, class: undefined, style: undefined }, field.parts.input())
            "
          />
          <textarea
            v-else
            ref="input"
            v-model="model"
            v-bind="
              mergePartAttrs(
                { ...$attrs, class: undefined, style: undefined },
                field.parts.textarea(),
              )
            "
          />
          <span v-if="field.showsSuffix()" v-bind="field.parts.suffix()">{{ suffix }}</span>
        </div>
        <span v-if="field.showsTrailingIcon()" v-bind="field.parts.trailingIcon()">
          <slot name="trailing-icon" />
        </span>
      </div>
    </div>
    <div v-if="field.showsSupporting()" v-bind="field.parts.supporting()">
      <!-- A new element for the error text, so it arrives with its alert role. -->
      <span
        v-if="field.showsSupportingText()"
        :key="field.showsErrorText() ? 'error' : 'supporting'"
        v-bind="field.parts.supportingText()"
        >{{ field.supportingTextNow() }}</span
      >
      <span v-if="field.showsCounter()" v-bind="field.parts.counter()">{{
        field.counterText()
      }}</span>
    </div>
  </div>
</template>
