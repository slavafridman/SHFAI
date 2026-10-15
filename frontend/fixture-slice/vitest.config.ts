import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Worker threads avoid Windows fork startup/IPC hangs in restricted runners.
    pool: 'threads',
    maxWorkers: 1,
  },
});
