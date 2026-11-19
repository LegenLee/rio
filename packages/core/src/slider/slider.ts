// The slider and the range slider: props, parts, and the values they take.

import type { SliderMessages } from '../locale/messages';
import type { PartAttrs, PartNode } from '../parts';
import { disabledAttrs, isBlocked } from '../utils/disabled';
import { numberFormat } from '../utils/intl';
import { resolveProps } from '../utils/object';

/** M3E slider sizes, by the track's thickness. `xsmall` is the default. */
export const SLIDER_SIZES = ['xsmall', 'small', 'medium', 'large', 'xlarge'] as const;
export type SliderSize = (typeof SLIDER_SIZES)[number];

/** What the slider and the range slider share. */
export interface SliderCommonProps {
  /** The lowest value. */
  min?: number;
  /** The highest value. */
  max?: number;
  /** The values the slider takes: `min`, and every step from it up to `max`. */
  step?: number;
  /** Shows a stop indicator at each step. */
  stops?: boolean;
  size?: SliderSize;
  /** Runs from the bottom up instead of from the start to the end. */
  vertical?: boolean;
  /** Shows the value over the handle while it is pressed, dragged, or focused from the keyboard. */
  valueIndicator?: boolean;
  /**
   * Writes a value for the value indicator and for assistive technology. Without it, the value is
   * written as a number in `locale`.
   */
  format?: (value: number) => string;
  /** The language numbers are written in. The adapter resolves it. */
  locale?: string;
  /** Native disabled: not focusable and not pressable. This is the spec's behavior. */
  disabled?: boolean;
  /**
   * Disabled but still focusable, so it stays discoverable. Presses, drags, and keys are blocked
   * in JavaScript instead. This deviates from the spec, which says disabled components can't be
   * focused.
   */
  softDisabled?: boolean;
}

export interface SliderProps extends SliderCommonProps {
  /** The value. Defaults to `min`. */
  value?: number;
  /** The active track runs from the middle of the range to the handle, for values on both sides. */
  centered?: boolean;
}

export interface RangeSliderProps extends SliderCommonProps {
  /** The start and the end of the range. Defaults to `min` and `max`. */
  value?: readonly [number, number];
  /** The name both inputs submit their values under with a form, the start's first. */
  name?: string;
}

export const sliderDefaults = {
  min: 0,
  max: 100,
  step: 1,
  stops: false,
  size: 'xsmall',
  vertical: false,
  valueIndicator: false,
  disabled: false,
  softDisabled: false,
  centered: false,
} satisfies Required<Omit<SliderProps, 'value' | 'format' | 'locale'>>;

/** The values a slider takes: from `min` to `max`, by `step`. */
export interface SliderRange {
  min: number;
  max: number;
  step: number;
}

/**
 * The range of the props, as a native range input reads it: `max` below `min` is `min`, and a
 * `step` that isn't above zero is 1.
 */
export function sliderRange(props: SliderCommonProps): SliderRange {
  const min = Number.isFinite(props.min) ? props.min! : sliderDefaults.min;
  const max = Math.max(min, Number.isFinite(props.max) ? props.max! : sliderDefaults.max);
  const step = Number.isFinite(props.step) && props.step! > 0 ? props.step! : sliderDefaults.step;
  return { min, max, step };
}

const decimals = (value: number) => {
  const text = String(value);
  const exponent = text.indexOf('e-');
  if (exponent >= 0) return Number(text.slice(exponent + 2));
  const point = text.indexOf('.');
  return point < 0 ? 0 : text.length - point - 1;
};

/**
 * The value nearest `value` that the slider takes: within the range, on a step. Where `max` isn't
 * on a step, the last step below it is the highest value, as in a native range input.
 */
export function snapSliderValue(value: number, range: SliderRange): number {
  const { min, max, step } = range;
  if (!Number.isFinite(value)) return min;
  const last = Math.floor((max - min) / step + 1e-9);
  const steps = Math.min(last, Math.max(0, Math.round((value - min) / step)));
  // Without the rounding, steps such as 0.1 would add up to 0.30000000000000004.
  const places = Math.min(100, Math.max(decimals(min), decimals(step)));
  return Number((min + steps * step).toFixed(places));
}

