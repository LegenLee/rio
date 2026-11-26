// The Vue adapter against core's markup contract: each component, rendered in a few
// configurations, has to match its skeleton and carry the attributes core gives each part. A new
// adapter writes the same test against the same skeletons.
import {
  appBarSkeleton,
  createAppBar,
  type AppBarContent,
  type AppBarProps,
  createIcon,
  type IconSource,
  buttonGroupSkeleton,
  buttonLinkSkeleton,
  buttonSkeleton,
  calendarSkeleton,
  createList,
  createListItem,
  listItemActionSkeleton,
  listItemSkeleton,
  listSkeleton,
  type ListItemProps,
  type ListProps,
  createDateRangePickerDialog,
  createRangeCalendar,
  dateRangePickerDialogSkeleton,
  initialDateRangePickerState,
  rangeCalendarSkeleton,
  checkboxSkeleton,
  createCalendar,
  createDatePicker,
  createTimePicker,
  initialTimePickerState,
  timePickerDialogSkeleton,
  timePickerSkeleton,
  type PartAttrs,
  type TimePickerApi,
  type TimePickerProps,
  type TimePickerState,
  createDatePickerDialog,
  datePickerDialogSkeleton,
  datePickerSkeleton,
  initialDatePickerState,
  messagesFor,
  dialogSkeleton,
  fullScreenDialogSkeleton,
  createButton,
  createButtonGroup,
  createCheckbox,
  createDialog,
  createFab,
  createIconButton,
  createMenu,
  createMenuDivider,
  createMenuGroup,
  createMenuItem,
  createRadio,
  createRadioGroup,
  createSelect,
  createSelectOption,
  createSubMenu,
  createSwitch,
  circularProgressSkeleton,
  createCircularProgress,
  createLinearProgress,
  createLoadingIndicator,
  linearProgressSkeleton,
  loadingIndicatorSkeleton,
  type CircularProgressProps,
  type LinearProgressProps,
  type LoadingIndicatorProps,
  actionChipLinkSkeleton,
  actionChipSkeleton,
  chipSetSkeleton,
  createAssistChip,
  createChipSet,
  createFilterChip,
  createInputChip,
  createSuggestionChip,
  filterChipSkeleton,
  inputChipRemoveOnlySkeleton,
  inputChipSkeleton,
  type ActionChipContent,
  type AssistChipProps,
  type FilterChipContent,
  type FilterChipProps,
  type InputChipContent,
  type InputChipProps,
  createRangeSlider,
  createScrollField,
  createSlider,
  rangeSliderSkeleton,
  scrollFieldSkeleton,
  sliderSkeleton,
  type RangeSliderProps,
  type SliderContent,
  type ScrollFieldProps,
  type ScrollFieldValue,
  type SliderProps,
  createTextField,
  createToolbar,
  createTooltip,
  createSplitButton,
  fabLinkSkeleton,
  fabSkeleton,
  iconButtonLinkSkeleton,
  iconButtonSkeleton,
  menuDividerSkeleton,
  menuGroupSkeleton,
  menuItemSkeleton,
  menuSkeleton,
  radioGroupSkeleton,
  radioSkeleton,
  selectOptionSkeleton,
  selectSkeleton,
  splitButtonSkeleton,
  switchSkeleton,
  textFieldSkeleton,
  toolbarSkeleton,
  tooltipSkeleton,
  tooltipTriggerSkeleton,
  type ButtonGroupProps,
  type ButtonProps,
  type CheckboxProps,
  type DialogContent,
  type DialogProps,
  type FabProps,
  type IconButtonProps,
  type MenuItemContent,
  type MenuItemProps,
  type MenuProps,
  type RadioProps,
  type SelectContent,
  type SelectOptionContent,
  type SelectOptionProps,
  type SelectProps,
  type SelectSelected,
  type SplitButtonContent,
  type SplitButtonProps,
  type SubMenuProps,
  type SwitchContent,
  type SwitchProps,
  type TextFieldContent,
  type TextFieldProps,
  type TooltipContent,
  type ToolbarProps,
  type TooltipProps,
} from '@rio-m3e/core';
import { expectSkeleton, findPart } from '@rio-m3e/testing';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { render } from 'vitest-browser-vue';
import { page, userEvent } from 'vitest/browser';
import { createApp, defineComponent, h, type VNode } from 'vue';
import ButtonGroup from './button-group/ButtonGroup.vue';
import Button from './button/Button.vue';
import Icon from './icon/Icon.vue';
import { createRio } from './rio/rio';
import Checkbox from './checkbox/Checkbox.vue';
import DatePicker from './date-picker/DatePicker.vue';
import DatePickerCalendar from './date-picker/DatePickerCalendar.vue';
import DatePickerDialog from './date-picker/DatePickerDialog.vue';
import DateRangeCalendar from './date-picker/DateRangeCalendar.vue';
import DateRangePickerDialog from './date-picker/DateRangePickerDialog.vue';
import Dialog from './dialog/Dialog.vue';
import Fab from './fab/Fab.vue';
import IconButton from './icon-button/IconButton.vue';
import List from './list/List.vue';
import ListItem from './list/ListItem.vue';
import Menu from './menu/Menu.vue';
import ScrollField from './scroll-field/ScrollField.vue';
import MenuDivider from './menu/MenuDivider.vue';
import MenuGroup from './menu/MenuGroup.vue';
import MenuItem from './menu/MenuItem.vue';
import SubMenu from './menu/SubMenu.vue';
import Radio from './radio/Radio.vue';
import RadioGroup from './radio/RadioGroup.vue';
import Select from './select/Select.vue';
import SelectOption from './select/SelectOption.vue';
import SplitButton from './split-button/SplitButton.vue';
import Switch from './switch/Switch.vue';
import CircularProgress from './progress/CircularProgress.vue';
import LinearProgress from './progress/LinearProgress.vue';
import LoadingIndicator from './loading-indicator/LoadingIndicator.vue';
import AssistChip from './chip/AssistChip.vue';
import ChipSet from './chip/ChipSet.vue';
import FilterChip from './chip/FilterChip.vue';
import InputChip from './chip/InputChip.vue';
import SuggestionChip from './chip/SuggestionChip.vue';
import RangeSlider from './slider/RangeSlider.vue';
import Slider from './slider/Slider.vue';
import TextField from './text-field/TextField.vue';
import TimeInput from './time-picker/TimeInput.vue';
import TimePickerDialog from './time-picker/TimePickerDialog.vue';
import TimeScroll from './time-picker/TimeScroll.vue';
import Toolbar from './toolbar/Toolbar.vue';
import AppBar from './app-bar/AppBar.vue';
import Tooltip from './tooltip/Tooltip.vue';

const noop = () => {};
const rootOf = (screen: { container: Element }) => screen.container.firstElementChild!;

describe('RioButton', () => {
  test.each<[string, ButtonProps, boolean]>([
    ['a plain button', {}, false],
    ['with an icon', {}, true],
    ['a selected toggle', { toggle: true, selected: true }, false],
    ['an unselected toggle', { toggle: true, selected: false }, false],
    // Every non-boolean prop away from its default, so a prop the adapter fails to pass on shows up.
    [
      'large, square, tonal, and a submit button',
      { variant: 'tonal', size: 'large', shape: 'square', type: 'submit' },
      true,
    ],
    ['a text button asked to toggle', { variant: 'text', toggle: true }, false],
    ['disabled, with an icon', { disabled: true }, true],
    ['soft-disabled', { softDisabled: true }, false],
    ['a link', { href: '/settings' }, true],
    ['a link asked to toggle', { href: '/settings', toggle: true, selected: true }, false],
    ['a disabled link', { href: '/settings', disabled: true }, false],
    ['a soft-disabled link', { href: '/settings', softDisabled: true }, false],
  ])('%s', async (_, props, icon) => {
    const screen = await render(Button, {
      props,
      slots: { default: () => 'Label', ...(icon ? { icon: () => '+' } : {}) },
    });
    const api = createButton({
      props: () => props,
      content: () => ({ icon }),
      onClick: noop,
      onChange: noop,
    });
    expectSkeleton(rootOf(screen), api.isLink() ? buttonLinkSkeleton : buttonSkeleton, api);
  });
});

