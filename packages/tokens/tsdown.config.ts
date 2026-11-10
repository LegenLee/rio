import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  dts: true,
  deps: {
    // MCU 0.4.0은 확장자 없는 import 때문에 Node ESM에서 깨진다(upstream #195).
    // 번들에 넣으면 Rolldown이 경로를 풀어 주므로 SSR/Vitest에서도 돈다.
    // 라이선스 주석은 번들에 그대로 남고, 출처는 루트 NOTICE에 적었다.
    onlyBundle: ['@material/material-color-utilities'],
  },
});
