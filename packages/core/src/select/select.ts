import type { MenuVariant } from '../menu/menu';
import type { CancelableEvent, PartAttrs, PartNode } from '../parts';
import type { TextFieldVariant } from '../text-field/text-field';
import { omitUndefined } from '../utils/object';

/** Identifies an option, through its `value` prop. */
export type SelectValue = string | number;

/** The selected value (or `undefined`), or with `multiple`, the selected values. */
export type SelectSelected = SelectValue | SelectValue[] | undefined;

export interface SelectProps {
  /** The field's look, as a text field's. Defaults to `'filled'`. */
  variant?: TextFieldVariant;
  /** Names the select. It rests inside the field while nothing is selected, and moves to the top. */
  label?: string;
  /** Any number of options can be selected, and the list stays open while choosing. */
  multiple?: boolean;
  /** The selected value, or the selected values with `multiple`. The adapter owns it. */
  selected?: SelectSelected;
  /** Whether the list of options is shown. The adapter owns it. */
  open?: boolean;
  /** Text below the field, about what to choose */
  supportingText?: string;
  /** Shows the field in the error color, and marks it invalid. */
  error?: boolean;
  /** Takes the supporting text's place while `error` is set, and is announced. */
  errorText?: string;
  /** Asks for a selection; the label ends with an asterisk. */
  required?: boolean;
  disabled?: boolean;
  /** Submits the selection with a form, under this name. */
  name?: string;
  /** Lets the browser fill in the selection, such as `country`. */
  autocomplete?: string;
  /** The list's color style, as a menu's. Defaults to `'standard'`. */
  menuVariant?: MenuVariant;
  /** Opens and closes the list without the expanding motion. */
  instant?: boolean;
}

export const selectDefaults = {
  variant: 'filled',
  multiple: false,
  open: false,
  error: false,
  required: false,
  disabled: false,
  menuVariant: 'standard',
  instant: false,
} satisfies Partial<Record<keyof SelectProps, unknown>>;

/** An option as the select sees it. The adapter collects them, in the order they appear. */
export interface SelectOptionInfo {
  value: SelectValue;
  /** The option's label as text, which the field shows while it is selected */
  label: string;
}

/** What the adapter has to put in the field, which only the adapter can see. */
export interface SelectContent {
  leadingIcon: boolean;
}

export interface SelectOptions {
  props: () => SelectProps;
  /** The options, in the order they appear in the list. */
  options: () => readonly SelectOptionInfo[];
  /** Without it, the field has no icon. */
  content?: () => SelectContent;
  /** Ids for the parts that refer to each other, unique in the document. The adapter makes them. */
  ids: { field: string; label: string; listbox: string; supportingText: string };
  /**
   * The name the app gave the field itself, without a `label`: its `aria-label`, or the ids in its
   * `aria-labelledby`. The list takes the same name.
   */
  appName?: () => { label?: string; labelledBy?: string };
  /** Called with the requested selection. */
  onChange: (selected: SelectSelected) => void;
  /** Called with the requested `open`, such as `false` once an option is chosen. */
  onOpenChange: (open: boolean) => void;
}

/** The select's markup, part by part. `selectSkeleton` says how the adapter nests them. */
export interface SelectParts {
  /** A text field's root, for its look, with the select's own class next to it */
  root: () => PartAttrs;
  /** The field's box: the outline and the label over the container, as in a text field. */
  frame: () => PartAttrs;
  /** The 56px box. Pressing anywhere on it opens the list. */
  container: () => PartAttrs;
  outline: () => PartAttrs;
  outlineStart: () => PartAttrs;
  /** Holds a copy of `labelText()`, which sizes the gap in the outline. */
  outlineNotch: () => PartAttrs;
  outlineEnd: () => PartAttrs;
  /** Holds `labelText()`. The field takes its name from it. */
  label: () => PartAttrs;
  leadingIcon: () => PartAttrs;
  content: () => PartAttrs;
  /** The `combobox`, which takes the focus and shows the selection */
  field: () => PartAttrs;
  /** Holds `valueText()` on one line, cut short with an ellipsis when it doesn't fit. */
  value: () => PartAttrs;
  /**
   * Holds each of `sizerTexts()` in a `<span>`, unseen, so the field is as wide as the widest of
   * them, as a native `<select>` is as wide as its widest option.
   */
  sizer: () => PartAttrs;
  /** The dropdown arrow, which turns over while the list is open */
  arrow: () => PartAttrs;
  /** The line below the field */
  supporting: () => PartAttrs;
  /** Holds `supportingTextNow()`. */
  supportingText: () => PartAttrs;
  /** The `listbox`, a menu's surface shown in the top layer. Its children are the options. */
  listbox: () => PartAttrs;
  /**
   * A native `<select>` hidden over the container, for forms: it submits the selection, checks
   * `required`, and takes changes from the browser, as autofill would make. It holds an `<option>` per option, with
   * `nativeValue()` as its value and the option's label as its text. Without `multiple`, an empty
   * `<option value="">` comes first and stands for no selection, which `required` turns down: a
   * single native `<select>` always has one of its options selected.
   */
  native: () => PartAttrs;
}