describe('RioIcon', () => {
  test.each<[string, IconSource]>([
    ['SVG paths', { type: 'svg', path: ['M0 0h24v12H0z', 'M0 12h24v12H0z'] }],
    [
      'SVG paths in their own view box',
      { type: 'svg', path: 'M0 0h48v48H0z', viewBox: '0 0 48 48' },
    ],
    ['a ligature', { type: 'ligature', name: 'home', className: 'material-symbols-outlined' }],
    ['a font’s class', { type: 'class', className: 'mdi mdi-home' }],
  ])('%s', async (_, icon) => {
    const screen = await render(Icon, { props: { icon } });
    const api = createIcon({ source: () => icon });
    expectSkeleton(rootOf(screen), api.skeleton()!, api);
  });

  test('a component, under the root part, as an alias pointing along the line', async () => {
    const Arrow = defineComponent(() => () => h('svg', { viewBox: '0 0 24 24' }));
    const screen = await render(Icon, {
      props: { alias: 'next' },
      global: { plugins: [createRio({ icons: { aliases: { next: Arrow } } })] },
    });
    const api = createIcon({ source: () => undefined, alias: () => 'next' });
    expect(api.skeleton()).toBeUndefined();
    const root = rootOf(screen);
    for (const [name, value] of Object.entries(api.parts.root())) {
      expect(root.getAttribute(name), name).toBe(value ?? null);
    }
  });
});

describe('RioIconButton', () => {
  test.each<[string, IconButtonProps, boolean]>([
    ['a plain icon button', { label: 'Go' }, false],
    ['a selected toggle with a selected icon', { label: 'Go', toggle: true, selected: true }, true],
    ['a selected toggle without one', { label: 'Go', toggle: true, selected: true }, false],
    ['an unselected toggle', { label: 'Go', toggle: true }, true],
    // Every non-boolean prop away from its default, so a prop the adapter fails to pass on shows up.
    [
      'extra large, wide, square, outlined, and a reset button',
      {
        label: 'Go',
        variant: 'outlined',
        size: 'xlarge',
        width: 'wide',
        shape: 'square',
        type: 'reset',
      },
      false,
    ],
    ['narrow and standard', { label: 'Go', width: 'narrow', variant: 'standard' }, false],
    ['disabled', { label: 'Go', disabled: true }, false],
    ['a link asked to toggle', { label: 'Go', href: '/go', toggle: true, selected: true }, true],
    ['a soft-disabled link', { label: 'Go', href: '/go', softDisabled: true }, false],
  ])('%s', async (_, props, selectedIcon) => {
    const screen = await render(IconButton, {
      props,
      slots: { default: () => '♡', ...(selectedIcon ? { 'selected-icon': () => '♥' } : {}) },
    });
    const api = createIconButton({
      props: () => props,
      content: () => ({ selectedIcon }),
      onClick: noop,
      onChange: noop,
    });
    const skeleton = api.isLink() ? iconButtonLinkSkeleton : iconButtonSkeleton;
    expectSkeleton(rootOf(screen), skeleton, api);
    // Which icon fills the icon part is core's call too.
    const icon = findPart(rootOf(screen), skeleton, 'icon', api);
    expect(icon?.textContent).toBe(api.showsSelectedIcon() ? '♥' : '♡');
  });
});

describe('RioFab', () => {
  test.each<[string, FabProps, boolean]>([
    ['a FAB with its icon only', { label: 'Go' }, true],
    ['extended, with an icon', { label: 'Go', extended: true }, true],
    ['without an icon, its label showing', { label: 'Go' }, false],
    // Every non-boolean prop away from its default, so a prop the adapter fails to pass on shows up.
    [
      'large, tertiary, extended, and a reset button',
      { label: 'Go', size: 'large', color: 'tertiary', extended: true, type: 'reset' },
      true,
    ],
    ['a link', { label: 'Go', href: '/go' }, true],
  ])('%s', async (_, props, icon) => {
    const screen = await render(Fab, { props, slots: icon ? { default: () => '✎' } : {} });
    const api = createFab({ props: () => props, content: () => ({ icon }), onClick: noop });
    const skeleton = api.isLink() ? fabLinkSkeleton : fabSkeleton;
    expectSkeleton(rootOf(screen), skeleton, api);
    // The text part holds the label.
    expect(findPart(rootOf(screen), skeleton, 'text', api)?.textContent).toBe('Go');
  });
});

describe('RioSwitch', () => {
  const none = { selectedIcon: false, unselectedIcon: false };
  const onlySelected = { selectedIcon: true, unselectedIcon: false };
  const onlyUnselected = { selectedIcon: false, unselectedIcon: true };
  const both = { selectedIcon: true, unselectedIcon: true };

  test.each<[string, SwitchProps, SwitchContent]>([
    ['off, without icons', {}, none],
    ['on, with the selected icon', { selected: true }, onlySelected],
    ['off, with only the selected icon', {}, onlySelected],
    ['on, with only the unselected icon', { selected: true }, onlyUnselected],
    ['off, with both icons', {}, both],
    ['disabled and on, with both icons', { disabled: true, selected: true }, both],
    ['soft-disabled', { softDisabled: true }, none],
  ])('%s', async (_, props, content) => {
    const screen = await render(Switch, {
      props,
      slots: {
        ...(content.selectedIcon ? { 'selected-icon': () => '✓' } : {}),
        ...(content.unselectedIcon ? { 'unselected-icon': () => '✕' } : {}),
      },
    });
    const api = createSwitch({
      props: () => props,
      content: () => content,
      onChange: noop,
    });
    expectSkeleton(rootOf(screen), switchSkeleton, api);
    // When the icon part renders, which icon fills it is core's call too.
    const icon = findPart(rootOf(screen), switchSkeleton, 'icon', api);
    if (icon) expect(icon.textContent).toBe(api.showsSelectedIcon() ? '✓' : '✕');
  });
});

describe('RioSlider', () => {
  const none = { icon: false };
  const icon = { icon: true };

  test.each<[string, Omit<SliderProps, 'value'> & { modelValue?: number }, SliderContent]>([
    ['by default', {}, none],
    ['with stops', { modelValue: 30, stops: true, step: 10 }, none],
    ['centered', { modelValue: 20, centered: true, min: -50, max: 50 }, none],
    ['centered, with an icon it doesn’t show', { centered: true, size: 'large' }, icon],
    ['extra small, with an icon it doesn’t show', {}, icon],
    [
      'vertical and large, with the value indicator',
      { vertical: true, size: 'large', valueIndicator: true, modelValue: 70 },
      none,
    ],
    ['medium, with an inset icon', { size: 'medium', modelValue: 50 }, icon],
    ['disabled', { disabled: true, modelValue: 40 }, none],
    ['soft-disabled', { softDisabled: true }, none],
    // Every non-boolean prop away from its default
    [
      'with its own range, size, and format',
      {
        min: 10,
        max: 90,
        step: 5,
        size: 'small',
        modelValue: 40,
        format: (value: number) => `${value}%`,
      },
      none,
    ],
  ])('%s', async (_, { modelValue, ...props }, content) => {
    const screen = await render(Slider, {
      props: { modelValue, ...props },
      slots: content.icon ? { icon: () => '♪' } : {},
    });
    const api = createSlider({
      props: () => ({ ...props, value: modelValue }),
      content: () => content,
      onChange: noop,
    });
    expectSkeleton(rootOf(screen), sliderSkeleton, api);
    const indicator = findPart(rootOf(screen), sliderSkeleton, 'valueIndicator', api);
    if (indicator) expect(indicator.textContent).toBe(api.valueText());
  });
});

describe('RioRangeSlider', () => {
  const messages = () => messagesFor('en').slider;

  test.each<[string, Omit<RangeSliderProps, 'value'> & { modelValue?: [number, number] }]>([
    ['by default', {}],
    ['with stops and a name', { modelValue: [20, 60], stops: true, step: 10, name: 'price' }],
    [
      'vertical and extra large, with the value indicators',
      { vertical: true, size: 'xlarge', valueIndicator: true, modelValue: [5, 95] },
    ],
    ['disabled', { disabled: true }],
    ['soft-disabled', { softDisabled: true, modelValue: [30, 30] }],
    // Every non-boolean prop away from its default
    [
      'with its own range, size, and format',
      {
        min: -10,
        max: 10,
        step: 0.5,
        size: 'medium',
        modelValue: [-2.5, 4],
        format: (value: number) => `${value}°`,
      },
    ],
  ])('%s', async (_, { modelValue, ...props }) => {
    const screen = await render(RangeSlider, {
      props: { locale: 'en-US', modelValue, ...props },
    });
    const api = createRangeSlider({
      props: () => ({ locale: 'en-US', ...props, value: modelValue }),
      messages,
      onChange: noop,
    });
    expectSkeleton(rootOf(screen), rangeSliderSkeleton, api);
    const start = findPart(rootOf(screen), rangeSliderSkeleton, 'startValueIndicator', api);
    if (start) expect(start.textContent).toBe(api.valueText(0));
    const end = findPart(rootOf(screen), rangeSliderSkeleton, 'endValueIndicator', api);
    if (end) expect(end.textContent).toBe(api.valueText(1));
  });
});

