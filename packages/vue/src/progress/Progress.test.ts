import { attachTheme } from '@rio-m3e/tokens';
import { describe, expect, onTestFinished, test, vi } from 'vitest';
import { render } from 'vitest-browser-vue';
import { defineComponent, h, nextTick, reactive } from 'vue';
import CircularProgress from './CircularProgress.vue';
import LinearProgress from './LinearProgress.vue';

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

/** A linear indicator 200px wide whose props the app keeps, named by the app */
const setupLinear = async (props: Record<string, unknown> = {}, dir?: string) => {
  const state = reactive({ ...props });
  const screen = await render(
    defineComponent(
      () => () =>
        h('div', { style: 'width: 200px', dir }, [
          h(LinearProgress, { 'aria-label': 'Loading', ...state }),
        ]),
    ),
  );
  const root = screen.getByRole('progressbar', { name: 'Loading' }).element() as HTMLElement;
  const part = (name: string) => root.querySelector<HTMLElement>(`.rio-linear-progress__${name}`)!;
  /** A part's start and end, in px from the indicator's left */
  const span = (name: string) => {
    const box = part(name).getBoundingClientRect();
    const rect = root.getBoundingClientRect();
    return [box.left - rect.left, box.right - rect.left];
  };
  return { screen, state, root, part, span };
};

const setupCircular = async (props: Record<string, unknown> = {}) => {
  const state = reactive({ ...props });
  const screen = await render(
    defineComponent(() => () => h(CircularProgress, { 'aria-label': 'Loading', ...state })),
  );
  const root = screen.getByRole('progressbar', { name: 'Loading' }).element() as HTMLElement;
  const part = (name: string) =>
    root.querySelector<SVGElement>(`.rio-circular-progress__${name}`)! as SVGElement;
  return { screen, state, root, part };
};

/** Calls frames back at `time()`, not the real time, so a wave moves only as far as a test says */
const holdFrameTime = (time: () => number) => {
  const request = window.requestAnimationFrame.bind(window);
  const spy = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback) => request(() => callback(time())));
  onTestFinished(() => spy.mockRestore());
};

/** How far a wavy circular indicator's wave starts off its circle, in px, at the default size */
const waveStartOffset = (wave: SVGElement) => {
  const [, x, y] = wave
    .getAttribute('d')!
    .match(/^M(-?[\d.]+) (-?[\d.]+)/)!
    .map(Number);
  return Math.hypot(x! - 24, y! - 24) - 20.4;
};

