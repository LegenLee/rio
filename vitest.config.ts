import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';
import { defaultClientConditions } from 'vite';
import { defaultExclude, defineConfig } from 'vitest/config';

const vrt = '**/*.vrt.test.ts';
// DOM behaviors in core need a real browser, so they run with the Vue tests
const primitives = 'packages/core/src/primitives/**/*.test.ts';

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
