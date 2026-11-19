// The Vue adapter against core's markup contract: each component, rendered in a few
// configurations, has to match its skeleton and carry the attributes core gives each part. A new
// adapter writes the same test against the same skeletons.
import {
  buttonGroupSkeleton,
  buttonLinkSkeleton,
  buttonSkeleton,
  calendarSkeleton,
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
  createButton,
  createButtonGroup,
  createCheckbox,
  createDialog,
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
  linearProgressSkeleton,
  type CircularProgressProps,
  type LinearProgressProps,
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
  createSlider,
  rangeSliderSkeleton,
  sliderSkeleton,
  type RangeSliderProps,
  type SliderContent,
  type SliderProps,
  createTextField,
  createTooltip,
  createSplitButton,
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
  tooltipSkeleton,
  tooltipTriggerSkeleton,
  type ButtonGroupProps,
  type ButtonProps,
  type CheckboxProps,
  type DialogContent,
  type DialogProps,
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
  type TooltipProps,
} from '@rio-m3e/core';
import { expectSkeleton, findPart } from '@rio-m3e/testing';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { render } from 'vitest-browser-vue';
import { userEvent } from 'vitest/browser';
import { createApp, h } from 'vue';
import ButtonGroup from './button-group/ButtonGroup.vue';
import Button from './button/Button.vue';
import Checkbox from './checkbox/Checkbox.vue';
import DatePicker from './date-picker/DatePicker.vue';
import DatePickerCalendar from './date-picker/DatePickerCalendar.vue';
import DatePickerDialog from './date-picker/DatePickerDialog.vue';
import Dialog from './dialog/Dialog.vue';
import IconButton from './icon-button/IconButton.vue';
import Menu from './menu/Menu.vue';
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
  test.each<[string, DialogProps & { headline?: string }, DialogContent]>([
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
  ])('%s', async (_, props, content) => {
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
    });
    expectSkeleton(root, dialogSkeleton, api);
    if (content.headline) {
      expect(findPart(root, dialogSkeleton, 'headline', api)?.textContent).toBe(props.headline);
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
  } else {
    const [hour, separator, minute] = fields.children;
    expectPart(hour, 'button', api.parts.hourField());
    expectPart(separator, 'span', api.parts.separator());
    expectPart(minute, 'button', api.parts.minuteField());
    expect(fields.children).toHaveLength(3);
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
  variant: 'inline' | 'dialog',
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
