import { describe, expect, test } from 'vitest';
import {
  circularWavePath,
  createCircularProgress,
  createLinearProgress,
  linearWavePath,
  progressDefaults,
  type CircularProgressProps,
  type LinearProgressProps,
} from './progress';

const linear = (props: LinearProgressProps = {}) => createLinearProgress({ props: () => props });
const circular = (props: CircularProgressProps = {}) =>
  createCircularProgress({ props: () => props });

/** The points of a path, as [x, y] pairs */
const points = (d: string) =>
  [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);

describe('defaults', () => {
  test('the spec’s 4dp thickness, flat, out of 1', () => {
    expect(progressDefaults).toEqual({ max: 1, wavy: false, thickness: 4 });
  });

  test('a circle of 40, 48 when wavy, growing with the thickness as the spec’s samples do', () => {
    expect(circular().size()).toBe(40);
    expect(circular({ wavy: true }).size()).toBe(48);
    expect(circular({ thickness: 8 }).size()).toBe(44);
    expect(circular({ wavy: true, thickness: 8 }).size()).toBe(52);
    expect(circular({ size: 120 }).size()).toBe(120);
    expect(circular({ size: 0 }).size()).toBe(40);
  });

  test('the radius leaves room for the thickness, and for the wave’s 1.6dp', () => {
    expect(circular().radius()).toBe(18);
    expect(circular({ thickness: 8 }).radius()).toBe(18);
    expect(circular({ wavy: true }).radius()).toBeCloseTo(20.4);
  });

  test('props an adapter passes as undefined take the defaults', () => {
    const root = linear({
      max: undefined,
      wavy: undefined,
      thickness: undefined,
      value: 0.5,
    }).parts.root();
    expect(root).toMatchObject({ 'aria-valuemax': '1', 'data-wavy': undefined });
    expect(root.style).toBe('--rio-progress-value: 0.5; --rio-progress-thickness: 4px');
  });
});

