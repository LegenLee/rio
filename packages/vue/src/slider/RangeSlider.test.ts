import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, reactive, type VNode } from 'vue';
import RangeSlider from './RangeSlider.vue';

/** 212px wide, so the handles travel 200px between the 6px insets: 2px for each of 100 values. */
const WIDTH = 212;

interface Setup {
  props?: Record<string, unknown>;
  value?: [number, number];
  /** Leaves the range as it is, as an app that turns the change down does. */
  keep?: boolean;
  wrap?: (slider: VNode) => VNode;
}

/** A range slider whose range the app keeps, named by the app. */
const setup = async ({ props = {}, value = [20, 60], keep = false, wrap }: Setup = {}) => {
  const state = reactive({ value, changes: [] as [number, number][] });
  const screen = await render(
    defineComponent(() => () => {
      const slider = h(RangeSlider, {
        style: `width: ${WIDTH}px`,
        'aria-label': 'Price',
        ...props,
        modelValue: state.value,
        'onUpdate:modelValue': (next: [number, number]) => {
          state.changes.push(next);
          if (!keep) state.value = next;
        },
      });
      return wrap ? wrap(slider) : slider;
    }),
  );
  const [start, end] = screen.getByRole('slider').elements() as HTMLInputElement[];
  const root = start!.closest<HTMLElement>('.rio-slider')!;
  return { screen, state, start: start!, end: end!, root };
};

const at = (root: HTMLElement, fraction: number) => {
  const rect = root.getBoundingClientRect();
  return { x: rect.left + 6 + fraction * (rect.width - 12), y: rect.top + rect.height / 2 };
};

const pointer = (
  root: HTMLElement,
  type: string,
  { x, y }: { x: number; y: number },
  pointerType = 'mouse',
) =>
  root.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      isPrimary: true,
      pointerId: 5,
      pointerType,
      clientX: x,
      clientY: y,
      buttons: type === 'pointerup' ? 0 : 1,
    }),
  );

const span = (root: HTMLElement, selector: string) => {
  const box = root.querySelector(selector)!.getBoundingClientRect();
  const rect = root.getBoundingClientRect();
  return [box.left - rect.left, box.right - rect.left];
};

