import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const sheets = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sheets(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });

const src = fileURLToPath(new URL('.', import.meta.url));

test('no `:dir()`, which a build for older browsers turns into `:lang()`, out of a page’s `dir`', () => {
  const uses = sheets(src).filter((file) =>
    readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .includes(':dir('),
  );
  expect(uses).toEqual([]);
});

test('a stylesheet reading the direction names where it comes from', () => {
  const readers = sheets(src).filter((file) =>
    /var\(--rio-dir-sign/.test(readFileSync(file, 'utf8')),
  );
  expect(readers.length).toBeGreaterThan(0);
  for (const file of readers) {
    expect([file, readFileSync(file, 'utf8').includes('base/direction.css')]).toEqual([file, true]);
  }
});
