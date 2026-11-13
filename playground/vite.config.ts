import vue from '@vitejs/plugin-vue';
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Import workspace packages straight from src, without building them first
    conditions: ['@rio-m3e/source', ...defaultClientConditions],
  },
});
