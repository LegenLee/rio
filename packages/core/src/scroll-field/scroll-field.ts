// The scroll field (M3 Expressive): a column of values that scrolls to the one in the middle, or
// takes typed text while editing. Props, parts, the values it takes, and its keys.
//
// - The values are numbers from `min` to `max`, a `step` apart, or the app's `options`.
// - A looping field repeats its values in copies, so it can scroll on past either end; items are
//   counted across the copies, and the one in the middle copy stands for its value at rest.
// - While editing, the value in the middle is a text input; Enter takes what was typed, if it is
//   one of the values, and Escape goes back to scrolling.

import type { PartAttrs, PartNode } from '../parts';
import { isBlocked } from '../utils/disabled';
import { numberFormat } from '../utils/intl';
import { hasModifier } from '../utils/keyboard';
import { addSteps } from '../utils/number';
import { resolveProps } from '../utils/object';

/** M3E scroll field sizes, by the width they keep at least. */
export const SCROLL_FIELD_SIZES = ['small', 'medium', 'large'] as const;
export type ScrollFieldSize = (typeof SCROLL_FIELD_SIZES)[number];

/** A value a scroll field takes: a number, or the app's text */
export type ScrollFieldValue = number | string;

export interface ScrollFieldProps {
  /** The value in the middle. Without one, or with one it doesn't take, the first. */
  value?: ScrollFieldValue;
  /** The lowest number, without `options`. */
  min?: number;
  /** The highest number, without `options`. Below `min`, it is `min`. */
  max?: number;
  /** The distance between numbers, without `options`. Not above zero, it is 1. */
  step?: number;
  /** The values it takes, in order, in place of `min`, `max`, and `step`. */
  options?: readonly ScrollFieldValue[];
  /**
   * Writes a value. By default, a number is written in the language's digits, with at least two of
   * them, and text as it is.
   */
  format?: (value: ScrollFieldValue) => string;
  /** Names the field for assistive technology, such as "Minutes". */
  label?: string;
  /** Whether the values go round: after the last, the first again. */
  loop?: boolean;
  /**
   * The width it keeps at least. By default, from the longest value written: small for 1 or 2
   * characters, medium for 3, large for more.
   */
  size?: ScrollFieldSize;
  /** Whether it takes typed text in place of scrolling. */
  editing?: boolean;
  /**
   * Shows the value as incorrect. The field sets it when typed text isn't one of its values; the
   * app can set it too, as for values that don't go together.
   */
  invalid?: boolean;
  /** The language numbers are written in. */
  locale?: string;
  /** Submits the value with a form under this name. */
  name?: string;
  /** Native-like disabled: not focusable, and nothing changes it. */
  disabled?: boolean;
  /**
   * Disabled but still focusable, so it stays discoverable, as on the button. Deviates from the
   * spec, which says disabled components can't be focused.
   */
  softDisabled?: boolean;
}

export const scrollFieldDefaults = {
  min: 0,
  max: 100,
  step: 1,
  loop: false,
  editing: false,
  invalid: false,
  disabled: false,
  softDisabled: false,
} satisfies Required<
  Pick<
    ScrollFieldProps,
    'min' | 'max' | 'step' | 'loop' | 'editing' | 'invalid' | 'disabled' | 'softDisabled'
  >
>;

/** The numbers of the range, as `min`, `max`, and `step` give them */
const range = (props: ScrollFieldProps) => {
  const min = Number.isFinite(props.min) ? props.min! : scrollFieldDefaults.min;
  const max = Math.max(min, Number.isFinite(props.max) ? props.max! : scrollFieldDefaults.max);
  const step =
    Number.isFinite(props.step) && props.step! > 0 ? props.step! : scrollFieldDefaults.step;
  return { min, max, step, count: Math.floor((max - min) / step + 1e-9) + 1 };
};

/** How many values a scroll field takes */
const countOf = (props: ScrollFieldProps) => props.options?.length || range(props).count;

/** The value at a place among the values, without listing them all */
const valueOf = (props: ScrollFieldProps, at: number): ScrollFieldValue => {
  if (props.options?.length) return props.options[at]!;
  const { min, step } = range(props);
  return addSteps(min, step, at);
};

/** The values a scroll field takes, in order: its `options`, or the numbers of its range. */
export function scrollFieldValues(props: ScrollFieldProps): readonly ScrollFieldValue[] {
  if (props.options?.length) return props.options;
  return Array.from({ length: countOf(props) }, (_, i) => valueOf(props, i));
}