describe.each([
  ['RioAssistChip', AssistChip, createAssistChip],
  ['RioSuggestionChip', SuggestionChip, createSuggestionChip],
] as const)('%s', (_, Chip, create) => {
  test.each<[string, AssistChipProps, ActionChipContent]>([
    ['plain', {}, { icon: false }],
    ['elevated, with an icon', { elevated: true }, { icon: true }],
    ['a link', { href: '#here' }, { icon: true }],
    ['a disabled link', { href: '#here', disabled: true }, { icon: false }],
    ['a soft-disabled link', { href: '#here', softDisabled: true }, { icon: false }],
    ['disabled', { disabled: true }, { icon: true }],
    ['soft-disabled', { softDisabled: true }, { icon: false }],
  ])('%s', async (_, props, content) => {
    const screen = await render(Chip, {
      props,
      slots: { default: () => 'Book', ...(content.icon ? { icon: () => h('svg') } : {}) },
    });
    const api = create({ props: () => props, content: () => content, onClick: noop });
    expectSkeleton(rootOf(screen), api.isLink() ? actionChipLinkSkeleton : actionChipSkeleton, api);
  });
});

describe('RioFilterChip', () => {
  const all = { icon: true, selectedIcon: true, dropdownIcon: true };
  const none = { icon: false, selectedIcon: false, dropdownIcon: false };

  test.each<[string, FilterChipProps, FilterChipContent]>([
    ['unselected, with every icon', {}, all],
    ['selected, with every icon', { selected: true }, all],
    ['selected, without a selected icon', { selected: true }, { ...none, icon: true }],
    ['a menu chip, open', { menu: true, open: true, selected: true }, all],
    ['elevated and disabled', { elevated: true, disabled: true, selected: true }, none],
    ['soft-disabled, with a value', { softDisabled: true, value: 'a' }, all],
  ])('%s', async (_, props, content) => {
    const screen = await render(FilterChip, {
      props,
      slots: {
        default: () => 'Wi-Fi',
        ...(content.icon ? { icon: () => 'i' } : {}),
        ...(content.selectedIcon ? { 'selected-icon': () => '✓' } : {}),
        ...(content.dropdownIcon ? { 'dropdown-icon': () => '▾' } : {}),
      },
    });
    const api = createFilterChip({
      props: () => props,
      content: () => content,
      onClick: noop,
      onChange: noop,
      onOpenChange: noop,
    });
    expectSkeleton(rootOf(screen), filterChipSkeleton, api);
    // Which icon fills the icon part is core's call too.
    const icon = findPart(rootOf(screen), filterChipSkeleton, 'icon', api);
    if (icon) expect(icon.textContent).toBe(api.showsSelectedIcon() ? '✓' : 'i');
  });
});

describe('RioInputChip', () => {
  test.each<[string, InputChipProps & { locale?: string }, InputChipContent]>([
    ['plain', {}, { icon: false, avatar: false }],
    ['with an avatar over its icon', {}, { icon: true, avatar: true }],
    ['with an icon, in Korean', { locale: 'ko' }, { icon: true, avatar: false }],
    ['remove-only', { removeOnly: true }, { icon: false, avatar: false }],
    ['disabled', { disabled: true }, { icon: false, avatar: true }],
    ['soft-disabled', { softDisabled: true }, { icon: true, avatar: false }],
  ])('%s', async (_, { locale = 'en', ...props }, content) => {
    const screen = await render(InputChip, {
      props: { ...props, locale },
      slots: {
        default: () => 'Ada',
        'remove-icon': () => h('svg'),
        ...(content.icon ? { icon: () => h('svg') } : {}),
        ...(content.avatar ? { avatar: () => h('img') } : {}),
      },
    });
    const root = rootOf(screen);
    // The ids come from Vue's `useId`; the API is built with the ones rendered.
    const id = root.querySelector('.rio-chip__label')!.id.replace(/-label$/, '');
    const api = createInputChip({
      props: () => props,
      content: () => content,
      messages: () => messagesFor(locale).chip,
      ids: {
        label: `${id}-label`,
        removeBefore: `${id}-remove-before`,
        removeAfter: `${id}-remove-after`,
      },
      onClick: noop,
      onRemove: noop,
    });
    expectSkeleton(root, api.isAction() ? inputChipSkeleton : inputChipRemoveOnlySkeleton, api);
    const before = findPart(root, inputChipSkeleton, 'removeBefore', api);
    if (before) expect(before.textContent).toBe(api.removeText().before);
    const after = findPart(root, inputChipSkeleton, 'removeAfter', api);
    if (after) expect(after.textContent).toBe(api.removeText().after);
  });
});

describe('RioChipSet', () => {
  test.each([
    ['plain', {}],
    [
      'scrolling, with a selection',
      { scroll: true, selection: 'multiple' as const, modelValue: ['a'] },
    ],
  ])('%s', async (_, props) => {
    const screen = await render(ChipSet, {
      props,
      slots: { default: () => h(AssistChip, null, () => 'One') },
    });
    const { modelValue, ...rest } = props as { modelValue?: string[] };
    const api = createChipSet({
      props: () => ({ ...rest, selected: modelValue }),
      tabStop: () => undefined,
      onChange: noop,
    });
    expectSkeleton(rootOf(screen), chipSetSkeleton, api);
  });
});

describe('RioLinearProgress', () => {
  test.each<[string, LinearProgressProps]>([
    ['determinate', { value: 0.4 }],
    ['indeterminate', {}],
    ['empty', { value: 0 }],
    ['wavy and full', { value: 1, wavy: true }],
    // Every non-boolean prop away from its default
    ['with its own range and thickness, wavy', { value: 30, max: 120, thickness: 8, wavy: true }],
  ])('%s', async (_, props) => {
    const screen = await render(LinearProgress, { props });
    const api = createLinearProgress({ props: () => props });
    expectSkeleton(rootOf(screen), linearProgressSkeleton, api);
  });
});

describe('RioLoadingIndicator', () => {
  test.each<[string, LoadingIndicatorProps]>([
    ['indeterminate', {}],
    ['determinate and contained', { value: 0.5, contained: true }],
    // Every non-boolean prop away from its default
    [
      'with its own range, size, and shapes',
      { value: 1, max: 4, size: 96, shapes: ['heart', 'sunny'] },
    ],
  ])('%s', async (_, props) => {
    const screen = await render(LoadingIndicator, { props });
    const api = createLoadingIndicator({ props: () => props });
    expectSkeleton(rootOf(screen), loadingIndicatorSkeleton, api);
  });
});

describe('RioCircularProgress', () => {
  test.each<[string, CircularProgressProps]>([
    ['determinate', { value: 0.4 }],
    ['indeterminate', {}],
    ['wavy', { value: 0.6, wavy: true }],
    // Every non-boolean prop away from its default
    ['with its own range, thickness, and size', { value: 3, max: 4, thickness: 8, size: 96 }],
  ])('%s', async (_, props) => {
    const screen = await render(CircularProgress, { props });
    const api = createCircularProgress({ props: () => props });
    expectSkeleton(rootOf(screen), circularProgressSkeleton, api);
  });
});

describe('RioScrollField', () => {
  test.each<[string, Omit<ScrollFieldProps, 'value'> & { modelValue?: ScrollFieldValue }]>([
    ['by default', {}],
    ['looping, with options', { options: ['g', 'kg', 'lb'], modelValue: 'kg', loop: true }],
    ['editing, invalid', { editing: true, invalid: true, modelValue: 7, min: 0, max: 59 }],
    ['disabled', { disabled: true }],
    ['soft-disabled, submitting with a form', { softDisabled: true, name: 'minutes' }],
    // Every non-boolean prop away from its default
    [
      'with its own range, size, label, language, and format',
      {
        min: 10,
        max: 90,
        step: 5,
        size: 'large',
        label: 'Weight',
        locale: 'ar-EG',
        modelValue: 40,
        format: (value: ScrollFieldValue) => `${value} kg`,
      },
    ],
  ])('%s', async (_, { modelValue, ...props }) => {
    const screen = await render(ScrollField, { props: { modelValue, ...props } });
    const root = rootOf(screen);
    // The ids come from Vue's `useId`; the API is built with the ones rendered.
    const options = root.querySelector('[role="option"]')!.id.replace(/-\d+$/, '');
    const api = createScrollField({
      props: () => ({ ...props, value: modelValue }),
      ids: { options },
      // As `attachScrollField` reports the first placement: the value's item, at once
      centerAtOnce: () => true,
      onChange: noop,
      onEditingChange: noop,
    });
    expectSkeleton(root, scrollFieldSkeleton, api);
    // The items carry the attributes core gives each, and their text.
    const items = root.querySelectorAll('.rio-scroll-field__item');
    expect(items).toHaveLength(api.items().length);
    for (const index of [0, api.targetIndex(), api.items().length - 1]) {
      for (const [name, value] of Object.entries(api.parts.item(index))) {
        expect(items[index]!.getAttribute(name), `${index} ${name}`).toBe(value ?? null);
      }
      expect(items[index]!.textContent?.trim()).toBe(api.itemText(index));
    }
  });
});

