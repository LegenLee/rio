import { describe, expect, test, vi } from 'vitest';
import { messagesFor } from '../locale/messages';
import {
  createAssistChip,
  createChipSet,
  createFilterChip,
  createInputChip,
  createSuggestionChip,
  type AssistChipProps,
  type ChipSetProps,
  type FilterChipContent,
  type FilterChipProps,
  type InputChipProps,
} from './chip';

const event = () => ({ preventDefault: vi.fn() });

describe('assist and suggestion chips', () => {
  const setup = (props: AssistChipProps = {}, icon = false, tabStop?: boolean) => {
    const onClick = vi.fn();
    return {
      chip: createAssistChip({
        props: () => props,
        content: () => ({ icon }),
        key: tabStop === undefined ? undefined : () => 'k',
        tabStop: () => tabStop,
        onClick,
      }),
      onClick,
    };
  };

  test('a button by default, outlined, with an icon that only decorates', () => {
    const { parts, showsIcon, isLink } = setup({}, true).chip;
    expect(parts.root()).toEqual({
      class: 'rio-chip rio-focus-ring',
      'data-type': 'assist',
      'data-elevated': undefined,
      'data-icon': '',
      type: 'button',
      disabled: undefined,
      'aria-disabled': undefined,
      tabindex: undefined,
      'data-disabled': undefined,
      'data-chip-focus': undefined,
    });
    expect([showsIcon(), isLink()]).toEqual([true, false]);
    expect(parts.icon()).toEqual({ class: 'rio-chip__icon', 'aria-hidden': 'true' });
    expect(parts.state()).toEqual({ class: 'rio-chip__state', 'aria-hidden': 'true' });
    expect(parts.touch()).toEqual({ class: 'rio-chip__touch', 'aria-hidden': 'true' });
    expect(parts.label()).toEqual({ class: 'rio-chip__label' });
  });

  test('a suggestion chip is marked so', () => {
    const chip = createSuggestionChip({ props: () => ({ elevated: true }), onClick: vi.fn() });
    expect(chip.parts.root()).toMatchObject({ 'data-type': 'suggestion', 'data-elevated': '' });
  });

  test('a click acts unless disabled or soft-disabled', () => {
    const { chip, onClick } = setup();
    chip.handleClick(event());
    expect(onClick).toHaveBeenCalledOnce();
    for (const props of [{ disabled: true }, { softDisabled: true }]) {
      const blocked = setup(props);
      const click = event();
      blocked.chip.handleClick(click);
      expect(blocked.onClick).not.toHaveBeenCalled();
      expect(click.preventDefault).toHaveBeenCalled();
    }
  });

  test('disabled is native; soft-disabled is aria-disabled and stays focusable', () => {
    expect(setup({ disabled: true }).chip.parts.root()).toMatchObject({
      disabled: '',
      'aria-disabled': undefined,
      'data-disabled': '',
    });
    expect(setup({ softDisabled: true }).chip.parts.root()).toMatchObject({
      disabled: undefined,
      'aria-disabled': 'true',
      'data-disabled': '',
    });
  });

  test('with href, a link; disabled, a link without an address', () => {
    const link = setup({ href: '/calendar' }).chip;
    expect(link.isLink()).toBe(true);
    expect(link.parts.root()).toMatchObject({
      href: '/calendar',
      role: undefined,
      tabindex: undefined,
    });
    expect(link.parts.root()).not.toHaveProperty('type');
    expect(setup({ href: '/calendar', disabled: true }).chip.parts.root()).toMatchObject({
      href: undefined,
      role: 'link',
      'aria-disabled': 'true',
      tabindex: undefined,
    });
    // The soft variant keeps the focus.
    expect(setup({ href: '/calendar', softDisabled: true }).chip.parts.root().tabindex).toBe('0');
  });

  test('in a chip set: marked for the arrow keys, and a tab stop or not', () => {
    expect(setup({}, false, true).chip.parts.root()).toMatchObject({
      tabindex: '0',
      'data-chip-focus': 'k',
    });
    expect(setup({}, false, false).chip.parts.root().tabindex).toBe('-1');
    expect(setup({ href: '#', softDisabled: true }, false, false).chip.parts.root().tabindex).toBe(
      '-1',
    );
    // A disabled chip takes no focus, so the arrow keys pass it, a link included, even as the
    // set's tab stop.
    expect(setup({ disabled: true }, false, false).chip.parts.root()).toMatchObject({
      tabindex: undefined,
      'data-chip-focus': undefined,
    });
    expect(setup({ href: '#', disabled: true }, false, true).chip.parts.root()).toMatchObject({
      tabindex: undefined,
      'data-chip-focus': undefined,
    });
  });
});

