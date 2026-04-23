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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/**/*.d.ts'],
      // MVP thresholds: exercised surfaces (components + hooks + schemas) are
      // well covered; pages and large feature dialogs are reserved for
      // Playwright e2e (Stage 9), so global numbers are lower than the
      // backend's on purpose.
      thresholds: {
        lines: 25,
        functions: 20,
        branches: 70,
        statements: 25,
      },
    },
  },
});
