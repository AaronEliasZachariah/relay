import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Migrate the in-process PGlite database before each test file.
    setupFiles: ['./test/setup.ts'],
    // `pglite` tells the DB client to use the in-process engine.
    env: {
      DATABASE_URL: 'pglite',
      NODE_ENV: 'test',
    },
    // One shared in-memory DB — run files sequentially.
    fileParallelism: false,
    include: ['test/**/*.test.ts'],
    hookTimeout: 30000,
    testTimeout: 20000,
  },
});