describe('filter chips', () => {
  const content: FilterChipContent = { icon: true, selectedIcon: true, dropdownIcon: true };
  const setup = (props: FilterChipProps = {}, own: Partial<FilterChipContent> = {}) => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const onClick = vi.fn();
    return {
      chip: createFilterChip({
        props: () => props,
        content: () => ({ icon: false, selectedIcon: false, dropdownIcon: false, ...own }),
        onClick,
        onChange,
        onOpenChange,
      }),
      onChange,
      onOpenChange,
      onClick,
    };
  };

  test('a toggle button, pressed while selected', () => {
    expect(setup().chip.parts.root()).toMatchObject({
      'aria-pressed': 'false',
      'data-type': 'filter',
      'data-selected': 'false',
      'aria-haspopup': undefined,
    });
    expect(setup({ selected: true }).chip.parts.root()).toMatchObject({
      'aria-pressed': 'true',
      'data-selected': 'true',
    });
  });

  test('a click asks for the opposite selection', () => {
    const { chip, onChange, onClick } = setup({ selected: true });
    chip.handleClick(event());
    expect(onChange).toHaveBeenCalledWith(false);
    expect(onClick).toHaveBeenCalledOnce();
    const blocked = setup({ softDisabled: true });
    blocked.chip.handleClick(event());
    expect(blocked.onChange).not.toHaveBeenCalled();
  });

  test('the selected icon shows while selected, the leading icon while not', () => {
    const off = setup({}, content).chip;
    expect([off.showsIcon(), off.showsSelectedIcon()]).toEqual([true, false]);
    const on = setup({ selected: true }, content).chip;
    expect([on.showsIcon(), on.showsSelectedIcon()]).toEqual([true, true]);
    // Selected without a selected icon: no icon, not the leading one.
    expect(setup({ selected: true }, { icon: true }).chip.showsIcon()).toBe(false);
    expect(setup({}, { selectedIcon: true }).chip.showsIcon()).toBe(false);
    expect(on.parts.root()['data-icon']).toBe('');
  });

  test('a menu chip is a menu button: a click asks to open it, and the app keeps its selection', () => {
    const { chip, onOpenChange, onChange } = setup({ menu: true, selected: true }, content);
    expect(chip.parts.root()).toMatchObject({
      'aria-pressed': undefined,
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      'data-selected': 'true',
      'data-trailing': '',
    });
    expect(chip.showsTrailing()).toBe(true);
    chip.handleClick(event());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(onChange).not.toHaveBeenCalled();
    expect(setup({ menu: true, open: true }).chip.parts.root()['aria-expanded']).toBe('true');
    // The dropdown icon only belongs to a menu chip.
    expect(setup({}, content).chip.showsTrailing()).toBe(false);
  });

  test('the trailing part stays out of the accessibility tree', () => {
    expect(setup().chip.parts.trailing()).toEqual({
      class: 'rio-chip__trailing',
      'aria-hidden': 'true',
    });
  });
});

