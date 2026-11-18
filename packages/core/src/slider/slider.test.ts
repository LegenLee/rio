import { describe, expect, test, vi } from 'vitest';
import { messagesFor } from '../locale/messages';
import {
  createRangeSlider,
  createSlider,
  SLIDER_SIZES,
  sliderDefaults,
  sliderRange,
  snapSliderValue,
  type RangeSliderProps,
  type SliderContent,
  type SliderProps,
} from './slider';

const setup = (props: SliderProps = {}, content?: SliderContent, iconInactive = false) => {
  const onChange = vi.fn();
  return {
    slider: createSlider({
      props: () => props,
      content: content && (() => content),
      iconInactive: () => iconInactive,
      onChange,
    }),
    onChange,
  };
};

const setupRange = (props: RangeSliderProps = {}, locale = 'en') => {
  const onChange = vi.fn();
  return {
    slider: createRangeSlider({
      props: () => props,
      messages: () => messagesFor(locale).slider,
      onChange,
    }),
    onChange,
  };
};

describe('defaults', () => {
  test('the spec’s sizes, XS first and by default, and a 0 to 100 range by whole steps', () => {
    expect(SLIDER_SIZES).toEqual(['xsmall', 'small', 'medium', 'large', 'xlarge']);
    expect(sliderDefaults).toMatchObject({ size: 'xsmall', min: 0, max: 100, step: 1 });
    expect(setup().slider.parts.root()['data-size']).toBe('xsmall');
  });
});

describe('sliderRange', () => {
  test('reads the props as a native range input does', () => {
    expect(sliderRange({})).toEqual({ min: 0, max: 100, step: 1 });
    expect(sliderRange({ min: 10, max: 5 })).toEqual({ min: 10, max: 10, step: 1 });
    expect(sliderRange({ min: 150 })).toEqual({ min: 150, max: 150, step: 1 });
    expect(sliderRange({ step: 0 }).step).toBe(1);
    expect(sliderRange({ step: -2 }).step).toBe(1);
    expect(sliderRange({ step: Number.NaN }).step).toBe(1);
  });
});

describe('snapSliderValue', () => {
  const range = { min: 0, max: 100, step: 10 };

  test('goes to the nearest step, within the range', () => {
    expect(snapSliderValue(44, range)).toBe(40);
    expect(snapSliderValue(45, range)).toBe(50);
    expect(snapSliderValue(-5, range)).toBe(0);
    expect(snapSliderValue(130, range)).toBe(100);
    expect(snapSliderValue(Number.NaN, range)).toBe(0);
  });

  test('counts steps from min', () => {
    expect(snapSliderValue(12, { min: 5, max: 50, step: 10 })).toBe(15);
  });

  test('where max isn’t on a step, the last step below it is the highest value', () => {
    expect(snapSliderValue(10, { min: 0, max: 10, step: 3 })).toBe(9);
    expect(snapSliderValue(9.9, { min: 0, max: 10, step: 3 })).toBe(9);
  });

  test('keeps decimal steps exact', () => {
    expect(snapSliderValue(0.3, { min: 0, max: 1, step: 0.1 })).toBe(0.3);
    expect(snapSliderValue(0.7, { min: 0, max: 1, step: 0.1 })).toBe(0.7);
    expect(snapSliderValue(1.26, { min: 0.05, max: 2, step: 0.25 })).toBe(1.3);
  });
});

