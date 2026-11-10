import vue from '@vitejs/plugin-vue'
import { defaultClientConditions, defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // 워크스페이스 패키지를 빌드 없이 src에서 바로 가져온다
    conditions: ['@rio-m3e/source', ...defaultClientConditions],
  },
})