/** Where a value sits along the track, from 0 at `min` to 1 at `max`. */
const fractionOf = (value: number, { min, max }: SliderRange) =>
  max > min ? (value - min) / (max - min) : 0;

/** Number of steps along the track, for the stop indicators. */
const stopCount = ({ min, max, step }: SliderRange) => (max - min) / step;

const formatValue = (value: number, props: SliderCommonProps) => {
  if (props.format) return props.format(value);
  try {
    return numberFormat(props.locale).format(value);
  } catch {
    return String(value);
  }
};

/** The sizes the spec gives the inset icon a size for */
const ICON_SIZES: readonly SliderSize[] = ['medium', 'large', 'xlarge'];

/** What the adapter has to put in the slider, which only the adapter can see. */
export interface SliderContent {
  /** Whether there is an icon for the inside of the track. */
  icon: boolean;
}

export interface SliderOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => SliderProps;
  /** Returns what content the adapter has. Without it, the slider has no inset icon. */
  content?: () => SliderContent;
  /**
   * Whether the inset icon sits on the inactive track, because the active one is too short for it,
   * as `attachSlider` reports it (`onIconInactiveChange`). The adapter keeps it.
   */
  iconInactive?: () => boolean;
  /** Called with the requested value. Adapters wire it to v-model, a callback prop, and so on. */
  onChange: (value: number) => void;
}

/** The slider's markup, part by part. `sliderSkeleton` says how the adapter nests them. */
export interface SliderParts {
  /**
   * Lays the slider out and takes the presses. Its `style` carries where the value sits along the
   * track (`--rio-slider-value`, from 0 to 1) and, with stops, how many steps there are
   * (`--rio-slider-stops`).
   */
  root: () => PartAttrs;
  /** The inactive track below the active one, on a centered slider. */
  trackLower: () => PartAttrs;
  trackActive: () => PartAttrs;
  /** The inactive track above the active one. */
  trackUpper: () => PartAttrs;
  /** Holds the inset icon. */
  icon: () => PartAttrs;
  /**
   * The native `<input type="range">`, invisible over the slider. It takes the focus, the keys,
   * and assistive technology, and submits the value with a form; the root takes the presses
   * (`attachSlider`).
   */
  input: () => PartAttrs;
  handle: () => PartAttrs;
  /** Holds the value over the handle (`valueText()`). */
  valueIndicator: () => PartAttrs;
}

export const sliderSkeleton: PartNode<
  keyof SliderParts,
  'showsLowerTrack' | 'showsIcon' | 'showsValueIndicator'
> = {
  part: 'root',
  tag: 'span',
  children: [
    { part: 'trackLower', tag: 'span', when: 'showsLowerTrack' },
    { part: 'trackActive', tag: 'span' },
    { part: 'trackUpper', tag: 'span' },
    { part: 'icon', tag: 'span', when: 'showsIcon', content: true },
    { part: 'input', tag: 'input' },
    {
      part: 'handle',
      tag: 'span',
      children: [
        { part: 'valueIndicator', tag: 'span', when: 'showsValueIndicator', content: true },
      ],
    },
  ],
};

export interface SliderApi {
  parts: SliderParts;
  /** Whether the lower inactive track renders: on a centered slider. */
  showsLowerTrack: () => boolean;
  /** Whether the icon part renders: with an icon, on a standard slider of size M, L, or XL. */
  showsIcon: () => boolean;
  showsValueIndicator: () => boolean;
  /** The text of the value indicator. */
  valueText: () => string;
  /** The value the slider shows: the prop's, within the range and on a step. */
  value: () => number;
  range: () => SliderRange;
  vertical: () => boolean;
  /** Whether a press or a key can't change it now: disabled or soft-disabled. */
  blocked: () => boolean;
  /** Attach to `attachSlider`'s `onMove`. The slider has one handle, at index 0. */
  moveHandle: (index: number, value: number) => void;
}

const rootAttrs = (p: SliderCommonProps, range: SliderRange, blocked: boolean) => ({
  'data-size': p.size ?? sliderDefaults.size,
  'data-vertical': p.vertical ? '' : undefined,
  'data-stops': p.stops ? '' : undefined,
  'data-value-indicator': p.valueIndicator ? '' : undefined,
  'data-disabled': blocked ? '' : undefined,
});

