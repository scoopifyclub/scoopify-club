import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Chrome',
      use: { 
        browserName: 'chromium',
        env: {
          NODE_ENV: 'test',
          DATABASE_URL: 'file:./prisma/test.db',
          JWT_SECRET: 'test-secret',
          STRIPE_SECRET_KEY: 'test-stripe-key',
          REDIS_URL: 'redis://localhost:6379',
          REDIS_TOKEN: 'test-redis-token',
        },
      },
    },
  ],
  globalSetup: './e2e/helpers/setup.ts',
  globalTeardown: './e2e/helpers/teardown.ts',
};

export default config; 