describe('RioLinearProgress', () => {
  test('a progress bar named by the app, with its value for assistive technology', async () => {
    const { root } = await setupLinear({ value: 30, max: 120 });
    expect([
      root.getAttribute('aria-valuemin'),
      root.getAttribute('aria-valuemax'),
      root.getAttribute('aria-valuenow'),
    ]).toEqual(['0', '120', '30']);
  });

  test('without a value, indeterminate: no value for assistive technology', async () => {
    const { root } = await setupLinear();
    expect(root.hasAttribute('aria-valuenow')).toBe(false);
    expect(root.hasAttribute('data-indeterminate')).toBe(true);
  });

  test('4px thick: the indicator to the value, the track 4px after it to the end', async () => {
    const { root, span } = await setupLinear({ value: 0.4 });
    expect(root.getBoundingClientRect().height).toBe(4);
    expect(span('indicator')).toEqual([0, 80]);
    expect(span('track-upper')).toEqual([84, 200]);
  });

  test('a stop indicator ends the determinate track, not the indeterminate one', async () => {
    withTheme();
    const { part, state } = await setupLinear({ value: 0.4 });
    expect(getComputedStyle(part('track-upper')).backgroundImage).toContain('radial-gradient');
    state.value = undefined;
    await vi.waitFor(() =>
      expect(getComputedStyle(part('track-upper')).backgroundImage).toBe('none'),
    );
  });

  test('as soon as progress starts, a dot; with none, no indicator', async () => {
    const { span, state } = await setupLinear({ value: 0.001 });
    expect(span('indicator')).toEqual([0, 4]);
    expect(span('track-upper')).toEqual([8, 200]);
    state.value = 0;
    await vi.waitFor(() => expect(span('indicator')).toEqual([0, 0]));
    // Nothing to keep off, so the track runs the whole way.
    expect(span('track-upper')).toEqual([0, 200]);
  });

  test('thickness', async () => {
    const { root, part } = await setupLinear({ value: 0.5, thickness: 8 });
    expect(root.getBoundingClientRect().height).toBe(8);
    expect(part('indicator').getBoundingClientRect().height).toBe(8);
  });

  test('a change of value moves the indicator there over 500ms', async () => {
    const { span, state } = await setupLinear({ value: 0.2 });
    state.value = 0.8;
    await new Promise((resolve) => setTimeout(resolve, 150));
    const [, midway] = span('indicator');
    expect(midway).toBeGreaterThan(40);
    expect(midway).toBeLessThan(160);
    await vi.waitFor(() => expect(span('indicator')).toEqual([0, 160]));
  });

  test('right to left, the progress runs from the right', async () => {
    const { span } = await setupLinear({ value: 0.25 }, 'rtl');
    expect(span('indicator')).toEqual([150, 200]);
    expect(span('track-upper')).toEqual([0, 146]);
  });

  test('indeterminate: with the indicators still off the track, the track runs the whole way', async () => {
    // 100ms into the cycle, before the first indicator comes on
    const { span, root } = await setupLinear({
      style: 'animation-play-state: paused; animation-delay: -100ms',
    });
    expect(root.hasAttribute('data-indeterminate')).toBe(true);
    await vi.waitFor(() => expect(span('track-upper')).toEqual([0, 200]));
  });

  test('indeterminate: the indicators move along the track, which keeps 4px from them', async () => {
    const { span } = await setupLinear();
    // The cycle starts with the indicators off the track; wait for the first to come on.
    await vi.waitFor(() => {
      const [start, end] = span('indicator');
      expect(end! - start!).toBeGreaterThan(8);
    });
    const [start, end] = span('indicator');
    const [, trackEnd] = span('track-middle');
    const [trackStart] = span('track-upper');
    if (start! > 4) expect(start! - trackEnd!).toBeCloseTo(4, 0);
    if (end! < 196) expect(trackStart! - end!).toBeCloseTo(4, 0);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(span('indicator')).not.toEqual([start, end]);
  });

  describe('wavy', () => {
    test('10px tall at 4px thick, 14px at 8px: the wave’s 3px either side', async () => {
      const thin = await setupLinear({ value: 0.5, wavy: true });
      expect(thin.root.getBoundingClientRect().height).toBe(10);
      thin.screen.unmount();
      const thick = await setupLinear({ value: 0.5, wavy: true, thickness: 8 });
      expect(thick.root.getBoundingClientRect().height).toBe(14);
    });

    test('the wave stands in for the flat indicator, over the same stretch, and moves', async () => {
      const { part } = await setupLinear({ value: 0.5, wavy: true });
      const wave = part('indicator-wave');
      await vi.waitFor(() => expect(wave.getAttribute('d')).toBeTruthy());
      expect(getComputedStyle(part('indicator')).opacity).toBe('0');
      // The path's box is its middle line, without the round ends: 2px in from each end of the
      // 100px of progress, its peaks 3px either side of the middle.
      const box = wave.getBoundingClientRect();
      const left = box.left - part('indicator').parentElement!.getBoundingClientRect().left;
      expect(left).toBeCloseTo(2, 0);
      expect(box.width).toBeCloseTo(96, 0);
      expect(box.height).toBeCloseTo(6, 0);
      const before = wave.getAttribute('d');
      await frames(4);
      expect(wave.getAttribute('d')).not.toBe(before);
    });

    test('while it isn’t rendered, the wave holds its last path; shown again, it moves on', async () => {
      const { part, state } = await setupLinear({ value: 0.5, wavy: true });
      const wave = part('indicator-wave');
      await vi.waitFor(() => expect(wave.getAttribute('d')).toBeTruthy());
      state.style = 'display: none';
      await nextTick();
      const before = wave.getAttribute('d');
      await frames(4);
      expect(wave.getAttribute('d')).toBe(before);
      state.style = '';
      await vi.waitFor(() => expect(wave.getAttribute('d')).not.toBe(before));
    });

    test('flat below 10% and from 95%', async () => {
      // At 97% the indicator is long enough for whole waves, were it wavy.
      const { root, part, state } = await setupLinear({ value: 0.97, wavy: true });
      expect(root.hasAttribute('data-flat')).toBe(true);
      // A flat line's box has no height; the wave's is its 3px either side.
      const wave = part('indicator-wave');
      await vi.waitFor(() => expect(wave.getAttribute('d')).toBeTruthy());
      expect(wave.getBoundingClientRect().height).toBeCloseTo(0, 0);
      state.value = 0.5;
      await vi.waitFor(() =>
        expect(part('indicator-wave').getBoundingClientRect().height).toBeCloseTo(6, 0),
      );
    });

    test('right to left, the wave lies over the indicator on the right', async () => {
      const { part, root } = await setupLinear({ value: 0.5, wavy: true }, 'rtl');
      const wave = part('indicator-wave');
      await vi.waitFor(() => expect(wave.getAttribute('d')).toBeTruthy());
      const box = wave.getBoundingClientRect();
      const rect = root.getBoundingClientRect();
      expect(box.left - rect.left).toBeCloseTo(102, 0);
      expect(rect.right - box.right).toBeCloseTo(2, 0);
    });

    test('indeterminate, both indicators wave', async () => {
      const { part } = await setupLinear({ wavy: true });
      await vi.waitFor(() => {
        expect(part('indicator-wave').hasAttribute('d')).toBe(true);
        expect(part('indicator-lower-wave').hasAttribute('d')).toBe(true);
      });
    });
  });
});

