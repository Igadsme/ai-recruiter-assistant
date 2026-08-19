import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
    pool: 'forks',
    fileParallelism: false,
    env: {
      LOG_LEVEL: 'silent',
      ANALYTICS_KEY: 'test-analytics',
    },
  },
})