describe('createSlider', () => {
  test('the root lays out the value as a fraction; the input is a native range input', () => {
    const { parts } = setup({ value: 25 }).slider;
    expect(parts.root()).toEqual({
      class: 'rio-slider',
      'data-size': 'xsmall',
      'data-vertical': undefined,
      'data-stops': undefined,
      'data-value-indicator': undefined,
      'data-disabled': undefined,
      'data-centered': undefined,
      'data-icon': undefined,
      'data-icon-inactive': undefined,
      style: '--rio-slider-value: 0.25',
    });
    expect(parts.input()).toEqual({
      class: 'rio-slider__input',
      type: 'range',
      min: '0',
      max: '100',
      step: '1',
      value: '25',
      disabled: undefined,
      'aria-disabled': undefined,
      'aria-orientation': undefined,
      'aria-valuetext': undefined,
    });
  });

  test('without a value it shows min; a value off the range or the steps shows snapped', () => {
    expect(setup({ min: 20 }).slider.value()).toBe(20);
    expect(setup({ value: 47, step: 10 }).slider.value()).toBe(50);
    expect(setup({ value: 47, step: 10 }).slider.parts.input().value).toBe('50');
    expect(setup({ value: 500 }).slider.parts.root().style).toBe('--rio-slider-value: 1');
  });

  test('the inner parts carry their classes; the handle and icon stay out of the accessibility tree', () => {
    const { parts } = setup().slider;
    expect(parts.trackLower()).toEqual({ class: 'rio-slider__track-lower' });
    expect(parts.trackActive()).toEqual({ class: 'rio-slider__track-active' });
    expect(parts.trackUpper()).toEqual({ class: 'rio-slider__track-upper' });
    expect(parts.icon()).toEqual({ class: 'rio-slider__icon', 'aria-hidden': 'true' });
    expect(parts.handle()).toEqual({ class: 'rio-slider__handle', 'aria-hidden': 'true' });
    expect(parts.valueIndicator()).toEqual({ class: 'rio-slider__value-indicator' });
  });

  test('stops: the root counts the steps for the stylesheet', () => {
    const root = setup({ value: 30, stops: true, step: 10 }).slider.parts.root();
    expect(root['data-stops']).toBe('');
    expect(root.style).toBe('--rio-slider-value: 0.3; --rio-slider-stops: 10');
    expect(setup({ stops: true, min: 5, max: 5 }).slider.parts.root().style).toBe(
      '--rio-slider-value: 0',
    );
  });

  test('size, vertical, centered, and the value indicator mark the root', () => {
    const { slider } = setup({
      size: 'large',
      vertical: true,
      centered: true,
      valueIndicator: true,
    });
    expect(slider.parts.root()).toMatchObject({
      'data-size': 'large',
      'data-vertical': '',
      'data-centered': '',
      'data-value-indicator': '',
    });
    expect(slider.parts.input()['aria-orientation']).toBe('vertical');
    expect([slider.vertical(), slider.showsLowerTrack(), slider.showsValueIndicator()]).toEqual([
      true,
      true,
      true,
    ]);
    expect(setup().slider.showsLowerTrack()).toBe(false);
    expect(setup().slider.showsValueIndicator()).toBe(false);
  });

  test('disabled is native, softDisabled is aria-disabled; either blocks and dims the root', () => {
    const disabled = setup({ disabled: true }).slider;
    expect(disabled.parts.input()).toMatchObject({ disabled: '', 'aria-disabled': undefined });
    expect(disabled.parts.root()['data-disabled']).toBe('');
    const soft = setup({ softDisabled: true }).slider;
    expect(soft.parts.input()).toMatchObject({ disabled: undefined, 'aria-disabled': 'true' });
    expect(soft.parts.root()['data-disabled']).toBe('');
    expect([disabled.blocked(), soft.blocked(), setup().slider.blocked()]).toEqual([
      true,
      true,
      false,
    ]);
  });

  test('the value is written in the language, or by the app’s format, which assistive technology gets too', () => {
    expect(setup({ value: 1234.5, max: 2000, step: 0.5, locale: 'de' }).slider.valueText()).toBe(
      '1.234,5',
    );
    expect(setup({ value: 1234.5, max: 2000, step: 0.5, locale: 'en' }).slider.valueText()).toBe(
      '1,234.5',
    );
    expect(setup({ value: 7, locale: 'not a language!' }).slider.valueText()).toBe('7');
    const percent = setup({ value: 40, format: (value) => `${value}%` }).slider;
    expect(percent.valueText()).toBe('40%');
    expect(percent.parts.input()['aria-valuetext']).toBe('40%');
  });

  test('an inset icon shows with the content, on the active track unless reported short', () => {
    const icon = { icon: true };
    const medium = { size: 'medium' } as const;
    expect(setup(medium, icon).slider.showsIcon()).toBe(true);
    expect(setup(medium, icon).slider.parts.root()).toMatchObject({
      'data-icon': '',
      'data-icon-inactive': undefined,
    });
    expect(setup(medium, icon, true).slider.parts.root()['data-icon-inactive']).toBe('');
    expect(setup(medium, { icon: false }).slider.showsIcon()).toBe(false);
    expect(setup(medium).slider.showsIcon()).toBe(false);
  });

  test('only M, L, and XL show the inset icon, the sizes the spec gives it', () => {
    const shows = (size: SliderProps['size']) => setup({ size }, { icon: true }).slider.showsIcon();
    expect(SLIDER_SIZES.map(shows)).toEqual([false, false, true, true, true]);
    expect(setup({}, { icon: true }, true).slider.parts.root()).toMatchObject({
      'data-icon': undefined,
      'data-icon-inactive': undefined,
    });
  });

  test('a centered slider shows no inset icon', () => {
    const { slider } = setup({ centered: true, size: 'large' }, { icon: true }, true);
    expect(slider.showsIcon()).toBe(false);
    expect(slider.parts.root()).toMatchObject({
      'data-icon': undefined,
      'data-icon-inactive': undefined,
    });
  });

  test('moving the handle asks for the value on a step, and only when it changes', () => {
    const { slider, onChange } = setup({ value: 30, step: 10 });
    slider.moveHandle(0, 52);
    expect(onChange).toHaveBeenLastCalledWith(50);
    slider.moveHandle(0, 31);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('createRangeSlider', () => {
  test('the root is a group, laying out the start and the end as fractions', () => {
    const root = setupRange({ value: [20, 60] }).slider.parts.root();
    expect(root).toEqual({
      class: 'rio-slider',
      role: 'group',
      'data-range': '',
      'data-size': 'xsmall',
      'data-vertical': undefined,
      'data-stops': undefined,
      'data-value-indicator': undefined,
      'data-disabled': undefined,
      style: '--rio-slider-start: 0.2; --rio-slider-end: 0.6',
    });
  });

  test('each input stops at the other’s value, is named for assistive technology, and submits under the name', () => {
    const { parts } = setupRange({ value: [20, 60], name: 'price' }).slider;
    expect(parts.startInput()).toEqual({
      class: 'rio-slider__input',
      type: 'range',
      min: '0',
      max: '60',
      step: '1',
      value: '20',
      disabled: undefined,
      'aria-disabled': undefined,
      'aria-orientation': undefined,
      'aria-valuetext': undefined,
      name: 'price',
      'aria-label': 'Minimum',
      'data-thumb': 'start',
    });
    expect(parts.endInput()).toMatchObject({
      min: '20',
      max: '100',
      value: '60',
      name: 'price',
      'aria-label': 'Maximum',
      'data-thumb': 'end',
    });
    expect(setupRange({}, 'ko').slider.parts.startInput()['aria-label']).toBe('최솟값');
    expect(setupRange({}, 'ko').slider.parts.endInput()['aria-label']).toBe('최댓값');
  });

  test('the handles carry which they are, and stay out of the accessibility tree', () => {
    const { parts } = setupRange().slider;
    expect(parts.startHandle()).toEqual({
      class: 'rio-slider__handle',
      'aria-hidden': 'true',
      'data-thumb': 'start',
    });
    expect(parts.endHandle()['data-thumb']).toBe('end');
    expect(parts.startValueIndicator()).toEqual({ class: 'rio-slider__value-indicator' });
  });

  test('without a value it spans the range; values out of order show in order, snapped', () => {
    expect(setupRange({ min: 10, max: 90 }).slider.value()).toEqual([10, 90]);
    expect(setupRange({ value: [70, 22], step: 5 }).slider.value()).toEqual([20, 70]);
  });

  test('a handle asks for its value, but never past the other', () => {
    const { slider, onChange } = setupRange({ value: [20, 60] });
    slider.moveHandle(0, 30);
    expect(onChange).toHaveBeenLastCalledWith([30, 60]);
    slider.moveHandle(0, 80);
    expect(onChange).toHaveBeenLastCalledWith([60, 60]);
    slider.moveHandle(1, 10);
    expect(onChange).toHaveBeenLastCalledWith([20, 20]);
    slider.moveHandle(1, 60);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  test('each handle’s value is written for its value indicator', () => {
    const { slider } = setupRange({ value: [1000, 2500], max: 5000, locale: 'en' });
    expect([slider.valueText(0), slider.valueText(1)]).toEqual(['1,000', '2,500']);
  });

  test('stops, disabled, and soft-disabled, as on the slider', () => {
    const root = setupRange({ stops: true, step: 25, softDisabled: true }).slider.parts.root();
    expect(root).toMatchObject({ 'data-stops': '', 'data-disabled': '' });
    expect(root.style).toBe('--rio-slider-start: 0; --rio-slider-end: 1; --rio-slider-stops: 4');
    expect(setupRange({ softDisabled: true }).slider.parts.endInput()['aria-disabled']).toBe(
      'true',
    );
    expect(setupRange({ disabled: true }).slider.blocked()).toBe(true);
  });
});
