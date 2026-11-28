// Loads the browser build of `@rio-m3e/vue` the way a page without a bundler does, from plain
// files: once as an ES module through an import map, once as scripts that set globals. Each page
// writes its components in its HTML, registers them with `RioComponents`, and fails on any error,
// a missing stylesheet or theme, a component that doesn't respond, or core and tokens out of reach.
// Build first: `pnpm build && pnpm test:browser-build`.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const vueRequire = createRequire(join(root, 'packages/vue/package.json'));
/** URL prefixes and the folders they serve */
const folders = {
  '/rio/': join(root, 'packages/vue/dist/browser'),
  '/vue/': join(dirname(vueRequire.resolve('vue/package.json')), 'dist'),
};
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };

const body = `
<div id="app">
  <rio-button variant="filled" @click="count++">Pressed {{ count }}</rio-button>
  <rio-switch v-model:selected="on" aria-label="Wi-Fi"></rio-switch>
  <rio-text-field v-model="name" label="Name"></rio-text-field>
  <output id="state">{{ count }} {{ on }} {{ name }}</output>
</div>`;

/** Mounts the app, with Vue and Rio as `Vue` and `RioVue` */
const mount = `
const { createApp, ref } = Vue;
const { createRio, RioComponents } = RioVue;
window.RioVue = RioVue;
window.app = createApp({ setup: () => ({ count: ref(0), on: ref(false), name: ref('') }) })
  .use(createRio({ theme: { sourceColor: '#6750a4' } }))
  .use(RioComponents);
window.app.mount('#app');`;

const page = (head, script) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="/rio/rio-vue.css">
${head}
</head>
<body>${body}
${script}
</body>
</html>`;

const pages = {
  '/esm.html': page(
    `<script type="importmap">
{ "imports": { "vue": "/vue/vue.esm-browser.prod.js", "@rio-m3e/vue": "/rio/rio-vue.js" } }
</script>`,
    `<script type="module">
import * as Vue from 'vue';
import * as RioVue from '@rio-m3e/vue';
${mount}
</script>`,
  ),
  '/global.html': page(
    `<script src="/vue/vue.global.prod.js"></script>
<script src="/rio/rio-vue.global.js"></script>`,
    `<script>${mount}</script>`,
  ),
};

const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (pages[path]) {
    response.writeHead(200, { 'content-type': TYPES['.html'] }).end(pages[path]);
    return;
  }
  const [prefix, folder] = Object.entries(folders).find(([p]) => path.startsWith(p)) ?? [];
  const file = folder && normalize(join(folder, path.slice(prefix.length)));
  try {
    if (!file?.startsWith(folder + sep)) throw new Error('outside');
    const content = await readFile(file);
    response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'text/plain' }).end(content);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, resolve));
const origin = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
const failures = [];
try {
  for (const name of Object.keys(pages)) {
    const tab = await browser.newPage();
    const errors = [];
    tab.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    tab.on('pageerror', (error) => errors.push(String(error)));
    tab.on('requestfailed', (request) => errors.push(`failed to load ${request.url()}`));
    tab.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
    const fail = (message) => failures.push(`${name}: ${message}`);

    await tab.goto(origin + name, { waitUntil: 'networkidle' });
    if (!(await tab.evaluate(() => Boolean(window.app?._container)))) fail('the app did not mount');
    else {
      const registered = await tab.evaluate(() => {
        // Every component, as `RioButton`; `RioComponents` is the plugin itself.
        const names = Object.keys(window.RioVue).filter(
          (key) => /^Rio[A-Z]/.test(key) && key !== 'RioComponents',
        );
        const { components, directives } = window.app._context;
        return {
          missing: names.filter((key) => !components[key]),
          count: names.length,
          ripple: Boolean(directives.ripple),
        };
      });
      if (registered.count < 40) fail(`only ${registered.count} components in the build`);
      if (registered.missing.length) fail(`not registered: ${registered.missing.join(', ')}`);
      if (!registered.ripple) fail('v-ripple not registered');

      // The stylesheet and the theme: a filled button in the theme's primary color, rounded
      const button = await tab.evaluate(() => {
        const element = document.querySelector('.rio-button');
        const probe = document.body.appendChild(document.createElement('span'));
        probe.style.color = 'var(--rio-color-primary)';
        const primary = getComputedStyle(probe).color;
        probe.remove();
        const style = element && getComputedStyle(element);
        return style && { background: style.backgroundColor, radius: style.borderRadius, primary };
      });
      if (!button) fail('no button');
      else {
        if (button.background !== button.primary || button.primary === 'rgb(0, 0, 0)') {
          fail(`button ${button.background}, primary ${button.primary}: no stylesheet or theme`);
        }
        if (button.radius === '0px') fail('the button is square: no stylesheet');
      }

      // Core and tokens, under their own names
      const namespaces = await tab.evaluate(() => ({
        compact: window.RioVue.core?.breakpointQuery?.('compact'),
        css: typeof window.RioVue.tokens?.createThemeCss,
      }));
      if (namespaces.compact !== '(width < 600px)') fail('RioVue.core.breakpointQuery is missing');
      if (namespaces.css !== 'function') fail('RioVue.tokens.createThemeCss is missing');

      await tab.getByRole('button', { name: 'Pressed 0' }).click();
      await tab.getByRole('switch', { name: 'Wi-Fi' }).click();
      await tab.getByRole('textbox', { name: 'Name' }).fill('Rio');
      const state = (await tab.textContent('#state'))?.trim();
      if (state !== '1 true Rio') fail(`after a press, a toggle, and typing: "${state}"`);
    }
    for (const error of errors) fail(error);
    console.log(`${name}: ${failures.some((f) => f.startsWith(`${name}:`)) ? 'failed' : 'ok'}`);
    await tab.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
