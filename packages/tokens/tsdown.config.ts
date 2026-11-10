import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  dts: true,
  deps: {
    // MCU 0.4.0 breaks under Node ESM because of extensionless imports (upstream #195).
    // Bundling it lets Rolldown resolve those paths, so it also works in SSR and Vitest.
    // Its license comments stay in the bundle, and the attribution is in the root NOTICE.
    onlyBundle: ['@material/material-color-utilities'],
  },
});