describe('the root', () => {
  test('a determinate progress bar: its value for assistive technology, its fraction for the stylesheet', () => {
    expect(linear({ value: 30, max: 120 }).parts.root()).toEqual({
      class: 'rio-linear-progress',
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': '120',
      'aria-valuenow': '30',
      'data-indeterminate': undefined,
      'data-wavy': undefined,
      'data-empty': undefined,
      'data-full': undefined,
      'data-flat': undefined,
      style: '--rio-progress-value: 0.25; --rio-progress-thickness: 4px',
    });
  });

  test('without a value, or a value that isn’t a number, indeterminate', () => {
    for (const value of [undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
      const progress = linear({ value });
      expect(progress.indeterminate()).toBe(true);
      expect(progress.parts.root()).toMatchObject({
        'aria-valuenow': undefined,
        'data-indeterminate': '',
        style: '--rio-progress-value: 0; --rio-progress-thickness: 4px',
      });
    }
  });

  test('a value off the range shows at its end; a max that isn’t above 0 is 1', () => {
    expect(linear({ value: 2 }).parts.root()).toMatchObject({
      'aria-valuenow': '1',
      'data-full': '',
    });
    expect(linear({ value: -1 }).parts.root()).toMatchObject({
      'aria-valuenow': '0',
      'data-empty': '',
    });
    expect(linear({ value: 0.5, max: 0 }).parts.root()['aria-valuemax']).toBe('1');
  });

  test('wavy: the wave lies flat up to 10% and from 95% of determinate progress', () => {
    const flat = (value?: number) => linear({ wavy: true, value }).parts.root()['data-flat'];
    expect([flat(0.1), flat(0.11), flat(0.94), flat(0.95), flat(undefined)]).toEqual([
      '',
      undefined,
      undefined,
      '',
      undefined,
    ]);
    expect(linear({ value: 0.05 }).parts.root()['data-flat']).toBeUndefined();
  });

  test('the circle’s size and radius go to the stylesheet too', () => {
    expect(circular({ value: 0.5, thickness: 8 }).parts.root()).toMatchObject({
      class: 'rio-circular-progress',
      role: 'progressbar',
      style:
        '--rio-progress-value: 0.5; --rio-progress-thickness: 8px; ' +
        '--rio-circular-progress-size: 44px; --rio-circular-progress-radius: 18px',
    });
  });
});

describe('the parts', () => {
  test('linear: tracks and indicators out of the accessibility tree, and the wave while wavy', () => {
    const { parts, showsWave } = linear();
    for (const name of [
      'trackLower',
      'indicatorLower',
      'trackMiddle',
      'indicator',
      'trackUpper',
      'wave',
    ] as const) {
      expect(parts[name]()['aria-hidden']).toBe('true');
    }
    expect(parts.indicator().class).toBe('rio-linear-progress__indicator');
    expect(parts.indicatorWave()).toEqual({ class: 'rio-linear-progress__indicator-wave' });
    expect(showsWave()).toBe(false);
    expect(linear({ wavy: true }).showsWave()).toBe(true);
  });

  test('circular: the circles centered in the box, on the radius', () => {
    const { parts } = circular({ wavy: true });
    expect(parts.svg()).toEqual({
      class: 'rio-circular-progress__svg',
      viewBox: '0 0 48 48',
      'aria-hidden': 'true',
    });
    expect(parts.indicator()).toEqual({
      class: 'rio-circular-progress__indicator',
      cx: '24',
      cy: '24',
      r: '20.4',
    });
    expect(parts.track().class).toBe('rio-circular-progress__track');
  });
});

describe('waves', () => {
  test('a linear wave runs between its ends, its peaks the amplitude either side', () => {
    const d = linearWavePath({ from: 2, to: 102, y: 5, amplitude: 3, wavelength: 40, shift: 0 });
    const ps = points(d);
    expect(ps[0]).toEqual([2, expect.closeTo(5 + 3 * Math.sin((2 * Math.PI * 2) / 40), 2)]);
    expect(ps.at(-1)![0]).toBe(102);
    const ys = ps.map(([, y]) => y!);
    expect(Math.max(...ys)).toBeCloseTo(8, 1);
    expect(Math.min(...ys)).toBeCloseTo(2, 1);
  });

  test('the wave is fixed to the track, and moves with the shift', () => {
    // Every point's height follows from where it is on the track and how far the wave has moved,
    // whatever stretch of the track the wave covers.
    for (const [from, shift] of [
      [0, 0],
      [10, 0],
      [3, 12],
    ] as const) {
      const d = linearWavePath({ from, to: from + 40, y: 0, amplitude: 2, wavelength: 40, shift });
      for (const [x, y] of points(d)) {
        expect(y).toBeCloseTo(2 * Math.sin((2 * Math.PI * (x! - shift)) / 40), 1);
      }
    }
  });

  test('a flat or empty stretch', () => {
    expect(linearWavePath({ from: 5, to: 4, y: 0, amplitude: 3, wavelength: 40, shift: 0 })).toBe(
      '',
    );
    const flat = points(
      linearWavePath({ from: 0, to: 30, y: 7, amplitude: 0, wavelength: 40, shift: 0 }),
    );
    expect(flat.every(([, y]) => y === 7)).toBe(true);
    // A stretch of nothing is a dot: a line of no length, which round ends draw.
    expect(
      points(linearWavePath({ from: 3, to: 3, y: 1, amplitude: 0, wavelength: 40, shift: 0 })),
    ).toEqual([
      [3, 1],
      [3, 1],
    ]);
  });

  test('a circular wave goes round from 3 o’clock, clockwise, a whole number of waves to the circle', () => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const wave = { cx: 24, cy: 24, radius, amplitude: 1.6, wavelength: 15, shift: 0 };
    const quarter = points(circularWavePath({ ...wave, from: 0, to: circumference / 4 }));
    expect(quarter[0]).toEqual([expect.closeTo(44, 1), expect.closeTo(24, 1)]);
    expect(quarter.at(-1)![1]).toBeGreaterThan(40);
    // Seamless: the wave's height where the circle starts and ends again matches.
    const whole = points(circularWavePath({ ...wave, from: 0, to: circumference }));
    expect(whole.at(-1)![0]).toBeCloseTo(whole[0]![0]!, 1);
    expect(whole.at(-1)![1]).toBeCloseTo(whole[0]![1]!, 1);
    expect(circularWavePath({ ...wave, from: 3, to: 2 })).toBe('');
  });
});