test('the app can recolor the indicator and the track, as in a button', async () => {
  const { part } = await setupLinear({
    value: 0.5,
    style: '--rio-progress-color: rgb(1, 2, 3); --rio-progress-track-color: transparent',
  });
  expect(getComputedStyle(part('indicator')).backgroundColor).toBe('rgb(1, 2, 3)');
  expect(getComputedStyle(part('track-upper')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
});

describe('RioCircularProgress', () => {
  test('a progress bar named by the app', async () => {
    const { root } = await setupCircular({ value: 0.25 });
    expect(root.getAttribute('aria-valuenow')).toBe('0.25');
  });

  test.each([
    [{}, 40],
    [{ wavy: true }, 48],
    [{ thickness: 8 }, 44],
    [{ size: 96 }, 96],
  ])('%o: %ipx', async (props, size) => {
    const { root } = await setupCircular({ value: 0.5, ...props });
    const box = root.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([size, size]);
  });

  test('the indicator from the top, clockwise, to the value; the track the rest, 4px off each end', async () => {
    const { part } = await setupCircular({ value: 0.25 });
    const circumference = 2 * Math.PI * 18;
    const indicator = getComputedStyle(part('indicator'));
    // The dash runs between the round ends, half the 4px thickness in.
    expect(parseFloat(indicator.strokeDasharray)).toBeCloseTo(circumference / 4 - 4, 1);
    expect(parseFloat(indicator.strokeDashoffset)).toBeCloseTo(-2, 1);
    const track = getComputedStyle(part('track'));
    expect(parseFloat(track.strokeDasharray)).toBeCloseTo((circumference * 3) / 4 - 8 - 4, 1);
    expect(parseFloat(track.strokeDashoffset)).toBeCloseTo(-(circumference / 4 + 4 + 2), 1);
  });

  test('at full progress, a ring: the ends meet on the same spot, not at their tips', async () => {
    const { part, state } = await setupCircular({ value: 1 });
    const circumference = 2 * Math.PI * 18;
    const dash = () => {
      const indicator = getComputedStyle(part('indicator'));
      return [parseFloat(indicator.strokeDasharray), parseFloat(indicator.strokeDashoffset)];
    };
    expect(dash()[0]).toBeCloseTo(circumference, 1);
    expect(dash()[1]).toBeCloseTo(0, 1);
    // Within the thickness of closing, the ends start less far in: at 99%, 1.13px short of full,
    // half that in rather than half the thickness.
    state.value = 0.99;
    await vi.waitFor(() => {
      expect(dash()[0]).toBeCloseTo(circumference * 0.99 - circumference * 0.01, 1);
      expect(dash()[1]).toBeCloseTo((-circumference * 0.01) / 2, 1);
    });
  });

  test('wavy, at full progress: the wave closes into a ring', async () => {
    const { part } = await setupCircular({ value: 1, wavy: true });
    const wave = part('indicator-wave');
    await vi.waitFor(() => expect(wave.getAttribute('d')).toBeTruthy());
    const points = [...wave.getAttribute('d')!.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)];
    const [first, last] = [points[0]!, points.at(-1)!].map((m) => [Number(m[1]), Number(m[2])]);
    expect(last![0]).toBeCloseTo(first![0]!, 1);
    expect(last![1]).toBeCloseTo(first![1]!, 1);
  });

  test('with no progress, no indicator, not even a dot, and the track all the way round', async () => {
    const { part } = await setupCircular({ value: 0 });
    expect(getComputedStyle(part('indicator')).strokeWidth).toBe('0px');
    expect(getComputedStyle(part('track')).strokeDasharray).toBe('none');
    expect(getComputedStyle(part('track')).strokeWidth).toBe('4px');
  });

  test('indeterminate: no track, and the indicator turns', async () => {
    const { part, root } = await setupCircular();
    expect(getComputedStyle(part('track')).visibility).toBe('hidden');
    const svg = root.querySelector('svg')!;
    const before = getComputedStyle(svg).rotate;
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(getComputedStyle(svg).rotate).not.toBe(before);
  });

  test('indeterminate: as the indicator restarts, the circle steps on to where its tail got to', async () => {
    const { root, part, state } = await setupCircular();
    /** The circle's step and the indicator's start, `ms` into the animation */
    const at = async (ms: number) => {
      state.style = `animation-play-state: paused; animation-delay: -${ms}ms`;
      await nextTick();
      const style = getComputedStyle(root);
      return {
        step: Number(style.getPropertyValue('--rio-circular-progress-advance')),
        start: Number(style.getPropertyValue('--rio-circular-progress-start')),
        transform: getComputedStyle(part('svg')).transform,
      };
    };
    const before = await at(1330);
    const after = await at(1336);
    expect(before.step).toBe(0);
    expect(before.start).toBeCloseTo(0.72, 2);
    expect(after.step).toBeCloseTo(0.72);
    expect(after.start).toBeCloseTo(0, 2);
    // Turned 0.72 of a turn: 259.2°
    const [a, b] = after.transform.match(/-?[\d.e]+/g)!.map(Number);
    expect((Math.atan2(b!, a!) * 180) / Math.PI).toBeCloseTo(259.2 - 360, 1);
  });

  test('wavy: the wave starts where the flat indicator’s dash does', async () => {
    const { part } = await setupCircular({ value: 0.25, wavy: true });
    const wave = part('indicator-wave');
    await vi.waitFor(() => expect(wave.getAttribute('d')).toBeTruthy());
    const [, x, y] = wave
      .getAttribute('d')!
      .match(/^M(-?[\d.]+) (-?[\d.]+)/)!
      .map(Number);
    // The dash starts half the thickness along the circle, from 3 o'clock before the turn to the top.
    const start = -parseFloat(getComputedStyle(part('indicator')).strokeDashoffset);
    expect(start).toBeCloseTo(2, 1);
    expect(Math.atan2(y! - 24, x! - 24)).toBeCloseTo(start / 20.4, 1);
  });

  test('wavy, with no progress: no wave, not even a dot', async () => {
    const { part } = await setupCircular({ value: 0, wavy: true });
    await vi.waitFor(() => expect(part('indicator-wave').hasAttribute('d')).toBe(true));
    expect(part('indicator-wave').getAttribute('d')).toBe('');
  });

  test('wavy: the wave stands in for the flat indicator', async () => {
    const { part } = await setupCircular({ value: 0.6, wavy: true });
    await vi.waitFor(() => expect(part('indicator-wave').getAttribute('d')).toBeTruthy());
    expect(getComputedStyle(part('indicator')).opacity).toBe('0');
    const before = part('indicator-wave').getAttribute('d');
    await frames(4);
    expect(part('indicator-wave').getAttribute('d')).not.toBe(before);
  });

  test('wavy: the wave moves on smoothly from one second to the next', async () => {
    // The path fits 9 waves round the circle, 14.24px each, not the 15px the wave moves a second.
    let now = 999.9;
    holdFrameTime(() => now);
    const { part } = await setupCircular({ value: 0.5, wavy: true });
    const wave = part('indicator-wave');
    await vi.waitFor(() => expect(wave.getAttribute('d')).toBeTruthy());
    const before = waveStartOffset(wave);
    now = 1000.1;
    await frames(2);
    expect(waveStartOffset(wave)).toBeCloseTo(before, 1);
  });

  test('wavy, indeterminate: as the circle steps on, the wave stays where it was on screen', async () => {
    // 0.72 of a turn is 6.48 of the 9 waves round the circle: without going back as far, the wave
    // would turn nearly upside down under the indicator.
    holdFrameTime(() => 0);
    const { part, state } = await setupCircular({ wavy: true });
    const wave = part('indicator-wave');
    /** How far the wave starts off the circle, `ms` into the animation */
    const offsetAt = async (ms: number) => {
      state.style = `animation-play-state: paused; animation-delay: -${ms}ms`;
      await nextTick();
      await frames(2);
      return waveStartOffset(wave);
    };
    // As the first cycle ends, and the 25th, when the circle has gone round 18 times and starts over.
    for (const end of [1333, 1333 * 25]) {
      const before = await offsetAt(end - 2);
      expect(await offsetAt(end + 2)).toBeCloseTo(before, 1);
    }
  });
});
