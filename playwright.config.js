import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
// Load test environment variables
dotenv.config({ path: '.env.test' });
export default defineConfig({
    testDir: './e2e',
    timeout: 30000,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { open: 'never' }],
        ['list']
    ],
    use: {
        baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: Object.assign({}, devices['Desktop Chrome']),
        },
        {
            name: 'firefox',
            use: Object.assign({}, devices['Desktop Firefox']),
        },
        {
            name: 'webkit',
            use: Object.assign({}, devices['Desktop Safari']),
        },
        {
            name: 'Mobile Chrome',
            use: Object.assign({}, devices['Pixel 7']),
        },
        {
            name: 'Mobile Safari',
            use: Object.assign({}, devices['iPhone 14']),
        },
    ],
    webServer: process.env.CI ? {
        command: 'npm run build && npm run start',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
    } : undefined,
});