/** The stop count's declaration for the root's `style`, after the values' */
const stopsStyle = (p: SliderCommonProps, range: SliderRange) =>
  p.stops && stopCount(range) > 0 ? `; --rio-slider-stops: ${stopCount(range)}` : '';

const inputAttrs = (
  p: SliderCommonProps,
  min: number,
  max: number,
  step: number,
  value: number,
) => ({
  class: 'rio-slider__input',
  type: 'range',
  min: String(min),
  max: String(max),
  step: String(step),
  value: String(value),
  ...disabledAttrs(p),
  'aria-orientation': p.vertical ? 'vertical' : undefined,
  'aria-valuetext': p.format ? p.format(value) : undefined,
});

export function createSlider(options: SliderOptions): SliderApi {
  const props = () => resolveProps(sliderDefaults, options.props());
  const range = () => sliderRange(props());
  const value = () => {
    const r = range();
    return snapSliderValue(options.props().value ?? r.min, r);
  };
  const blocked = () => isBlocked(props());
  const showsIcon = () => {
    const p = props();
    return !!options.content?.().icon && !p.centered && ICON_SIZES.includes(p.size);
  };

  return {
    parts: {
      root() {
        const p = props();
        const r = range();
        return {
          class: 'rio-slider',
          ...rootAttrs(p, r, blocked()),
          'data-centered': p.centered ? '' : undefined,
          'data-icon': showsIcon() ? '' : undefined,
          'data-icon-inactive': showsIcon() && options.iconInactive?.() ? '' : undefined,
          style: `--rio-slider-value: ${fractionOf(value(), r)}${stopsStyle(p, r)}`,
        };
      },
      trackLower: () => ({ class: 'rio-slider__track-lower' }),
      trackActive: () => ({ class: 'rio-slider__track-active' }),
      trackUpper: () => ({ class: 'rio-slider__track-upper' }),
      icon: () => ({ class: 'rio-slider__icon', 'aria-hidden': 'true' }),
      input() {
        const r = range();
        return inputAttrs(props(), r.min, r.max, r.step, value());
      },
      handle: () => ({ class: 'rio-slider__handle', 'aria-hidden': 'true' }),
      valueIndicator: () => ({ class: 'rio-slider__value-indicator' }),
    },
    showsLowerTrack: () => !!props().centered,
    showsIcon,
    showsValueIndicator: () => !!props().valueIndicator,
    valueText: () => formatValue(value(), props()),
    value,
    range,
    vertical: () => !!props().vertical,
    blocked,
    moveHandle(_index, next) {
      const snapped = snapSliderValue(next, range());
      if (snapped !== value()) options.onChange(snapped);
    },
  };
}

export interface RangeSliderOptions {
  /** Returns the current prop values. The adapter owns the state. */
  props: () => RangeSliderProps;
  /** The names of the two inputs for assistive technology, in the slider's language. */
  messages: () => SliderMessages;
  /** Called with the requested range. Adapters wire it to v-model, a callback prop, and so on. */
  onChange: (value: [number, number]) => void;
}

/** The range slider's markup, part by part. `rangeSliderSkeleton` says how the adapter nests them. */
export interface RangeSliderParts {
  /**
   * A group, named the way the app names it. Its `style` carries where the start and the end sit
   * along the track (`--rio-slider-start` and `--rio-slider-end`, from 0 to 1) and, with stops,
   * how many steps there are (`--rio-slider-stops`).
   */
  root: () => PartAttrs;
  /** The inactive track below the range. */
  trackLower: () => PartAttrs;
  /** The active track, between the handles. */
  trackActive: () => PartAttrs;
  /** The inactive track above the range. */
  trackUpper: () => PartAttrs;
  /**
   * The start's native `<input type="range">`, invisible over the slider, as on the slider. Its
   * `max` is the end's value, so the keys stop there.
   */
  startInput: () => PartAttrs;
  /** The end's input. Its `min` is the start's value. */
  endInput: () => PartAttrs;
  startHandle: () => PartAttrs;
  endHandle: () => PartAttrs;
  /** Hold the values over the handles (`valueText(0)` and `valueText(1)`). */
  startValueIndicator: () => PartAttrs;
  endValueIndicator: () => PartAttrs;
}

