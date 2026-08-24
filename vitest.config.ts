import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    coverage: {
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts', 'services/**/*.ts', 'components/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*Data.ts'],
    },
  },
});
