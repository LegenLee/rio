import { attachTheme } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, reactive, ref, type Component } from 'vue';
import RioMenu from '../menu/Menu.vue';
import RioMenuItem from '../menu/MenuItem.vue';
import AssistChip from './AssistChip.vue';
import FilterChip from './FilterChip.vue';
import InputChip from './InputChip.vue';
import SuggestionChip from './SuggestionChip.vue';

const svg = () => h('svg', { viewBox: '0 0 24 24' });

const withTheme = () => {
  const theme = attachTheme(document.documentElement, {
    sourceColor: '#6750a4',
    colorScheme: false,
  });
  onTestFinished(() => theme.detach());
};

/** Renders after a button, and moves the focus in from it with Tab, as the keyboard does */
const tabInto = async (vnode: () => ReturnType<typeof h>) => {
  const screen = await render(
    defineComponent(() => () => h('div', [h('button', 'Before'), vnode()])),
  );
  (screen.getByRole('button', { name: 'Before' }).element() as HTMLElement).focus();
  await userEvent.tab();
  return screen;
};

/** Where a part sits inside its chip, along the inline axis, from the chip's start */
const offsets = (root: Element, part: string) => {
  const box = root.querySelector(`.rio-chip__${part}`)!.getBoundingClientRect();
  const chip = root.getBoundingClientRect();
  return { start: box.left - chip.left, end: chip.right - box.right, width: box.width };
};

