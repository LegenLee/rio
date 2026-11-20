/** The value of complete progress: `max` when it is a positive number, otherwise 1. */
export function progressMax(max: number): number {
  return Number.isFinite(max) && max > 0 ? max : 1;
}

/** How much of the range the progress covers, from 0 to 1, or `undefined` while indeterminate. */
export function progressFraction(value: number | undefined, max: number): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.min(1, Math.max(0, value / progressMax(max)));
}

// TODO: Rename `progressBarAttrs` to `progressAttrs`
/** A progress bar's ARIA attributes, for a value from 0 to `max`, or none while indeterminate */
export function progressBarAttrs(value: number | undefined, max: number) {
  const top = progressMax(max);
  const determinate = progressFraction(value, max) !== undefined;
  return {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': String(top),
    'aria-valuenow': determinate ? String(Math.min(top, Math.max(0, value!))) : undefined,
  };
}
