import { attachSlider } from '@rio-m3e/core';
import { attachTheme } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, reactive, type VNode } from 'vue';
import Slider from './Slider.vue';
import { expectRingOnFocus } from '../test/focus-ring';

/** 212px wide, so the handle travels 200px between the 6px insets: 2px for each of 100 values. */
const WIDTH = 212;

interface Setup {
  props?: Record<string, unknown>;
  value?: number;
  /** Leaves the value as it is, as an app that turns the change down does. */
  keep?: boolean;
  slots?: Record<string, () => unknown>;
  /** Wraps the slider, as in a form, a label, or a right-to-left page. */
  wrap?: (slider: VNode) => VNode;
}

/** A slider whose value the app keeps, as an app would write it. */
const setup = async ({ props = {}, value = 50, keep = false, slots, wrap }: Setup = {}) => {
  const state = reactive({ value, changes: [] as number[] });
  const screen = await render(
    defineComponent(() => () => {
      const slider = h(
        Slider,
        {
          style: `width: ${WIDTH}px`,
          ...props,
          modelValue: state.value,
          'onUpdate:modelValue': (next: number) => {
            state.changes.push(next);
            if (!keep) state.value = next;
          },
        },
        slots,
      );
      return wrap ? wrap(slider) : slider;
    }),
  );
  const input = screen.getByRole('slider').element() as HTMLInputElement;
  const root = input.closest<HTMLElement>('.rio-slider')!;
  const part = (name: string) => root.querySelector<HTMLElement>(`.rio-slider__${name}`)!;
  return { screen, state, input, root, part };
};

/** Where a fraction of the range sits on screen, along the slider */
const at = (root: HTMLElement, fraction: number) => {
  const rect = root.getBoundingClientRect();
  return root.dataset.vertical === undefined
    ? { x: rect.left + 6 + fraction * (rect.width - 12), y: rect.top + rect.height / 2 }
    : { x: rect.left + rect.width / 2, y: rect.bottom - 6 - fraction * (rect.height - 12) };
};

const pointer = (
  root: HTMLElement,
  type: string,
  { x, y }: { x: number; y: number },
  pointerType = 'mouse',
  pointerId = 5,
) =>
  root.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      isPrimary: true,
      pointerId,
      pointerType,
      clientX: x,
      clientY: y,
      buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
    }),
  );

/** A box's start and end along the slider, from the root's start */
const span = (root: HTMLElement, el: Element) => {
  const box = el.getBoundingClientRect();
  const rect = root.getBoundingClientRect();
  return [box.left - rect.left, box.right - rect.left];
};

const withTheme = () => {
  const theme = attachTheme(document.documentElement, {
    sourceColor: '#6750a4',
    colorScheme: false,
  });
  onTestFinished(() => theme.detach());
};