/** Where `value` is among the values, or the first's place, 0, for one it doesn't take. */
export function scrollFieldIndex(
  value: ScrollFieldValue | undefined,
  props: ScrollFieldProps,
): number {
  if (props.options?.length) return Math.max(0, props.options.indexOf(value!));
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const { min, step, count } = range(props);
  return Math.min(count - 1, Math.max(0, Math.round((value - min) / step)));
}

/** A value as the field writes it: by `format`, or as its default says. */
export function scrollFieldText(value: ScrollFieldValue, props: ScrollFieldProps): string {
  if (props.format) return props.format(value);
  if (typeof value === 'string') return value;
  try {
    return numberFormat(props.locale, { minimumIntegerDigits: 2, useGrouping: false }).format(
      value,
    );
  } catch {
    return String(value).padStart(2, '0');
  }
}

/** The size for values written this long, in characters */
const sizeFor = (length: number): ScrollFieldSize =>
  length <= 2 ? 'small' : length === 3 ? 'medium' : 'large';

/** The language's digits, 0 to 9, each mapped to its Latin one */
const digitsOf = (locale: string | undefined) => {
  const map = new Map<string, string>();
  try {
    const format = numberFormat(locale, { useGrouping: false });
    for (let d = 0; d <= 9; d++) map.set(format.format(d), String(d));
  } catch {
    // An unknown language: Latin digits only.
  }
  return map;
};

/**
 * The value typed text stands for, or `undefined` for text that isn't one: a value written as the
 * field writes it, in any case, or a number of the range or the options typed in the language's
 * digits or Latin ones.
 */
export function readScrollFieldText(
  text: string,
  props: ScrollFieldProps,
): ScrollFieldValue | undefined {
  const typed = text.trim();
  if (!typed) return undefined;
  const values = scrollFieldValues(props);
  const lower = typed.toLocaleLowerCase(props.locale);
  const written = values.find(
    (value) => scrollFieldText(value, props).toLocaleLowerCase(props.locale) === lower,
  );
  if (written !== undefined) return written;
  const digits = digitsOf(props.locale);
  const latin = [...typed].map((c) => digits.get(c) ?? c).join('');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(latin)) return undefined;
  const number = Number(latin);
  if (props.options?.length) return props.options.find((value) => value === number);
  const { min, max, step } = range(props);
  if (number < min || number > max) return undefined;
  const steps = (number - min) / step;
  return Math.abs(steps - Math.round(steps)) < 1e-9
    ? addSteps(min, step, Math.round(steps))
    : undefined;
}

/**
 * What typed text completes to: the first value written in text, not as a number, that starts with
 * it, in any case. `undefined` when none does.
 */
export function completeScrollFieldText(text: string, props: ScrollFieldProps): string | undefined {
  if (!text) return undefined;
  const lower = text.toLocaleLowerCase(props.locale);
  for (const value of scrollFieldValues(props)) {
    if (typeof value === 'number') continue;
    const written = scrollFieldText(value, props);
    if (written.toLocaleLowerCase(props.locale).startsWith(lower)) return written;
  }
  return undefined;
}

/** Items a looping field keeps at least on either side of the middle copy */
const LOOP_REACH = 40;

/** How many copies of the values a field holds: one, or enough to scroll on past either end. */
export function scrollFieldCopies(count: number, loop: boolean): number {
  return loop && count > 0 ? 2 * Math.ceil(LOOP_REACH / count) + 1 : 1;
}

export interface ScrollFieldOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => ScrollFieldProps;
  /** Unique within the page: the options' ids start with `options`. */
  ids: { options: string };
  /**
   * The item in the middle, counted across the copies, as `attachScrollField` reports it
   * (`onCenterChange`). The adapter keeps it. Until then, the value's item.
   */
  center?: () => number | undefined;
  /** Called with the requested value. Adapters wire it to v-model, a callback prop, and so on. */
  onChange: (value: ScrollFieldValue) => void;
  /** Called to start or end editing. */
  onEditingChange: (editing: boolean) => void;
}

