import { createThemeVariables } from '@rio-m3e/tokens';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, type VNode } from 'vue';
import Button from '../button/Button.vue';
import IconButton from '../icon-button/IconButton.vue';
import ButtonGroup from './ButtonGroup.vue';

const theme = createThemeVariables({ sourceColor: '#6750a4' });

/**
 * Renders a group in a container of the given width. `themed` adds the theme's variables, which
 * the connected group's corners need; without them, springs jump straight to their targets.
 */
const renderGroup = (
  props: Record<string, unknown>,
  children: () => VNode[],
  { width = 600, themed = false } = {},
) =>
  render(
    defineComponent(
      () => () =>
        h('div', { style: { width: `${width}px`, ...(themed ? theme : {}) } }, [
          h(ButtonGroup, props, children),
        ]),
    ),
  );

const buttons = (labels: string[], props: (label: string) => object = () => ({})) =>
  labels.map((label) => h(Button, { value: label, ...props(label) }, () => label));

const press = (el: Element) =>
  el.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, buttons: 1, pointerId: 1 }),
  );
const release = (el: Element) =>
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, isPrimary: true, pointerId: 1 }));
const width = (el: Element) => el.getBoundingClientRect().width;
/** The button's own width, ignoring any width a spring wrote on it. */
const ownWidth = (el: HTMLElement) => {
  const inline = el.style.inlineSize;
  el.style.inlineSize = '';
  const own = width(el);
  el.style.inlineSize = inline;
  return own;
};
/** The widths of the elements over the next few frames. */
const widthsOverFrames = (elements: Element[], frames: number) =>
  new Promise<number[][]>((resolve) => {
    const seen: number[][] = [];
    requestAnimationFrame(function record() {
      seen.push(elements.map(width));
      if (seen.length < frames) requestAnimationFrame(record);
      else resolve(seen);
    });
  });
const corners = (el: Element) => {
  const style = getComputedStyle(el);
  return [style.borderStartStartRadius, style.borderStartEndRadius].map(parseFloat);
};