describe('RioButtonGroup', () => {
  test.each<[string, Omit<ButtonGroupProps, 'selected'>, ButtonGroupProps['selected']]>([
    ['a standard group', {}, undefined],
    [
      'a connected, square, single-select group',
      { variant: 'connected', shape: 'square', selection: 'single' },
      'A',
    ],
    ['a large, multi-select group', { size: 'large', selection: 'multiple' }, ['A']],
  ])('%s', async (_, props, selected) => {
    const screen = await render(ButtonGroup, {
      props: { ...props, modelValue: selected },
      slots: { default: () => [h(Button, { value: 'A' }, () => 'A'), h(Button, () => 'B')] },
    });
    const api = createButtonGroup({ props: () => ({ ...props, selected }), onChange: noop });
    expectSkeleton(rootOf(screen), buttonGroupSkeleton, api);
  });
});

describe('RioAppBar', () => {
  const all: AppBarContent = { leading: true, headline: true, subtitle: true, trailing: true };
  test.each<[string, AppBarProps, AppBarContent]>([
    ['every part', {}, all],
    [
      'a medium flexible bar with a headline only',
      { variant: 'medium-flexible' },
      { ...all, leading: false, subtitle: false, trailing: false },
    ],
    [
      'an h3, centered, without a headline',
      { headingLevel: 3, align: 'center' },
      { ...all, headline: false },
    ],
  ])('%s', async (_, props, content) => {
    const slots: Record<string, () => VNode> = {};
    if (content.leading) slots.leading = () => h(Button, () => 'Back');
    if (content.trailing) slots.trailing = () => h(Button, () => 'Save');
    const screen = await render(AppBar, {
      props: {
        ...props,
        headline: content.headline ? 'Inbox' : undefined,
        subtitle: content.subtitle ? '12 unread' : undefined,
      },
      slots,
    });
    const api = createAppBar({ props: () => props, content: () => content });
    expectSkeleton(rootOf(screen), appBarSkeleton(props.headingLevel), api);
  });
});

describe('RioToolbar', () => {
  test.each<[string, ToolbarProps]>([
    ['a docked toolbar', {}],
    ['a vibrant floating toolbar', { variant: 'floating', color: 'vibrant' }],
    [
      'a vertical, flat floating toolbar',
      { variant: 'floating', orientation: 'vertical', flat: true },
    ],
  ])('%s', async (_, props) => {
    const screen = await render(Toolbar, {
      props,
      slots: { default: () => [h(Button, () => 'A'), h(Button, () => 'B')] },
    });
    expectSkeleton(rootOf(screen), toolbarSkeleton, createToolbar({ props: () => props }));
  });
});

describe('RioSplitButton', () => {
  const labelOnly = { icon: false, label: true };
  const iconOnly = { icon: true, label: false };
  const both = { icon: true, label: true };

  test.each<[string, SplitButtonProps, SplitButtonContent]>([
    ['a label', { menuLabel: 'More' }, labelOnly],
    ['an icon and a label', { menuLabel: 'More' }, both],
    ['only an icon, named by label', { menuLabel: 'More', label: 'Go' }, iconOnly],
    ['open', { menuLabel: 'More', open: true }, labelOnly],
    // Every non-boolean prop away from its default, so a prop the adapter fails to pass on shows up.
    [
      'extra large, tonal, opening a dialog, and a submit button',
      { menuLabel: 'More', variant: 'tonal', size: 'xlarge', popup: 'dialog', type: 'submit' },
      both,
    ],
    ['disabled', { menuLabel: 'More', disabled: true }, labelOnly],
    ['soft-disabled and open', { menuLabel: 'More', softDisabled: true, open: true }, labelOnly],
  ])('%s', async (_, props, content) => {
    const screen = await render(SplitButton, {
      props,
      slots: {
        ...(content.label ? { default: () => 'Label' } : {}),
        ...(content.icon ? { icon: () => '+' } : {}),
        'menu-icon': () => '▾',
      },
    });
    const api = createSplitButton({
      props: () => props,
      content: () => content,
      onClick: noop,
      onChange: noop,
    });
    expectSkeleton(rootOf(screen), splitButtonSkeleton, api);
    expect(findPart(rootOf(screen), splitButtonSkeleton, 'menuIcon', api)?.textContent).toBe('▾');
  });
});

describe('RioMenu', () => {
  test.each<[string, Omit<MenuProps, 'open' | 'selected'>]>([
    ['a standard menu', {}],
    // Every non-boolean prop away from its default, so a prop the adapter fails to pass on shows up.
    [
      'vibrant, selecting, named, and placed elsewhere',
      {
        variant: 'vibrant',
        selection: 'multiple',
        label: 'Edit',
        side: 'top',
        align: 'end',
        offset: 4,
      },
    ],
    ['instant', { instant: true }],
  ])('%s', async (_, props) => {
    const screen = await render(Menu, { props, slots: { default: () => h(MenuItem, () => 'A') } });
    const api = createMenu({ props: () => props, onChange: noop, onOpenChange: noop });
    expectSkeleton(rootOf(screen), menuSkeleton, api);
  });
});

describe('RioMenuItem', () => {
  const none = { icon: false, supportingText: false, trailingText: false, trailingIcon: false };
  const all = { icon: true, supportingText: true, trailingText: true, trailingIcon: true };

  test.each<[string, MenuItemProps, MenuProps | undefined, MenuItemContent]>([
    ['a label', {}, undefined, none],
    ['with every slot', {}, undefined, all],
    ['only an icon and trailing text', {}, undefined, { ...none, icon: true, trailingText: true }],
    ['disabled', { disabled: true }, undefined, none],
    [
      'selected, in a single-select menu',
      { value: 'a' },
      { selection: 'single', selected: 'a' },
      all,
    ],
    [
      'unselected, in a multi-select menu',
      { value: 'b' },
      { selection: 'multiple', selected: ['a'] },
      none,
    ],
    ['without a value, in a selecting menu', {}, { selection: 'single' }, none],
  ])('%s', async (_, props, menuProps, content) => {
    const slots = {
      default: () => 'Label',
      ...(content.icon ? { icon: () => '+' } : {}),
      ...(content.supportingText ? { 'supporting-text': () => 'More' } : {}),
      ...(content.trailingText ? { 'trailing-text': () => 'Ctrl+C' } : {}),
      ...(content.trailingIcon ? { 'trailing-icon': () => '>' } : {}),
    };
    const item = () => h(MenuItem, props, slots);
    const screen = menuProps
      ? await render(Menu, {
          props: { ...menuProps, modelValue: menuProps.selected },
          slots: { default: item },
        })
      : await render(item);
    const element = menuProps ? rootOf(screen).firstElementChild! : rootOf(screen);
    const menu = menuProps
      ? createMenu({ props: () => menuProps, onChange: noop, onOpenChange: noop })
      : undefined;
    const api = createMenuItem({
      props: () => props,
      content: () => content,
      menu: () => menu,
      onClick: noop,
    });
    expectSkeleton(element, menuItemSkeleton, api);
  });
});