export const rangeSliderSkeleton: PartNode<keyof RangeSliderParts, 'showsValueIndicator'> = {
  part: 'root',
  tag: 'span',
  children: [
    { part: 'trackLower', tag: 'span' },
    { part: 'trackActive', tag: 'span' },
    { part: 'trackUpper', tag: 'span' },
    { part: 'startInput', tag: 'input' },
    { part: 'endInput', tag: 'input' },
    {
      part: 'startHandle',
      tag: 'span',
      children: [
        {
          part: 'startValueIndicator',
          tag: 'span',
          when: 'showsValueIndicator',
          content: true,
        },
      ],
    },
    {
      part: 'endHandle',
      tag: 'span',
      children: [
        { part: 'endValueIndicator', tag: 'span', when: 'showsValueIndicator', content: true },
      ],
    },
  ],
};

export interface RangeSliderApi {
  parts: RangeSliderParts;
  showsValueIndicator: () => boolean;
  /** The text of a handle's value indicator: the start's (0) or the end's (1). */
  valueText: (index: number) => string;
  /** The range the slider shows: the prop's, in order, within the range and on steps. */
  value: () => [number, number];
  range: () => SliderRange;
  vertical: () => boolean;
  /** Whether a press or a key can't change it now: disabled or soft-disabled. */
  blocked: () => boolean;
  /**
   * Attach to `attachSlider`'s `onMove`: the start (0) or the end (1) moved. Neither goes past the
   * other.
   */
  moveHandle: (index: number, value: number) => void;
}

export function createRangeSlider(options: RangeSliderOptions): RangeSliderApi {
  const props = () => resolveProps(sliderDefaults, options.props());
  const range = () => sliderRange(props());
  const value = (): [number, number] => {
    const r = range();
    const [start, end] = options.props().value ?? [r.min, r.max];
    const a = snapSliderValue(start, r);
    const b = snapSliderValue(end, r);
    return a <= b ? [a, b] : [b, a];
  };
  const blocked = () => isBlocked(props());
  const input = (index: number, thumb: 'start' | 'end') => {
    const p = props();
    const r = range();
    const [start, end] = value();
    const messages = options.messages();
    return {
      ...(index === 0
        ? inputAttrs(p, r.min, end, r.step, start)
        : inputAttrs(p, start, r.max, r.step, end)),
      name: p.name,
      'aria-label': index === 0 ? messages.rangeStart : messages.rangeEnd,
      'data-thumb': thumb,
    };
  };

  return {
    parts: {
      root() {
        const p = props();
        const r = range();
        const [start, end] = value();
        return {
          class: 'rio-slider',
          role: 'group',
          'data-range': '',
          ...rootAttrs(p, r, blocked()),
          style:
            `--rio-slider-start: ${fractionOf(start, r)}; ` +
            `--rio-slider-end: ${fractionOf(end, r)}${stopsStyle(p, r)}`,
        };
      },
      trackLower: () => ({ class: 'rio-slider__track-lower' }),
      trackActive: () => ({ class: 'rio-slider__track-active' }),
      trackUpper: () => ({ class: 'rio-slider__track-upper' }),
      startInput: () => input(0, 'start'),
      endInput: () => input(1, 'end'),
      startHandle: () => ({
        class: 'rio-slider__handle',
        'aria-hidden': 'true',
        'data-thumb': 'start',
      }),
      endHandle: () => ({
        class: 'rio-slider__handle',
        'aria-hidden': 'true',
        'data-thumb': 'end',
      }),
      startValueIndicator: () => ({ class: 'rio-slider__value-indicator' }),
      endValueIndicator: () => ({ class: 'rio-slider__value-indicator' }),
    },
    showsValueIndicator: () => !!props().valueIndicator,
    valueText: (index) => formatValue(value()[index === 0 ? 0 : 1], props()),
    value,
    range,
    vertical: () => !!props().vertical,
    blocked,
    moveHandle(index, next) {
      const [start, end] = value();
      const snapped = snapSliderValue(next, range());
      const requested: [number, number] =
        index === 0 ? [Math.min(snapped, end), end] : [start, Math.max(snapped, start)];
      if (requested[0] !== start || requested[1] !== end) options.onChange(requested);
    },
  };
}