describe('RioButtonGroup', () => {
  test('is a group whose buttons take its size and shape unless they set their own', async () => {
    const screen = await render(ButtonGroup, {
      props: { size: 'medium', shape: 'square' },
      slots: { default: () => [h(Button, () => 'A'), h(Button, { size: 'xsmall' }, () => 'B')] },
    });
    await expect.element(screen.getByRole('group')).toBeVisible();
    const [a, b] = screen.getByRole('button').elements();
    expect([a!.dataset.size, a!.dataset.shape]).toEqual(['medium', 'square']);
    expect([b!.dataset.size, b!.dataset.shape]).toEqual(['xsmall', 'square']);
  });

  describe('selection', () => {
    test('single: selecting another button replaces the selection; the parent owns it', async () => {
      const screen = await render(ButtonGroup, {
        props: { selection: 'single', modelValue: 'One' },
        slots: { default: () => buttons(['One', 'Two']) },
      });
      const one = screen.getByRole('button', { name: 'One' });
      const two = screen.getByRole('button', { name: 'Two' });
      await expect.element(one).toHaveAttribute('aria-pressed', 'true');
      await expect.element(two).toHaveAttribute('aria-pressed', 'false');
      await two.click();
      expect(screen.emitted('update:modelValue')).toEqual([['Two']]);
      await expect.element(one).toHaveAttribute('aria-pressed', 'true');
      await screen.rerender({ modelValue: 'Two' });
      await expect.element(two).toHaveAttribute('aria-pressed', 'true');
      await expect.element(one).toHaveAttribute('aria-pressed', 'false');
    });

    test('single and required: the selected button stays on', async () => {
      const screen = await render(ButtonGroup, {
        props: { selection: 'single', required: true, modelValue: 'One' },
        slots: { default: () => buttons(['One', 'Two']) },
      });
      await screen.getByRole('button', { name: 'One' }).click();
      expect(screen.emitted('update:modelValue')).toBeUndefined();
    });

    test('multiple: toggles values in and out', async () => {
      const screen = await render(ButtonGroup, {
        props: { selection: 'multiple', modelValue: ['One'] },
        slots: { default: () => buttons(['One', 'Two']) },
      });
      await screen.getByRole('button', { name: 'Two' }).click();
      expect(screen.emitted('update:modelValue')).toEqual([[['One', 'Two']]]);
    });

    test('a button without a value stays a plain button', async () => {
      const screen = await render(ButtonGroup, {
        props: { selection: 'single' },
        slots: { default: () => [h(Button, () => 'Plain')] },
      });
      const plain = screen.getByRole('button', { name: 'Plain' });
      await expect.element(plain).not.toHaveAttribute('aria-pressed');
      await plain.click();
      expect(screen.emitted('update:modelValue')).toBeUndefined();
    });

    test('a selected icon button shows its selected icon', async () => {
      const screen = await render(ButtonGroup, {
        props: { selection: 'single', modelValue: 'fav' },
        slots: {
          default: () => [
            h(
              IconButton,
              { label: 'Favorite', value: 'fav' },
              { default: () => '♡', 'selected-icon': () => '♥' },
            ),
          ],
        },
      });
      await expect.element(screen.getByRole('button')).toHaveTextContent('♥');
    });
  });

  describe('keyboard', () => {
    test('arrow keys move between buttons, skipping disabled ones', async () => {
      const screen = await render(ButtonGroup, {
        slots: {
          default: () => [
            h(Button, () => 'A'),
            h(Button, { disabled: true }, () => 'B'),
            h(Button, () => 'C'),
          ],
        },
      });
      const [a, , c] = screen.getByRole('button').elements() as HTMLElement[];
      a!.focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(c);
      await userEvent.keyboard('{ArrowRight}'); // no wrapping past the end
      expect(document.activeElement).toBe(c);
      await userEvent.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(a);
    });

    test('in right-to-left layouts, the left arrow goes forward', async () => {
      const screen = await render(ButtonGroup, {
        attrs: { dir: 'rtl' },
        slots: { default: () => [h(Button, () => 'A'), h(Button, () => 'B')] },
      });
      const [a, b] = screen.getByRole('button').elements() as HTMLElement[];
      a!.focus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(b);
    });
  });

  describe('standard', () => {
    // With the theme the widths move on springs, which is where a stale starting point shows.
    const renderThemed = () =>
      render(ButtonGroup, {
        attrs: { style: theme },
        slots: { default: () => buttons(['One', 'Two', 'Six']) },
      });

    test('after a change of size, a press starts from the new widths', async () => {
      const screen = await renderThemed();
      const items = screen.getByRole('button').elements() as HTMLElement[];
      const [one, two] = items;
      // A press at small leaves the springs resting at the small widths.
      press(two!);
      release(two!);
      await vi.waitFor(() => expect(two!.style.inlineSize).toBe(''), { timeout: 2000 });

      await screen.rerender({ size: 'large' });
      const large = items.map(width);
      press(two!);
      const frames = await widthsOverFrames(items, 5);
      for (const [left, middle] of frames) {
        // Never back at the small widths, not even for the first frame.
        expect(middle!).toBeGreaterThanOrEqual(large[1]! - 0.5);
        expect(left!).toBeGreaterThan(large[0]! * 0.8);
      }
      release(one!);
    });

    test('a change of size during a press applies at once', async () => {
      const screen = await renderThemed();
      const [, two] = screen.getByRole('button').elements() as HTMLElement[];
      press(two!);
      await vi.waitFor(() => expect(two!.style.inlineSize).not.toBe(''));

      await screen.rerender({ size: 'large' });
      await vi.waitFor(() => expect(width(two!)).toBeCloseTo(ownWidth(two!) * 1.15, 0));

      release(two!);
      await vi.waitFor(() => expect(two!.style.inlineSize).toBe(''), { timeout: 2000 });
      expect(width(two!)).toBe(ownWidth(two!));
    });

    test('a pressed button grows by 15% and its neighbors make room', async () => {
      const screen = await renderGroup({}, () => buttons(['One', 'Two', 'Six']));
      const group = screen.getByRole('group').element();
      const [one, two, six] = screen.getByRole('button').elements();
      const before = [one!, two!, six!].map(width);

      press(two!);
      await vi.waitFor(() => expect(width(two!)).toBeGreaterThan(before[1]!));
      const share = (before[1]! * 0.15) / 2;
      expect(width(two!)).toBeCloseTo(before[1]! * 1.15, 0);
      expect(width(one!)).toBeCloseTo(before[0]! - share, 0);
      expect(width(six!)).toBeCloseTo(before[2]! - share, 0);
      expect(width(group)).toBeCloseTo(before.reduce((a, b) => a + b) + 2 * 12, 0);

      release(two!);
      await vi.waitFor(() => expect([one!, two!, six!].map(width)).toEqual(before));
      expect(two!.style.inlineSize).toBe('');
    });

    test('has the spec spacing for each size', async () => {
      for (const [size, gap] of [
        ['xsmall', '18px'],
        ['small', '12px'],
        ['medium', '8px'],
        ['xlarge', '8px'],
      ] as const) {
        const screen = await render(ButtonGroup, { props: { size } });
        expect(getComputedStyle(screen.getByRole('group').element()).columnGap).toBe(gap);
        screen.unmount();
      }
    });
  });

  describe('connected', () => {
    test('fills its container, with equal buttons 2px apart', async () => {
      const screen = await renderGroup({ variant: 'connected' }, () => buttons(['A', 'B', 'C']));
      expect(width(screen.getByRole('group').element())).toBe(600);
      for (const button of screen.getByRole('button').elements()) {
        expect(width(button)).toBeCloseTo((600 - 2 * 2) / 3, 1);
      }
    });

    test('rounds the ends of the row and keeps the facing corners small', async () => {
      const screen = await renderGroup({ variant: 'connected' }, () => buttons(['A', 'B', 'C']), {
        themed: true,
      });
      const [a, b, c] = screen.getByRole('button').elements();
      // Small: 40px high, so round is 20px; facing corners are corner-small (8px).
      expect([corners(a!), corners(b!), corners(c!)]).toEqual([
        [20, 8],
        [8, 8],
        [8, 20],
      ]);
    });

    test('a square group uses the facing radius at the ends too', async () => {
      const screen = await renderGroup(
        { variant: 'connected', shape: 'square' },
        () => buttons(['A', 'B']),
        { themed: true },
      );
      expect(screen.getByRole('button').elements().map(corners)).toEqual([
        [8, 8],
        [8, 8],
      ]);
    });

    test('a selected button is fully round', async () => {
      const screen = await renderGroup(
        { variant: 'connected', selection: 'single', modelValue: 'B' },
        () => buttons(['A', 'B', 'C']),
        { themed: true },
      );
      expect(corners(screen.getByRole('button', { name: 'B' }).element())).toEqual([20, 20]);
    });

    test('pressing tightens the facing corners and leaves the widths alone', async () => {
      const screen = await renderGroup({ variant: 'connected' }, () => buttons(['A', 'B', 'C']), {
        themed: true,
      });
      const [a, b] = screen.getByRole('button').elements();
      const before = width(b!);
      press(a!);
      // corner-extra-small (4px) on the facing side; the round end stays.
      await vi.waitFor(() => expect(corners(a!)).toEqual([20, 4]));
      expect(width(b!)).toBe(before);
      release(a!);
    });

    test('extra small icon buttons keep a 48px minimum width', async () => {
      const icons = () => ['A', 'B', 'C'].map((label) => h(IconButton, { label }, () => '♡'));
      const screen = await renderGroup({ variant: 'connected', size: 'xsmall' }, icons, {
        width: 100,
      });
      for (const button of screen.getByRole('button').elements()) {
        expect(width(button)).toBe(48);
      }
    });
  });
});
