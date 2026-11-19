// The progress indicators' waves in the DOM.
//
// - While wavy, each frame turns the indicators the stylesheet lays out flat into waves: it reads
//   where each indicator lies, and draws a wave over the same stretch into its path (`d`). Once a
//   path has been drawn, the stylesheet shows it in place of the flat indicator.
// - The wave is fixed to the track and moves toward the end by one wavelength a second; under
//   reduced motion it holds still. Its amplitude and wavelength come from the stylesheet
//   (`--rio-progress-amplitude`, `--rio-progress-wavelength`), which flattens it near the ends of
//   the progress and shortens it while indeterminate.
// - Right to left, a linear wave runs from the right, as the track does.
// - While the indicator isn't rendered, as under `display: none`, frames draw nothing, and the wave
//   keeps the last path drawn until it shows again.

import { prefersReducedMotion } from '../primitives/spring/spring';
import { parsePx } from '../utils/css';
import { circularWavePath, linearWavePath } from './progress';

export interface ProgressDomHandle {
  /** Starts drawing when the indicator turns wavy. Call it after each render. */
  sync(): void;
  detach(): void;
}

/** Draws on every frame while `wavy()` and `root` is rendered, and stops when it isn't wavy. */
function frameLoop(
  root: HTMLElement,
  draw: (time: number) => void,
  wavy: () => boolean,
): ProgressDomHandle {
  let frame: number | undefined;
  const tick = (time: number) => {
    frame = undefined;
    if (!wavy()) return;
    if (root.getClientRects().length > 0) draw(time);
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    if (frame === undefined && wavy()) frame = requestAnimationFrame(tick);
  };
  sync();
  return {
    sync,
    detach() {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
    },
  };
}

/** How far the wave has moved along the track at `time`, in px */
const shiftAt = (time: number, wavelength: number) =>
  prefersReducedMotion() ? 0 : ((time / 1000) * wavelength) % wavelength;

export interface LinearProgressDomOptions {
  wavy: () => boolean;
  /** The flat indicators: the progress (or, while indeterminate, the leading one), and the other. */
  indicators: () => readonly (Element | null | undefined)[];
  /** Their waves' paths, in the same order, while wavy. */
  waves: () => readonly (Element | null | undefined)[];
}

export function attachLinearProgress(
  root: HTMLElement,
  options: LinearProgressDomOptions,
): ProgressDomHandle {
  return frameLoop(
    root,
    (time) => {
      const style = getComputedStyle(root);
      const thickness = parsePx(style.getPropertyValue('--rio-progress-thickness'), 4);
      const amplitude = parsePx(style.getPropertyValue('--rio-progress-amplitude'));
      const wavelength = parsePx(style.getPropertyValue('--rio-progress-wavelength'), 40);
      const track = root.getBoundingClientRect();
      const rtl = style.direction === 'rtl';
      const shift = shiftAt(time, wavelength);
      const waves = options.waves();
      options.indicators().forEach((indicator, i) => {
        const path = waves[i];
        if (!indicator || !path) return;
        const box = indicator.getBoundingClientRect();
        // From the track's start; the line's ends sit half the thickness in, where its caps start.
        const from = rtl ? track.right - box.right : box.left - track.left;
        const d =
          box.width > 0
            ? linearWavePath({
                from: from + thickness / 2,
                to: from + box.width - thickness / 2,
                y: track.height / 2,
                amplitude,
                wavelength,
                shift,
              })
            : '';
        path.setAttribute('d', d);
      });
    },
    options.wavy,
  );
}

export interface CircularProgressDomOptions {
  wavy: () => boolean;
  /** The flat indicator: a circle, of which the stylesheet's dash is the progress. */
  indicator: () => SVGCircleElement | null | undefined;
  /** Its wave's path, while wavy. */
  wave: () => Element | null | undefined;
}

const firstLength = (value: string) => parseFloat(value.split(/[\s,]+/)[0] ?? '') || 0;

export function attachCircularProgress(
  root: HTMLElement,
  options: CircularProgressDomOptions,
): ProgressDomHandle {
  return frameLoop(
    root,
    (time) => {
      const indicator = options.indicator();
      const path = options.wave();
      if (!indicator || !path) return;
      const style = getComputedStyle(root);
      const circle = getComputedStyle(indicator);
      const wavelength = parsePx(style.getPropertyValue('--rio-progress-wavelength'), 15);
      // The dash is the line between the caps: it starts `-dashoffset` along the circle.
      const from = -firstLength(circle.strokeDashoffset);
      const length = circle.strokeDasharray === 'none' ? 0 : firstLength(circle.strokeDasharray);
      // The stylesheet thins the line to nothing where there is no progress to show.
      const visible = parseFloat(circle.strokeWidth) > 0;
      path.setAttribute(
        'd',
        visible
          ? circularWavePath({
              cx: indicator.cx.baseVal.value,
              cy: indicator.cy.baseVal.value,
              radius: indicator.r.baseVal.value,
              from,
              to: from + length,
              amplitude: parsePx(style.getPropertyValue('--rio-progress-amplitude')),
              wavelength,
              shift: shiftAt(time, wavelength),
            })
          : '',
      );
    },
    options.wavy,
  );
}
