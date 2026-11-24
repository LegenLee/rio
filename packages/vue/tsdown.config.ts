import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { defineConfig, type Rolldown } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';

/** A module's static imports and re-exports, in the order they appear */
const IMPORTS =
  /^\s*(?:import\s*(?:[^'";]*?\s*from\s*)?|export\s*[^'";]*?\s*from\s*)['"]([^'"]+)['"]/gm;
/** Any stylesheet named anywhere in a module, however its imports are laid out */
const STYLESHEETS = /['"](@rio-m3e\/styles\/[^'"]+\.css)['"]/g;

/**
 * Writes the browser build's stylesheet, `browser/rio-vue.css`: the stylesheets the components
 * import, in the order a browser evaluates the published modules for the whole library, each where
 * it is first imported, depth first. That is the order a bundler gives an app that imports it all.
 */
function writeBrowserStylesheet(outDir: string) {
  const require = createRequire(import.meta.url);
  const seen = new Set<string>();
  const sheets: string[] = [];
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const [, specifier] of readFileSync(file, 'utf8').matchAll(IMPORTS)) {
      if (specifier!.endsWith('.css')) {
        if (!seen.has(specifier!)) sheets.push(specifier!);
        seen.add(specifier!);
      } else if (specifier!.startsWith('.')) visit(resolve(dirname(file), specifier!));
    }
  };
  visit(join(outDir, 'index.js'));
  // IMPORTS reads one import per line: should the build's output change shape, as when minified,
  // fail rather than leave a stylesheet out.
  const named = new Set(
    readdirSync(outDir, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.js') && !file.startsWith('browser'))
      .flatMap((file) => [...readFileSync(join(outDir, file), 'utf8').matchAll(STYLESHEETS)])
      .map(([, sheet]) => sheet!),
  );
  const missed = [...named].filter((sheet) => !sheets.includes(sheet));
  if (missed.length) throw new Error(`The browser stylesheet misses ${missed.join(', ')}`);
  const css = sheets.map(
    (sheet) => `/* ${sheet} */\n${readFileSync(require.resolve(sheet), 'utf8')}`,
  );
  mkdirSync(join(outDir, 'browser'), { recursive: true });
  writeFileSync(join(outDir, 'browser', 'rio-vue.css'), css.join('\n'));
}

/** For the browser build: a browser can't import CSS from JavaScript, so the imports load nothing. */
const dropStylesheetImports: Rolldown.Plugin = {
  name: 'rio:drop-stylesheet-imports',
  load(id) {
    if (id.endsWith('.css')) return { code: '', moduleType: 'js' };
  },
};

export default defineConfig([
  {
    entry: ['./src/index.ts'],
    platform: 'neutral',
    // One output file per component, so an unused component is tree-shaken along with its CSS import.
    unbundle: true,
    plugins: [Vue({ isProduction: true })],
    dts: { tsc: { vue: true } },
    onSuccess: (config) => writeBrowserStylesheet(config.outDir),
  },
  // For pages without a bundler, as from a CDN: one file with the whole library, core and tokens
  // included, as an ES module for an import map (`rio-vue.js`) or a script that sets the `RioVue`
  // global (`rio-vue.global.js`), with the stylesheet the first build writes beside them
  // (`rio-vue.css`). Vue stays outside: the page's own, `vue` in the import map or the `Vue` global.
  {
    entry: { 'rio-vue': './src/browser.ts' },
    outDir: 'dist/browser',
    platform: 'browser',
    format: ['esm', 'iife'],
    globalName: 'RioVue',
    outputOptions: (options, format) =>
      format === 'iife'
        ? { ...options, entryFileNames: 'rio-vue.global.js', globals: { vue: 'Vue' } }
        : { ...options, entryFileNames: 'rio-vue.js' },
    minify: true,
    dts: false,
    deps: {
      alwaysBundle: ['@rio-m3e/core', '@rio-m3e/styles/**', '@rio-m3e/tokens'],
      // Only Vue stays outside: a package left out of alwaysBundle fails the build.
      onlyImport: ['vue'],
      onlyBundle: false,
    },
    css: false,
    plugins: [Vue({ isProduction: true }), dropStylesheetImports],
  },
]);