describe.each([
  ['RioAssistChip', AssistChip],
  ['RioSuggestionChip', SuggestionChip],
] as [string, Component][])('%s', (_, Chip) => {
  test('a button named by its label, 32px tall with a 48px target', async () => {
    const onClick = vi.fn();
    const screen = await render(Chip, { attrs: { onClick }, slots: { default: () => 'Book' } });
    const button = screen.getByRole('button', { name: 'Book' }).element() as HTMLElement;
    expect(button.getBoundingClientRect().height).toBe(32);
    const touch = button.querySelector('.rio-chip__touch')!.getBoundingClientRect();
    expect(touch.height).toBe(48);
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  test('16px on each side; 8px before a leading icon, which is 18px and 8px from the label', async () => {
    const plain = await render(Chip, { slots: { default: () => 'Book' } });
    const root = plain.container.querySelector('.rio-chip')!;
    expect(offsets(root, 'label')).toMatchObject({ start: 16, end: 16 });
    plain.unmount();
    const withIcon = await render(Chip, { slots: { default: () => 'Book', icon: svg } });
    const chip = withIcon.container.querySelector('.rio-chip')!;
    const icon = offsets(chip, 'icon');
    expect([icon.start, icon.width]).toEqual([8, 18]);
    expect(offsets(chip, 'label').start).toBe(8 + 18 + 8);
  });

  test('with href, a link; disabled, it keeps no address', async () => {
    const screen = await render(Chip, {
      props: { href: '#here', disabled: false },
      slots: { default: () => 'Go' },
    });
    await expect.element(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('href', '#here');
    await screen.rerender({ disabled: true });
    await expect.element(screen.getByRole('link', { name: 'Go' })).not.toHaveAttribute('href');
  });

  test('disabled takes no focus and no click; soft-disabled takes the focus, not the click', async () => {
    const onClick = vi.fn();
    const disabled = await render(Chip, {
      props: { disabled: true },
      attrs: { onClick },
      slots: { default: () => 'Off' },
    });
    const button = disabled.getByRole('button').element() as HTMLButtonElement;
    button.focus();
    expect(document.activeElement).not.toBe(button);
    disabled.unmount();
    const soft = await render(Chip, {
      props: { softDisabled: true },
      attrs: { onClick },
      slots: { default: () => 'Off' },
    });
    const softButton = soft.getByRole('button').element() as HTMLButtonElement;
    softButton.focus();
    expect(document.activeElement).toBe(softButton);
    await userEvent.click(softButton, { force: true });
    expect(onClick).not.toHaveBeenCalled();
  });

  test('focus from the keyboard darkens the outline to the label’s color', async () => {
    withTheme();
    const screen = await tabInto(() => h(Chip, null, () => 'Book'));
    const chip = screen.container.querySelector('.rio-chip') as HTMLElement;
    expect(chip.matches(':focus-visible')).toBe(true);
    const outline = () => getComputedStyle(chip).borderTopColor;
    const label = () => getComputedStyle(chip).color;
    // The colors fade, so wait for them to settle.
    await vi.waitFor(() => expect(outline()).toBe(label()));
    (screen.getByRole('button', { name: 'Before' }).element() as HTMLElement).focus();
    await vi.waitFor(() => expect(outline()).not.toBe(label()));
  });

  test('a press ripples on the state part, which covers the chip', async () => {
    const screen = await render(Chip, { slots: { default: () => 'Book' } });
    const root = screen.container.querySelector('.rio-chip')!;
    const state = root.querySelector('.rio-chip__state')!;
    expect(state.hasAttribute('data-ripple')).toBe(true);
    const box = state.getBoundingClientRect();
    expect(box.width).toBe(root.getBoundingClientRect().width);
  });
});

describe('RioFilterChip', () => {
  const check = { 'selected-icon': svg };

  /** A filter chip whose selection the app keeps */
  const setup = async (props: Record<string, unknown> = {}, keep = false) => {
    const state = reactive({ selected: false, changes: [] as boolean[] });
    const screen = await render(
      defineComponent(
        () => () =>
          h(
            FilterChip,
            {
              ...props,
              selected: state.selected,
              'onUpdate:selected': (next: boolean) => {
                state.changes.push(next);
                if (!keep) state.selected = next;
              },
            },
            { default: () => 'Wi-Fi', ...check },
          ),
      ),
    );
    const button = screen.getByRole('button', { name: 'Wi-Fi' }).element() as HTMLElement;
    return { screen, state, button };
  };

  test('a toggle button: pressed while selected, the app owning the state', async () => {
    const { button, state } = await setup();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(button);
    expect(state.selected).toBe(true);
    await vi.waitFor(() => expect(button.getAttribute('aria-pressed')).toBe('true'));
  });

  test('a change the app turns down doesn’t stick', async () => {
    const { button, state } = await setup({}, true);
    await userEvent.click(button);
    expect(state.changes).toEqual([true]);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  test('Space and Enter toggle it, as a button', async () => {
    const { button, state } = await setup();
    button.focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Enter}');
    expect(state.changes).toEqual([true, false]);
  });

  test('selected, the selected icon leads, 8px in', async () => {
    const { button, state } = await setup();
    expect(button.querySelector('.rio-chip__icon')).toBeNull();
    expect(offsets(button, 'label').start).toBe(16);
    state.selected = true;
    await vi.waitFor(() => expect(button.querySelector('.rio-chip__icon')).not.toBeNull());
    expect(offsets(button, 'icon').start).toBe(8);
  });

  test('a press shows the color it leads to: selected’s on an unselected chip, and the other way round', async () => {
    withTheme();
    const screen = await render(
      defineComponent(
        () => () =>
          h('div', [
            h(FilterChip, null, () => 'Off'),
            h(FilterChip, { selected: true }, () => 'On'),
          ]),
      ),
    );
    const [off, on] = [...screen.container.querySelectorAll<HTMLElement>('.rio-chip')];
    const press = (chip: HTMLElement) => {
      chip.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          isPrimary: true,
          buttons: 1,
          pointerType: 'mouse',
        }),
      );
      return chip.querySelector<HTMLElement>('.rio-chip__state')!;
    };
    const offState = press(off!);
    const onState = press(on!);
    await vi.waitFor(() => expect(offState.hasAttribute('data-pressed')).toBe(true));
    expect(getComputedStyle(offState).color).toBe(getComputedStyle(on!).color);
    expect(getComputedStyle(onState).color).toBe(getComputedStyle(off!).color);
    for (const chip of [off!, on!]) {
      chip.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, isPrimary: true, pointerType: 'mouse' }),
      );
    }
  });

  test('a menu chip opens its menu, anchored to it, and turns its dropdown icon over', async () => {
    const state = reactive({ open: false, size: '' });
    const screen = await render(
      defineComponent(() => {
        const chip = ref();
        return () => [
          h(
            FilterChip,
            {
              ref: chip,
              menu: true,
              open: state.open,
              selected: state.size !== '',
              'onUpdate:open': (next: boolean) => (state.open = next),
            },
            { default: () => state.size || 'Size', 'dropdown-icon': svg },
          ),
          h(
            RioMenu,
            {
              open: state.open,
              anchor: chip.value,
              label: 'Size',
              'onUpdate:open': (next: boolean) => (state.open = next),
            },
            () => h(RioMenuItem, { onClick: () => (state.size = 'Large') }, () => 'Large'),
          ),
        ];
      }),
    );
    const button = screen.getByRole('button', { name: 'Size' }).element() as HTMLElement;
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-pressed')).toBeNull();
    await userEvent.click(button);
    await expect.element(screen.getByRole('menu')).toBeVisible();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(getComputedStyle(button.querySelector('.rio-chip__trailing')!).rotate).toBe('180deg');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Large' }));
    await vi.waitFor(() => expect(button.getAttribute('data-selected')).toBe('true'));
    expect(button.textContent).toContain('Large');
  });
});