type SelectWhen = 'showsOutline' | 'showsLabel' | 'showsLeadingIcon' | 'showsSupporting';

export const selectSkeleton: PartNode<keyof SelectParts, SelectWhen> = {
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
        { part: 'label', tag: 'span', when: 'showsLabel', content: true },
        {
          part: 'container',
          tag: 'div',
          children: [
            { part: 'leadingIcon', tag: 'span', when: 'showsLeadingIcon', content: true },
            {
              part: 'content',
              tag: 'div',
              children: [
                {
                  part: 'field',
                  tag: 'div',
                  children: [
                    { part: 'value', tag: 'span', content: true },
                    { part: 'sizer', tag: 'span', content: true },
                  ],
                },
              ],
            },
            { part: 'arrow', tag: 'span' },
            { part: 'native', tag: 'select', content: true },
          ],
        },
      ],
    },
    {
      part: 'supporting',
      tag: 'div',
      when: 'showsSupporting',
      children: [{ part: 'supportingText', tag: 'span', content: true }],
    },
    { part: 'listbox', tag: 'div', content: true },
  ],
};

export interface SelectApi extends Record<SelectWhen, () => boolean> {
  parts: SelectParts;
  /** The label, with an asterisk when a selection is required */
  labelText: () => string;
  /** The error text while in error and there is one, otherwise the supporting text */
  supportingTextNow: () => string;
  /** Whether the supporting text part holds the error text now, as an alert */
  showsErrorText: () => boolean;
  /**
   * The selected option's label. With `multiple`, the selected options' labels, in the order of the
   * options, separated by commas, such as `Small, Large`.
   */
  valueText: () => string;
  /** The selected options' labels, in the order of the options */
  selectedLabels: () => string[];
  /** The texts the field makes room for: the label and every option's label */
  sizerTexts: () => string[];
  /** Whether `multiple` is set, with the default filled in */
  multiple: () => boolean;
  /** The selected values, as an array, whichever the mode */
  selectedValues: () => SelectValue[];
  isSelected: (value: SelectValue) => boolean;
  /**
   * An option was chosen. It becomes the selection and the list asks to close; with `multiple`, it
   * is added or taken out, and the list stays open.
   */
  choose: (value: SelectValue) => void;
  /**
   * The native `<select>` changed on its own, as the browser's autofill changes it: the values it
   * holds now, as `nativeValue()` spells them.
   */
  nativeChanged: (values: readonly string[]) => void;
  /** An option's value in the native `<select>`, which takes only text */
  nativeValue: (value: SelectValue) => string;
  /** Asks for the list to open or close. A disabled select doesn't open. */
  setOpen: (open: boolean) => void;
}

const NO_CONTENT: SelectContent = { leadingIcon: false };

const valuesOf = (selected: SelectSelected): SelectValue[] =>
  selected === undefined ? [] : Array.isArray(selected) ? selected : [selected];

