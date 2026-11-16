import type { PartAttrs, PartNode } from '../parts';
import { omitUndefined } from '../utils/object';

/** M3 text field variants: the same field, with a filled container or an outline. */
export const TEXT_FIELD_VARIANTS = ['filled', 'outlined'] as const;
export type TextFieldVariant = (typeof TEXT_FIELD_VARIANTS)[number];

export interface TextFieldProps {
  /** Defaults to `'filled'`. */
  variant?: TextFieldVariant;
  /** Names the field. It rests inside the field while it is empty, and moves to the top. */
  label?: string;
  /** The text in the field. The adapter owns it. */
  value?: string;
  /** A text area: several lines, at a fixed height that scrolls, instead of one line. */
  multiline?: boolean;
  /** How many lines a text area shows. Defaults to 3. */
  rows?: number;
  /** Text before the input, such as a currency symbol */
  prefix?: string;
  /** Text after the input, such as a unit or an email domain */
  suffix?: string;
  /** Text below the field, about what to enter */
  supportingText?: string;
  /** Shows the field in the error color, and marks the input invalid. */
  error?: boolean;
  /** Takes the supporting text's place while `error` is set, and is announced. */
  errorText?: string;
  /** The most characters the input takes. It also shows a counter below the field. */
  maxlength?: number;
  /** The input asks for a value; the label ends with an asterisk. */
  required?: boolean;
  disabled?: boolean;
  /** The text can be read and selected, but not changed. */
  readonly?: boolean;
}

export const textFieldDefaults = {
  variant: 'filled',
  value: '',
  multiline: false,
  rows: 3,
  error: false,
  required: false,
  disabled: false,
  readonly: false,
} satisfies Partial<Record<keyof TextFieldProps, unknown>>;

/** What the adapter has to put in the field, which only the adapter can see. */
export interface TextFieldContent {
  leadingIcon: boolean;
  trailingIcon: boolean;
}

export interface TextFieldOptions {
  props: () => TextFieldProps;
  /** Without it, the field has no icons. */
  content?: () => TextFieldContent;
  /** Ids for the parts the input refers to, unique in the document. The adapter makes them. */
  ids: { input: string; prefix: string; suffix: string; supportingText: string; counter: string };
}

/** The text field's markup, part by part. `textFieldSkeleton` says how the adapter nests them. */
export interface TextFieldParts {
  root: () => PartAttrs;
  /**
   * The field's box: the outline and the label over the container. The label at the top of an
   * outlined field reaches past the container, which a text area clips so it can be resized.
   */
  frame: () => PartAttrs;
  /** The 56px box: the fill and the active indicator. A text area's can be made taller. */
  container: () => PartAttrs;
  /** The outlined variant's outline, in three pieces around the gap the label rests in. */
  outline: () => PartAttrs;
  outlineStart: () => PartAttrs;
  /** Holds a copy of the label text at its top size, which sizes the gap. */
  outlineNotch: () => PartAttrs;
  outlineEnd: () => PartAttrs;
  /** The `<label>` for the input. Holds `labelText()`. */
  label: () => PartAttrs;
  leadingIcon: () => PartAttrs;
  /** The prefix, the input, and the suffix */
  content: () => PartAttrs;
  prefix: () => PartAttrs;
  /** The native `<input>`, for a single line */
  input: () => PartAttrs;
  /** The native `<textarea>`, for several lines */
  textarea: () => PartAttrs;
  suffix: () => PartAttrs;
  trailingIcon: () => PartAttrs;
  /** The line below the field: the supporting or error text, and the counter */
  supporting: () => PartAttrs;
  /** Holds `supportingTextNow()`. */
  supportingText: () => PartAttrs;
  /** Holds `counterText()`. */
  counter: () => PartAttrs;
}

type TextFieldWhen =
  | 'showsOutline'
  | 'showsLeadingIcon'
  | 'showsLabel'
  | 'showsPrefix'
  | 'singleLine'
  | 'multiline'
  | 'showsSuffix'
  | 'showsTrailingIcon'
  | 'showsSupporting'
  | 'showsSupportingText'
  | 'showsCounter';

export const textFieldSkeleton: PartNode<keyof TextFieldParts, TextFieldWhen> = {
  part: 'root',
  tag: 'div',
  children: [
    {
      part: 'frame',
      tag: 'div',
      children: [
        {
          part: 'outline',
          tag: 'span',
          when: 'showsOutline',
          children: [
            { part: 'outlineStart', tag: 'span' },
            { part: 'outlineNotch', tag: 'span', content: true },
            { part: 'outlineEnd', tag: 'span' },
          ],
        },
        { part: 'label', tag: 'label', when: 'showsLabel', content: true },
        {
          part: 'container',
          tag: 'div',
          children: [
            { part: 'leadingIcon', tag: 'span', when: 'showsLeadingIcon', content: true },
            {
              part: 'content',
              tag: 'div',
              children: [
                { part: 'prefix', tag: 'span', when: 'showsPrefix', content: true },
                { part: 'input', tag: 'input', when: 'singleLine' },
                { part: 'textarea', tag: 'textarea', when: 'multiline' },
                { part: 'suffix', tag: 'span', when: 'showsSuffix', content: true },
              ],
            },
            { part: 'trailingIcon', tag: 'span', when: 'showsTrailingIcon', content: true },
          ],
        },
      ],
    },
    {
      part: 'supporting',
      tag: 'div',
      when: 'showsSupporting',
      children: [
        { part: 'supportingText', tag: 'span', when: 'showsSupportingText', content: true },
        { part: 'counter', tag: 'span', when: 'showsCounter', content: true },
      ],
    },
  ],
};