/** The scroll field's markup, part by part. `scrollFieldSkeleton` says how the adapter nests them. */
export interface ScrollFieldParts {
  /**
   * The field: while it scrolls, a list box for assistive technology, whose active option is the
   * value's, and the keys.
   */
  root: () => PartAttrs;
  /**
   * Scrolls, and holds an `item` for each of `items()`. Its height and the items' make the item at
   * the top of its scroll the one in the middle.
   */
  viewport: () => PartAttrs;
  /**
   * A value in the column; its text is `itemText(index)`, which it carries as `data-text` too. In a
   * looping field, the items of the middle copy are the list box's options, and the other copies
   * are hidden from assistive technology.
   */
  item: (index: number) => PartAttrs;
  /**
   * The text input that stands in for the value in the middle while editing. `attachScrollField`
   * fills it with `valueText()` as editing starts.
   */
  input: () => PartAttrs;
  /** Submits the value with a form, under `name`. */
  hiddenInput: () => PartAttrs;
}

type ScrollFieldPart = 'root' | 'viewport' | 'input' | 'hiddenInput';

export const scrollFieldSkeleton: PartNode<ScrollFieldPart, 'showsInput' | 'showsHiddenInput'> = {
  part: 'root',
  tag: 'div',
  children: [
    // The items, `item(index)` each
    { part: 'viewport', tag: 'div', content: true },
    { part: 'input', tag: 'input', when: 'showsInput' },
    { part: 'hiddenInput', tag: 'input', when: 'showsHiddenInput' },
  ],
};

/** What `handleKeydown` reads from a key event: a DOM one, or a framework's own */
export interface ScrollFieldKeyEvent {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  defaultPrevented: boolean;
  preventDefault(): void;
}

export interface ScrollFieldApi {
  parts: ScrollFieldParts;
  /** Every item, counted across the copies */
  items: () => readonly number[];
  itemText: (index: number) => string;
  /** The values it takes, once */
  values: () => readonly ScrollFieldValue[];
  /** The value it shows: the prop's, or the first for one it doesn't take. */
  value: () => ScrollFieldValue;
  /** The value, written */
  valueText: () => string;
  /** The value's item nearest `near`, counted across the copies; in the middle copy without it. */
  targetIndex: (near?: number) => number;
  /**
   * The item in the middle, which `item()` marks: as reported, or the value's. An item's part
   * changes only with it and with the item's text.
   */
  centerIndex: () => number;
  size: () => ScrollFieldSize;
  showsInput: () => boolean;
  showsHiddenInput: () => boolean;
  /** Whether nothing can change it now: disabled or soft-disabled. */
  blocked: () => boolean;
  /** Attach to the root's `keydown`. */
  handleKeydown: (event: ScrollFieldKeyEvent) => void;
  /**
   * Asks for an item's value. Attach to each item's `click`, and to `attachScrollField`'s
   * `onCenterChange` when the person scrolled the item into the middle.
   */
  selectItem: (index: number) => void;
  /**
   * Asks for the value `by` places from the value, as the arrow keys do. Attach to
   * `attachScrollField`'s `onStep`. Whether the field takes it: not while blocked or editing.
   */
  step: (by: number) => boolean;
  /** The value typed text stands for (`readScrollFieldText`). */
  readText: (text: string) => ScrollFieldValue | undefined;
  /** What typed text completes to (`completeScrollFieldText`). */
  completeText: (text: string) => string | undefined;
}

