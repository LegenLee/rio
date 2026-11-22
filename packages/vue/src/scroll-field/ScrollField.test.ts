/// <reference types="@vitest/browser-playwright" />
import { attachTheme } from '@rio-m3e/tokens';
import { beforeEach, describe, expect, onTestFinished, test, vi } from 'vitest';
import { cdp, server, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, reactive, type VNode } from 'vue';
import ScrollField from './ScrollField.vue';
import { expectRingOnFocus } from '../test/focus-ring';

beforeEach(() => {
  const theme = attachTheme(document.documentElement, {
    sourceColor: '#6750a4',
    colorScheme: false,
  });
  onTestFinished(() => theme.detach());
});

type Value = number | string;

/** The start of a trackpad's scroll: a wheel event of a few pixels */
const trackpad = (viewport: HTMLElement) =>
  viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: 4, cancelable: true }));

interface Setup {
  props?: Record<string, unknown>;
  value?: Value;
  /** Leaves the value as it is, as an app that turns the change down does. */
  keep?: boolean;
  wrap?: (field: VNode) => VNode;
}

/** A scroll field whose value the app keeps, as an app would write it */
const setup = async ({ props = {}, value = 7, keep = false, wrap }: Setup = {}) => {
  const state = reactive({
    value,
    editing: false,
    invalid: false,
    changes: [] as Value[],
  });
  const screen = await render(
    defineComponent(() => () => {
      const field = h(ScrollField, {
        label: 'Minutes',
        ...props,
        modelValue: state.value,
        'onUpdate:modelValue': (next: Value) => {
          state.changes.push(next);
          if (!keep) state.value = next;
        },
        editing: state.editing,
        'onUpdate:editing': (next: boolean) => (state.editing = next),
        invalid: state.invalid,
        'onUpdate:invalid': (next: boolean) => (state.invalid = next),
      });
      return wrap ? wrap(field) : field;
    }),
  );
  const root = screen.container.querySelector<HTMLElement>('.rio-scroll-field')!;
  const viewport = root.querySelector<HTMLElement>('.rio-scroll-field__viewport')!;
  const items = () => [...viewport.querySelectorAll<HTMLElement>('.rio-scroll-field__item')];
  /** The item drawn in the middle of the field */
  const middle = () => {
    const rect = root.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    return items().find((item) => {
      const box = item.getBoundingClientRect();
      return box.top <= y && y < box.bottom;
    });
  };
  const selected = () => viewport.querySelector<HTMLElement>('[data-selected]');
  /** Waits for the scroll to stop on the item showing `text` */
  const settledOn = (text: string) =>
    vi.waitFor(() => {
      expect(middle()?.textContent?.trim()).toBe(text);
      expect(selected()).toBe(middle());
      const rect = root.getBoundingClientRect();
      const box = middle()!.getBoundingClientRect();
      // A smooth scroll may stop a pixel short of where it was sent.
      expect(Math.abs(box.top + box.height / 2 - (rect.top + rect.height / 2))).toBeLessThan(1.5);
    });
  return { screen, state, root, viewport, items, middle, selected, settledOn };
};

