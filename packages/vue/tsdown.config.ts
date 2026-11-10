import { defineConfig } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  // One output file per component, so an unused component is tree-shaken along with its CSS import.
  unbundle: true,
  plugins: [Vue({ isProduction: true })],
  dts: { tsc: { vue: true } },
});
