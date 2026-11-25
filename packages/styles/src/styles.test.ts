import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { BREAKPOINT_WIDTHS } from '../../core/src/layout/breakpoints';

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

/** The widths a media query compares the window's to, with their units, as `[file, width]` */
const mediaWidths = (css: string, file = '') =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@media([^{]*)\{/g)].flatMap(([, query]) =>
    [
      ...query!.matchAll(
        /(?:\bwidth\s*[:<>=]+\s*([\d.]+[a-z]*)|([\d.]+[a-z]*)\s*[<>=]+\s*(?=width\b))/g,
      ),
    ].map((match) => [file, match[1] ?? match[2]] as const),
  );

test('a media query on the width reads it in every form', () => {
  const css = `@media (min-width: 600px) {} @media (width < 840px) {} /* @media (width < 1px) {} */
    @media (600px <= width < 1200px) {} @media (max-height: 559px) {} @media (min-width: 40em) {}`;
  expect(mediaWidths(css).map(([, width]) => width)).toEqual([
    '600px',
    '840px',
    '600px',
    '1200px',
    '40em',
  ]);
});

test("a media query on the window's width compares it to a breakpoint's, in px", () => {
  const widths = Object.values(BREAKPOINT_WIDTHS).map((width) => `${width}px`);
  const off = sheets(src)
    .flatMap((file) => mediaWidths(readFileSync(file, 'utf8'), file))
    .filter(([, width]) => !widths.includes(width));
  expect(off).toEqual([]);
});