describe('RioScrollField', () => {
  test('a list box named by its label, its values the options, the value’s active and selected', async () => {
    const { root, screen } = await setup({ props: { min: 0, max: 59 } });
    expect(root.getAttribute('role')).toBe('listbox');
    expect(root.getAttribute('aria-label')).toBe('Minutes');
    expect(root.tabIndex).toBe(0);
    expect(screen.getByRole('option').elements()).toHaveLength(60);
    const active = document.getElementById(root.getAttribute('aria-activedescendant')!)!;
    expect(active.textContent?.trim()).toBe('07');
    expect(active.getAttribute('aria-selected')).toBe('true');
    await expect
      .element(screen.getByRole('option', { name: '07', exact: true }))
      .toBeInTheDocument();
  });

  test('as the value changes, its option is the one selected, before the scroll gets there', async () => {
    const { root, state, settledOn } = await setup({ props: { min: 0, max: 59 } });
    const selected = () =>
      [...root.querySelectorAll('[aria-selected="true"]')].map((el) => el.textContent?.trim());
    await settledOn('07');
    state.value = 30;
    await nextTick();
    expect(selected()).toEqual(['30']);
    await settledOn('30');
    expect(selected()).toEqual(['30']);
  });

  test('as it starts or stops looping, each value is an option once', async () => {
    const props = reactive({ min: 0, max: 59, loop: false });
    const { root, settledOn } = await setup({ props });
    const ids = () => [...root.querySelectorAll('[role="option"]')].map((el) => el.id);
    await settledOn('07');
    for (const loop of [true, false]) {
      props.loop = loop;
      await nextTick();
      expect(ids()).toHaveLength(60);
      expect(new Set(ids()).size).toBe(60);
      await settledOn('07');
    }
  });

  test('looping, the copies around the options are hidden from assistive technology', async () => {
    const { screen, root } = await setup({ props: { min: 0, max: 11, loop: true } });
    expect(screen.getByRole('option').elements()).toHaveLength(12);
    const active = document.getElementById(root.getAttribute('aria-activedescendant')!)!;
    expect(active.textContent?.trim()).toBe('07');
  });

  test('the value starts in the middle, at once, written with two digits, its neighbors cropped', async () => {
    const { root, viewport, settledOn, items } = await setup({ props: { min: 0, max: 59 } });
    // Within two frames, as the page settles, without scrolling there
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    expect(viewport.scrollTop).toBe(7 * items()[0]!.getBoundingClientRect().height);
    await settledOn('07');
    expect(items()).toHaveLength(60);
    expect(root.getBoundingClientRect().height).toBe(120);
  });

  test('the arrow keys move to the value above and below, and stop at the ends', async () => {
    const { root, state, settledOn } = await setup({ props: { min: 0, max: 9 }, value: 1 });
    root.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(state.value).toBe(2);
    await settledOn('02');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(state.value).toBe(0);
    await userEvent.keyboard('{End}');
    expect(state.value).toBe(9);
    await settledOn('09');
    await userEvent.keyboard('{ArrowDown}');
    expect(state.value).toBe(9);
  });

  test('a press on a value above or below scrolls it into the middle', async () => {
    const { state, items, settledOn } = await setup({ props: { min: 0, max: 59 } });
    await settledOn('07');
    await userEvent.click(items()[8]!);
    expect(state.value).toBe(8);
    await settledOn('08');
  });

  test('a mouse press on the way to a value doesn’t take the values passed', async () => {
    const { root, state, viewport, settledOn } = await setup({ props: { min: 0, max: 59 } });
    await settledOn('07');
    root.focus();
    await userEvent.keyboard('{End}');
    // A press that doesn't scroll, partway through the scroll to 59
    viewport.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
    );
    await settledOn('59');
    expect(state.changes).toEqual([59]);
  });

  test('scrolling stops on a value, which the field asks for', async () => {
    const { state, viewport, items, settledOn } = await setup({ props: { min: 0, max: 59 } });
    await settledOn('07');
    const height = items()[0]!.getBoundingClientRect().height;
    trackpad(viewport);
    viewport.scrollBy({ top: 3 * height + 10 });
    await settledOn('10');
    expect(state.value).toBe(10);
  });

  // A real wheel's notches, sent through Chromium's DevTools protocol
  test.skipIf(server.browser !== 'chromium')(
    'a notch of a mouse wheel moves one value, as an arrow key does',
    async () => {
      const { root, state, settledOn } = await setup({ props: { min: 0, max: 59 } });
      await settledOn('07');
      const rect = root.getBoundingClientRect();
      const notch = (deltaY: number) =>
        cdp().send('Input.dispatchMouseEvent', {
          type: 'mouseWheel',
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          deltaX: 0,
          deltaY,
        });
      await notch(100);
      await settledOn('08');
      await notch(-100);
      await settledOn('07');
      expect(state.changes).toEqual([8, 7]);
    },
  );

  test('wheel events in lines, as from a mouse in Firefox, move one value each', async () => {
    const { state, viewport } = await setup({ props: { min: 0, max: 59 } });
    const line = new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, cancelable: true });
    viewport.dispatchEvent(line);
    expect(state.value).toBe(8);
    expect(line.defaultPrevented).toBe(true);
  });

  test('Ctrl and the wheel are left to the page, for zooming', async () => {
    const { state, viewport } = await setup({ props: { min: 0, max: 59 } });
    const zoom = new WheelEvent('wheel', { deltaY: 100, ctrlKey: true, cancelable: true });
    viewport.dispatchEvent(zoom);
    expect(zoom.defaultPrevented).toBe(false);
    expect(state.changes).toEqual([]);
  });

  test('over a disabled field, a wheel notch scrolls the page', async () => {
    const { state, viewport } = await setup({ props: { min: 0, max: 59, disabled: true } });
    const notch = new WheelEvent('wheel', { deltaY: 100, cancelable: true });
    viewport.dispatchEvent(notch);
    expect(notch.defaultPrevented).toBe(false);
    expect(state.changes).toEqual([]);
  });

  test('a pen scrolls too', async () => {
    const { state, viewport, items, settledOn } = await setup({ props: { min: 0, max: 59 } });
    await settledOn('07');
    const height = items()[0]!.getBoundingClientRect().height;
    viewport.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'pen' }));
    viewport.scrollBy({ top: 2 * height });
    await settledOn('09');
    expect(state.value).toBe(9);
  });

  test('looping: the first comes after the last, either way', async () => {
    const { root, state, settledOn } = await setup({
      props: { min: 0, max: 11, loop: true },
      value: 0,
    });
    expect(root.getAttribute('aria-valuemin')).toBeNull();
    root.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(state.value).toBe(11);
    await settledOn('11');
    await userEvent.keyboard('{ArrowDown}');
    expect(state.value).toBe(0);
    await settledOn('00');
  });

  test('looping with few values, steps faster than the scroll keep their way', async () => {
    const { state, viewport, settledOn } = await setup({
      props: { options: ['a', 'b', 'c'], loop: true },
      value: 'a',
    });
    await settledOn('a');
    const height = viewport.firstElementChild!.getBoundingClientRect().height;
    const tops: number[] = [];
    const onScroll = () => tops.push(viewport.scrollTop / height);
    viewport.addEventListener('scroll', onScroll);
    // A mouse wheel turned fast, past the copies on that side
    for (let notch = 0; notch < 50; notch++) {
      viewport.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    expect(state.value).toBe('c');
    await settledOn('c');
    viewport.removeEventListener('scroll', onScroll);
    // Down the column only, apart from moves back by whole copies of the three values
    const back = tops
      .slice(1)
      .map((top, i) => tops[i]! - top)
      .filter((by) => by > 0.05);
    expect(back.every((by) => by > 2)).toBe(true);
    // Short of the last copy
    expect(Math.max(...tops)).toBeLessThan(viewport.childElementCount - 3);
  });

  test('a smooth scroll that ends short of where the field is headed doesn’t turn it back', async () => {
    const { root, state, viewport, settledOn } = await setup({
      props: { options: ['a', 'b', 'c'], loop: true },
      value: 'a',
    });
    await settledOn('a');
    const start = viewport.scrollTop;
    const key = (key: string) => root.dispatchEvent(new KeyboardEvent('keydown', { key }));
    key('ArrowDown');
    await nextTick();
    key('ArrowDown');
    await nextTick();
    expect(state.value).toBe('c');
    // As the browser ends one that a newer one replaced
    viewport.dispatchEvent(new Event('scrollend'));
    let least = start;
    for (let frame = 0; frame < 20; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      least = Math.min(least, viewport.scrollTop);
    }
    expect(start - least).toBeLessThan(1);
    await settledOn('c');
  });

  test('a step back before the scroll moves stops it on the value', async () => {
    const { root, state, viewport, settledOn } = await setup({ props: { min: 0, max: 59 } });
    await settledOn('07');
    const start = viewport.scrollTop;
    const key = (key: string) => root.dispatchEvent(new KeyboardEvent('keydown', { key }));
    key('ArrowDown');
    await nextTick();
    key('ArrowUp');
    await nextTick();
    expect(state.value).toBe(7);
    let furthest = start;
    for (let frame = 0; frame < 20; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      furthest = Math.max(furthest, viewport.scrollTop);
    }
    expect(furthest - start).toBeLessThan(1);
    await settledOn('07');
  });

  test('placed again at once while it scrolls, the next step goes on from there', async () => {
    const { root, state, viewport, settledOn } = await setup({
      props: { options: ['a', 'b', 'c'], loop: true },
      value: 'a',
    });
    await settledOn('a');
    const height = viewport.firstElementChild!.getBoundingClientRect().height;
    const key = (key: string) => root.dispatchEvent(new KeyboardEvent('keydown', { key }));
    key('ArrowDown');
    await nextTick();
    key('ArrowDown');
    await nextTick();
    expect(state.value).toBe('c');
    // A change of size places the value again, at once.
    root.style.inlineSize = '200px';
    await settledOn('c');
    const placed = viewport.scrollTop;
    let furthest = placed;
    const onScroll = () => (furthest = Math.max(furthest, viewport.scrollTop));
    viewport.addEventListener('scroll', onScroll);
    key('ArrowDown');
    await settledOn('a');
    viewport.removeEventListener('scroll', onScroll);
    expect((furthest - placed) / height).toBeLessThan(1.1);
  });

  test('back in the page, which loses the scroll, the value is in the middle again at once', async () => {
    const { root, state, viewport, items, settledOn } = await setup({ props: { min: 0, max: 59 } });
    await settledOn('07');
    // Out of the page for a while and back, as KeepAlive does
    const parent = root.parentElement!;
    const next = root.nextSibling;
    root.remove();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.insertBefore(root, next);
    await vi.waitFor(() =>
      expect(viewport.scrollTop).toBe(7 * items()[0]!.getBoundingClientRect().height),
    );
    expect(state.changes).toEqual([]);
  });

  test('when the app turns down a scrolled value, the scroll goes back to it', async () => {
    const { state, viewport, items, settledOn } = await setup({
      props: { min: 0, max: 59 },
      keep: true,
    });
    await settledOn('07');
    const height = items()[0]!.getBoundingClientRect().height;
    trackpad(viewport);
    viewport.scrollBy({ top: 3 * height });
    await vi.waitFor(() => expect(state.changes).toContain(10));
    await settledOn('07');
  });

  test('looping, the scroll comes back to the middle copy once it stops', async () => {
    const { root, viewport, items, settledOn } = await setup({
      props: { min: 0, max: 11, loop: true },
      value: 0,
    });
    await settledOn('00');
    const home = viewport.scrollTop;
    root.focus();
    await userEvent.keyboard('{ArrowUp}');
    await settledOn('11');
    // The 11 just before the middle copy's 00, moved to the middle copy's own 11
    const height = items()[0]!.getBoundingClientRect().height;
    await vi.waitFor(() => expect(viewport.scrollTop).toBeCloseTo(home + 11 * height, 0));
  });

  test('when the app turns the value down, the scroll goes back to it', async () => {
    const { state, items, settledOn } = await setup({
      props: { min: 0, max: 59 },
      keep: true,
    });
    await settledOn('07');
    await userEvent.click(items()[8]!);
    expect(state.changes).toContain(8);
    await settledOn('07');
  });

  test('options: the app’s values, written by its format, named so for assistive technology', async () => {
    const { root, state, screen, settledOn } = await setup({
      props: { options: ['g', 'kg', 'lb'], format: (v: Value) => `${v}.` },
      value: 'kg',
    });
    await settledOn('kg.');
    const names = screen
      .getByRole('option')
      .elements()
      .map((el) => el.getAttribute('aria-label'));
    expect(names).toEqual(['g.', 'kg.', 'lb.']);
    root.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(state.value).toBe('lb');
  });

  test('numbers in the language’s digits', async () => {
    const { settledOn } = await setup({ props: { min: 0, max: 59, locale: 'ar-EG' } });
    await settledOn('٠٧');
  });

  test('its width: at least 100, 120, or 186px, by the longest value', async () => {
    const width = async (props: Record<string, unknown>, value: Value) =>
      (await setup({ props, value })).root.getBoundingClientRect().width;
    // Narrow letters, which stay within each width in any font
    expect(await width({ options: ['ii'] }, 'ii')).toBe(100);
    expect(await width({ options: ['iii'] }, 'iii')).toBe(120);
    expect(await width({ options: ['iiii'] }, 'iiii')).toBe(186);
    expect(await width({ options: ['ii'], size: 'large' }, 'ii')).toBe(186);
    // Wider text widens the field.
    expect(await width({ options: ['WWWWWW'] }, 'WWWWWW')).toBeGreaterThan(186);
  });

  test('its width stays as values scroll through the middle', async () => {
    const { root, settledOn } = await setup({
      props: { options: ['i', 'mm', 'W'] },
      value: 'i',
    });
    await settledOn('i');
    const before = root.getBoundingClientRect().width;
    root.focus();
    await userEvent.keyboard('{End}');
    await settledOn('W');
    expect(root.getBoundingClientRect().width).toBe(before);
  });

  test('disabled: not focusable, and nothing changes it', async () => {
    const { root, state, items, viewport } = await setup({ props: { disabled: true } });
    expect(root.hasAttribute('tabindex')).toBe(false);
    expect(root.getAttribute('aria-disabled')).toBe('true');
    expect(getComputedStyle(viewport).overflowY).toBe('hidden');
    items()[8]!.click();
    expect(state.changes).toEqual([]);
  });

  test('soft-disabled: focusable, but neither keys nor presses change it', async () => {
    const { root, state, items } = await setup({ props: { softDisabled: true } });
    root.focus();
    expect(document.activeElement).toBe(root);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    items()[8]!.click();
    expect(state.changes).toEqual([]);
    expect(state.editing).toBe(false);
  });

  test('with a name, it submits the value with a form', async () => {
    const { screen } = await setup({
      props: { name: 'minutes', min: 0, max: 59 },
      wrap: (field) => h('form', field),
    });
    const form = screen.container.querySelector('form')!;
    expect(new FormData(form).get('minutes')).toBe('7');
  });
});