describe('RioRangeSlider', () => {
  test('a group named by the app, of two native range inputs named for what they set', async () => {
    const { screen, start, end } = await setup();
    await expect.element(screen.getByRole('group', { name: 'Price' })).toBeInTheDocument();
    await expect.element(screen.getByRole('slider', { name: 'Minimum' })).toBeInTheDocument();
    await expect.element(screen.getByRole('slider', { name: 'Maximum' })).toBeInTheDocument();
    expect([start.value, end.value]).toEqual(['20', '60']);
  });

  test('the inputs are named in the slider’s language, or by the app’s messages', async () => {
    const korean = await setup({ props: { locale: 'ko' } });
    await expect.element(korean.screen.getByRole('slider', { name: '최솟값' })).toBeInTheDocument();
    korean.screen.unmount();
    const own = await setup({ props: { messages: { rangeStart: 'From' } } });
    await expect.element(own.screen.getByRole('slider', { name: 'From' })).toBeInTheDocument();
  });

  test('each input stops at the other’s value', async () => {
    const { start, end } = await setup();
    expect([start.min, start.max, end.min, end.max]).toEqual(['0', '60', '20', '100']);
  });

  test('the active track runs between the handles, 6px off each; the inactive ones reach the ends', async () => {
    const { root } = await setup();
    // The start's handle at 46, the end's at 126
    expect(span(root, '.rio-slider__track-lower')).toEqual([0, 38]);
    expect(span(root, '.rio-slider__track-active')).toEqual([54, 118]);
    expect(span(root, '.rio-slider__track-upper')).toEqual([134, WIDTH]);
  });

  describe('the pointer moves the nearest handle', () => {
    test.each([
      ['below the start', 0.1, [10, 60]],
      ['nearer the start', 0.35, [35, 60]],
      ['nearer the end', 0.45, [20, 45]],
      ['above the end', 0.9, [20, 90]],
    ] as const)('%s', async (_, fraction, range) => {
      const { root, state } = await setup();
      pointer(root, 'pointerdown', at(root, fraction));
      pointer(root, 'pointerup', at(root, fraction));
      expect(state.value).toEqual(range);
    });

    test('and focuses its input', async () => {
      const { root, end } = await setup();
      await userEvent.click(root, { position: { x: 6 + 180, y: 24 } });
      expect(document.activeElement).toBe(end);
      expect(end.matches(':focus-visible')).toBe(false);
    });

    test('a handle dragged into the other stops at it', async () => {
      const inputs: string[] = [];
      const { root, state } = await setup({
        props: { onInput: (event: Event) => inputs.push((event.target as HTMLInputElement).value) },
      });
      pointer(root, 'pointerdown', at(root, 0.2));
      await nextTick();
      pointer(root, 'pointermove', at(root, 0.5));
      await nextTick();
      pointer(root, 'pointermove', at(root, 0.8));
      await nextTick();
      pointer(root, 'pointermove', at(root, 0.9));
      pointer(root, 'pointerup', at(root, 0.9));
      expect(state.value).toEqual([60, 60]);
      // Pushing on at the other handle changes nothing more.
      expect(inputs).toEqual(['50', '60']);
    });

    test.each([
      ['down moves the start', 0.3, [30, 50]],
      ['up moves the end', 0.7, [50, 70]],
    ] as const)('where both handles sit, dragging %s', async (_, fraction, range) => {
      const { root, state } = await setup({ value: [50, 50] });
      pointer(root, 'pointerdown', at(root, 0.5));
      expect(state.changes).toEqual([]);
      pointer(root, 'pointermove', at(root, fraction));
      pointer(root, 'pointerup', at(root, fraction));
      expect(state.value).toEqual(range);
    });
  });

  test('where both handles sit, a tap a little below them moves the start', async () => {
    const { root, state } = await setup({ value: [50, 50] });
    pointer(root, 'pointerdown', at(root, 0.5), 'touch');
    pointer(root, 'pointerup', at(root, 0.48), 'touch');
    expect(state.value).toEqual([48, 50]);
  });

  test('the keys move the focused handle, and stop at the other', async () => {
    const { start, state } = await setup({ value: [58, 60] });
    start.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(state.value).toEqual([59, 60]);
    await vi.waitFor(() => expect(start.max).toBe('60'));
    await userEvent.keyboard('{End}');
    expect(state.value).toEqual([60, 60]);
  });

  test('a change the app turns down doesn’t stick', async () => {
    const { root, start, state } = await setup({ keep: true });
    pointer(root, 'pointerdown', at(root, 0.1));
    pointer(root, 'pointerup', at(root, 0.1));
    expect(state.changes).toEqual([[10, 60]]);
    await vi.waitFor(() => expect(start.value).toBe('20'));
  });

  test('only the pressed handle shows its value', async () => {
    const { root } = await setup({ props: { valueIndicator: true } });
    const [first, second] = root.querySelectorAll<HTMLElement>('.rio-slider__value-indicator');
    expect([first!.textContent, second!.textContent]).toEqual(['20', '60']);
    pointer(root, 'pointerdown', at(root, 0.6));
    await vi.waitFor(() => expect(getComputedStyle(second!).opacity).toBe('1'));
    expect(getComputedStyle(first!).opacity).toBe('0');
    pointer(root, 'pointerup', at(root, 0.6));
  });

  test('submits both values under its name, the start first', async () => {
    const { start } = await setup({
      props: { name: 'price' },
      wrap: (slider) => h('form', [slider]),
    });
    expect(new FormData(start.form!).getAll('price')).toEqual(['20', '60']);
  });

  test('disabled changes nothing; soft-disabled takes the focus, not the keys', async () => {
    const disabled = await setup({ props: { disabled: true } });
    pointer(disabled.root, 'pointerdown', at(disabled.root, 0.9));
    pointer(disabled.root, 'pointerup', at(disabled.root, 0.9));
    expect(disabled.state.changes).toEqual([]);
    disabled.screen.unmount();

    const soft = await setup({ props: { softDisabled: true } });
    soft.end.focus();
    expect(document.activeElement).toBe(soft.end);
    await userEvent.keyboard('{ArrowRight}');
    pointer(soft.root, 'pointerdown', at(soft.root, 0.9));
    pointer(soft.root, 'pointerup', at(soft.root, 0.9));
    expect(soft.state.changes).toEqual([]);
    expect(soft.end.value).toBe('60');
  });
});
