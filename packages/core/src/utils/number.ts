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