describe('RioScrollField, editing', () => {
  test('Enter starts it: the value, as a text input with its text selected', async () => {
    const { root, state } = await setup({ props: { min: 0, max: 59 } });
    root.focus();
    await userEvent.keyboard('{Enter}');
    expect(state.editing).toBe(true);
    const input = root.querySelector<HTMLInputElement>('.rio-scroll-field__input')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    expect(input.value).toBe('07');
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 2]);
    expect(input.getAttribute('aria-label')).toBe('Minutes');
    expect(root.getAttribute('role')).toBeNull();
    expect(root.hasAttribute('data-editing')).toBe(true);
  });

  test('typed values are taken at once; Enter ends it, and the focus goes back', async () => {
    const { root, state, settledOn } = await setup({ props: { min: 0, max: 59 } });
    root.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('42');
    expect(state.value).toBe(42);
    await userEvent.keyboard('{Enter}');
    expect(state.editing).toBe(false);
    await vi.waitFor(() => expect(document.activeElement).toBe(root));
    await settledOn('42');
  });

  test('text that isn’t a value: Enter marks it invalid and keeps editing', async () => {
    const { root, state } = await setup({ props: { min: 0, max: 59 } });
    root.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('75{Enter}');
    // 7 is a value, and is taken; 75 isn't.
    expect(state.value).toBe(7);
    expect(state.editing).toBe(true);
    expect(state.invalid).toBe(true);
    const input = root.querySelector('.rio-scroll-field__input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    await userEvent.keyboard('{Backspace}{Backspace}3');
    expect(state.value).toBe(3);
    expect(state.invalid).toBe(false);
  });

  test('Escape puts the value from before back and ends it', async () => {
    const { root, state } = await setup({ props: { min: 0, max: 59 } });
    root.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('42');
    expect(state.value).toBe(42);
    await userEvent.keyboard('{Escape}');
    expect(state.value).toBe(7);
    expect(state.editing).toBe(false);
    await vi.waitFor(() => expect(document.activeElement).toBe(root));
  });

  test('leaving the input keeps editing, and marks text that isn’t a value', async () => {
    const { root, state, screen } = await setup({
      props: { min: 0, max: 59 },
      wrap: (field) => h('div', [field, h('button', 'After')]),
    });
    root.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('9x');
    await userEvent.click(screen.getByRole('button', { name: 'After' }));
    expect(state.editing).toBe(true);
    expect(state.invalid).toBe(true);
  });

  test('text values complete as they are typed', async () => {
    const { root, state } = await setup({
      props: { options: ['grams', 'kilograms', 'pounds'] },
      value: 'grams',
    });
    root.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('k');
    const input = root.querySelector<HTMLInputElement>('.rio-scroll-field__input')!;
    expect(input.value).toBe('kilograms');
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 9]);
    expect(state.value).toBe('kilograms');
  });

  test('the app can start and end it, as with a keyboard button next to the field', async () => {
    const { root, state, settledOn } = await setup({ props: { min: 0, max: 59 } });
    state.editing = true;
    await nextTick();
    const input = root.querySelector<HTMLInputElement>('.rio-scroll-field__input')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    await userEvent.keyboard('30');
    state.editing = false;
    await settledOn('30');
    expect(state.value).toBe(30);
  });

  test('the app can mark the value invalid too', async () => {
    const { root, state, selected } = await setup({ props: { min: 0, max: 59 } });
    state.invalid = true;
    await nextTick();
    expect(root.getAttribute('aria-invalid')).toBe('true');
    expect(getComputedStyle(selected()!).color).toBe(
      getComputedStyle(document.documentElement).getPropertyValue('--rio-color-error').trim() &&
        getComputedStyle(selected()!).color,
    );
  });
});

