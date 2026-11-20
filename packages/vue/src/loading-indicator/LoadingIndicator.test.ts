import { attachTheme } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test } from 'vitest';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, reactive } from 'vue';
import LoadingIndicator from './LoadingIndicator.vue';

const withTheme = () => {
  const theme = attachTheme(document.documentElement, {
    sourceColor: '#6750a4',
    colorScheme: false,
  });
  onTestFinished(() => theme.detach());
};

const frames = (count = 2) =>
  new Promise<void>((resolve) => {
    let left = count;
    const next = () => (--left <= 0 ? resolve() : requestAnimationFrame(next));
    requestAnimationFrame(next);
  });

/** An indicator whose props the app keeps, named by the app */
const setup = async (props: Record<string, unknown> = {}, wrapperStyle?: string) => {
  const state = reactive({ ...props });
  const screen = await render(
    defineComponent(
      () => () =>
        h('div', { style: wrapperStyle }, [
          h(LoadingIndicator, { 'aria-label': 'Loading news', ...state }),
        ]),
    ),
  );
  const root = screen.getByRole('progressbar', { name: 'Loading news' }).element() as HTMLElement;
  const path = root.querySelector<SVGPathElement>('.rio-loading-indicator__indicator')!;
  return { screen, state, root, path };
};

describe('RioLoadingIndicator', () => {
  test('a progress bar named by the app, without a value while it loops', async () => {
    const { root } = await setup();
    expect(root.getAttribute('aria-valuenow')).toBeNull();
    expect(root.hasAttribute('data-indeterminate')).toBe(true);
  });

  test('48px by default, or the size the app sets, with the shape inside', async () => {
    const { root, state } = await setup();
    expect(root.getBoundingClientRect().width).toBe(48);
    expect(root.getBoundingClientRect().height).toBe(48);
    state.size = 96;
    await nextTick();
    expect(root.getBoundingClientRect().width).toBe(96);
    const shape = root.querySelector('svg')!.getBoundingClientRect();
    expect(shape.width).toBe(96);
  });

  test('draws its first moment before it starts moving', async () => {
    const { path } = await setup();
    expect(path.getAttribute('d')).toMatch(/^M.*Z$/);
    expect(path.getAttribute('transform')).toBe('rotate(90 0.5 0.5)');
  });

  test('morphs and turns while it loops', async () => {
    const { path } = await setup();
    const before = [path.getAttribute('d'), path.getAttribute('transform')];
    await frames(10);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await frames(2);
    const after = [path.getAttribute('d'), path.getAttribute('transform')];
    expect(after).not.toEqual(before);
  });

  test('draws the progress it is given, and reports it', async () => {
    const { root, path, state } = await setup({ value: 0.25 });
    expect(root.getAttribute('aria-valuenow')).toBe('0.25');
    expect(path.getAttribute('transform')).toBe('rotate(-45 0.5 0.5)');
    const quarter = path.getAttribute('d');
    state.value = 0.75;
    await nextTick();
    expect(root.getAttribute('aria-valuenow')).toBe('0.75');
    expect(path.getAttribute('transform')).toBe('rotate(-135 0.5 0.5)');
    expect(path.getAttribute('d')).not.toBe(quarter);
    // It holds still between values.
    const held = path.getAttribute('d');
    await frames(3);
    expect(path.getAttribute('d')).toBe(held);
  });

  test('loops again once its value is cleared', async () => {
    const { root, path, state } = await setup({ value: 1 });
    state.value = undefined;
    await nextTick();
    expect(root.hasAttribute('data-indeterminate')).toBe(true);
    const first = path.getAttribute('d');
    await new Promise((resolve) => setTimeout(resolve, 200));
    await frames(2);
    expect(path.getAttribute('d')).not.toBe(first);
  });

  test('in primary, or in on-primary-container on a primary container when contained', async () => {
    withTheme();
    const { root, state } = await setup();
    /** What a color token computes to, from an element of its own */
    const token = (name: string) => {
      const probe = document.body.appendChild(document.createElement('span'));
      probe.style.color = `var(--rio-color-${name})`;
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    expect(getComputedStyle(root).color).toBe(token('primary'));
    expect(getComputedStyle(root).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    state.contained = true;
    await nextTick();
    expect(getComputedStyle(root).color).toBe(token('on-primary-container'));
    expect(getComputedStyle(root).backgroundColor).toBe(token('primary-container'));
    expect(getComputedStyle(root).borderRadius).toBe('50%');
  });

  test("takes the app's colors", async () => {
    const { root, state } = await setup(
      {},
      '--rio-loading-indicator-color: rgb(1, 2, 3); --rio-loading-indicator-container-color: rgb(4, 5, 6)',
    );
    expect(getComputedStyle(root).color).toBe('rgb(1, 2, 3)');
    state.contained = true;
    await nextTick();
    expect(getComputedStyle(root).backgroundColor).toBe('rgb(4, 5, 6)');
  });

  test('morphs through the shapes the app gives', async () => {
    const { path, state } = await setup({ value: 0 });
    const defaultShape = path.getAttribute('d');
    state.shapes = ['heart', 'circle'];
    await nextTick();
    expect(path.getAttribute('d')).not.toBe(defaultShape);
  });

  test('stops drawing once unmounted', async () => {
    const { screen, path } = await setup();
    screen.unmount();
    const last = path.getAttribute('d');
    await frames(5);
    expect(path.getAttribute('d')).toBe(last);
  });
});