describe('RioSubMenu', () => {
  const none = { icon: false, supportingText: false, trailingText: false, trailingIcon: false };
  const all = { icon: true, supportingText: true, trailingText: true, trailingIcon: true };

  test.each<[string, SubMenuProps, MenuProps, MenuItemContent]>([
    ['a label', { label: 'Share' }, {}, none],
    // Every prop away from its default, with every slot, in a menu whose style carries over
    [
      'disabled, selecting, with every slot, in a vibrant instant menu',
      { label: 'Sort by', disabled: true, selection: 'single', selected: 'name' },
      { variant: 'vibrant', instant: true },
      all,
    ],
  ])('%s', async (_, props, menuProps, content) => {
    const slots = {
      default: () => h(MenuItem, { value: 'name' }, () => 'Name'),
      ...(content.icon ? { icon: () => '+' } : {}),
      ...(content.supportingText ? { 'supporting-text': () => 'More' } : {}),
      ...(content.trailingText ? { 'trailing-text': () => '3' } : {}),
      ...(content.trailingIcon ? { 'trailing-icon': () => '>' } : {}),
    };
    const { selected, ...rest } = props;
    const screen = await render(Menu, {
      props: menuProps,
      slots: { default: () => h(SubMenu, { ...rest, modelValue: selected }, slots) },
    });
    const parent = createMenu({ props: () => menuProps, onChange: noop, onOpenChange: noop });
    // The item, then the submenu after it
    const [item, menu] = rootOf(screen).children;
    const api = createSubMenu({
      props: () => props,
      content: () => content,
      menu: () => parent,
      open: () => false,
      onChange: noop,
      onOpenChange: noop,
      ids: { menu: menu!.id },
    });
    expect(menu!.id).not.toBe('');
    expectSkeleton(item!, menuItemSkeleton, api.item);
    expectSkeleton(menu!, menuSkeleton, api.menu);
  });
});

describe('RioMenuGroup and RioMenuDivider', () => {
  test.each([
    ['a group with a label', 'Share'],
    ['a group without one', undefined],
  ])('%s', async (_, label) => {
    const screen = await render(MenuGroup, {
      props: { label },
      slots: { default: () => h(MenuItem, () => 'A') },
    });
    const api = createMenuGroup({ props: () => ({ label }) });
    expectSkeleton(rootOf(screen), menuGroupSkeleton, api);
  });

  test('a divider', async () => {
    const screen = await render(MenuDivider);
    expectSkeleton(rootOf(screen), menuDividerSkeleton, createMenuDivider());
  });
});

describe('RioTooltip', () => {
  test.each<[string, TooltipProps & { subhead?: string }, TooltipContent]>([
    ['plain', {}, { subhead: false, actions: false }],
    // Every non-boolean prop away from its default, with every slot: a dialog
    [
      'rich and persistent, with a subhead and actions, placed elsewhere',
      {
        variant: 'rich',
        persistent: true,
        subhead: 'Albums',
        side: 'end',
        align: 'center',
        offset: 8,
      },
      { subhead: true, actions: true },
    ],
    ['rich, with its text only', { variant: 'rich' }, { subhead: false, actions: false }],
  ])('%s', async (_, props, content) => {
    const screen = await render(Tooltip, {
      props: { ...props, text: 'Text' },
      slots: {
        default: () => h('button', null, 'Target'),
        ...(content.actions ? { actions: () => h('button', null, 'Action') } : {}),
      },
    });
    const trigger = rootOf(screen);
    const root = trigger.querySelector<HTMLElement>('.rio-tooltip')!;
    // The ids come from Vue's `useId`; the API is built with the ones rendered.
    const api = createTooltip({
      props: () => props,
      content: () => content,
      ids: {
        root: root.id,
        subhead: `${root.id.replace(/-tooltip$/, '')}-subhead`,
        supportingText: `${root.id.replace(/-tooltip$/, '')}-text`,
      },
    });
    expectSkeleton(trigger, tooltipTriggerSkeleton, api);
    // The app's element, then the tooltip
    expect(trigger.firstElementChild?.textContent).toBe('Target');
    expect(trigger.lastElementChild).toBe(root);
    expectSkeleton(root, tooltipSkeleton, api);
  });
});

describe('RioDialog', () => {
  test.each<[string, DialogProps & { headline?: string }, DialogContent, compact?: boolean]>([
    ['with its content only', {}, { icon: false, headline: false, actions: false }],
    // Every prop away from its default, with every slot
    [
      'a dialog with an icon, a headline, and actions',
      { role: 'dialog', headline: 'Phone ringtone' },
      { icon: true, headline: true, actions: true },
    ],
    [
      'an alert dialog with a headline and actions',
      { headline: 'Discard draft?' },
      { icon: false, headline: true, actions: true },
    ],
    [
      'a full-screen dialog with a headline and the confirming button',
      { variant: 'full-screen', headline: 'New event' },
      { icon: false, headline: true, actions: true },
    ],
    [
      'a full-screen dialog with its content only',
      { variant: 'full-screen' },
      { icon: false, headline: false, actions: false },
    ],
    [
      'an adaptive dialog in a wider window, with its Cancel button only',
      { variant: 'adaptive', headline: 'New event' },
      { icon: false, headline: true, actions: false },
    ],
    [
      'an adaptive dialog in a compact window',
      { variant: 'adaptive', headline: 'New event' },
      { icon: true, headline: true, actions: true },
      true,
    ],
  ])('%s', async (_, props, content, compact = false) => {
    if (compact) {
      await page.viewport(412, 720);
      onTestFinished(() => page.viewport(1280, 720));
    }
    const screen = await render(Dialog, {
      props,
      slots: {
        default: () => 'Text',
        ...(content.icon ? { icon: () => h('svg') } : {}),
        ...(content.actions ? { actions: () => h('button', null, 'OK') } : {}),
      },
    });
    const root = rootOf(screen);
    // A closed dialog renders none of its parts. It opens after the render: the test renderer
    // moves what it renders into place, which would close it.
    expect(root.children).toHaveLength(0);
    await screen.rerender({ ...props, open: true });
    await expect.poll(() => root.matches(':modal')).toBe(true);
    // The ids come from Vue's `useId`; the API is built with the ones rendered.
    const id = root.querySelector('.rio-dialog__content')!.id.replace(/-content$/, '');
    const api = createDialog({
      props: () => props,
      content: () => content,
      ids: { headline: `${id}-headline`, content: `${id}-content` },
      compact: () => compact,
    });
    expect(api.skeleton()).toBe(api.fullScreen() ? fullScreenDialogSkeleton : dialogSkeleton);
    expectSkeleton(root, api.skeleton(), api);
    if (content.headline) {
      expect(findPart(root, api.skeleton(), 'headline', api)?.textContent).toBe(props.headline);
    }
  });
});

describe('RioCheckbox', () => {
  test.each<[string, CheckboxProps]>([
    ['unchecked', {}],
    // Every prop away from its default
    [
      'checked, indeterminate, in error, and disabled',
      { selected: true, indeterminate: true, error: true, disabled: true },
    ],
    ['checked and soft-disabled', { selected: true, softDisabled: true }],
  ])('%s', async (_, props) => {
    const screen = await render(Checkbox, { props });
    expectSkeleton(rootOf(screen), checkboxSkeleton, createCheckbox({ props: () => props }));
  });
});

describe('RioRadioGroup and RioRadio', () => {
  test.each<[string, RadioProps]>([
    ['unselected', {}],
    // Every prop away from its default
    ['selected and disabled', { selected: true, disabled: true }],
    ['soft-disabled', { softDisabled: true }],
  ])('%s', async (_, props) => {
    const screen = await render(RadioGroup, {
      props: { label: 'Ringtone', modelValue: props.selected ? 'luna' : undefined },
      slots: {
        default: () =>
          h(Radio, { value: 'luna', disabled: props.disabled, softDisabled: props.softDisabled }),
      },
    });
    const group = rootOf(screen);
    expectSkeleton(
      group,
      radioGroupSkeleton,
      createRadioGroup({ props: () => ({ label: 'Ringtone' }) }),
    );
    const root = group.firstElementChild!;
    const name = root.querySelector('input')!.name;
    const api = createRadio({ props: () => props, name: () => name, value: () => 'luna' });
    expectSkeleton(root, radioSkeleton, api);
  });
});

describe('RioTextField', () => {
  test.each<[string, Omit<TextFieldProps, 'value'> & { modelValue?: string }, TextFieldContent]>([
    ['filled, with its label only', { label: 'Name' }, { leadingIcon: false, trailingIcon: false }],
    // Every prop away from its default, with every slot
    [
      'an outlined text area with everything',
      {
        variant: 'outlined',
        label: 'Notes',
        modelValue: 'Hello',
        multiline: true,
        rows: 5,
        prefix: '$',
        suffix: 'USD',
        supportingText: 'Hint',
        error: true,
        errorText: 'Wrong',
        maxlength: 20,
        required: true,
        disabled: true,
        readonly: true,
      },
      { leadingIcon: true, trailingIcon: true },
    ],
    [
      'without a label, with supporting text',
      { supportingText: 'Hint' },
      { leadingIcon: false, trailingIcon: false },
    ],
  ])('%s', async (_, props, content) => {
    const screen = await render(TextField, {
      props,
      slots: {
        ...(content.leadingIcon ? { 'leading-icon': () => h('svg') } : {}),
        ...(content.trailingIcon ? { 'trailing-icon': () => h('button', null, 'Clear') } : {}),
      },
    });
    const root = rootOf(screen);
    // The ids come from Vue's `useId`; the API is built with the ones rendered.
    const id = root.querySelector('.rio-text-field__input')!.id.replace(/-input$/, '');
    const { modelValue, ...rest } = props;
    const api = createTextField({
      props: () => ({ ...rest, value: modelValue }),
      content: () => content,
      ids: {
        input: `${id}-input`,
        prefix: `${id}-prefix`,
        suffix: `${id}-suffix`,
        supportingText: `${id}-supporting`,
        counter: `${id}-counter`,
      },
    });
    expectSkeleton(root, textFieldSkeleton, api);
    if (props.label) {
      expect(findPart(root, textFieldSkeleton, 'label', api)?.textContent).toBe(api.labelText());
    }
  });
});

