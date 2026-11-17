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
  createDatePickerDialog,
  datePickerDialogSkeleton,
  datePickerSkeleton,
  initialPickerState,
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
import TextField from './text-field/TextField.vue';
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
    const api = createSubMenu({
      props: () => props,
      content: () => content,
      menu: () => parent,
      open: () => false,
      onChange: noop,
      onOpenChange: noop,
    });
    // The item, then the submenu after it
    const [item, menu] = rootOf(screen).children;
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
      state: () => initialPickerState(value, 'en-US'),
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
      state: () => initialPickerState(undefined, 'en-US'),
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
      state: () => ({ ...initialPickerState(undefined, 'en-US'), mode }),
      ids: { title, headline: title.replace(/-title$/, '-headline') },
      onChange: noop,
      onOpenChange: noop,
      onStateChange: noop,
    });
    expectSkeleton(root, datePickerDialogSkeleton, api);
  });
});
