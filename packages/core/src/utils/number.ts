const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)$/;

/**
 * Reads a decimal number as Kotlin's `String.toFloat()` (Java's `Float.parseFloat`) does, but keeps
 * all 64 bits: characters up to and including the space around it are ignored, and anything else
 * throws, where `Number()` would return `NaN` or read an empty string as 0.
 *
 * It reads only what Kotlin reads without a letter: its callers, which read the original's
 * formats, split their text at letters first, so exponents, `NaN`, `Infinity`, hexadecimal, and
 * `f` or `d` suffixes never reach it.
 */
export function parseFloatStrict(text: string): number {
  // oxlint-disable-next-line no-control-regex
  const s = text.replace(/^[\u0000- ]+|[\u0000- ]+$/g, '');
  if (DECIMAL.test(s)) return Number(s);
  throw new Error(`For input string: "${text}"`);
}

const decimals = (value: number) => {
  const text = String(value);
  const exponent = text.indexOf('e-');
  if (exponent >= 0) return Number(text.slice(exponent + 2));
  const point = text.indexOf('.');
  return point < 0 ? 0 : text.length - point - 1;
};

/**
 * `start` plus `steps` steps of `step`, rounded to the decimals of `start` and `step`, so that steps
 * such as 0.1 don't add up to 0.30000000000000004.
 */
export function addSteps(start: number, step: number, steps: number): number {
  const places = Math.min(100, Math.max(decimals(start), decimals(step)));
  return Number((start + steps * step).toFixed(places));
}