describe('RioSelect', () => {
  const OPTIONS = [
    { value: 's', label: 'Small' },
    { value: 2, label: 'Large' },
  ];
  const plain = { leadingIcon: false };

  // The last item says whether the app shows the selection itself, in the `value` slot.
  test.each<
    [
      string,
      Omit<SelectProps, 'open' | 'selected'> & { modelValue?: SelectSelected },
      SelectContent,
      boolean,
    ]
  >([
    ['filled, with its label only', { label: 'Size' }, plain, false],
    // Every prop away from its default, with every slot
    [
      'an outlined multi-select with everything',
      {
        variant: 'outlined',
        label: 'Sizes',
        multiple: true,
        modelValue: ['s', 2],
        supportingText: 'Hint',
        error: true,
        errorText: 'Wrong',
        required: true,
        disabled: true,
        name: 'size',
        autocomplete: 'off',
        menuVariant: 'vibrant',
        instant: true,
      },
      { leadingIcon: true },
      false,
    ],
    [
      'without a label, one selected, shown the app’s way',
      { modelValue: 2, supportingText: 'Hint' },
      plain,
      true,
    ],
  ])('%s', async (_, props, content, custom) => {
    const screen = await render(Select, {
      props,
      slots: {
        default: () =>
          OPTIONS.map((option) => h(SelectOption, { value: option.value }, () => option.label)),
        ...(content.leadingIcon ? { 'leading-icon': () => h('svg') } : {}),
        ...(custom ? { value: () => 'Custom' } : {}),
      },
    });
    // The options' labels reach the field after they render.
    await new Promise((resolve) => setTimeout(resolve));
    const root = rootOf(screen);
    // The ids come from Vue's `useId`; the API is built with the ones rendered.
    const id = root.querySelector('[role="combobox"]')!.id.replace(/-field$/, '');
    const { modelValue, ...rest } = props;
    const api = createSelect({
      props: () => ({ ...rest, selected: modelValue }),
      options: () => OPTIONS,
      content: () => content,
      ids: {
        field: `${id}-field`,
        label: `${id}-label`,
        listbox: `${id}-listbox`,
        supportingText: `${id}-supporting`,
      },
      onChange: noop,
      onOpenChange: noop,
    });
    expectSkeleton(root, selectSkeleton, api);
    // What fills the content parts is core's call too.
    const value = findPart(root, selectSkeleton, 'value', api)!.textContent!.trim();
    expect(value).toBe(custom ? 'Custom' : api.valueText());
    const sizer = findPart(root, selectSkeleton, 'sizer', api)!;
    expect([...sizer.children].map((each) => each.textContent)).toEqual(api.sizerTexts());
    const native = findPart(root, selectSkeleton, 'native', api) as HTMLSelectElement;
    expect([...native.options].map((option) => option.value)).toEqual([
      ...(api.multiple() ? [] : ['']),
      ...OPTIONS.map((option) => api.nativeValue(option.value)),
    ]);
  });
});

describe('RioSelectOption', () => {
  const none = { icon: false, supportingText: false, trailingText: false, trailingIcon: false };
  const all = { icon: true, supportingText: true, trailingText: true, trailingIcon: true };

  test.each<[string, SelectOptionProps, SelectProps, SelectOptionContent]>([
    ['a label', { value: 'a' }, {}, none],
    ['selected, with every slot', { value: 'a' }, { selected: 'a' }, all],
    [
      'disabled, in a multi-select',
      { value: 'b', disabled: true },
      { multiple: true, selected: ['a'] },
      none,
    ],
  ])('%s', async (_, props, selectProps, content) => {
    const slots = {
      default: () => 'Label',
      ...(content.icon ? { icon: () => '+' } : {}),
      ...(content.supportingText ? { 'supporting-text': () => 'More' } : {}),
      ...(content.trailingText ? { 'trailing-text': () => 'S' } : {}),
      ...(content.trailingIcon ? { 'trailing-icon': () => '>' } : {}),
    };
    const screen = await render(Select, {
      props: { ...selectProps, modelValue: selectProps.selected },
      slots: { default: () => h(SelectOption, props, slots) },
    });
    const element = rootOf(screen).querySelector('[role="listbox"]')!.firstElementChild!;
    const select = createSelect({
      props: () => selectProps,
      options: () => [],
      ids: { field: '', label: '', listbox: '', supportingText: '' },
      onChange: noop,
      onOpenChange: noop,
    });
    const api = createSelectOption({
      props: () => props,
      content: () => content,
      select: () => select,
    });
    expectSkeleton(element, selectOptionSkeleton, api);
  });
});

describe('RioDatePicker', () => {
  const messages = () => messagesFor('en').datePicker;

  test.each([
    ['docked, submitting with a form', { name: 'when', modelValue: '2026-11-27' }],
    ['modal', { variant: 'modal' as const }],
  ])('%s', async (_, props) => {
    const screen = await render(DatePicker, { props: { locale: 'en-US', ...props } });
    const value = 'modelValue' in props ? props.modelValue : undefined;
    const api = createDatePicker({
      props: () => ({
        variant: 'variant' in props ? props.variant : undefined,
        name: 'name' in props ? props.name : undefined,
        value,
        locale: 'en-US',
      }),
      messages,
      state: () => initialDatePickerState(value, 'en-US'),
      onChange: noop,
      onOpenChange: noop,
      onStateChange: noop,
    });
    expectSkeleton(rootOf(screen), datePickerSkeleton, api);
  });
});

describe('the date pickers’ calendar', () => {
  test.each([
    ['docked, the days', 'docked' as const, 'days' as const],
    ['docked, the months', 'docked' as const, 'months' as const],
    ['modal, the years', 'modal' as const, 'years' as const],
  ])('%s', async (_, variant, view) => {
    const props = {
      variant,
      selected: '2026-11-27',
      month: '2026-11',
      focused: '2026-11-27',
      view,
      locale: 'en-US',
      min: '2026-11-05',
    };
    const screen = await render(DatePickerCalendar, {
      props: { ...props, messages: messagesFor('en').datePicker },
    });
    const api = createCalendar({
      props: () => props,
      messages: () => messagesFor('en').datePicker,
      onSelect: noop,
      onMonthChange: noop,
      onFocusChange: noop,
      onViewChange: noop,
    });
    const root = rootOf(screen);
    expectSkeleton(root, calendarSkeleton, api);
    // The days carry the attributes core gives each.
    if (view === 'days') {
      for (const date of ['2026-11-27', '2026-11-01', '2026-12-01']) {
        const day = root.querySelector(`[data-date="${date}"]`)!;
        for (const [name, value] of Object.entries(api.parts.day(date))) {
          if (name === 'class') continue;
          expect(day.getAttribute(name), `${date} ${name}`).toBe(value ?? null);
        }
      }
    }
  });
});

