import path from 'node:path';
import { defineConfig } from 'vitest/config';

// React plugin is intentionally not loaded here; vitest handles JSX transforms
// via its own esbuild pipeline and we don't need HMR for tests. Loading the
// plugin causes a type clash because @vitejs/plugin-react targets vite's
// PluginOption while vitest exposes its own narrower union.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nis/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