describe('RioSlider', () => {
  test('is a native range input, from 0 to 100 by default', async () => {
    const { input } = await setup({ value: 30 });
    expect([input.type, input.min, input.max, input.step, input.value]).toEqual([
      'range',
      '0',
      '100',
      '1',
      '30',
    ]);
  });

  describe('layout', () => {
    test('the input covers the slider, where assistive technology finds it', async () => {
      const { root, input } = await setup();
      expect(input.getBoundingClientRect().toJSON()).toEqual(root.getBoundingClientRect().toJSON());
    });

    test('the value indicator: 48 × 44px, 4px over the handle, or beside it at the start on a vertical slider', async () => {
      // One digit, so the label's width stays under the 48px, whatever the font
      const horizontal = await setup({ props: { valueIndicator: true }, value: 5 });
      const box = horizontal.part('value-indicator').getBoundingClientRect();
      const handle = horizontal.part('handle').getBoundingClientRect();
      expect([box.width, box.height]).toEqual([48, 44]);
      expect(handle.top - box.bottom).toBe(4);
      expect(box.left + box.width / 2).toBe(handle.left + handle.width / 2);
      horizontal.screen.unmount();

      const vertical = await setup({
        props: { valueIndicator: true, vertical: true, style: undefined },
      });
      const side = vertical.part('value-indicator').getBoundingClientRect();
      const bar = vertical.part('handle').getBoundingClientRect();
      expect(bar.left - side.right).toBe(4);
      expect(side.top + side.height / 2).toBe(bar.top + bar.height / 2);
    });

    test('an XS slider: a 16px track and a 44 × 4px handle, in a 48px row', async () => {
      const { root, part } = await setup();
      expect(root.getBoundingClientRect().height).toBe(48);
      expect(part('track-active').getBoundingClientRect().height).toBe(16);
      const handle = part('handle').getBoundingClientRect();
      expect([handle.width, handle.height]).toEqual([4, 44]);
    });

    test.each([
      ['small', 48, 24, 44],
      ['medium', 52, 40, 52],
      ['large', 68, 56, 68],
      ['xlarge', 108, 96, 108],
    ])('%s: the spec’s track and handle', async (size, row, track, handle) => {
      const { root, part } = await setup({ props: { size } });
      expect(root.getBoundingClientRect().height).toBe(row);
      expect(part('track-upper').getBoundingClientRect().height).toBe(track);
      expect(part('handle').getBoundingClientRect().height).toBe(handle);
    });

    test('the handle travels between 6px insets, on the stop indicators', async () => {
      const { root, part, state } = await setup({ value: 0 });
      const center = () => {
        const [start, end] = span(root, part('handle'));
        return (start! + end!) / 2;
      };
      expect(center()).toBe(6);
      state.value = 50;
      await vi.waitFor(() => expect(center()).toBe(106));
      state.value = 100;
      await vi.waitFor(() => expect(center()).toBe(206));
    });

    test('the tracks keep 6px from the handle’s sides, and reach the slider’s ends', async () => {
      const { root, part } = await setup({ value: 50 });
      // The handle spans 104 to 108.
      expect(span(root, part('track-active'))).toEqual([0, 98]);
      expect(span(root, part('track-upper'))).toEqual([114, WIDTH]);
    });

    test('centered: the active track runs from the middle, 2px off it, to the handle', async () => {
      const { root, part, state } = await setup({
        props: { centered: true, min: -50, max: 50 },
        value: 20,
      });
      // The middle is at 106 and the handle at 146.
      expect(span(root, part('track-lower'))).toEqual([0, 104]);
      expect(span(root, part('track-active'))).toEqual([108, 138]);
      expect(span(root, part('track-upper'))).toEqual([154, WIDTH]);
      state.value = -20;
      // The handle at 66
      await vi.waitFor(() => expect(span(root, part('track-active'))).toEqual([74, 104]));
      expect(span(root, part('track-lower'))).toEqual([0, 58]);
      expect(span(root, part('track-upper'))).toEqual([108, WIDTH]);
    });

    test('stops: the tracks draw one at each step, as far apart as the steps', async () => {
      // The dots take the theme's colors.
      withTheme();
      const { part } = await setup({ props: { stops: true, step: 10 } });
      expect(getComputedStyle(part('track-upper')).backgroundSize).toBe('20px 100%');
      expect(getComputedStyle(part('track-active')).backgroundImage).toContain('radial-gradient');
    });

    test('right to left, the value grows toward the left, and so do the stops', async () => {
      withTheme();
      const { root, part } = await setup({
        props: { stops: true, step: 10 },
        value: 30,
        wrap: (slider) => h('div', { dir: 'rtl' }, [slider]),
      });
      const [start, end] = span(root, part('handle'));
      expect((start! + end!) / 2).toBe(WIDTH - 66);
      // The upper track starts 74px from the right. Its dots' boxes, 20px each, line up from 6px in
      // from the slider's right end, less half a box: 78px right of the track's own start.
      expect(getComputedStyle(part('track-upper')).backgroundPositionX).toBe('calc(100% + 78px)');
    });

    test('vertical: 200px tall by default, the value growing upward', async () => {
      const { root, part, input } = await setup({
        props: { vertical: true, style: undefined },
        value: 25,
      });
      const rect = root.getBoundingClientRect();
      expect([rect.width, rect.height]).toEqual([48, 200]);
      const handle = part('handle').getBoundingClientRect();
      expect([handle.width, handle.height]).toEqual([44, 4]);
      expect(rect.bottom - (handle.top + handle.bottom) / 2).toBe(6 + 0.25 * 188);
      expect(input.getAttribute('aria-orientation')).toBe('vertical');
    });
  });

  describe('the pointer', () => {
    test('a click moves the handle there and focuses the slider, without a focus ring', async () => {
      const { root, input, state } = await setup();
      await userEvent.click(root, { position: { x: 6 + 150, y: 24 } });
      expect(state.value).toBe(75);
      expect(document.activeElement).toBe(input);
      expect(input.matches(':focus-visible')).toBe(false);
    });

    test('a mouse drag follows, with an input event for each change and a change event at the end', async () => {
      const inputs: string[] = [];
      const changes: string[] = [];
      const { root, state } = await setup({
        props: {
          onInput: (event: Event) => inputs.push((event.target as HTMLInputElement).value),
          onChange: (event: Event) => changes.push((event.target as HTMLInputElement).value),
        },
      });
      pointer(root, 'pointerdown', at(root, 0.2));
      await nextTick();
      pointer(root, 'pointermove', at(root, 0.3));
      await nextTick();
      pointer(root, 'pointermove', at(root, 0.3));
      pointer(root, 'pointerup', at(root, 0.3));
      expect(state.changes).toEqual([20, 30]);
      expect(inputs).toEqual(['20', '30']);
      expect(changes).toEqual(['30']);
    });

    test('dragging past the ends stops there', async () => {
      const { root, state } = await setup();
      pointer(root, 'pointerdown', at(root, 0.9));
      await nextTick();
      pointer(root, 'pointermove', { x: root.getBoundingClientRect().right + 80, y: 0 });
      pointer(root, 'pointerup', { x: 0, y: 0 });
      expect(state.value).toBe(100);
    });

    test('touch: a tap moves the handle there as it lifts', async () => {
      const { root, input, state } = await setup();
      pointer(root, 'pointerdown', at(root, 0.1), 'touch');
      expect(state.changes).toEqual([]);
      pointer(root, 'pointerup', at(root, 0.1), 'touch');
      expect(state.value).toBe(10);
      expect(document.activeElement).toBe(input);
    });

    test('touch: a drag follows once it has moved 8px; a swipe the page takes changes nothing', async () => {
      const { root, state } = await setup();
      const from = at(root, 0.5);
      pointer(root, 'pointerdown', from, 'touch');
      pointer(root, 'pointermove', { x: from.x + 6, y: from.y }, 'touch');
      expect(state.changes).toEqual([]);
      pointer(root, 'pointermove', { x: from.x + 20, y: from.y }, 'touch');
      expect(state.value).toBe(60);
      pointer(root, 'pointerup', { x: from.x + 20, y: from.y }, 'touch');

      pointer(root, 'pointerdown', at(root, 0.2), 'touch');
      pointer(root, 'pointercancel', at(root, 0.2), 'touch');
      expect(state.value).toBe(60);
      // The next touch starts afresh.
      pointer(root, 'pointerdown', at(root, 0.3), 'touch', 6);
      pointer(root, 'pointerup', at(root, 0.3), 'touch', 6);
      expect(state.value).toBe(30);
    });

    test('a press marks the input, which narrows the handle and shows the value indicator', async () => {
      const { root, input, part } = await setup({ props: { valueIndicator: true }, value: 40 });
      const indicator = part('value-indicator');
      expect(indicator.textContent).toBe('40');
      expect(getComputedStyle(indicator).opacity).toBe('0');
      pointer(root, 'pointerdown', at(root, 0.4));
      expect(input.hasAttribute('data-pressed')).toBe(true);
      await vi.waitFor(() => expect(getComputedStyle(indicator).opacity).toBe('1'));
      await vi.waitFor(() => expect(part('handle').getBoundingClientRect().width).toBe(2));
      pointer(root, 'pointerup', at(root, 0.4));
      expect(input.hasAttribute('data-pressed')).toBe(false);
      await vi.waitFor(() => expect(getComputedStyle(indicator).opacity).toBe('0'));
    });

    test('vertical: the pointer reads from the bottom up', async () => {
      const { root, state } = await setup({ props: { vertical: true, style: undefined } });
      await userEvent.click(root, { position: { x: 24, y: 200 - 6 - 0.3 * 188 } });
      expect(state.value).toBe(30);
    });

    test('right to left: the pointer reads from the right', async () => {
      const { root, state } = await setup({
        wrap: (slider) => h('div', { dir: 'rtl' }, [slider]),
      });
      await userEvent.click(root, { position: { x: 6 + 50, y: 24 } });
      expect(state.value).toBe(75);
    });

    test('with steps, the handle goes to the nearest one', async () => {
      const { root, state } = await setup({ props: { step: 25, stops: true }, value: 0 });
      await userEvent.click(root, { position: { x: 6 + 130, y: 24 } });
      expect(state.value).toBe(75);
    });
  });

  describe('the keys', () => {
    test('arrows move by a step, Page Up and Page Down by a tenth, Home and End to the ends', async () => {
      const { input, state } = await setup({ props: { step: 2 } });
      input.focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(state.value).toBe(52);
      await userEvent.keyboard('{ArrowDown}');
      expect(state.value).toBe(50);
      await userEvent.keyboard('{PageUp}');
      expect(state.value).toBe(60);
      await userEvent.keyboard('{Home}');
      expect(state.value).toBe(0);
      await userEvent.keyboard('{End}');
      expect(state.value).toBe(100);
    });

    test('focus from the keyboard shows the value indicator, the focus ring, and the narrow handle', async () => {
      withTheme();
      const screen = await render(
        defineComponent(
          () => () =>
            h('div', [
              h('button', 'Before'),
              h(Slider, { style: `width: ${WIDTH}px`, modelValue: 40, valueIndicator: true }),
            ]),
        ),
      );
      (screen.getByRole('button').element() as HTMLElement).focus();
      await userEvent.tab();
      const input = screen.getByRole('slider').element() as HTMLInputElement;
      const root = input.closest<HTMLElement>('.rio-slider')!;
      expect(input.matches(':focus-visible')).toBe(true);
      const handle = root.querySelector<HTMLElement>('.rio-slider__handle')!;
      await expect
        .poll(() => getComputedStyle(root.querySelector('.rio-slider__value-indicator')!).opacity)
        .toBe('1');
      expect(getComputedStyle(handle).outlineStyle).toBe('solid');
      await expect.poll(() => handle.getBoundingClientRect().width).toBe(2);
    });
  });

  describe('the app owns the value', () => {
    test('a change the app turns down doesn’t stick, from the pointer or the keys', async () => {
      const { root, input, state } = await setup({ keep: true });
      pointer(root, 'pointerdown', at(root, 0.8));
      pointer(root, 'pointerup', at(root, 0.8));
      expect(state.changes).toEqual([80]);
      await vi.waitFor(() => expect(input.value).toBe('50'));
      input.focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(state.changes).toEqual([80, 51]);
      await vi.waitFor(() => expect(input.value).toBe('50'));
    });

    test('a change assistive technology makes on the input is reported', async () => {
      const { input, state } = await setup();
      input.value = '64';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(state.value).toBe(64);
    });

    test('the app sets the value from outside', async () => {
      const { input, state } = await setup();
      state.value = 12;
      await vi.waitFor(() => expect(input.value).toBe('12'));
    });
  });

  describe('disabled', () => {
    test('disabled is not focusable and changes nothing', async () => {
      const { root, input, state } = await setup({ props: { disabled: true } });
      input.focus();
      expect(document.activeElement).not.toBe(input);
      pointer(root, 'pointerdown', at(root, 0.9));
      pointer(root, 'pointerup', at(root, 0.9));
      expect(state.changes).toEqual([]);
    });

    test('soft-disabled takes the focus, but neither the keys nor the pointer change it', async () => {
      const events: string[] = [];
      const { root, input, state } = await setup({
        props: {
          softDisabled: true,
          onInput: () => events.push('input'),
          onChange: () => events.push('change'),
        },
      });
      input.focus();
      expect(document.activeElement).toBe(input);
      await userEvent.keyboard('{ArrowRight}');
      await userEvent.keyboard('{End}');
      pointer(root, 'pointerdown', at(root, 0.9));
      pointer(root, 'pointermove', at(root, 0.95));
      pointer(root, 'pointerup', at(root, 0.95));
      expect(state.changes).toEqual([]);
      expect(events).toEqual([]);
      expect(input.value).toBe('50');
    });

    test('soft-disabled: keys with Alt, Ctrl, or Meta go on to the browser', async () => {
      const { input } = await setup({ props: { softDisabled: true } });
      input.focus();
      const press = (init: KeyboardEventInit) =>
        input.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowLeft',
            bubbles: true,
            cancelable: true,
            ...init,
          }),
        );
      for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
        expect(press({ [modifier]: true }), modifier).toBe(true);
      }
      expect(press({})).toBe(false);
    });

    test('soft-disabled: a change assistive technology makes on the input doesn’t stick', async () => {
      const { input, state } = await setup({ props: { softDisabled: true } });
      input.value = '70';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(state.changes).toEqual([]);
      expect(input.value).toBe('50');
    });
  });

  describe('in a form', () => {
    const inForm = (slider: VNode) => h('form', [slider]);

    test('submits its value under its name', async () => {
      const { root, input, state } = await setup({ props: { name: 'volume' }, wrap: inForm });
      expect(new FormData(input.form!).get('volume')).toBe('50');
      pointer(root, 'pointerdown', at(root, 0.7));
      pointer(root, 'pointerup', at(root, 0.7));
      expect(state.value).toBe(70);
      expect(new FormData(input.form!).get('volume')).toBe('70');
    });

    test('a reset leaves the app’s value, which the slider keeps showing', async () => {
      const { input, state } = await setup({ props: { name: 'volume' }, value: 30, wrap: inForm });
      // The input's default is the value it was first rendered with.
      state.value = 70;
      await vi.waitFor(() => expect(input.value).toBe('70'));
      input.form!.reset();
      await vi.waitFor(() => expect(input.value).toBe('70'));
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(input.value).toBe('70');
    });
  });

  test('a reset shows the adapter’s value, for an adapter that leaves the input’s default alone', async () => {
    // Vue keeps the `value` attribute, the input's default, in step; an adapter may set only the
    // property.
    const form = document.createElement('form');
    const root = document.createElement('span');
    const input = Object.assign(document.createElement('input'), { type: 'range' });
    input.defaultValue = '10';
    root.append(input);
    form.append(root);
    document.body.append(form);
    const handle = attachSlider(root, {
      inputs: [input],
      values: () => [70],
      range: () => ({ min: 0, max: 100, step: 1 }),
      vertical: () => false,
      blocked: () => false,
      onMove: () => {},
    });
    onTestFinished(() => {
      handle.detach();
      form.remove();
    });
    expect(input.value).toBe('70');
    // After the first layout, whose resize report syncs too
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    form.reset();
    await vi.waitFor(() => expect(input.value).toBe('70'));
  });

  test('a <label> around it names it', async () => {
    const { screen } = await setup({
      wrap: (slider) => h('label', [h('span', 'Volume'), slider]),
    });
    await expect.element(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
  });

  test('class and style dress the slider; every other attribute goes to the input', async () => {
    const { root, input } = await setup({
      props: { class: 'mine', style: 'margin: 3px', id: 'volume', 'aria-label': 'Volume' },
    });
    expect(root.classList.contains('mine')).toBe(true);
    expect(root.style.margin).toBe('3px');
    expect([input.id, input.getAttribute('aria-label')]).toEqual(['volume', 'Volume']);
    expect(root.hasAttribute('id')).toBe(false);
  });

  test('the app’s format writes the value indicator and what assistive technology reads', async () => {
    const { input, part } = await setup({
      props: { valueIndicator: true, format: (value: number) => `${value}%` },
      value: 40,
    });
    expect(part('value-indicator').textContent).toBe('40%');
    expect(input.getAttribute('aria-valuetext')).toBe('40%');
  });

  test('the value indicator writes the number in the slider’s language', async () => {
    const { part } = await setup({
      props: { valueIndicator: true, locale: 'de', max: 2000, step: 0.5 },
      value: 1234.5,
    });
    expect(part('value-indicator').textContent).toBe('1.234,5');
  });

  describe('the inset icon', () => {
    const icon = { icon: () => h('svg', { viewBox: '0 0 24 24' }) };

    test('sits at the active track’s start, and past the handle once the active track is too short', async () => {
      const { root, part, state } = await setup({ props: { size: 'medium' }, slots: icon });
      expect(root.hasAttribute('data-icon')).toBe(true);
      expect(root.hasAttribute('data-icon-inactive')).toBe(false);
      expect(span(root, part('icon'))).toEqual([6, 30]);
      // 36px of track: a 24px icon with 6px on each side
      state.value = 12;
      await vi.waitFor(() => expect(root.hasAttribute('data-icon-inactive')).toBe(true));
      // The handle at 30, its gap to 38, then 6px
      expect(span(root, part('icon'))).toEqual([44, 68]);
      state.value = 50;
      await vi.waitFor(() => expect(root.hasAttribute('data-icon-inactive')).toBe(false));
    });

    test('moves when the slider’s length leaves the active track too short', async () => {
      const { root } = await setup({
        props: { size: 'medium', style: undefined },
        slots: icon,
        value: 20,
        wrap: (slider) => h('div', { style: `width: ${WIDTH}px` }, [slider]),
      });
      // 38px of active track at 212px; 20px at 120px. The page's layout changes, not the app's state.
      expect(root.hasAttribute('data-icon-inactive')).toBe(false);
      root.parentElement!.style.width = '120px';
      await vi.waitFor(() => expect(root.hasAttribute('data-icon-inactive')).toBe(true));
    });

    test('a centered slider shows none', async () => {
      const { root } = await setup({ props: { size: 'medium', centered: true }, slots: icon });
      expect(root.querySelector('.rio-slider__icon')).toBeNull();
    });

    test('nor does an XS or S slider, which the spec gives no icon size', async () => {
      const { root } = await setup({ slots: icon });
      expect(root.querySelector('.rio-slider__icon')).toBeNull();
    });
  });
});

describe('RioSlider, the focus ring', () => {
  test('goes round the handle while the input has keyboard focus', async () => {
    withTheme();
    const screen = await render(() =>
      h('div', { style: { padding: '40px' } }, [h(Slider, { label: 'Volume' })]),
    );
    const container = screen.container as HTMLElement;
    await expectRingOnFocus(
      container.querySelector('input')!,
      container.querySelector('.rio-slider__handle')!,
    );
  });
});