describe('input chips', () => {
  const ids = { label: 'l', removeBefore: 'b', removeAfter: 'a' };
  const setup = (
    props: InputChipProps = {},
    locale = 'en',
    content = { icon: false, avatar: false },
    tabStop?: boolean,
  ) => {
    const onRemove = vi.fn();
    const onClick = vi.fn();
    return {
      chip: createInputChip({
        props: () => props,
        content: () => content,
        messages: () => messagesFor(locale).chip,
        ids,
        key: tabStop === undefined ? undefined : () => 'k',
        tabStop: () => tabStop,
        onClick,
        onRemove,
      }),
      onRemove,
      onClick,
    };
  };

  test('an action and a remove button, named after the label, “Remove” first in English', () => {
    const { chip } = setup();
    expect(chip.isAction()).toBe(true);
    expect(chip.parts.action()).toEqual({
      class: 'rio-chip__action',
      type: 'button',
      disabled: undefined,
      'aria-disabled': undefined,
      tabindex: undefined,
      'data-chip-focus': undefined,
    });
    expect(chip.parts.label()).toEqual({ class: 'rio-chip__label', id: 'l' });
    expect(chip.parts.remove()).toMatchObject({
      class: 'rio-chip__remove rio-focus-ring',
      type: 'button',
      'aria-labelledby': 'b l',
      tabindex: undefined,
    });
    expect(chip.removeText()).toEqual({ before: 'Remove', after: '' });
    expect([chip.showsRemoveBefore(), chip.showsRemoveAfter()]).toEqual([true, false]);
    expect(chip.parts.removeBefore()).toEqual({ id: 'b', hidden: '' });
  });

  test('Korean names the label first', () => {
    const { chip } = setup({}, 'ko');
    expect(chip.removeText()).toEqual({ before: '', after: '삭제' });
    expect(chip.parts.remove()['aria-labelledby']).toBe('l a');
  });

  test('a message without the label keeps its words before it', () => {
    const chip = createInputChip({
      props: () => ({}),
      messages: () => ({ remove: 'Delete' }),
      ids,
      onClick: vi.fn(),
      onRemove: vi.fn(),
    });
    expect(chip.removeText()).toEqual({ before: 'Delete', after: '' });
  });

  test('the remove button and Backspace or Delete ask to remove it; other keys don’t', () => {
    const { chip, onRemove } = setup();
    chip.handleRemoveClick(event());
    const keys = { altKey: false, ctrlKey: false, metaKey: false, defaultPrevented: false };
    for (const key of ['Backspace', 'Delete']) {
      const keydown = { ...keys, key, preventDefault: vi.fn() };
      chip.handleKeydown(keydown);
      expect(keydown.preventDefault).toHaveBeenCalled();
    }
    expect(onRemove).toHaveBeenCalledTimes(3);
    chip.handleKeydown({ ...keys, key: 'Enter', preventDefault: vi.fn() });
    chip.handleKeydown({ ...keys, key: 'Delete', defaultPrevented: true, preventDefault: vi.fn() });
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
      const keydown = { ...keys, [modifier]: true, key: 'Backspace', preventDefault: vi.fn() };
      chip.handleKeydown(keydown);
      expect(keydown.preventDefault).not.toHaveBeenCalled();
    }
    expect(onRemove).toHaveBeenCalledTimes(3);
  });

  test('disabled or soft-disabled, nothing removes it or acts', () => {
    for (const props of [{ disabled: true }, { softDisabled: true }]) {
      const { chip, onRemove, onClick } = setup(props);
      chip.handleRemoveClick(event());
      chip.handleKeydown({
        key: 'Delete',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        defaultPrevented: false,
        preventDefault: vi.fn(),
      });
      chip.handleClick(event());
      expect(onRemove).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    }
    expect(setup({ disabled: true }).chip.parts.remove()).toMatchObject({ disabled: '' });
    expect(setup({ softDisabled: true }).chip.parts.remove()['aria-disabled']).toBe('true');
  });

  test('a remove-only chip has no action: its remove button is the one focusable element, and a press on it removes it', () => {
    const { chip, onClick, onRemove } = setup(
      { removeOnly: true },
      'en',
      { icon: false, avatar: false },
      true,
    );
    expect(chip.isAction()).toBe(false);
    expect(chip.parts.action()).toEqual({ class: 'rio-chip__action' });
    expect(chip.parts.remove()).toMatchObject({ tabindex: '0', 'data-chip-focus': 'k' });
    expect(chip.parts.root()['data-remove-only']).toBe('');
    chip.handleClick(event());
    expect(onClick).not.toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalledOnce();
    const blocked = setup({ removeOnly: true, softDisabled: true });
    blocked.chip.handleClick(event());
    expect(blocked.onRemove).not.toHaveBeenCalled();
  });

  test('in a chip set, the action is the tab stop and the arrow keys reach the remove button', () => {
    const stop = setup({}, 'en', { icon: false, avatar: false }, true).chip;
    expect(stop.parts.action()).toMatchObject({ tabindex: '0', 'data-chip-focus': 'k' });
    expect(stop.parts.remove()).toMatchObject({ tabindex: '-1', 'data-chip-focus': 'k' });
    const other = setup({}, 'en', { icon: false, avatar: false }, false).chip;
    expect(other.parts.action().tabindex).toBe('-1');
  });

  test('an avatar wins over the icon, and both only decorate', () => {
    const both = setup({}, 'en', { icon: true, avatar: true }).chip;
    expect([both.showsAvatar(), both.showsIcon()]).toEqual([true, false]);
    expect(both.parts.root()).toMatchObject({ 'data-avatar': '', 'data-icon': undefined });
    expect(both.parts.avatar()).toEqual({ class: 'rio-chip__avatar', 'aria-hidden': 'true' });
    expect(setup({}, 'en', { icon: true, avatar: false }).chip.showsIcon()).toBe(true);
  });
});