export interface TextFieldApi extends Record<TextFieldWhen, () => boolean> {
  parts: TextFieldParts;
  /** The label, with an asterisk when the field is required */
  labelText: () => string;
  /** The error text while in error and there is one, otherwise the supporting text */
  supportingTextNow: () => string;
  /** Whether the supporting text part holds the error text now, as an alert */
  showsErrorText: () => boolean;
  /** Characters used and the most allowed, such as `12 / 20` */
  counterText: () => string;
}

const NO_CONTENT: TextFieldContent = { leadingIcon: false, trailingIcon: false };

export function createTextField(options: TextFieldOptions): TextFieldApi {
  const props = () => ({ ...textFieldDefaults, ...omitUndefined(options.props()) });
  const content = () => options.content?.() ?? NO_CONTENT;
  const { ids } = options;

  const showsLabel = () => !!props().label;
  const showsPrefix = () => !!props().prefix;
  const showsSuffix = () => !!props().suffix;
  const showsCounter = () => (props().maxlength ?? -1) >= 0;
  const showingError = () => props().error && !!props().errorText;
  const supportingTextNow = () =>
    showingError() ? props().errorText! : (props().supportingText ?? '');
  const showsSupportingText = () => supportingTextNow() !== '';
  const showsSupporting = () => showsSupportingText() || showsCounter();

  const labelText = () => `${props().label ?? ''}${props().required ? '*' : ''}`;

  const control = (): PartAttrs => {
    const p = props();
    const describedBy = [
      showsPrefix() && ids.prefix,
      showsSuffix() && ids.suffix,
      showsSupportingText() && ids.supportingText,
      showsCounter() && ids.counter,
    ].filter(Boolean);
    return {
      class: 'rio-text-field__input',
      id: ids.input,
      disabled: p.disabled ? '' : undefined,
      readonly: p.readonly ? '' : undefined,
      required: p.required ? '' : undefined,
      maxlength: showsCounter() ? String(p.maxlength) : undefined,
      'aria-invalid': p.error ? 'true' : undefined,
      'aria-describedby': describedBy.length ? describedBy.join(' ') : undefined,
    };
  };

  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-text-field',
          'data-variant': p.variant,
          'data-populated': p.value !== '' ? '' : undefined,
          'data-label': showsLabel() ? '' : undefined,
          'data-leading-icon': content().leadingIcon ? '' : undefined,
          'data-trailing-icon': content().trailingIcon ? '' : undefined,
          'data-multiline': p.multiline ? '' : undefined,
          'data-error': p.error ? '' : undefined,
          'data-disabled': p.disabled ? '' : undefined,
        };
      },
      frame: () => ({ class: 'rio-text-field__frame' }),
      container: () => ({ class: 'rio-text-field__container' }),
      outline: () => ({ class: 'rio-text-field__outline', 'aria-hidden': 'true' }),
      outlineStart: () => ({ class: 'rio-text-field__outline-start' }),
      outlineNotch: () => ({ class: 'rio-text-field__outline-notch' }),
      outlineEnd: () => ({ class: 'rio-text-field__outline-end' }),
      leadingIcon: () => ({ class: 'rio-text-field__leading-icon' }),
      content: () => ({ class: 'rio-text-field__content' }),
      label: () => ({ class: 'rio-text-field__label', for: ids.input }),
      prefix: () => ({ class: 'rio-text-field__prefix', id: ids.prefix }),
      input: control,
      textarea: () => ({ ...control(), rows: String(props().rows) }),
      suffix: () => ({ class: 'rio-text-field__suffix', id: ids.suffix }),
      trailingIcon: () => ({ class: 'rio-text-field__trailing-icon' }),
      supporting: () => ({ class: 'rio-text-field__supporting' }),
      supportingText: () => ({
        class: 'rio-text-field__supporting-text',
        id: ids.supportingText,
        // An error is announced as it appears.
        role: showingError() ? 'alert' : undefined,
      }),
      counter: () => ({ class: 'rio-text-field__counter', id: ids.counter }),
    },
    showsOutline: () => props().variant === 'outlined',
    showsLeadingIcon: () => content().leadingIcon,
    showsLabel,
    showsPrefix,
    singleLine: () => !props().multiline,
    multiline: () => props().multiline,
    showsSuffix,
    showsTrailingIcon: () => content().trailingIcon,
    showsSupporting,
    showsSupportingText,
    showsCounter,
    labelText,
    supportingTextNow,
    showsErrorText: showingError,
    counterText: () => `${props().value.length} / ${props().maxlength}`,
  };
}
