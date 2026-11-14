// The Vue adapter against core's markup contract: each component, rendered in a few
// configurations, has to match its skeleton and carry the attributes core gives each part. A new
// adapter writes the same test against the same skeletons.
import {
  buttonGroupSkeleton,
  buttonSkeleton,
  createButton,
  createButtonGroup,
  createIconButton,
  createSwitch,
  iconButtonSkeleton,
  switchSkeleton,
  type ButtonGroupProps,
  type ButtonProps,
  type IconButtonProps,
  type SwitchContent,
  type SwitchProps,
} from '@rio-m3e/core';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-vue';
import { h } from 'vue';
import ButtonGroup from './button-group/ButtonGroup.vue';
import Button from './button/Button.vue';
import IconButton from './icon-button/IconButton.vue';
import Switch from './switch/Switch.vue';
import { expectSkeleton, findPart } from './test/contract';

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
  ])('%s', async (_, props, icon) => {
    const screen = await render(Button, {
      props,
      slots: { default: () => 'Label', ...(icon ? { icon: () => '+' } : {}) },
    });
    const api = createButton({
      props: () => props,
      content: () => ({ icon }),
      onClick: noop,
      onSelectedChange: noop,
    });
    expectSkeleton(rootOf(screen), buttonSkeleton, api);
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
  ])('%s', async (_, props, selectedIcon) => {
    const screen = await render(IconButton, {
      props,
      slots: { default: () => '♡', ...(selectedIcon ? { 'selected-icon': () => '♥' } : {}) },
    });
    const api = createIconButton({
      props: () => props,
      content: () => ({ selectedIcon }),
      onClick: noop,
      onSelectedChange: noop,
    });
    expectSkeleton(rootOf(screen), iconButtonSkeleton, api);
    // Which icon fills the icon part is core's call too.
    const icon = findPart(rootOf(screen), iconButtonSkeleton, 'icon', api);
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
      onSelectedChange: noop,
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