export function createSelect(options: SelectOptions): SelectApi {
  const props = () => ({ ...selectDefaults, ...omitUndefined(options.props()) });
  const content = () => options.content?.() ?? NO_CONTENT;
  const { ids } = options;

  const selectedValues = () => valuesOf(props().selected);
  const isSelected = (value: SelectValue) => selectedValues().includes(value);
  /** The selected options, in the order of the list */
  const selectedOptions = () => options.options().filter((option) => isSelected(option.value));

  const showsLabel = () => !!props().label;
  const showingError = () => props().error && !!props().errorText;
  const supportingTextNow = () =>
    showingError() ? props().errorText! : (props().supportingText ?? '');
  const showsSupporting = () => supportingTextNow() !== '';
  const setOpen = (open: boolean) => {
    if (open && props().disabled) return;
    options.onOpenChange(open);
  };

  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-text-field rio-select',
          'data-variant': p.variant,
          'data-populated': selectedOptions().length ? '' : undefined,
          'data-label': showsLabel() ? '' : undefined,
          'data-leading-icon': content().leadingIcon ? '' : undefined,
          'data-trailing-icon': '',
          // The focus is in the list, and the field looks focused all the same.
          'data-focused': p.open ? '' : undefined,
          'data-open': p.open ? '' : undefined,
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
      label: () => ({ class: 'rio-text-field__label', id: ids.label }),
      leadingIcon: () => ({ class: 'rio-text-field__leading-icon' }),
      content: () => ({ class: 'rio-text-field__content' }),
      field() {
        const p = props();
        return {
          class: 'rio-text-field__input rio-select__field',
          id: ids.field,
          role: 'combobox',
          tabindex: p.disabled ? undefined : '0',
          'aria-labelledby': showsLabel() ? ids.label : options.appName?.().labelledBy,
          'aria-haspopup': 'listbox',
          'aria-expanded': String(p.open),
          'aria-controls': ids.listbox,
          'aria-required': p.required ? 'true' : undefined,
          'aria-invalid': p.error ? 'true' : undefined,
          'aria-disabled': p.disabled ? 'true' : undefined,
          'aria-describedby': showsSupporting() ? ids.supportingText : undefined,
        };
      },
      value: () => ({ class: 'rio-select__value' }),
      sizer: () => ({ class: 'rio-select__sizer', 'aria-hidden': 'true' }),
      arrow: () => ({ class: 'rio-select__arrow', 'aria-hidden': 'true' }),
      supporting: () => ({ class: 'rio-text-field__supporting' }),
      supportingText: () => ({
        class: 'rio-text-field__supporting-text',
        id: ids.supportingText,
        // An error is announced as it appears.
        role: showingError() ? 'alert' : undefined,
      }),
      listbox() {
        const p = props();
        return {
          class: 'rio-menu rio-select__listbox',
          id: ids.listbox,
          role: 'listbox',
          tabindex: '-1',
          'aria-labelledby': showsLabel() ? ids.label : options.appName?.().labelledBy,
          'aria-label': showsLabel() ? undefined : options.appName?.().label,
          'aria-multiselectable': p.multiple ? 'true' : undefined,
          'data-variant': p.menuVariant,
          'data-instant': p.instant ? '' : undefined,
        };
      },
      native() {
        const p = props();
        return {
          class: 'rio-select__native',
          'aria-hidden': 'true',
          tabindex: '-1',
          name: p.name,
          autocomplete: p.autocomplete,
          multiple: p.multiple ? '' : undefined,
          required: p.required ? '' : undefined,
          disabled: p.disabled ? '' : undefined,
        };
      },
    },
    showsOutline: () => props().variant === 'outlined',
    showsLabel,
    showsLeadingIcon: () => content().leadingIcon,
    showsSupporting,
    labelText: () => `${props().label ?? ''}${props().required ? '*' : ''}`,
    supportingTextNow,
    showsErrorText: showingError,
    valueText: () =>
      selectedOptions()
        .map((option) => option.label)
        .join(', '),
    selectedLabels: () => selectedOptions().map((option) => option.label),
    sizerTexts: () => [props().label ?? '', ...options.options().map((option) => option.label)],
    multiple: () => props().multiple,
    selectedValues,
    isSelected,
    choose(value) {
      const p = props();
      if (p.multiple) {
        const current = selectedValues();
        options.onChange(
          isSelected(value) ? current.filter((other) => other !== value) : [...current, value],
        );
        return;
      }
      if (!isSelected(value)) options.onChange(value);
      options.onOpenChange(false);
    },
    nativeChanged(values) {
      const chosen = options
        .options()
        .filter((option) => values.includes(String(option.value)))
        .map((option) => option.value);
      if (props().multiple) options.onChange(chosen);
      else if (chosen[0] !== undefined && !isSelected(chosen[0])) options.onChange(chosen[0]);
    },
    nativeValue: (value) => String(value),
    setOpen,
  };
}

// Options

export interface SelectOptionProps {
  /** What the select's `v-model` takes when this option is chosen */
  value: SelectValue;
  /** Still focusable, but can't be chosen. */
  disabled?: boolean;
}

export const selectOptionDefaults = {
  disabled: false,
} satisfies Omit<Required<SelectOptionProps>, 'value'>;

