/// <reference types="vite/client" />
// The stylesheets each component imports: one that reads a variable a base stylesheet sets needs
// that base stylesheet too. Without `base/direction.css`, `--rio-dir-sign` falls back to left to
// right; without `base/accent.css`, an overlay opened inside a colored component takes its color.
import { expect, test } from 'vitest';

const sheets = import.meta.glob<string>('../../styles/src/**/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const sources = import.meta.glob<string>(['./**/*.{vue,ts}', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

test.each([
  ['the direction', 'var(--rio-dir-sign', 'base/direction.css'],
  ['an accent', 'var(--rio-accent', 'base/accent.css'],
])('a component importing a stylesheet that reads %s imports %s', (_, read, base) => {
  /** The stylesheets that read the variable, as components import them */
  const readers = Object.entries(sheets)
    .filter(([, css]) => css.includes(read))
    .map(([path]) => `'@rio-m3e/styles/${path.replace('../../styles/src/', '')}'`);
  const importers = Object.entries(sources).filter(([, source]) =>
    readers.some((sheet) => source.includes(sheet)),
  );
  expect(readers.length).toBeGreaterThan(0);
  expect(importers.length).toBeGreaterThan(0);
  const missing = importers
    .filter(([, source]) => !source.includes(`'@rio-m3e/styles/${base}'`))
    .map(([path]) => path);
  expect(missing).toEqual([]);
});
