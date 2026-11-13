import { join } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';
import { defaultClientConditions } from 'vite';
import { defaultExclude, defineConfig } from 'vitest/config';

const vrt = '**/*.vrt.test.ts';
// DOM behaviors in core need a real browser, so they run with the Vue tests
const primitives = 'packages/core/src/primitives/**/*.test.ts';

// Committed reference screenshots are only valid from CI's container (the `visual` job in ci.yml),
// so anywhere else they go to a git-ignored folder: a local run compares against the previous
// local run instead.
const screenshotPath = (data: {
  root: string;
  testFileDirectory: string;
  screenshotDirectory: string;
  testFileName: string;
  arg: string;
  browserName: string;
  platform: string;
  ext: string;
}) =>
  join(
    data.root,
    process.env.CI
      ? join(data.testFileDirectory, data.screenshotDirectory)
      : join('.vitest/screenshots', data.testFileDirectory),
    data.testFileName,
    `${data.arg}-${data.browserName}-${data.platform}${data.ext}`,
  );

const browserProject = (name: string, include: string[], exclude: string[] = []) => ({
  plugins: [vue()],
  resolve: { conditions: ['@rio-m3e/source', ...defaultClientConditions] },
  // Pre-bundle up front; discovering vue mid-run makes Vite reload the test page
  optimizeDeps: { include: ['vue'] },
  test: {
    name,
    include,
    exclude: [...exclude, ...defaultExclude],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [
        {
          browser: 'chromium' as const,
          viewport: { width: 1280, height: 720 },
        },
      ],
      expect: { toMatchScreenshot: { resolveScreenshotPath: screenshotPath } },
    },
  },
});

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['packages/{tokens,core}/src/**/*.test.ts'],
          exclude: [primitives, ...defaultExclude],
          environment: 'node',
          // MCU breaks under Node ESM (upstream #195), so let Vite process it
          server: { deps: { inline: ['@material/material-color-utilities'] } },
        },
      },
      browserProject('browser', ['packages/vue/src/**/*.test.ts', primitives], [vrt]),
      browserProject('vrt', [`packages/vue/src/${vrt}`]),
    ],
  },
});