/** What the adapter has to put in the option, which only the adapter can see. */
export interface SelectOptionContent {
  /** A leading icon */
  icon: boolean;
  /** Supporting text under the label */
  supportingText: boolean;
  /** Trailing text */
  trailingText: boolean;
  /** A trailing icon */
  trailingIcon: boolean;
}

export interface SelectOptionOptions<E extends CancelableEvent = MouseEvent> {
  props: () => SelectOptionProps;
  /** Without it, the option has only a label. */
  content?: () => SelectOptionContent;
  /** The select the option is in */
  select: () => Pick<SelectApi, 'isSelected' | 'choose'> | undefined;
  /** Called for a click on the option that isn't blocked, before the select is told. */
  onClick?: (event: E) => void;
}

/** An option has the parts of a menu item, and looks like one. */
export interface SelectOptionParts {
  /** A `<button>` with the role `option` */
  root: () => PartAttrs;
  /** Extends the 44px option to a 48px target, over the space between options. */
  touch: () => PartAttrs;
  icon: () => PartAttrs;
  /** Holds the label and the supporting text, one above the other */
  text: () => PartAttrs;
  label: () => PartAttrs;
  supportingText: () => PartAttrs;
  trailingText: () => PartAttrs;
  trailingIcon: () => PartAttrs;
}

type SelectOptionWhen =
  | 'showsIcon'
  | 'showsSupportingText'
  | 'showsTrailingText'
  | 'showsTrailingIcon';

export const selectOptionSkeleton: PartNode<keyof SelectOptionParts, SelectOptionWhen> = {
  part: 'root',
  tag: 'button',
  children: [
    { part: 'touch', tag: 'span' },
    { part: 'icon', tag: 'span', when: 'showsIcon', content: true },
    {
      part: 'text',
      tag: 'span',
      children: [
        { part: 'label', tag: 'span', content: true },
        { part: 'supportingText', tag: 'span', when: 'showsSupportingText', content: true },
      ],
    },
    { part: 'trailingText', tag: 'span', when: 'showsTrailingText', content: true },
    { part: 'trailingIcon', tag: 'span', when: 'showsTrailingIcon', content: true },
  ],
};

export interface SelectOptionApi<E extends CancelableEvent = MouseEvent> extends Record<
  SelectOptionWhen,
  () => boolean
> {
  parts: SelectOptionParts;
  selected: () => boolean;
  /** Attach to the option's `click`. */
  handleClick: (event: E) => void;
}

const NO_OPTION_CONTENT: SelectOptionContent = {
  icon: false,
  supportingText: false,
  trailingText: false,
  trailingIcon: false,
};

export function createSelectOption<E extends CancelableEvent = MouseEvent>(
  options: SelectOptionOptions<E>,
): SelectOptionApi<E> {
  const props = () => ({ ...selectOptionDefaults, ...omitUndefined(options.props()) });
  const content = () => options.content?.() ?? NO_OPTION_CONTENT;
  const selected = () => !!options.select()?.isSelected(options.props().value);

  return {
    parts: {
      root() {
        const p = props();
        return {
          class: 'rio-menu-item rio-state-layer rio-focus-ring rio-select-option',
          type: 'button',
          role: 'option',
          // Focus moves with the arrow keys, so the options are left out of the Tab order.
          tabindex: '-1',
          'aria-selected': String(selected()),
          // Not native `disabled`: disabled options stay focusable.
          'aria-disabled': p.disabled ? 'true' : undefined,
          'data-selected': String(selected()),
          'data-focus-ring': 'inner',
        };
      },
      touch: () => ({ class: 'rio-menu-item__touch', 'aria-hidden': 'true' }),
      icon: () => ({ class: 'rio-menu-item__icon', 'aria-hidden': 'true' }),
      text: () => ({ class: 'rio-menu-item__text' }),
      label: () => ({ class: 'rio-menu-item__label' }),
      supportingText: () => ({ class: 'rio-menu-item__supporting-text' }),
      trailingText: () => ({ class: 'rio-menu-item__trailing-text' }),
      trailingIcon: () => ({ class: 'rio-menu-item__trailing-icon', 'aria-hidden': 'true' }),
    },
    showsIcon: () => content().icon,
    showsSupportingText: () => content().supportingText,
    showsTrailingText: () => content().trailingText,
    showsTrailingIcon: () => content().trailingIcon,
    selected,
    handleClick(event) {
      if (props().disabled) {
        event.preventDefault();
        return;
      }
      options.onClick?.(event);
      options.select()?.choose(options.props().value);
    },
  };
}