describe('the chip set', () => {
  const setup = (props: ChipSetProps = {}, tabStop?: string) => {
    const onChange = vi.fn();
    return {
      set: createChipSet({ props: () => props, tabStop: () => tabStop, onChange }),
      onChange,
    };
  };

  test('a toolbar, wrapping by default', () => {
    expect(setup().set.parts.root()).toEqual({
      class: 'rio-chip-set',
      role: 'toolbar',
      'data-scroll': undefined,
    });
    expect(setup({ scroll: true }).set.parts.root()['data-scroll']).toBe('');
  });

  test('without a selection, every chip keeps its own', () => {
    const { set, onChange } = setup({ selected: ['a'] });
    expect(set.selection()).toBe('none');
    expect(set.isSelected('a')).toBe(false);
    set.select('a', true);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('single: selecting one turns the other off; turning it off leaves none', () => {
    const { set, onChange } = setup({ selection: 'single', selected: 'a' });
    expect([set.isSelected('a'), set.isSelected('b')]).toEqual([true, false]);
    set.select('b', true);
    expect(onChange).toHaveBeenLastCalledWith('b');
    set.select('a', false);
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  test('multiple: chips add and leave; required keeps the last one', () => {
    const { set, onChange } = setup({ selection: 'multiple', selected: ['a'], required: true });
    set.select('b', true);
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
    set.select('a', false);
    expect(onChange).toHaveBeenCalledTimes(1);
    set.select('a', true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('the tab stop is the chip the adapter keeps, once there is one', () => {
    expect(setup().set.isTabStop('k')).toBeUndefined();
    const { set } = setup({}, 'k');
    expect([set.isTabStop('k'), set.isTabStop('j')]).toEqual([true, false]);
  });
});

describe('props an adapter passes as undefined take the defaults', () => {
  test('a filter chip is a toggle, off', () => {
    const chip = createFilterChip({
      props: () => ({ selected: undefined, menu: undefined, elevated: undefined, open: undefined }),
      onClick: vi.fn(),
      onChange: vi.fn(),
      onOpenChange: vi.fn(),
    });
    expect(chip.parts.root()).toMatchObject({
      'aria-pressed': 'false',
      'aria-haspopup': undefined,
      'aria-expanded': undefined,
      'data-selected': 'false',
      'data-elevated': undefined,
    });
  });

  test('a chip set keeps no selection', () => {
    const onChange = vi.fn();
    const set = createChipSet({
      props: () => ({ selection: undefined, required: undefined, scroll: undefined }),
      tabStop: () => undefined,
      onChange,
    });
    expect(set.selection()).toBe('none');
    set.select('a', true);
    expect(onChange).not.toHaveBeenCalled();
    expect(set.parts.root()['data-scroll']).toBeUndefined();
  });

  test('an input chip has its action', () => {
    const chip = createInputChip({
      props: () => ({ removeOnly: undefined, disabled: undefined }),
      messages: () => messagesFor('en').chip,
      ids: { label: 'l', removeBefore: 'b', removeAfter: 'a' },
      onClick: vi.fn(),
      onRemove: vi.fn(),
    });
    expect(chip.isAction()).toBe(true);
  });
});