export function createScrollField(options: ScrollFieldOptions): ScrollFieldApi {
  /** Defaults under the given props, skipping props that are explicitly `undefined`. */
  const props = () => resolveProps(scrollFieldDefaults, options.props());
  const values = () => scrollFieldValues(props());
  const count = () => countOf(props());
  const copies = () => scrollFieldCopies(count(), props().loop);
  const index = () => scrollFieldIndex(props().value, props());
  const value = () => valueOf(props(), index());
  const valueAt = (item: number) => valueOf(props(), item % count());
  const blocked = () => isBlocked(props());
  const targetIndex = (near?: number) => {
    const n = count();
    const middle = Math.floor(copies() / 2) * n + index();
    if (near === undefined || copies() === 1) return middle;
    // The copy whose item is nearest `near`, within the copies
    const copy = Math.round((near - index()) / n);
    return Math.min(copies() - 1, Math.max(0, copy)) * n + index();
  };
  const centerIndex = () => options.center?.() ?? targetIndex();
  const optionId = (at: number) => `${options.ids.options}-${at}`;
  const size = () => {
    const p = props();
    if (p.size) return p.size;
    // Numbers of a range, written by default: the longest are at the ends, or carry a step's
    // decimals. Other values, each written.
    const n = count();
    const written =
      p.options?.length || p.format
        ? values()
        : [valueOf(p, 0), valueOf(p, Math.min(1, n - 1)), valueOf(p, n - 1)];
    return sizeFor(Math.max(0, ...written.map((v) => [...scrollFieldText(v, p)].length)));
  };
  const numeric = () => !props().options?.length || values().every((v) => typeof v === 'number');
  /** The keyboard for typing: digits alone, or with a decimal point; any, for text or below 0 */
  const inputMode = () => {
    if (!numeric()) return undefined;
    const p = props();
    const numbers = p.options?.length ? p.options.map(Number) : [Number(valueOf(p, 0)), p.step];
    if (numbers.some((v) => v < 0)) return undefined;
    return numbers.every((v) => Number.isInteger(v)) ? 'numeric' : 'decimal';
  };
  const move = (to: number) => {
    const n = count();
    const p = props();
    const next = p.loop ? ((to % n) + n) % n : Math.min(n - 1, Math.max(0, to));
    if (next !== index()) options.onChange(valueOf(p, next));
  };

  return {
    parts: {
      root() {
        const p = props();
        const editing = p.editing;
        return {
          class: 'rio-scroll-field rio-focus-ring',
          role: editing ? undefined : 'listbox',
          tabindex: editing || p.disabled ? undefined : '0',
          'aria-label': editing ? undefined : p.label,
          'aria-activedescendant': editing ? undefined : optionId(index()),
          'aria-invalid': !editing && p.invalid ? 'true' : undefined,
          'aria-disabled': !editing && blocked() ? 'true' : undefined,
          'data-size': size(),
          'data-editing': editing ? '' : undefined,
          'data-invalid': p.invalid ? '' : undefined,
          'data-disabled': blocked() ? '' : undefined,
        };
      },
      viewport: () => ({ class: 'rio-scroll-field__viewport', tabindex: '-1' }),
      item(item) {
        const center = centerIndex();
        const n = count();
        const option = Math.floor(item / n) === Math.floor(copies() / 2);
        const at = item % n;
        const text = scrollFieldText(valueAt(item), props());
        return {
          class: 'rio-scroll-field__item',
          role: option ? 'option' : undefined,
          id: option ? optionId(at) : undefined,
          // The name, whatever the stylesheet adds around the text
          'aria-label': option ? text : undefined,
          'aria-selected': option ? String(at === index()) : undefined,
          'aria-hidden': option ? undefined : 'true',
          // The stylesheet sizes each item for its text written as the value in the middle is.
          'data-text': text,
          'data-selected': item === center ? '' : undefined,
        };
      },
      input() {
        const p = props();
        return {
          class: 'rio-scroll-field__input',
          type: 'text',
          inputmode: inputMode(),
          autocomplete: 'off',
          spellcheck: 'false',
          'aria-label': p.label,
          'aria-invalid': p.invalid ? 'true' : undefined,
          disabled: p.disabled ? '' : undefined,
          readonly: p.softDisabled && !p.disabled ? '' : undefined,
        };
      },
      hiddenInput() {
        const p = props();
        return {
          type: 'hidden',
          name: p.name,
          value: String(value()),
          disabled: p.disabled ? '' : undefined,
        };
      },
    },
    items: () => Array.from({ length: copies() * count() }, (_, i) => i),
    itemText(item) {
      // Read for every item on each render: the props as given, without the defaults filled in
      const raw = options.props();
      return scrollFieldText(valueOf(raw, item % countOf(raw)), raw);
    },
    values,
    value,
    valueText: () => scrollFieldText(value(), props()),
    targetIndex,
    centerIndex,
    size,
    showsInput: () => props().editing,
    showsHiddenInput: () => props().name !== undefined,
    blocked,
    handleKeydown(event) {
      const p = props();
      if (event.defaultPrevented || p.editing) return;
      if (hasModifier(event)) return;
      const last = count() - 1;
      const to: Record<string, number | undefined> = {
        ArrowUp: index() - 1,
        ArrowDown: index() + 1,
        Home: 0,
        End: last,
      };
      if (event.key in to) {
        if (to[event.key] === undefined) return;
        event.preventDefault();
        if (!blocked()) move(to[event.key]!);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!blocked()) options.onEditingChange(true);
      }
    },
    selectItem(item) {
      if (blocked() || props().editing) return;
      move(item % count());
    },
    step(by) {
      if (blocked() || props().editing) return false;
      move(index() + by);
      return true;
    },
    readText: (text) => readScrollFieldText(text, props()),
    completeText: (text) => completeScrollFieldText(text, props()),
  };
}
