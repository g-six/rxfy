import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'packages/template/*'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

// const config = {
//   rootDir: './',
//   testMatch: ['__unit_tests__/**/*.ts'],
// };

// export default config;
