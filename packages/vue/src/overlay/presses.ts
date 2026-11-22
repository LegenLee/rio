import { OVERLAY_PRESS_EVENTS } from '@rio-m3e/core';

const stop = (event: Event) => event.stopPropagation();

/**
 * Listeners for an overlay's root, bound with `v-on`: they stop core's `OVERLAY_PRESS_EVENTS`, so
 * clicks and presses stay in the overlay. Keys go on.
 */
export const keepPresses: Readonly<Record<string, (event: Event) => void>> = Object.fromEntries(
  OVERLAY_PRESS_EVENTS.map((name) => [name, stop]),
);