describe('RioDatePickerDialog', () => {
  test('closed, it renders nothing inside', async () => {
    const screen = await render(DatePickerDialog, { props: { locale: 'en-US' } });
    const root = rootOf(screen);
    const api = createDatePickerDialog({
      props: () => ({ locale: 'en-US', rendered: false }),
      messages: () => messagesFor('en').datePicker,
      state: () => initialDatePickerState(undefined, 'en-US'),
      ids: { title: 'x', headline: 'y' },
      onChange: noop,
      onOpenChange: noop,
      onStateChange: noop,
    });
    expectSkeleton(root, datePickerDialogSkeleton, {
      ...api,
      parts: { ...api.parts, root: () => ({ class: api.parts.root().class }) },
    });
  });

  // Mounted with `createApp`: vitest-browser-vue moves what it renders into place afterwards,
  // which closes a dialog that is open by then.
  test.each(['calendar', 'input'] as const)('open, in the %s', async (mode) => {
    const host = document.body.appendChild(document.createElement('div'));
    const app = createApp(() =>
      h(DatePickerDialog, { locale: 'en-US', open: true, initialMode: mode }),
    );
    app.mount(host);
    onTestFinished(() => {
      app.unmount();
      host.remove();
    });
    const root = host.querySelector('dialog')!;
    await vi.waitFor(() => expect(root.open).toBe(true));
    const title = root.querySelector('.rio-date-picker-dialog__title')!.id;
    const api = createDatePickerDialog({
      props: () => ({ locale: 'en-US', rendered: true }),
      messages: () => messagesFor('en').datePicker,
      state: () => ({ ...initialDatePickerState(undefined, 'en-US'), mode }),
      ids: { title, headline: title.replace(/-title$/, '-headline') },
      onChange: noop,
      onOpenChange: noop,
      onStateChange: noop,
    });
    expectSkeleton(root, datePickerDialogSkeleton, api);
  });
});

describe('RioList', () => {
  test.each<[string, ListProps]>([
    ['static, standard', {}],
    [
      'one at a time, segmented, named',
      { selection: 'single', variant: 'segmented', label: 'Size' },
    ],
    ['any number', { selection: 'multiple', selected: ['a'] }],
  ])('%s', async (_, { selected, ...props }) => {
    const screen = await render(List, {
      props: { ...props, modelValue: selected },
      slots: { default: () => [h(ListItem, { value: 'a' }, () => 'A')] },
    });
    const root = rootOf(screen);
    // The tab stop is the item `attachList` reports, read back from the rendered item.
    const stop = root.querySelector<HTMLElement>('[tabindex="0"]')?.dataset.listFocus;
    const api = createList({
      props: () => ({ ...props, selected }),
      tabStop: () => stop,
      onChange: noop,
    });
    expectSkeleton(root, listSkeleton, api);
  });
});

describe('RioListItem', () => {
  const content = { leading: true, overline: true, supporting: true, trailing: true };
  const slots = {
    default: () => 'Label',
    leading: () => 'L',
    overline: () => 'O',
    supporting: () => 'S',
    trailing: () => 'T',
  };
  test.each<[string, ListItemProps, ListProps]>([
    ['static', {}, {}],
    ['a link', { href: '/inbox' }, {}],
    ['a button, disabled', { action: true, disabled: true }, {}],
    ['an option, selected', { value: 'a' }, { selection: 'single', selected: 'a' }],
  ])('%s, with every part', async (_, props, listProps) => {
    const screen = await render(
      defineComponent(
        () => () =>
          h(List, { ...listProps, modelValue: listProps.selected }, () =>
            h(
              ListItem,
              {
                value: props.value,
                href: props.href,
                disabled: props.disabled,
                onClick: props.action ? noop : undefined,
              },
              slots,
            ),
          ),
      ),
    );
    const root = rootOf(screen).querySelector<HTMLElement>('.rio-list-item')!;
    const key =
      root.querySelector<HTMLElement>('[data-list-focus]')?.dataset.listFocus ??
      root.dataset.listFocus ??
      'static';
    const list = createList({ props: () => listProps, tabStop: () => key, onChange: noop });
    const api = createListItem({
      props: () => props,
      list: () => list,
      key,
      content: () => content,
      multiline: () => false,
    });
    const skeleton =
      api.kind() === 'link'
        ? listItemActionSkeleton('a')
        : api.kind() === 'button'
          ? listItemActionSkeleton('button')
          : listItemSkeleton;
    expectSkeleton(root, skeleton, api);
    expect(root.querySelector('.rio-list-item__label')!.textContent).toBe('Label');
  });
});

describe('the range picker’s calendar', () => {
  test('the weekdays, and the months with their days', async () => {
    const props = {
      start: '2026-08-17',
      end: '2026-09-02',
      focused: '2026-08-17',
      firstMonth: '2026-07',
      lastMonth: '2026-09',
      locale: 'en-US',
      min: '2026-07-10',
    };
    const screen = await render(DateRangeCalendar, { props });
    const api = createRangeCalendar({
      props: () => props,
      onSelect: noop,
      onFocusChange: noop,
      onMonthsChange: noop,
    });
    const root = rootOf(screen);
    expectSkeleton(root, rangeCalendarSkeleton, api);
    const weekdays = root.querySelector('.rio-date-picker__weekdays')!.children;
    expect(weekdays).toHaveLength(7);
    api.weekdays().forEach((day, i) => {
      expectPart(weekdays[i], 'span', api.parts.weekday(day));
      expect(weekdays[i]!.textContent?.trim()).toBe(api.weekdayText(day));
    });
    const months = root.querySelector('.rio-date-picker__months')!.children;
    expect(months).toHaveLength(api.months().length);
    api.months().forEach((month, i) => {
      const element = months[i]!;
      expectPart(element, 'div', api.parts.month(month));
      const [subhead, grid] = element.children;
      expectPart(subhead, 'div', api.parts.subhead(month));
      expect(subhead!.textContent?.trim()).toBe(api.monthText(month));
      expectPart(grid, 'table', api.parts.grid(month));
      const rows = grid!.querySelectorAll(':scope > tbody > tr');
      expect(rows).toHaveLength(api.weeks(month).length);
      api.weeks(month).forEach((week, w) =>
        week.forEach((date, d) => {
          const cell = rows[w]!.children[d]!;
          expectPart(cell, 'td', api.parts.cell(date, month));
          const day = cell.querySelector('button');
          if (!api.showsDay(date, month)) {
            expect(day, date).toBeNull();
            return;
          }
          expectPart(day, 'button', api.parts.day(date));
          expect(day!.textContent?.trim()).toBe(api.dayText(date));
        }),
      );
    });
  });
});

describe('RioDateRangePickerDialog', () => {
  const dialogApi = (
    state: Parameters<typeof createDateRangePickerDialog>[0]['state'],
    ids = { title: 'x', headline: 'y' },
    rendered = true,
  ) =>
    createDateRangePickerDialog({
      props: () => ({ locale: 'en-US', rendered }),
      messages: () => messagesFor('en').datePicker,
      state,
      ids,
      onChange: noop,
      onOpenChange: noop,
      onStateChange: noop,
    });

  test('closed, it renders nothing inside', async () => {
    const screen = await render(DateRangePickerDialog, { props: { locale: 'en-US' } });
    const api = dialogApi(
      () => initialDateRangePickerState(undefined, undefined, 'en-US'),
      undefined,
      false,
    );
    expectSkeleton(rootOf(screen), dateRangePickerDialogSkeleton, {
      ...api,
      parts: { ...api.parts, root: () => ({ class: api.parts.root().class }) },
    });
  });

  // Mounted with `createApp`, as the date picker's dialog is
  test.each(['calendar', 'input'] as const)('open, in the %s', async (mode) => {
    const host = document.body.appendChild(document.createElement('div'));
    const app = createApp(() =>
      h(DateRangePickerDialog, {
        locale: 'en-US',
        open: true,
        start: '2026-08-17',
        end: '2026-08-23',
        initialMode: mode,
      }),
    );
    app.mount(host);
    onTestFinished(() => {
      app.unmount();
      host.remove();
    });
    const root = host.querySelector('dialog')!;
    await vi.waitFor(() => expect(root.open).toBe(true));
    const title = root.querySelector('.rio-date-picker-dialog__title')!.id;
    const api = dialogApi(
      () => ({ ...initialDateRangePickerState('2026-08-17', '2026-08-23', 'en-US'), mode }),
      { title, headline: title.replace(/-title$/, '-headline') },
    );
    expectSkeleton(root, dateRangePickerDialogSkeleton, api);
    // The header: the title, the headline, and the mode button
    const header = root.querySelector('.rio-date-picker-dialog__header')!.children;
    expect(header).toHaveLength(3);
    const [titleElement, headline, modeButton] = header;
    expectPart(titleElement, 'span', api.parts.title());
    expectPart(headline, 'span', api.parts.headline());
    expect(headline!.textContent?.trim()).toBe(api.headline());
    expect(modeButton!.getAttribute('aria-label')).toBe(api.modeButtonLabel());
  });
});

/** An element inside a part that holds content, against the attributes core gives it */
const expectPart = (
  element: Element | null | undefined,
  tag: keyof HTMLElementTagNameMap,
  attrs: PartAttrs,
) => {
  expect(element, `${tag}.${attrs.class}`).toBeTruthy();
  expectSkeleton<'part', never>(
    element!,
    { part: 'part', tag, content: true },
    { parts: { part: () => attrs } },
  );
};