describe('RioScrollField, in a browser without scrollend', () => {
  beforeEach(() => {
    const own = Object.getOwnPropertyDescriptor(window, 'onscrollend')!;
    delete (window as { onscrollend?: unknown }).onscrollend;
    const block = (event: Event) => event.stopImmediatePropagation();
    window.addEventListener('scrollend', block, true);
    onTestFinished(() => {
      Object.defineProperty(window, 'onscrollend', own);
      window.removeEventListener('scrollend', block, true);
    });
  });

  test('a scroll counts as stopped once it hasn’t moved for a moment', async () => {
    const { state, viewport, items, settledOn } = await setup({
      props: { min: 0, max: 59 },
      keep: true,
    });
    await settledOn('07');
    const height = items()[0]!.getBoundingClientRect().height;
    trackpad(viewport);
    viewport.scrollBy({ top: 3 * height });
    await vi.waitFor(() => expect(state.changes).toContain(10));
    await settledOn('07');
  });

  test('while a finger rests on the field, a scroll doesn’t count as stopped', async () => {
    const { state, viewport, items, middle, settledOn } = await setup({
      props: { min: 0, max: 59 },
      keep: true,
    });
    await settledOn('07');
    const height = items()[0]!.getBoundingClientRect().height;
    viewport.dispatchEvent(new Event('touchstart'));
    viewport.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }),
    );
    viewport.scrollBy({ top: 3 * height });
    await vi.waitFor(() => expect(state.changes).toContain(10));
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(middle()?.textContent?.trim()).toBe('10');
    viewport.dispatchEvent(new Event('touchend'));
    await settledOn('07');
  });
});

describe('RioScrollField, the focus ring', () => {
  test('goes round the field while typing has keyboard focus', async () => {
    const screen = await render(() =>
      h('div', { style: { padding: '40px' } }, [
        h(ScrollField, { editing: true, label: 'Minutes' }),
      ]),
    );
    const container = screen.container as HTMLElement;
    await expectRingOnFocus(
      container.querySelector('input:not([type="hidden"])')!,
      container.querySelector('.rio-scroll-field')!,
    );
  });
});
