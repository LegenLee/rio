// Fails a test during which Vue warned, such as about a template ref on a value that isn't a ref.
// Vue warns only in development, so nothing else would catch what it warns about.
//
// A warning that comes after a test has ended, from a flush after the test unmounted for one, fails
// the next test, or the file after the last one, rather than going unseen.
import { afterAll, afterEach, beforeEach, expect } from 'vitest';

let warnings: string[] = [];
const warn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  const message = String(args[0]);
  if (message.startsWith('[Vue warn]')) warnings.push(message);
  warn(...args);
};

const take = () => {
  const taken = warnings;
  warnings = [];
  return taken;
};

beforeEach(() => {
  expect(take(), 'Vue warned after the previous test ended').toEqual([]);
});

afterEach(() => {
  expect(take(), 'Vue warned during the test').toEqual([]);
});

afterAll(() => {
  expect(take(), 'Vue warned after the last test ended').toEqual([]);
});