/** What the time pickers' fields, AM and PM, and dial hold */
const expectTimePickerContent = (root: Element, api: TimePickerApi) => {
  const fields = root.querySelector('.rio-time-picker__fields')!;
  if (api.textInput()) {
    const [hour, separator, minute] = fields.children;
    expectPart(hour, 'span', api.parts.unit());
    expectPart(hour!.children[0], 'input', api.parts.hourField());
    expectPart(hour!.children[1], 'span', api.parts.hourLabel());
    expectPart(separator, 'span', api.parts.separator());
    expectPart(minute, 'span', api.parts.unit());
    expectPart(minute!.children[0], 'input', api.parts.minuteField());
    expectPart(minute!.children[1], 'span', api.parts.minuteLabel());
    expect(fields.children).toHaveLength(3);
  } else if (api.showsScroll()) {
    const [hour, separator, minute] = fields.children;
    expectPart(separator, 'span', api.parts.separator());
    expect(fields.children).toHaveLength(3);
    // Scroll fields, each with the props core gives it
    for (const [element, field] of [
      [hour, 'hour'],
      [minute, 'minute'],
    ] as const) {
      expectPart(
        element,
        'div',
        field === 'hour' ? api.parts.hourField() : api.parts.minuteField(),
      );
      const options = element!.querySelector('[role="option"]')!.id.replace(/-\d+$/, '');
      const scroll = createScrollField({
        props: () => api.scrollField(field),
        ids: { options },
        onChange: noop,
        onEditingChange: noop,
      });
      expectSkeleton(element!, scrollFieldSkeleton, scroll);
    }
  } else {
    const [hour, separator, minute] = fields.children;
    expectPart(hour, 'button', api.parts.hourField());
    expectPart(separator, 'span', api.parts.separator());
    expectPart(minute, 'button', api.parts.minuteField());
    expect(fields.children).toHaveLength(3);
  }
  const toggle = root.querySelector('.rio-time-picker__toggle');
  if (api.showsToggle()) {
    // The mode button, named for the mode it switches to
    const props = { variant: 'standard', label: api.modeButtonLabel() } as const;
    const button = createIconButton({
      props: () => props,
      content: () => ({ selectedIcon: false }),
      onClick: noop,
      onChange: noop,
    });
    expect(toggle!.children).toHaveLength(1);
    expectSkeleton(toggle!.children[0]!, iconButtonSkeleton, button);
  }
  const period = root.querySelector('.rio-time-picker__period');
  if (api.showsPeriod()) {
    const [am, pm] = period!.children;
    expectPart(am, 'button', api.parts.am());
    expectPart(pm, 'button', api.parts.pm());
    expect(period!.children).toHaveLength(2);
    for (const button of [am!, pm!]) {
      expectPart(button.querySelector(':scope > span'), 'span', api.parts.periodTouch());
    }
  }
  const dial = root.querySelector('.rio-time-picker__dial');
  if (api.showsDial()) {
    const [track, handle, center, ...numbers] = dial!.children;
    expectPart(track, 'span', api.parts.dialTrack());
    expectPart(handle, 'span', api.parts.dialHandle());
    expectPart(center, 'span', api.parts.dialCenter());
    const items = api.dialItems();
    expect(numbers).toHaveLength(items.length);
    items.forEach((item, i) => expectPart(numbers[i], 'button', api.parts.dialItem(item)));
  }
};

const timePicker = (
  variant: 'inline' | 'scroll' | 'dialog',
  props: TimePickerProps,
  state: TimePickerState,
  error = 'error',
) =>
  createTimePicker({
    variant,
    props: () => props,
    messages: () => messagesFor('en').timePicker,
    state: () => state,
    ids: { error },
    onChange: noop,
    onOpenChange: noop,
    onStateChange: noop,
  });

describe('RioTimeInput', () => {
  test.each([
    ['12 hours, with AM and PM', 'en-US'],
    ['24 hours', 'de-DE'],
  ])('%s', async (_, locale) => {
    const screen = await render(TimeInput, { props: { locale, modelValue: '19:05' } });
    const twelve = locale === 'en-US';
    const api = timePicker(
      'inline',
      { locale, value: '19:05' },
      {
        ...initialTimePickerState('19:05'),
        mode: 'input',
        hourText: twelve ? '07' : '19',
        minuteText: '05',
      },
    );
    expectSkeleton(rootOf(screen), timePickerSkeleton, api);
    expectTimePickerContent(rootOf(screen), api);
  });

  test('with an error', async () => {
    const screen = await render(TimeInput, { props: { locale: 'en-US', modelValue: '19:05' } });
    await userEvent.fill(screen.getByRole('textbox', { name: 'Hour' }), '13');
    await userEvent.keyboard('{Enter}');
    const alert = await vi.waitFor(() => rootOf(screen).querySelector('[role="alert"]')!);
    const api = timePicker(
      'inline',
      { locale: 'en-US', value: '19:05' },
      {
        ...initialTimePickerState('19:05'),
        mode: 'input',
        hourText: '13',
        minuteText: '05',
        invalid: 'hour',
      },
      alert.id,
    );
    expectSkeleton(rootOf(screen), timePickerSkeleton, api);
    expectTimePickerContent(rootOf(screen), api);
  });
});

describe('RioTimeScroll', () => {
  test.each<[string, string, string | undefined]>([
    ['12 hours, with AM and PM', 'en-US', '19:05'],
    ['24 hours', 'de-DE', '19:05'],
    ['without a time', 'en-US', undefined],
  ])('%s', async (_, locale, value) => {
    const screen = await render(TimeScroll, { props: { locale, modelValue: value } });
    const api = timePicker('scroll', { locale, value }, initialTimePickerState(value));
    expectSkeleton(rootOf(screen), timePickerSkeleton, api);
    expectTimePickerContent(rootOf(screen), api);
  });

  test('switched to the text input', async () => {
    const screen = await render(TimeScroll, { props: { locale: 'en-US', modelValue: '19:05' } });
    await userEvent.click(screen.getByRole('button', { name: 'Toggle input picker' }));
    await vi.waitFor(() => rootOf(screen).querySelector('input')!);
    const api = timePicker(
      'scroll',
      { locale: 'en-US', value: '19:05' },
      { ...initialTimePickerState('19:05'), mode: 'input', hourText: '07', minuteText: '05' },
    );
    expectSkeleton(rootOf(screen), timePickerSkeleton, api);
    expectTimePickerContent(rootOf(screen), api);
  });
});

describe('RioTimePickerDialog', () => {
  test('closed, it renders nothing inside', async () => {
    const screen = await render(TimePickerDialog, { props: { locale: 'en-US' } });
    const api = timePicker(
      'dialog',
      { locale: 'en-US', rendered: false },
      initialTimePickerState(undefined),
    );
    expectSkeleton(rootOf(screen), timePickerDialogSkeleton, api);
  });

  // Mounted with `createApp`: vitest-browser-vue moves what it renders into place afterwards,
  // which closes a dialog that is open by then.
  test.each<[string, Partial<TimePickerProps>, Partial<TimePickerState>]>([
    ['the dial, on the hours', {}, {}],
    ['the dial, on the minutes', {}, { selection: 'minute' }],
    [
      'the text input, 24 hours, horizontal',
      { hourCycle: 24, layout: 'horizontal', initialMode: 'input' },
      { mode: 'input', hourText: '07', minuteText: '30' },
    ],
    ['the dial, 24 hours', { hourCycle: 24 }, {}],
    ['the scroll fields', { picker: 'scroll' }, {}],
    [
      'the text input, from the scroll fields',
      { picker: 'scroll', initialMode: 'input' },
      { mode: 'input', hourText: '07', minuteText: '30' },
    ],
  ])('open: %s', async (_, props, state) => {
    const host = document.body.appendChild(document.createElement('div'));
    const app = createApp(() =>
      h(TimePickerDialog, { locale: 'en-US', modelValue: '07:30', open: true, ...props }),
    );
    app.mount(host);
    onTestFinished(() => {
      app.unmount();
      host.remove();
    });
    const root = host.querySelector('dialog')!;
    await vi.waitFor(() => expect(root.open).toBe(true));
    if (state.selection === 'minute') {
      await userEvent.click(root.querySelector('.rio-time-picker__field[data-field="minute"]')!);
    }
    const api = timePicker(
      'dialog',
      { locale: 'en-US', value: '07:30', open: true, rendered: true, ...props },
      { ...initialTimePickerState('07:30'), hourText: '07', minuteText: '30', ...state },
    );
    expectSkeleton(root, timePickerDialogSkeleton, api);
    expectTimePickerContent(root, api);
  });
});
