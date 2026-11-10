import { defineConfig } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  // 컴포넌트마다 파일을 따로 내보낸다. 안 쓰는 컴포넌트는 CSS import까지 통째로 트리셰이킹된다.
  unbundle: true,
  plugins: [Vue({ isProduction: true })],
  dts: { tsc: { vue: true } },
});
