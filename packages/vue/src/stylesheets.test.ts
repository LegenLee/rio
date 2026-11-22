/// <reference types="vite/client" />
// The stylesheets each component imports: one that reads the line's direction (`--rio-dir-sign`)
// falls back to left to right without `base/direction.css`, so a component importing it imports
// that too.
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

/** The stylesheets that read the direction, as components import them */
const readers = Object.entries(sheets)
  .filter(([, css]) => css.includes('var(--rio-dir-sign'))
  .map(([path]) => `'@rio-m3e/styles/${path.replace('../../styles/src/', '')}'`);

test('a component importing a stylesheet that reads the direction imports base/direction.css', () => {
  const importers = Object.entries(sources).filter(([, source]) =>
    readers.some((sheet) => source.includes(sheet)),
  );
  expect(readers.length).toBeGreaterThan(0);
  expect(importers.length).toBeGreaterThan(0);
  const missing = importers
    .filter(([, source]) => !source.includes("'@rio-m3e/styles/base/direction.css'"))
    .map(([path]) => path);
  expect(missing).toEqual([]);
});
