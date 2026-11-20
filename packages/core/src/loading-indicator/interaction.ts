// The loading indicator in the DOM.
//
// - While indeterminate, each frame draws the moment since the loop started into the shape's path
//   (`d` and `transform`). It starts over when the indicator turns indeterminate again.
// - While determinate, the shape is drawn for the progress whenever `sync` is called, after each
//   render; it doesn't animate between values.
// - Under reduced motion the morphs ease in without overshooting; the indicator keeps moving,
//   since its movement is what says the process is going on (Rio's choice).
// - While the indicator isn't rendered, as under `display: none`, frames draw nothing.

import { prefersReducedMotion } from '../primitives/reduced-motion/reduced-motion';
import type { LoadingIndicatorDrawing } from './loading-indicator';

export interface LoadingIndicatorDomOptions {
  /** The shape's path */
  indicator: () => SVGPathElement | null | undefined;
  /** Whether the indicator loops, which `createLoadingIndicator` reports */
  indeterminate: () => boolean;
  /** The drawing at a moment, from `createLoadingIndicator` */
  drawing: (elapsedMs: number, reducedMotion: boolean) => LoadingIndicatorDrawing;
}

export interface LoadingIndicatorDomHandle {
  /** Draws the current progress, and starts or stops the loop. Call it after each render. */
  sync(): void;
  detach(): void;
}

export function attachLoadingIndicator(
  root: HTMLElement,
  options: LoadingIndicatorDomOptions,
): LoadingIndicatorDomHandle {
  let frame: number | undefined;
  let start: number | undefined;

  const draw = (elapsedMs: number) => {
    const path = options.indicator();
    if (!path) return;
    const { d, rotation } = options.drawing(elapsedMs, prefersReducedMotion());
    path.setAttribute('d', d);
    path.setAttribute('transform', `rotate(${rotation} 0.5 0.5)`);
  };

  const tick = (time: number) => {
    frame = undefined;
    if (!options.indeterminate()) return;
    start ??= time;
    if (root.getClientRects().length > 0) draw(time - start);
    frame = requestAnimationFrame(tick);
  };

  const sync = () => {
    if (options.indeterminate()) {
      if (frame === undefined) frame = requestAnimationFrame(tick);
      return;
    }
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    start = undefined;
    draw(0);
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