describe('RioInputChip', () => {
  const remove = { 'remove-icon': svg };

  test('remove-only: with the keyboard focus on the remove button, the ring goes round the chip', async () => {
    withTheme();
    const screen = await tabInto(() =>
      h(InputChip, { removeOnly: true }, { default: () => 'Ada', ...remove }),
    );
    const chip = screen.container.querySelector('.rio-chip') as HTMLElement;
    const button = chip.querySelector('.rio-chip__remove') as HTMLElement;
    expect(document.activeElement).toBe(button);
    expect(getComputedStyle(chip).outlineStyle).toBe('solid');
    expect(getComputedStyle(button).outlineStyle).toBe('none');
  });

  const setup = async (props: Record<string, unknown> = {}, slots = {}) => {
    const onRemove = vi.fn();
    const onClick = vi.fn();
    const screen = await render(InputChip, {
      props,
      attrs: { onRemove, onClick },
      slots: { default: () => 'Ada', ...remove, ...slots },
    });
    return { screen, onRemove, onClick, root: screen.container.querySelector('.rio-chip')! };
  };

  test('the chip’s action and its remove button, named after the label', async () => {
    const { screen, onRemove, onClick } = await setup();
    await userEvent.click(screen.getByRole('button', { name: 'Ada', exact: true }));
    expect(onClick).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Ada' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  test('the remove button is named in the chip’s language, or by the app’s message', async () => {
    const korean = await setup({ locale: 'ko' });
    await expect
      .element(korean.screen.getByRole('button', { name: 'Ada 삭제' }))
      .toBeInTheDocument();
    korean.screen.unmount();
    const own = await setup({ messages: { remove: 'Drop {label}' } });
    await expect.element(own.screen.getByRole('button', { name: 'Drop Ada' })).toBeInTheDocument();
  });

  test('Backspace and Delete remove it, from the action or the remove button', async () => {
    const { screen, onRemove } = await setup();
    (screen.getByRole('button', { name: 'Ada', exact: true }).element() as HTMLElement).focus();
    await userEvent.keyboard('{Backspace}');
    (screen.getByRole('button', { name: 'Remove Ada' }).element() as HTMLElement).focus();
    await userEvent.keyboard('{Delete}');
    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  test('disabled or soft-disabled, nothing removes it', async () => {
    for (const props of [{ disabled: true }, { softDisabled: true }]) {
      const { screen, onRemove } = await setup(props);
      const button = screen.getByRole('button', { name: 'Remove Ada' });
      await userEvent.click(button, { force: true });
      (button.element() as HTMLElement).focus();
      await userEvent.keyboard('{Delete}');
      expect(onRemove).not.toHaveBeenCalled();
      screen.unmount();
    }
  });

  test('remove-only: the remove button is the one focusable element, and a press anywhere removes it', async () => {
    const { screen, onRemove } = await setup({ removeOnly: true });
    expect(screen.getByRole('button').elements()).toHaveLength(1);
    const button = screen.getByRole('button', { name: 'Remove Ada' }).element() as HTMLElement;
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledOnce();
    // At the chip's start: on a chip this short, the remove button's 48px target covers the label.
    await userEvent.click(screen.container.querySelector('.rio-chip')!, {
      position: { x: 6, y: 16 },
    });
    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  test('Backspace and Delete with Alt, Ctrl, or Meta are left to the app', async () => {
    const { screen, onRemove } = await setup();
    (screen.getByRole('button', { name: 'Ada', exact: true }).element() as HTMLElement).focus();
    await userEvent.keyboard('{Control>}{Backspace}{/Control}');
    await userEvent.keyboard('{Alt>}{Delete}{/Alt}');
    expect(onRemove).not.toHaveBeenCalled();
  });

  test('16px before the label, or 8px before an icon or 4px before an avatar; the remove icon 8px from the end, with a 48px target', async () => {
    const plain = await setup();
    expect(offsets(plain.root, 'label').start).toBe(16);
    const removeIcon = offsets(plain.root, 'remove-icon');
    expect([removeIcon.end, removeIcon.width]).toEqual([8, 18]);
    const target = plain.root.querySelector('.rio-chip__remove .rio-chip__touch')!;
    expect(target.getBoundingClientRect().height).toBe(48);
    plain.screen.unmount();
    const icon = await setup({}, { icon: svg });
    expect(offsets(icon.root, 'icon').start).toBe(8);
    icon.screen.unmount();
    const avatar = await setup({}, { avatar: svg, icon: svg });
    const box = offsets(avatar.root, 'avatar');
    expect([box.start, box.width]).toEqual([4, 24]);
    expect(avatar.root.querySelector('.rio-chip__icon')).toBeNull();
    expect(offsets(avatar.root, 'label').start).toBe(4 + 24 + 8);
  });

  test('with an action of its own, at least 88px wide; remove-only, as wide as it needs', async () => {
    const short = await render(InputChip, { slots: { default: () => 'A', ...remove } });
    expect(short.container.querySelector('.rio-chip')!.getBoundingClientRect().width).toBe(88);
    short.unmount();
    const only = await render(InputChip, {
      props: { removeOnly: true },
      slots: { default: () => 'A', ...remove },
    });
    expect(only.container.querySelector('.rio-chip')!.getBoundingClientRect().width).toBeLessThan(
      88,
    );
  });

  test('class and style dress the chip; every other attribute goes to the action', async () => {
    const screen = await render(InputChip, {
      attrs: { class: 'mine', style: 'margin: 3px', 'aria-describedby': 'hint' },
      slots: { default: () => 'Ada' },
    });
    const root = screen.container.querySelector('.rio-chip') as HTMLElement;
    expect(root.classList.contains('mine')).toBe(true);
    expect(root.style.margin).toBe('3px');
    expect(root.querySelector('.rio-chip__action')!.getAttribute('aria-describedby')).toBe('hint');
    expect(root.hasAttribute('aria-describedby')).toBe(false);
  });
});
