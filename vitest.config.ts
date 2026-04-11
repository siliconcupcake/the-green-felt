import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/shared', 'packages/engine', 'packages/server', 'packages/client'],
    passWithNoTests: true,
  },
});
